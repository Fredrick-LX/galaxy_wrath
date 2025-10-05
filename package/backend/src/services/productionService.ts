/**
 * 生产计算服务
 */

import type { Planet, Building, ResourceStorage } from '../types';
import { PRODUCTION_INTERVAL } from '../config/constants';

// 建筑配置（与前端保持一致）
const BUILDING_CONFIGS: Record<string, any> = {
  miningDrill: {
    production: { output: { minerals: 2 }, rate: 1 },
    adjacencyBonus: 0.025
  },
  powerPlant: {
    production: { output: { energy: 2 }, rate: 1 },
    adjacencyBonus: 0.025
  },
  hydroponicFarm: {
    production: { output: { food: 2 }, rate: 1 },
    adjacencyBonus: 0.025
  },
  refinery: {
    production: { input: { minerals: 3 }, output: { alloys: 1 }, rate: 1 },
    adjacencyBonus: 0.025
  },
  transformer: {
    production: { input: { energy: 3 }, output: { powerCells: 1 }, rate: 1 },
    adjacencyBonus: 0.025
  },
  foodProcessor: {
    production: { input: { food: 3 }, output: { consumerGoods: 1 }, rate: 1 },
    adjacencyBonus: 0.025
  },
  residentialBlock: {
    production: { output: {}, rate: 0 },
    adjacencyBonus: 0.025
  },
  systemFortress: {
    production: { output: {}, rate: 0 },
    adjacencyBonus: 0
  },
  colonyShipyard: {
    production: { input: { minerals: 10, energy: 10, alloys: 5 }, output: { colonyShips: 1 }, rate: 0.1 },
    adjacencyBonus: 0.025
  }
};

/**
 * 计算建筑的相邻加成
 */
function calculateAdjacencyBonus(building: Building, planet: Planet): number {
  const adjacentPositions = [
    { x: building.positionX - 1, y: building.positionY },
    { x: building.positionX + 1, y: building.positionY },
    { x: building.positionX, y: building.positionY - 1 },
    { x: building.positionX, y: building.positionY + 1 }
  ];

  let bonus = 0;
  adjacentPositions.forEach(pos => {
    const adjacentBuilding = planet.buildings.find(
      b => b.positionX === pos.x && b.positionY === pos.y
    );
    if (adjacentBuilding && adjacentBuilding.type === building.type) {
      bonus += 0.025;
    }
  });

  return bonus;
}

/**
 * 计算单个行星的生产
 */
export function calculatePlanetProduction(planet: Planet): ResourceStorage {
  const production: ResourceStorage = {
    minerals: 0,
    energy: 0,
    food: 0,
    alloys: 0,
    powerCells: 0,
    consumerGoods: 0,
    techComponents: 0,
    colonyShips: 0
  };

  planet.buildings.forEach(building => {
    // 只有活动状态的建筑才生产
    if (building.status !== 'active') return;

    const config = BUILDING_CONFIGS[building.type];
    if (!config) return;

    // 计算相邻加成
    const adjacencyBonus = calculateAdjacencyBonus(building, planet);
    const totalBonus = 1 + adjacencyBonus;

    // 输出资源
    if (config.production.output) {
      Object.entries(config.production.output).forEach(([resource, amount]) => {
        if (production[resource as keyof ResourceStorage] !== undefined) {
          production[resource as keyof ResourceStorage] += (amount as number) * totalBonus * config.production.rate;
        }
      });
    }

    // 消耗资源（输入）
    if (config.production.input) {
      Object.entries(config.production.input).forEach(([resource, amount]) => {
        if (production[resource as keyof ResourceStorage] !== undefined) {
          production[resource as keyof ResourceStorage] -= (amount as number) * config.production.rate;
        }
      });
    }
  });

  return production;
}

/**
 * 应用生产到行星资源
 */
export function applyProduction(planet: Planet, productionRate: number = 1): void {
  const production = calculatePlanetProduction(planet);

  // 应用生产（考虑生产率）
  Object.entries(production).forEach(([resource, amount]) => {
    const key = resource as keyof ResourceStorage;
    planet.resources[key] += amount * productionRate;
    
    // 确保资源不为负数（除了消耗）
    if (planet.resources[key] < 0) {
      planet.resources[key] = 0;
    }
  });
}

/**
 * 更新建筑状态（建造完成、升级完成等）
 */
export function updateBuildingStatus(planet: Planet, currentTime: number): boolean {
  let hasUpdates = false;

  planet.buildings.forEach(building => {
    if (building.status === 'building' || building.status === 'upgrading') {
      if (currentTime >= building.constructionEndTime) {
        building.status = 'active';
        hasUpdates = true;
      }
    }
  });

  return hasUpdates;
}

/**
 * 计算离线收益
 */
export function calculateOfflineRewards(
  planet: Planet,
  offlineTime: number,
  offlineBonusRate: number = 0.25
): ResourceStorage {
  // 计算正常生产
  const production = calculatePlanetProduction(planet);
  
  // 离线收益 = 正常生产 × 离线时间（秒） × 离线收益比率
  const offlineSeconds = offlineTime / 1000;
  const rewards: ResourceStorage = {
    minerals: 0,
    energy: 0,
    food: 0,
    alloys: 0,
    powerCells: 0,
    consumerGoods: 0,
    techComponents: 0,
    colonyShips: 0
  };

  Object.entries(production).forEach(([resource, amount]) => {
    const key = resource as keyof ResourceStorage;
    // 只计算正向生产（不计算消耗）
    if (amount > 0) {
      rewards[key] = amount * offlineSeconds * offlineBonusRate;
    }
  });

  return rewards;
}

/**
 * 生产计算引擎类
 */
export class ProductionEngine {
  private interval: NodeJS.Timeout | null = null;
  private planets: Map<string, Planet> = new Map();
  private onUpdate: ((planetId: string, planet: Planet) => void) | null = null;

  /**
   * 添加行星到生产循环
   */
  addPlanet(planet: Planet): void {
    this.planets.set(planet.id, planet);
  }

  /**
   * 移除行星
   */
  removePlanet(planetId: string): void {
    this.planets.delete(planetId);
  }

  /**
   * 获取行星
   */
  getPlanet(planetId: string): Planet | undefined {
    return this.planets.get(planetId);
  }

  /**
   * 设置更新回调
   */
  setUpdateCallback(callback: (planetId: string, planet: Planet) => void): void {
    this.onUpdate = callback;
  }

  /**
   * 启动生产引擎
   */
  start(): void {
    if (this.interval) return;

    console.log('🏭 生产引擎已启动');
    
    this.interval = setInterval(() => {
      const currentTime = Date.now();
      
      this.planets.forEach((planet, planetId) => {
        // 更新建筑状态
        const statusUpdated = updateBuildingStatus(planet, currentTime);
        
        // 应用生产
        applyProduction(planet, PRODUCTION_INTERVAL / 1000);
        
        // 通知更新
        if (this.onUpdate && (statusUpdated || true)) {
          this.onUpdate(planetId, planet);
        }
      });
    }, PRODUCTION_INTERVAL);
  }

  /**
   * 停止生产引擎
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('🏭 生产引擎已停止');
    }
  }

  /**
   * 获取所有行星
   */
  getAllPlanets(): Planet[] {
    return Array.from(this.planets.values());
  }
}

// 全局生产引擎实例
export const productionEngine = new ProductionEngine();
