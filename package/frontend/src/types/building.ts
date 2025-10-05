/**
 * 建筑相关类型定义
 */

import type { ResourceCost, ProductionData } from './resource';
import { ZoneType } from './planet';

// 建筑类型常量
export const BuildingType = {
  // 一级生产建筑
  MINING_DRILL: 'miningDrill',           // 采矿钻井
  POWER_PLANT: 'powerPlant',             // 发电园区
  HYDROPONIC_FARM: 'hydroponicFarm',     // 水培农场
  
  // 二级生产建筑
  REFINERY: 'refinery',                  // 矿物精炼机
  TRANSFORMER: 'transformer',            // 电压变频设备
  FOOD_PROCESSOR: 'foodProcessor',       // 食品加工厂
  
  // 功能建筑
  RESIDENTIAL_BLOCK: 'residentialBlock', // 居民楼
  SYSTEM_FORTRESS: 'systemFortress',     // 星系要塞
  COLONY_SHIPYARD: 'colonyShipyard'      // 殖民船坞
} as const;

export type BuildingType = typeof BuildingType[keyof typeof BuildingType];

// 建筑状态常量
export const BuildingStatus = {
  BUILDING: 'building',     // 建造中
  ACTIVE: 'active',         // 活动中
  UPGRADING: 'upgrading'    // 升级中
} as const;

export type BuildingStatus = typeof BuildingStatus[keyof typeof BuildingStatus];

// 建筑接口
export interface Building {
  id: string;
  planetId: string;
  type: BuildingType;
  level: number;
  positionX: number;        // 在行星网格中的位置
  positionY: number;
  status: BuildingStatus;
  constructionStartTime: number;
  constructionEndTime: number;
  production: ProductionData;
  adjacencyBonus: number;   // 相邻加成百分比
}

// 建筑配置接口
export interface BuildingConfig {
  name: string;
  description: string;
  cost: ResourceCost;
  buildTime: number;        // 建造时间（秒）
  production: ProductionData;
  requiredZone: ZoneType;   // 需要的区划类型
  maxLevel: number;         // 最大等级
  adjacencyBonus: number;   // 每相邻一个同类建筑的加成 (2.5%)
}

// 建筑配置数据
export const BUILDING_CONFIGS: Record<BuildingType, BuildingConfig> = {
  // 一级生产建筑
  [BuildingType.MINING_DRILL]: {
    name: '采矿钻井',
    description: '从地下开采矿物资源',
    cost: { minerals: 50, energy: 20 },
    buildTime: 10,
    production: {
      output: { minerals: 2 },
      rate: 1
    },
    requiredZone: ZoneType.MINING,
    maxLevel: 5,
    adjacencyBonus: 0.025
  },
  
  [BuildingType.POWER_PLANT]: {
    name: '发电园区',
    description: '生产电力能源',
    cost: { minerals: 40, energy: 10 },
    buildTime: 10,
    production: {
      output: { energy: 2 },
      rate: 1
    },
    requiredZone: ZoneType.POWER,
    maxLevel: 5,
    adjacencyBonus: 0.025
  },
  
  [BuildingType.HYDROPONIC_FARM]: {
    name: '水培农场',
    description: '种植作物生产食物',
    cost: { minerals: 30, energy: 15 },
    buildTime: 10,
    production: {
      output: { food: 2 },
      rate: 1
    },
    requiredZone: ZoneType.AGRICULTURAL,
    maxLevel: 5,
    adjacencyBonus: 0.025
  },
  
  // 二级生产建筑
  [BuildingType.REFINERY]: {
    name: '矿物精炼机',
    description: '将矿物精炼为合金',
    cost: { minerals: 100, energy: 50 },
    buildTime: 20,
    production: {
      input: { minerals: 3 },
      output: { alloys: 1 },
      rate: 1
    },
    requiredZone: ZoneType.MINING,
    maxLevel: 5,
    adjacencyBonus: 0.025
  },
  
  [BuildingType.TRANSFORMER]: {
    name: '电压变频设备',
    description: '将电力转换为高能电池',
    cost: { minerals: 80, energy: 40 },
    buildTime: 20,
    production: {
      input: { energy: 3 },
      output: { powerCells: 1 },
      rate: 1
    },
    requiredZone: ZoneType.POWER,
    maxLevel: 5,
    adjacencyBonus: 0.025
  },
  
  [BuildingType.FOOD_PROCESSOR]: {
    name: '食品加工厂',
    description: '将食物加工为消费品',
    cost: { minerals: 70, energy: 30 },
    buildTime: 20,
    production: {
      input: { food: 3 },
      output: { consumerGoods: 1 },
      rate: 1
    },
    requiredZone: ZoneType.AGRICULTURAL,
    maxLevel: 5,
    adjacencyBonus: 0.025
  },
  
  // 功能建筑
  [BuildingType.RESIDENTIAL_BLOCK]: {
    name: '居民楼',
    description: '提供人口，增加生产效率',
    cost: { minerals: 100, energy: 50, food: 50 },
    buildTime: 30,
    production: {
      output: {},
      rate: 0
    },
    requiredZone: ZoneType.AGRICULTURAL,
    maxLevel: 10,
    adjacencyBonus: 0.025
  },
  
  [BuildingType.SYSTEM_FORTRESS]: {
    name: '星系要塞',
    description: '防御建筑，阻止其他玩家占领同星系行星',
    cost: { minerals: 500, energy: 300, alloys: 100 },
    buildTime: 60,
    production: {
      output: {},
      rate: 0
    },
    requiredZone: ZoneType.MINING,
    maxLevel: 3,
    adjacencyBonus: 0
  },
  
  [BuildingType.COLONY_SHIPYARD]: {
    name: '殖民船坞',
    description: '建造殖民船用于占领新行星',
    cost: { minerals: 200, energy: 150, alloys: 50 },
    buildTime: 40,
    production: {
      input: { minerals: 10, energy: 10, alloys: 5 },
      output: { colonyShips: 1 },
      rate: 0.1 // 10秒生产1艘
    },
    requiredZone: ZoneType.MINING,
    maxLevel: 5,
    adjacencyBonus: 0.025
  }
};
