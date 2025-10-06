/**
 * 星系生成器 - 使用 simplex-noise
 */

import { GLOBAL_SEED, GALAXY_GRID_SIZE, PLANET_DENSITY, MIN_PLANET_SIZE, MAX_PLANET_SIZE } from '../config/constants';
import { createSeededNoise2D, createSeededRandom, octaveNoise2D, normalizeNoise, mapNoise } from './noiseGenerator';
import type { PlanetType } from '../types';

export interface GeneratedPlanet {
  position: number;
  type: PlanetType;
  size: number;
  x: number;
  y: number;
}

/**
 * 生成星系ID对应的哈希种子
 */
function galaxyIdToSeed(galaxyId: string): string {
  return `${GLOBAL_SEED}_galaxy_${galaxyId}`;
}

/**
 * 根据噪声值确定行星类型
 * 后端类型: 'mountain' | 'swamp' | 'frozen' | 'lava' | 'arid' | 'tropical' | 'tundra'
 */
function getPlanetTypeFromNoise(temperatureNoise: number, moistureNoise: number): PlanetType {
  const temp = normalizeNoise(temperatureNoise);
  const moisture = normalizeNoise(moistureNoise);

  // 基于温度和湿度的双重噪声决定行星类型
  if (temp < 0.15) {
    // 极寒区域
    return 'frozen';
  } else if (temp < 0.3) {
    // 寒冷区域
    if (moisture > 0.5) {
      return 'tundra';
    } else {
      return 'frozen';
    }
  } else if (temp < 0.5) {
    // 温和区域
    if (moisture > 0.7) {
      return 'swamp';
    } else if (moisture > 0.4) {
      return 'tropical';
    } else {
      return 'mountain';
    }
  } else if (temp < 0.7) {
    // 温暖干燥区域
    if (moisture > 0.6) {
      return 'tropical';
    } else if (moisture > 0.3) {
      return 'arid';
    } else {
      return 'mountain';
    }
  } else {
    // 炎热区域
    if (moisture > 0.5) {
      return 'lava';
    } else {
      return 'arid';
    }
  }
}

/**
 * 生成星系中的所有行星
 */
export function generateGalaxyPlanets(galaxyId: string): GeneratedPlanet[] {
  const seed = galaxyIdToSeed(galaxyId);
  
  // 创建多个噪声生成器用于不同的特性
  const densityNoise = createSeededNoise2D(seed + '_density');
  const temperatureNoise = createSeededNoise2D(seed + '_temperature');
  const moistureNoise = createSeededNoise2D(seed + '_moisture');
  const sizeNoise = createSeededNoise2D(seed + '_size');
  const random = createSeededRandom(seed);

  const planets: GeneratedPlanet[] = [];

  // 遍历 9x9 网格
  for (let gridY = 0; gridY < GALAXY_GRID_SIZE; gridY++) {
    for (let gridX = 0; gridX < GALAXY_GRID_SIZE; gridX++) {
      const position = gridY * GALAXY_GRID_SIZE + gridX;
      
      // 使用噪声判断该位置是否有行星
      const density = octaveNoise2D(densityNoise, gridX * 0.3, gridY * 0.3, 3, 0.5, 2.0, 1.0);
      const normalizedDensity = normalizeNoise(density);
      
      // 使用密度噪声和预设密度阈值决定是否生成行星
      if (normalizedDensity < PLANET_DENSITY) {
        // 生成行星的各种属性
        const temp = octaveNoise2D(temperatureNoise, gridX * 0.2, gridY * 0.2, 4, 0.5, 2.0, 1.0);
        const moist = octaveNoise2D(moistureNoise, gridX * 0.25, gridY * 0.25, 4, 0.5, 2.0, 1.0);
        const sizeValue = octaveNoise2D(sizeNoise, gridX * 0.15, gridY * 0.15, 3, 0.5, 2.0, 1.0);
        
        const type = getPlanetTypeFromNoise(temp, moist);
        const size = Math.floor(mapNoise(sizeValue, MIN_PLANET_SIZE, MAX_PLANET_SIZE + 1));
        
        // 在网格单元内添加一些随机偏移
        const offsetX = (random() - 0.5) * 0.3;
        const offsetY = (random() - 0.5) * 0.3;
        
        planets.push({
          position,
          type,
          size,
          x: gridX + offsetX,
          y: gridY + offsetY
        });
      }
    }
  }

  return planets;
}

/**
 * 获取特定位置的行星信息
 */
export function getPlanetAtPosition(galaxyId: string, position: number): GeneratedPlanet | null {
  const planets = generateGalaxyPlanets(galaxyId);
  return planets.find(p => p.position === position) || null;
}

/**
 * 检查特定位置是否有行星
 */
export function hasPlanetAtPosition(galaxyId: string, position: number): boolean {
  return getPlanetAtPosition(galaxyId, position) !== null;
}

