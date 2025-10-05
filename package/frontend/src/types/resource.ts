/**
 * 资源相关类型定义
 */

// 资源存储接口
export interface ResourceStorage {
  // 一级资源
  minerals: number;      // 矿物
  energy: number;        // 电力
  food: number;          // 食物
  
  // 二级资源
  alloys: number;        // 合金
  powerCells: number;    // 高能电池
  consumerGoods: number; // 消费品
  
  // 三级资源（待扩展）
  techComponents: number; // 科技组件
  colonyShips: number;    // 殖民船
}

// 资源类型常量
export const ResourceType = {
  // 一级资源
  MINERALS: 'minerals',
  ENERGY: 'energy',
  FOOD: 'food',
  
  // 二级资源
  ALLOYS: 'alloys',
  POWER_CELLS: 'powerCells',
  CONSUMER_GOODS: 'consumerGoods',
  
  // 三级资源
  TECH_COMPONENTS: 'techComponents',
  COLONY_SHIPS: 'colonyShips'
} as const;

export type ResourceType = typeof ResourceType[keyof typeof ResourceType];

// 资源成本接口
export interface ResourceCost {
  [ResourceType.MINERALS]?: number;
  [ResourceType.ENERGY]?: number;
  [ResourceType.FOOD]?: number;
  [ResourceType.ALLOYS]?: number;
  [ResourceType.POWER_CELLS]?: number;
  [ResourceType.CONSUMER_GOODS]?: number;
  [ResourceType.TECH_COMPONENTS]?: number;
  [ResourceType.COLONY_SHIPS]?: number;
}

// 生产数据接口
export interface ProductionData {
  input?: ResourceCost;   // 输入资源
  output: ResourceCost;   // 输出资源
  rate: number;           // 生产速率（每秒）
}

// 初始资源配置
export const INITIAL_RESOURCES: ResourceStorage = {
  minerals: 500,
  energy: 500,
  food: 500,
  alloys: 0,
  powerCells: 0,
  consumerGoods: 0,
  techComponents: 0,
  colonyShips: 0
};
