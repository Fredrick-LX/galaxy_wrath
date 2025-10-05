/**
 * 宇宙服务 - 初始行星分配
 */

import { GLOBAL_SEED, INITIAL_RESOURCES } from '../config/constants';
import type { Planet } from '../types';

/**
 * 生成简单的哈希值（用于种子生成）
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * 简单的随机数生成器
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * 为新玩家分配初始行星
 */
export async function assignStartingPlanet(userId: string): Promise<Planet> {
  // 使用用户ID生成唯一的星系坐标
  const userSeed = simpleHash(userId);
  const rng = seededRandom(userSeed + GLOBAL_SEED);
  
  // 在较远的范围内随机选择一个空星系
  const gridX = Math.floor((rng() - 0.5) * 100); // -50 到 50
  const gridY = Math.floor((rng() - 0.5) * 100);
  
  // 生成星系ID
  let galaxyId = '';
  if (gridX === 0 && gridY === 0) {
    galaxyId = '0';
  } else {
    const absX = Math.abs(gridX);
    const absY = Math.abs(gridY);
    const dirX = gridX > 0 ? 'E' : 'W';
    const dirY = gridY > 0 ? 'N' : 'S';
    
    if (gridX === 0) {
      galaxyId = `${dirY}${absY}`;
    } else if (gridY === 0) {
      galaxyId = `${dirX}${absX}`;
    } else {
      galaxyId = `${dirY}${absY}${dirX}${absX}`;
    }
  }
  
  // 在星系中随机选择一个行星位置（0-80）
  const position = Math.floor(rng() * 81);
  const planetId = `${galaxyId}_${position}`;
  
  // 生成初始行星（简化版本，实际应该从前端生成算法获取）
  const planet: Planet = {
    id: planetId,
    galaxyId,
    position,
    type: 'tropical', // 初始行星固定为热带类型（适合新手）
    size: 5, // 中等大小
    ownerId: userId,
    zones: generateInitialZones(5),
    buildings: [],
    resources: { ...INITIAL_RESOURCES }
  };
  
  return planet;
}

/**
 * 生成初始区划（简化版本）
 */
function generateInitialZones(size: number): any[][] {
  const zones: any[][] = [];
  
  for (let y = 0; y < size; y++) {
    const row: any[] = [];
    for (let x = 0; x < size; x++) {
      // 简单的区划分布
      let type = 'wasteland';
      const sum = x + y;
      
      if (sum < size) {
        type = 'mining';
      } else if (sum < size * 1.5) {
        type = 'power';
      } else {
        type = 'agricultural';
      }
      
      const colors: Record<string, string> = {
        mining: '#8B6914',
        power: '#4A90E2',
        agricultural: '#4CAF50',
        wasteland: '#6B6B6B'
      };
      
      row.push({
        type,
        color: colors[type]
      });
    }
    zones.push(row);
  }
  
  return zones;
}

/**
 * 检查行星是否已被占领
 */
export function isPlanetOccupied(planetId: string, allPlanets: Planet[]): boolean {
  return allPlanets.some(p => p.id === planetId && p.ownerId !== null);
}
