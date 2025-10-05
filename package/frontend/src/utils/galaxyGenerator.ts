/**
 * 星系生成算法
 */

import seedrandom from 'seedrandom';
import type { Galaxy, GalaxyCoordinate } from '../types/galaxy';
import type { Planet } from '../types/planet';
import { generateGalaxyId } from '../types/galaxy';
import { generatePlanet } from './planetGenerator';
import { NoiseGenerator } from './noiseGenerator';

/**
 * 星系生成配置
 */
export interface GalaxyConfig {
  globalSeed: number;      // 全局种子
  galaxySize: number;      // 星系尺寸（像素）
  galaxyGridSize: number;  // 星系网格大小（9x9）
  planetDensity: number;   // 行星密度（0-1）
  minPlanetSize: number;   // 最小行星大小
  maxPlanetSize: number;   // 最大行星大小
}

/**
 * 默认星系配置
 */
export const DEFAULT_GALAXY_CONFIG: GalaxyConfig = {
  globalSeed: 42069,
  galaxySize: 2000,
  galaxyGridSize: 9,
  planetDensity: 0.6,
  minPlanetSize: 4,
  maxPlanetSize: 7
};

/**
 * 根据星系坐标生成局部种子（四个象限独立种子）
 */
function generateLocalSeed(globalSeed: number, gridX: number, gridY: number): number {
  // 确定象限并添加偏移量
  let quadrantSeed = globalSeed;
  
  if (gridX > 0 && gridY > 0) {
    // 东北象限 (NE)
    quadrantSeed = globalSeed + 1000000;
  } else if (gridX < 0 && gridY > 0) {
    // 西北象限 (NW)
    quadrantSeed = globalSeed + 2000000;
  } else if (gridX < 0 && gridY < 0) {
    // 西南象限 (SW)
    quadrantSeed = globalSeed + 3000000;
  } else if (gridX > 0 && gridY < 0) {
    // 东南象限 (SE)
    quadrantSeed = globalSeed + 4000000;
  }
  
  // 使用象限种子和坐标生成唯一的局部种子
  const combined = `${quadrantSeed}_${gridX}_${gridY}`;
  const rng = seedrandom(combined);
  return Math.floor(rng() * 1000000000);
}

/**
 * 生成星系
 * @param gridX 星系网格X坐标
 * @param gridY 星系网格Y坐标
 * @param config 星系配置
 * @param noiseGenerator 噪声生成器
 * @returns 星系对象
 */
export function generateGalaxy(
  gridX: number,
  gridY: number,
  config: GalaxyConfig,
  noiseGenerator: NoiseGenerator
): Galaxy {
  const galaxyId = generateGalaxyId(gridX, gridY);
  const localSeed = generateLocalSeed(config.globalSeed, gridX, gridY);
  const rng = seedrandom(localSeed.toString());

  // 计算星系中心坐标（像素坐标）
  const coordinateX = gridX * config.galaxySize;
  const coordinateY = gridY * config.galaxySize;

  // 使用噪声决定星系的行星密度修正
  const noiseValue = noiseGenerator.getNormalized2D(gridX, gridY, 0.1);
  const densityModifier = 0.5 + noiseValue; // 密度修正范围 [0.5, 1.5]
  const adjustedDensity = Math.min(1, config.planetDensity * densityModifier);

  // 生成81个行星位置
  const planets: (Planet | null)[] = [];
  for (let i = 0; i < config.galaxyGridSize * config.galaxyGridSize; i++) {
    // 根据调整后的密度决定是否生成行星
    if (rng() < adjustedDensity) {
      const planet = generatePlanet(
        galaxyId,
        i,
        localSeed + i,
        config,
        noiseGenerator
      );
      planets.push(planet);
    } else {
      planets.push(null); // 空位
    }
  }

  return {
    id: galaxyId,
    coordinateX,
    coordinateY,
    gridX,
    gridY,
    planets,
    seed: localSeed,
    hasPlayer: false
  };
}

/**
 * 批量生成星系（用于视口范围内的星系）
 * @param startGridX 起始网格X
 * @param startGridY 起始网格Y
 * @param endGridX 结束网格X
 * @param endGridY 结束网格Y
 * @param config 星系配置
 * @param noiseGenerator 噪声生成器
 * @returns 星系数组
 */
export function generateGalaxies(
  startGridX: number,
  startGridY: number,
  endGridX: number,
  endGridY: number,
  config: GalaxyConfig,
  noiseGenerator: NoiseGenerator
): Galaxy[] {
  const galaxies: Galaxy[] = [];

  for (let y = startGridY; y <= endGridY; y++) {
    for (let x = startGridX; x <= endGridX; x++) {
      const galaxy = generateGalaxy(x, y, config, noiseGenerator);
      galaxies.push(galaxy);
    }
  }

  return galaxies;
}

/**
 * 查找空星系（没有任何玩家占领行星的星系）
 * @param config 星系配置
 * @param noiseGenerator 噪声生成器
 * @param maxAttempts 最大尝试次数
 * @returns 空星系坐标，如果找不到则返回 null
 */
export function findEmptyGalaxy(
  config: GalaxyConfig,
  noiseGenerator: NoiseGenerator,
  maxAttempts: number = 100
): GalaxyCoordinate | null {
  const rng = seedrandom(config.globalSeed.toString());
  
  for (let i = 0; i < maxAttempts; i++) {
    // 在较远的范围内随机选择坐标
    const gridX = Math.floor((rng() - 0.5) * 20); // -10 到 10
    const gridY = Math.floor((rng() - 0.5) * 20);
    
    const galaxy = generateGalaxy(gridX, gridY, config, noiseGenerator);
    
    // 检查是否有行星
    const hasPlanets = galaxy.planets.some(p => p !== null);
    if (hasPlanets && !galaxy.hasPlayer) {
      return { x: gridX, y: gridY };
    }
  }
  
  return null;
}

/**
 * 计算视口范围内的星系网格坐标
 * @param viewportX 视口中心X坐标（像素）
 * @param viewportY 视口中心Y坐标（像素）
 * @param viewportWidth 视口宽度
 * @param viewportHeight 视口高度
 * @param galaxySize 星系尺寸
 * @returns 星系网格坐标范围
 */
export function calculateViewportGalaxies(
  viewportX: number,
  viewportY: number,
  viewportWidth: number,
  viewportHeight: number,
  galaxySize: number
): { startX: number; startY: number; endX: number; endY: number } {
  // 添加一些边距以实现预加载
  const margin = galaxySize * 1.5;
  
  const startX = Math.floor((viewportX - viewportWidth / 2 - margin) / galaxySize);
  const startY = Math.floor((viewportY - viewportHeight / 2 - margin) / galaxySize);
  const endX = Math.ceil((viewportX + viewportWidth / 2 + margin) / galaxySize);
  const endY = Math.ceil((viewportY + viewportHeight / 2 + margin) / galaxySize);
  
  return { startX, startY, endX, endY };
}
