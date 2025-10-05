/**
 * 建筑数据库操作（预留）
 */

import type { Building } from '../types';

/**
 * 建筑数据当前存储在行星数据中
 * 此文件用于未来可能的建筑独立存储需求
 */

export interface BuildingOperation {
  planetId: string;
  building: Building;
}

// 建筑操作将通过行星数据进行
// 预留接口供后续扩展
