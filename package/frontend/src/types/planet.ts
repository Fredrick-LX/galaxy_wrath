/**
 * 行星相关类型定义
 */

import type { ResourceStorage } from './resource';
import type { Building } from './building';

// 行星类型常量
export const PlanetType = {
  MOUNTAIN: 'mountain',   // 高山
  SWAMP: 'swamp',        // 沼泽
  FROZEN: 'frozen',      // 冰冻
  LAVA: 'lava',          // 熔岩
  ARID: 'arid',          // 干旱
  TROPICAL: 'tropical',  // 热带
  TUNDRA: 'tundra'       // 寒带
} as const;

export type PlanetType = typeof PlanetType[keyof typeof PlanetType];

// 区划类型常量
export const ZoneType = {
  MINING: 'mining',         // 采矿区划
  POWER: 'power',           // 发电区划
  AGRICULTURAL: 'agricultural', // 农业区划
  WASTELAND: 'wasteland'    // 荒芜区划
} as const;

export type ZoneType = typeof ZoneType[keyof typeof ZoneType];

// 区划接口
export interface Zone {
  type: ZoneType;
  color: string;  // 渲染颜色
}

// 行星接口
export interface Planet {
  id: string;              // 如 "N1E1_11"
  galaxyId: string;        // 所属星系ID
  position: number;        // 在星系中的位置 0-80
  type: PlanetType;        // 行星类型
  size: number;            // 4-7
  ownerId: string | null;  // 拥有者ID
  zones: Zone[][];         // size × size 的区划网格
  buildings: Building[];   // 建筑列表
  resources: ResourceStorage; // 资源存储
  name?: string;           // 行星名称（可选）
}

// 行星类型资源影响系数
export const PLANET_TYPE_MODIFIERS: Record<PlanetType, { minerals: number; energy: number; food: number }> = {
  [PlanetType.MOUNTAIN]: { minerals: 1.5, energy: 1.0, food: 0.5 },
  [PlanetType.SWAMP]: { minerals: 0.8, energy: 0.9, food: 1.2 },
  [PlanetType.FROZEN]: { minerals: 1.0, energy: 0.7, food: 0.3 },
  [PlanetType.LAVA]: { minerals: 1.8, energy: 1.3, food: 0.2 },
  [PlanetType.ARID]: { minerals: 1.2, energy: 1.0, food: 0.6 },
  [PlanetType.TROPICAL]: { minerals: 0.7, energy: 1.0, food: 1.8 },
  [PlanetType.TUNDRA]: { minerals: 1.0, energy: 1.2, food: 0.5 }
};

// 区划颜色配置
export const ZONE_COLORS: Record<ZoneType, string> = {
  [ZoneType.MINING]: '#8B6914',        // 棕色/橙色
  [ZoneType.POWER]: '#4A90E2',         // 蓝色/青色
  [ZoneType.AGRICULTURAL]: '#4CAF50',  // 绿色
  [ZoneType.WASTELAND]: '#6B6B6B'      // 灰色
};

// 行星类型显示名称
export const PLANET_TYPE_NAMES: Record<PlanetType, string> = {
  [PlanetType.MOUNTAIN]: '高山',
  [PlanetType.SWAMP]: '沼泽',
  [PlanetType.FROZEN]: '冰冻',
  [PlanetType.LAVA]: '熔岩',
  [PlanetType.ARID]: '干旱',
  [PlanetType.TROPICAL]: '热带',
  [PlanetType.TUNDRA]: '寒带'
};

// 区划类型显示名称
export const ZONE_TYPE_NAMES: Record<ZoneType, string> = {
  [ZoneType.MINING]: '采矿区划',
  [ZoneType.POWER]: '发电区划',
  [ZoneType.AGRICULTURAL]: '农业区划',
  [ZoneType.WASTELAND]: '荒芜区划'
};
