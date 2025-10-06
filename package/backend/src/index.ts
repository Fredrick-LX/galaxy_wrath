/**
 * 后端服务入口文件
 * 纯 Socket.io 架构
 */

import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { initDatabase, closeDatabase } from './database/db';
import { SocketEventsHandler } from './services/SocketEventsHandler';
import { productionEngine } from './services/productionService';
import { PORT, CORS_ORIGIN } from './config/constants';

async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    
    // 创建 HTTP 服务器
    const httpServer = createServer();
    
    // 创建 Socket.io 服务器
    const io = new Server(httpServer, {
      cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST']
      },
      path: '/socket.io'
    });
    
    // 初始化 Socket 事件处理器
    const socketEventsHandler = new SocketEventsHandler(io);
    socketEventsHandler.initializeEvents();
    
    // 启动生产引擎
    productionEngine.start();
    
    // 启动服务器
    httpServer.listen(PORT, () => {
      console.log('╔════════════════════════════════════════╗');
      console.log('║                                        ║');
      console.log('║     🌌 星河之怒 (Galaxy Wrath)        ║');
      console.log('║                                        ║');
      console.log('╚════════════════════════════════════════╝');
      console.log('');
      console.log(`🚀 服务器运行在: http://localhost:${PORT}`);
      console.log(`🌐 CORS 允许来源: ${CORS_ORIGIN}`);
      console.log(`📡 Socket.io 服务已启动`);
      console.log(`🏭 生产引擎已启动`);
      console.log('');
      console.log('按 Ctrl+C 停止服务器');
      console.log('');
    });
    
    // 优雅退出
    const shutdown = async () => {
      console.log('\n\n⏹️  正在关闭服务器...');
      productionEngine.stop();
      await closeDatabase();
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();