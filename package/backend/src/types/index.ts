/**
 * 后端类型定义
 */

import { Request } from 'express';

// ==================== 用户相关类型 ====================

export interface User {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    level: number;
    createdAt: number;
    lastLoginAt: number;
    offlineTime: number;
}

export interface AuthRequest extends Request {
    userId?: string;
    user?: User;
}

// ==================== 资源类型 ====================

export interface ResourceStorage {
    minerals: number;
    energy: number;
    food: number;
    alloys: number;
    powerCells: number;
    consumerGoods: number;
    techComponents: number;
    colonyShips: number;
}

// ==================== 行星类型 ====================

export type PlanetType = 'mountain' | 'swamp' | 'frozen' | 'lava' | 'arid' | 'tropical' | 'tundra';
export type ZoneType = 'mining' | 'power' | 'agricultural' | 'wasteland';

export interface Zone {
    type: ZoneType;
    color: string;
}

export interface Planet {
    id: string;
    galaxyId: string;
    position: number;
    type: PlanetType;
    size: number;
    ownerId: string | null;
    zones: Zone[][];
    buildings: Building[];
    resources: ResourceStorage;
}

// ==================== 建筑类型 ====================

export type BuildingType =
    | 'miningDrill'
    | 'powerPlant'
    | 'hydroponicFarm'
    | 'refinery'
    | 'transformer'
    | 'foodProcessor'
    | 'residentialBlock'
    | 'systemFortress'
    | 'colonyShipyard';

export type BuildingStatus = 'building' | 'active' | 'upgrading';

export interface Building {
    id: string;
    planetId: string;
    type: BuildingType;
    level: number;
    positionX: number;
    positionY: number;
    status: BuildingStatus;
    constructionStartTime: number;
    constructionEndTime: number;
    production: {
        input?: Partial<ResourceStorage>;
        output: Partial<ResourceStorage>;
        rate: number;
    };
    adjacencyBonus: number;
}

// ==================== 游戏存档类型 ====================

export interface GameSave {
    userId: string;
    planets: Planet[];
    lastSaveTime: number;
}