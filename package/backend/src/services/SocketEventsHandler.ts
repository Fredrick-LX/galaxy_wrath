/**
 * Socket 事件处理器 - 统一处理所有 Socket.io 事件
 */

import { Server, Socket } from 'socket.io';
import { register, login, resetPassword, sendVerificationCode } from './authService';
import { getGameData, saveGameData } from '../database/planetDB';
import { assignStartingPlanet } from './universeService';
import { productionEngine, calculateOfflineRewards } from './productionService';
import { OFFLINE_BONUS_RATE, MAX_OFFLINE_HOURS } from '../config/constants';
import { verifyToken } from '../utils/jwt';
import { generateGalaxyPlanets, getPlanetAtPosition } from '../utils/galaxyGenerator';
import type { Planet } from '../types';

export class SocketEventsHandler {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  /**
   * 初始化所有 Socket 事件监听
   */
  initializeEvents() {
    // Socket 认证中间件
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      
      // 如果没有 token，允许连接但标记为未认证（用于登录注册）
      if (!token) {
        socket.data.authenticated = false;
        return next();
      }
      
      const payload = verifyToken(token);
      if (!payload) {
        socket.data.authenticated = false;
        return next();
      }
      
      // 将用户信息附加到 socket
      socket.data.authenticated = true;
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      
      next();
    });

    // 设置生产引擎更新回调
    productionEngine.setUpdateCallback((planetId, planet) => {
      // 推送行星更新到拥有者
      if (planet.ownerId) {
        this.io.to(`user:${planet.ownerId}`).emit('planet:update', {
          planetId,
          resources: planet.resources,
          buildings: planet.buildings
        });
      }
    });

    // 监听连接事件
    this.io.on('connection', (socket) => {
      console.log(`📡 Socket 已连接: ${socket.id}`);
      
      // 如果已认证，将用户加入自己的房间
      if (socket.data.authenticated && socket.data.userId) {
        const userId = socket.data.userId;
        socket.join(`user:${userId}`);
        console.log(`✅ 用户 ${userId} 已连接 (Socket ID: ${socket.id})`);
        
        // 发送欢迎消息
        socket.emit('connected', {
          message: '连接成功',
          userId,
          timestamp: Date.now()
        });
      } else {
        // 未认证用户也发送连接确认
        socket.emit('connected', {
          message: '连接成功（未认证）',
          timestamp: Date.now()
        });
      }
      
      // ============ 认证相关事件 ============
      
      // 用户注册
      socket.on('auth:register', async (data: { email: string; password: string; username: string; verificationCode: string }, callback) => {
        try {
          const { email, password, username, verificationCode } = data;
          
          if (!email || !password || !username || !verificationCode) {
            callback({ 
              success: false, 
              message: '缺少必要参数' 
            });
            return;
          }
          
          const result = await register(email, password, username, verificationCode);
          callback(result);
        } catch (error) {
          console.error('注册失败:', error);
          callback({ 
            success: false, 
            message: '服务器错误' 
          });
        }
      });
      
      // 用户登录
      socket.on('auth:login', async (data: { email: string; password: string }, callback) => {
        try {
          const { email, password } = data;
          
          if (!email || !password) {
            callback({ 
              success: false, 
              message: '缺少必要参数' 
            });
            return;
          }
          
          const result = await login(email, password);
          
          // 如果登录成功，更新 socket 认证状态并加入用户房间
          if (result.success && result.user) {
            socket.data.authenticated = true;
            socket.data.userId = result.user.id;
            socket.data.email = result.user.email;
            socket.join(`user:${result.user.id}`);
            console.log(`✅ 用户 ${result.user.id} 通过 socket 登录成功`);
          }
          
          callback(result);
        } catch (error) {
          console.error('登录失败:', error);
          callback({ 
            success: false, 
            message: '服务器错误' 
          });
        }
      });
      
      // 重置密码
      socket.on('auth:reset-password', async (data: { email: string; verificationCode: string; newPassword: string }, callback) => {
        try {
          const { email, verificationCode, newPassword } = data;
          
          if (!email || !verificationCode || !newPassword) {
            callback({ 
              success: false, 
              message: '缺少必要参数' 
            });
            return;
          }
          
          const result = await resetPassword(email, verificationCode, newPassword);
          callback(result);
        } catch (error) {
          console.error('重置密码失败:', error);
          callback({ 
            success: false, 
            message: '服务器错误' 
          });
        }
      });
      
      // 发送验证码
      socket.on('auth:send-code', async (data: { email: string }, callback) => {
        try {
          const { email } = data;
          
          if (!email) {
            callback({ 
              success: false, 
              message: '缺少邮箱参数' 
            });
            return;
          }
          
          const result = await sendVerificationCode(email);
          callback(result);
        } catch (error) {
          console.error('发送验证码失败:', error);
          callback({ 
            success: false, 
            message: '服务器错误' 
          });
        }
      });
      
      // ============ 行星相关事件 ============
      
      // 获取玩家的所有行星
      socket.on('planet:get-my-planets', async (callback) => {
        if (!this.requireAuth(socket, callback)) return;
        
        try {
          const userId = socket.data.userId;
          
          // 从数据库获取游戏存档
          let gameSave = await getGameData(userId);
          
          // 如果没有存档，创建新存档并分配初始行星
          if (!gameSave) {
            console.log(`🌍 为用户 ${userId} 分配初始行星`);
            const startingPlanet = await assignStartingPlanet(userId);
            
            gameSave = {
              userId,
              planets: [startingPlanet],
              lastSaveTime: Date.now()
            };
            
            await saveGameData(userId, gameSave);
            
            // 添加到生产引擎
            productionEngine.addPlanet(startingPlanet);
          } else {
            // 加载所有行星到生产引擎
            gameSave.planets.forEach(planet => {
              productionEngine.addPlanet(planet);
            });
          }
          
          callback({
            success: true,
            planets: gameSave.planets
          });
        } catch (error) {
          console.error('获取行星失败:', error);
          callback({ 
            success: false, 
            message: '获取行星失败' 
          });
        }
      });
      
      // 获取单个行星详情
      socket.on('planet:get-detail', async (data: { planetId: string }, callback) => {
        if (!this.requireAuth(socket, callback)) return;
        
        try {
          const userId = socket.data.userId;
          const { planetId } = data;
          
          // 先从生产引擎获取（获取最新状态）
          let planet = productionEngine.getPlanet(planetId);
          
          // 如果生产引擎没有，从数据库获取
          if (!planet) {
            const gameSave = await getGameData(userId);
            planet = gameSave?.planets.find(p => p.id === planetId);
          }
          
          if (!planet) {
            callback({ 
              success: false, 
              message: '行星不存在' 
            });
            return;
          }
          
          // 检查权限
          if (planet.ownerId !== userId) {
            callback({ 
              success: false, 
              message: '无权访问此行星' 
            });
            return;
          }
          
          callback({
            success: true,
            planet
          });
        } catch (error) {
          console.error('获取行星详情失败:', error);
          callback({ 
            success: false, 
            message: '获取行星详情失败' 
          });
        }
      });
      
      // 建造建筑
      socket.on('planet:build', async (data: { planetId: string; building: any }, callback) => {
        if (!this.requireAuth(socket, callback)) return;
        
        try {
          const userId = socket.data.userId;
          const { planetId, building } = data;
          
          if (!building) {
            callback({ 
              success: false, 
              message: '缺少建筑数据' 
            });
            return;
          }
          
          // 从生产引擎获取行星
          const planet = productionEngine.getPlanet(planetId);
          if (!planet) {
            callback({ 
              success: false, 
              message: '行星不存在' 
            });
            return;
          }
          
          if (planet.ownerId !== userId) {
            callback({ 
              success: false, 
              message: '无权操作此行星' 
            });
            return;
          }
          
          // 添加建筑
          planet.buildings.push(building);
          
          // 保存到数据库
          const gameSave = await getGameData(userId);
          if (gameSave) {
            const planetIndex = gameSave.planets.findIndex(p => p.id === planetId);
            if (planetIndex !== -1) {
              gameSave.planets[planetIndex] = planet;
              await saveGameData(userId, gameSave);
            }
          }
          
          callback({
            success: true,
            message: '建筑建造成功',
            planet
          });
        } catch (error) {
          console.error('建造建筑失败:', error);
          callback({ 
            success: false, 
            message: '建造建筑失败' 
          });
        }
      });
      
      // 更新建筑
      socket.on('planet:update-building', async (data: { planetId: string; buildingId: string; action: string; updates?: any }, callback) => {
        if (!this.requireAuth(socket, callback)) return;
        
        try {
          const userId = socket.data.userId;
          const { planetId, buildingId, action, updates } = data;
          
          const planet = productionEngine.getPlanet(planetId);
          if (!planet) {
            callback({ 
              success: false, 
              message: '行星不存在' 
            });
            return;
          }
          
          if (planet.ownerId !== userId) {
            callback({ 
              success: false, 
              message: '无权操作此行星' 
            });
            return;
          }
          
          const buildingIndex = planet.buildings.findIndex(b => b.id === buildingId);
          if (buildingIndex === -1) {
            callback({ 
              success: false, 
              message: '建筑不存在' 
            });
            return;
          }
          
          if (action === 'demolish') {
            // 拆除建筑
            planet.buildings.splice(buildingIndex, 1);
          } else if (action === 'upgrade' || action === 'update') {
            // 更新建筑
            Object.assign(planet.buildings[buildingIndex], updates);
          }
          
          // 保存到数据库
          const gameSave = await getGameData(userId);
          if (gameSave) {
            const planetIndex = gameSave.planets.findIndex(p => p.id === planetId);
            if (planetIndex !== -1) {
              gameSave.planets[planetIndex] = planet;
              await saveGameData(userId, gameSave);
            }
          }
          
          callback({
            success: true,
            message: '建筑更新成功',
            planet
          });
        } catch (error) {
          console.error('更新建筑失败:', error);
          callback({ 
            success: false, 
            message: '更新建筑失败' 
          });
        }
      });
      
      // 计算并领取离线收益
      socket.on('planet:claim-offline-rewards', async (callback) => {
        if (!this.requireAuth(socket, callback)) return;
        
        try {
          const userId = socket.data.userId;
          
          const gameSave = await getGameData(userId);
          if (!gameSave) {
            callback({ 
              success: false, 
              message: '游戏存档不存在' 
            });
            return;
          }
          
          const currentTime = Date.now();
          const offlineTime = currentTime - gameSave.lastSaveTime;
          const maxOfflineTime = MAX_OFFLINE_HOURS * 60 * 60 * 1000;
          const actualOfflineTime = Math.min(offlineTime, maxOfflineTime);
          
          // 计算每个行星的离线收益
          const rewards: Record<string, any> = {};
          gameSave.planets.forEach(planet => {
            const planetRewards = calculateOfflineRewards(planet, actualOfflineTime, OFFLINE_BONUS_RATE);
            
            // 应用收益
            Object.entries(planetRewards).forEach(([resource, amount]) => {
              const key = resource as keyof typeof planet.resources;
              planet.resources[key] += amount;
            });
            
            rewards[planet.id] = planetRewards;
          });
          
          // 更新保存时间
          gameSave.lastSaveTime = currentTime;
          await saveGameData(userId, gameSave);
          
          callback({
            success: true,
            message: '离线收益已领取',
            offlineTime: actualOfflineTime,
            rewards,
            planets: gameSave.planets
          });
        } catch (error) {
          console.error('领取离线收益失败:', error);
          callback({ 
            success: false, 
            message: '领取离线收益失败' 
          });
        }
      });
      
      // ============ 宇宙相关事件 ============
      
      // 获取星系中的所有行星
      socket.on('universe:get-galaxy-planets', async (data: { galaxyId: string }, callback) => {
        if (!this.requireAuth(socket, callback)) return;
        
        try {
          const { galaxyId } = data;
          
          if (!galaxyId) {
            callback({ 
              success: false, 
              message: '缺少星系ID' 
            });
            return;
          }
          
          // 使用噪声生成器生成星系中的行星
          const planets = generateGalaxyPlanets(galaxyId);
          
          callback({
            success: true,
            galaxyId,
            planets
          });
        } catch (error) {
          console.error('获取星系行星失败:', error);
          callback({ 
            success: false, 
            message: '获取星系行星失败' 
          });
        }
      });
      
      // 获取特定位置的行星信息
      socket.on('universe:get-planet-at-position', async (data: { galaxyId: string; position: number }, callback) => {
        if (!this.requireAuth(socket, callback)) return;
        
        try {
          const { galaxyId, position } = data;
          
          if (!galaxyId || position === undefined) {
            callback({ 
              success: false, 
              message: '缺少必要参数' 
            });
            return;
          }
          
          // 获取特定位置的行星
          const planet = getPlanetAtPosition(galaxyId, position);
          
          if (!planet) {
            callback({ 
              success: false, 
              message: '该位置没有行星' 
            });
            return;
          }
          
          callback({
            success: true,
            planet
          });
        } catch (error) {
          console.error('获取行星信息失败:', error);
          callback({ 
            success: false, 
            message: '获取行星信息失败' 
          });
        }
      });
      
      // ============ 实时数据相关事件 ============
      
      // 订阅行星更新
      socket.on('subscribe:planet', (planetId: string) => {
        if (!this.requireAuth(socket)) return;
        socket.join(`planet:${planetId}`);
        console.log(`📡 用户 ${socket.data.userId} 订阅行星 ${planetId}`);
      });
      
      // 取消订阅行星
      socket.on('unsubscribe:planet', (planetId: string) => {
        if (!this.requireAuth(socket)) return;
        socket.leave(`planet:${planetId}`);
        console.log(`📡 用户 ${socket.data.userId} 取消订阅行星 ${planetId}`);
      });
      
      // 请求行星最新状态
      socket.on('request:planet', (planetId: string) => {
        if (!this.requireAuth(socket)) return;
        const userId = socket.data.userId;
        const planet = productionEngine.getPlanet(planetId);
        if (planet && planet.ownerId === userId) {
          socket.emit('planet:update', {
            planetId,
            resources: planet.resources,
            buildings: planet.buildings
          });
        }
      });
      
      // 保存游戏进度
      socket.on('save:game', async () => {
        if (!this.requireAuth(socket)) return;
        
        try {
          const userId = socket.data.userId;
          const gameSave = await getGameData(userId);
          if (gameSave) {
            // 从生产引擎获取最新的行星数据
            gameSave.planets = gameSave.planets.map(planet => {
              const enginePlanet = productionEngine.getPlanet(planet.id);
              return enginePlanet || planet;
            });
            
            gameSave.lastSaveTime = Date.now();
            await saveGameData(userId, gameSave);
            
            socket.emit('save:success', {
              message: '游戏进度已保存',
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.error('保存游戏失败:', error);
          socket.emit('save:error', {
            message: '保存失败'
          });
        }
      });
      
      // Ping-Pong
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });
      
      // 断开连接
      socket.on('disconnect', async () => {
        if (!socket.data.authenticated || !socket.data.userId) {
          console.log(`❌ Socket 已断开连接: ${socket.id}`);
          return;
        }
        
        const userId = socket.data.userId;
        console.log(`❌ 用户 ${userId} 已断开连接 (Socket ID: ${socket.id})`);
        
        // 自动保存游戏进度
        try {
          const gameSave = await getGameData(userId);
          if (gameSave) {
            gameSave.planets = gameSave.planets.map(planet => {
              const enginePlanet = productionEngine.getPlanet(planet.id);
              return enginePlanet || planet;
            });
            
            gameSave.lastSaveTime = Date.now();
            await saveGameData(userId, gameSave);
            console.log(`💾 用户 ${userId} 的游戏进度已自动保存`);
          }
        } catch (error) {
          console.error('自动保存失败:', error);
        }
      });
    });
  }

  /**
   * 检查 Socket 是否已认证，未认证时返回错误
   */
  private requireAuth(socket: Socket, callback?: Function): boolean {
    if (!socket.data.authenticated || !socket.data.userId) {
      if (callback) {
        callback({
          success: false,
          message: '未认证，请先登录'
        });
      } else {
        socket.emit('error', {
          message: '未认证，请先登录'
        });
      }
      return false;
    }
    return true;
  }
}
