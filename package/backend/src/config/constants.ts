/**
 * 游戏常量配置
 */

// JWT 配置
export const JWT_SECRET = process.env.JWT_SECRET || 'galaxy_wrath_secret_key_2024';
export const JWT_EXPIRES_IN = '7d';

// 数据库配置
export const DB_PATH = process.env.DB_PATH || './data/gamedb';

// 服务器配置
export const PORT = process.env.PORT || 3000;
export const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// 游戏配置
export const GLOBAL_SEED = 42069;  // 全局宇宙种子
export const PRODUCTION_INTERVAL = 1000;  // 生产周期（毫秒）
export const OFFLINE_BONUS_RATE = 0.25;  // 离线收益比率
export const MAX_OFFLINE_HOURS = 24;  // 最大离线收益时长（小时）

// 资源初始值
export const INITIAL_RESOURCES = {
  minerals: 500,
  energy: 500,
  food: 500,
  alloys: 0,
  powerCells: 0,
  consumerGoods: 0,
  techComponents: 0,
  colonyShips: 0
};

// 星系配置
export const GALAXY_SIZE = 2000;  // 每个星系占2000x2000像素
export const GALAXY_GRID_SIZE = 9;  // 9x9 = 81个行星位置
export const PLANET_DENSITY = 0.6;  // 60%的位置有行星
export const MIN_PLANET_SIZE = 4;
export const MAX_PLANET_SIZE = 7;

// 玩家配置
export const MAX_PLAYER_LEVEL = 1;  // 当前锁定等级
export const MAX_PLANETS_PER_PLAYER = 1;  // 当前最多1颗行星
