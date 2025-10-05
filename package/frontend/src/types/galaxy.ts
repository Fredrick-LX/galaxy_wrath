/**
 * 星系相关类型定义
 */

import type { Planet } from './planet';

// 方向常量
export const Direction = {
  NORTH: 'N',
  SOUTH: 'S',
  EAST: 'E',
  WEST: 'W'
} as const;

export type Direction = typeof Direction[keyof typeof Direction];

// 星系坐标接口
export interface GalaxyCoordinate {
  x: number;  // 东西方向距离（正数为东，负数为西）
  y: number;  // 南北方向距离（正数为北，负数为南）
}

// 星系接口
export interface Galaxy {
  id: string;              // 如 "N1E1", "S2W3", "0" (原点)
  coordinateX: number;     // 星系中心X坐标（像素坐标）
  coordinateY: number;     // 星系中心Y坐标（像素坐标）
  gridX: number;           // 星系网格X坐标
  gridY: number;           // 星系网格Y坐标
  planets: (Planet | null)[]; // 81个位置（null表示空位）
  seed: number;            // 基于全局种子的局部种子
  hasPlayer: boolean;      // 是否有玩家占领行星
}

// 星系生成配置
export interface GalaxyGenerationConfig {
  globalSeed: number;      // 全局种子
  galaxySize: number;      // 星系尺寸（像素）
  galaxyGridSize: number;  // 星系网格大小（9x9）
  planetDensity: number;   // 行星密度（0-1）
  minPlanetSize: number;   // 最小行星大小
  maxPlanetSize: number;   // 最大行星大小
}

// 默认星系生成配置
export const DEFAULT_GALAXY_CONFIG: GalaxyGenerationConfig = {
  globalSeed: 42069,       // 全局种子
  galaxySize: 2000,        // 每个星系占2000x2000像素
  galaxyGridSize: 9,       // 9x9 = 81个行星位置
  planetDensity: 0.6,      // 60%的位置有行星
  minPlanetSize: 4,
  maxPlanetSize: 7
};

/**
 * 根据网格坐标生成星系ID
 * @param gridX 网格X坐标（不包含0）
 * @param gridY 网格Y坐标（不包含0）
 * @returns 星系ID，如 "N1E1", "S2W3"
 */
export function generateGalaxyId(gridX: number, gridY: number): string {
  // 将坐标转换为从1开始（跳过0）
  const adjX = gridX > 0 ? gridX : gridX;
  const adjY = gridY > 0 ? gridY : gridY;
  
  const absX = Math.abs(adjX);
  const absY = Math.abs(adjY);
  const dirX = adjX > 0 ? Direction.EAST : Direction.WEST;
  const dirY = adjY > 0 ? Direction.NORTH : Direction.SOUTH;
  
  // 所有星系都使用四方向格式
  return `${dirY}${absY}${dirX}${absX}`;
}

/**
 * 解析星系ID为网格坐标
 * @param galaxyId 星系ID
 * @returns 网格坐标
 */
export function parseGalaxyId(galaxyId: string): GalaxyCoordinate {
  const northMatch = galaxyId.match(/N(\d+)/);
  const southMatch = galaxyId.match(/S(\d+)/);
  const eastMatch = galaxyId.match(/E(\d+)/);
  const westMatch = galaxyId.match(/W(\d+)/);
  
  let x = 0;
  let y = 0;
  
  if (northMatch) y = parseInt(northMatch[1] || '0');
  if (southMatch) y = -parseInt(southMatch[1] || '0');
  if (eastMatch) x = parseInt(eastMatch[1] || '0');
  if (westMatch) x = -parseInt(westMatch[1] || '0');
  
  return { x, y };
}
