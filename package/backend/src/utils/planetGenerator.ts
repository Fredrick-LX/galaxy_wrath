/**
 * 行星区划生成器 - 使用 simplex-noise
 */

import { GLOBAL_SEED } from '../config/constants';
import { createSeededNoise2D, octaveNoise2D, normalizeNoise } from './noiseGenerator';
import type { Zone, ZoneType } from '../types';

/**
 * 区划类型对应的颜色
 */
const ZONE_COLORS: Record<ZoneType, string> = {
  mining: '#8B6914',
  power: '#4A90E2',
  agricultural: '#4CAF50',
  wasteland: '#6B6B6B'
};

/**
 * 生成行星ID对应的种子
 */
function planetIdToSeed(planetId: string): string {
  return `${GLOBAL_SEED}_planet_${planetId}`;
}

/**
 * 根据多层噪声值确定区划类型
 */
function getZoneTypeFromNoise(
  resourceNoise: number,
  fertilityNoise: number,
  energyNoise: number
): ZoneType {
  // 归一化所有噪声值到 [0, 1]
  const resource = normalizeNoise(resourceNoise);
  const fertility = normalizeNoise(fertilityNoise);
  const energy = normalizeNoise(energyNoise);

  // 找出最高的特性值
  const maxValue = Math.max(resource, fertility, energy);
  
  // 如果所有值都很低，则为荒地
  if (maxValue < 0.3) {
    return 'wasteland';
  }

  // 根据最高值确定区划类型
  if (resource === maxValue && resource > 0.4) {
    return 'mining';
  } else if (fertility === maxValue && fertility > 0.4) {
    return 'agricultural';
  } else if (energy === maxValue && energy > 0.4) {
    return 'power';
  } else {
    return 'wasteland';
  }
}

/**
 * 生成行星的区划网格
 */
export function generatePlanetZones(planetId: string, size: number): Zone[][] {
  const seed = planetIdToSeed(planetId);
  
  // 创建多个噪声生成器用于不同的资源类型
  const resourceNoise = createSeededNoise2D(seed + '_resource');
  const fertilityNoise = createSeededNoise2D(seed + '_fertility');
  const energyNoise = createSeededNoise2D(seed + '_energy');

  const zones: Zone[][] = [];

  // 生成 size x size 的区划网格
  for (let y = 0; y < size; y++) {
    const row: Zone[] = [];
    for (let x = 0; x < size; x++) {
      // 使用多层噪声生成更自然的地形
      const resource = octaveNoise2D(
        resourceNoise,
        x * 0.3,
        y * 0.3,
        4,      // octaves
        0.5,    // persistence
        2.0,    // lacunarity
        1.0     // scale
      );

      const fertility = octaveNoise2D(
        fertilityNoise,
        x * 0.25,
        y * 0.25,
        4,
        0.5,
        2.0,
        1.0
      );

      const energy = octaveNoise2D(
        energyNoise,
        x * 0.35,
        y * 0.35,
        4,
        0.5,
        2.0,
        1.0
      );

      const type = getZoneTypeFromNoise(resource, fertility, energy);
      
      row.push({
        type,
        color: ZONE_COLORS[type]
      });
    }
    zones.push(row);
  }

  return zones;
}

/**
 * 重新生成初始行星的区划（为新手提供更均衡的布局）
 */
export function generateBalancedStartingZones(planetId: string, size: number): Zone[][] {
  const zones = generatePlanetZones(planetId, size);
  
  // 统计各类型区划数量
  const counts: Record<ZoneType, number> = {
    mining: 0,
    power: 0,
    agricultural: 0,
    wasteland: 0
  };

  for (const row of zones) {
    for (const zone of row) {
      counts[zone.type]++;
    }
  }

  // 确保每种资源类型至少有一定数量
  const totalZones = size * size;
  const minRequired = Math.floor(totalZones * 0.15); // 至少15%

  // 如果某类型不足，进行调整
  if (counts.mining < minRequired || counts.power < minRequired || counts.agricultural < minRequired) {
    // 使用原生成算法但调整参数以获得更均衡的分布
    const seed = planetIdToSeed(planetId) + '_balanced';
    const resourceNoise = createSeededNoise2D(seed + '_resource');
    const fertilityNoise = createSeededNoise2D(seed + '_fertility');
    const energyNoise = createSeededNoise2D(seed + '_energy');

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // 调整噪声参数以获得更均衡的分布
        const resource = octaveNoise2D(resourceNoise, x * 0.2, y * 0.2, 3, 0.4, 2.0, 1.5);
        const fertility = octaveNoise2D(fertilityNoise, x * 0.2, y * 0.2, 3, 0.4, 2.0, 1.5);
        const energy = octaveNoise2D(energyNoise, x * 0.2, y * 0.2, 3, 0.4, 2.0, 1.5);

        const type = getZoneTypeFromNoise(resource, fertility, energy);
        zones[y][x] = {
          type,
          color: ZONE_COLORS[type]
        };
      }
    }
  }

  return zones;
}

