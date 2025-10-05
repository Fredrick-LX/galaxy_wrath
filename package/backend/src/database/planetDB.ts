/**
 * 行星数据库操作
 */

import { db, putData, getData } from './db';
import type { Planet, GameSave } from '../types';

const GAME_SAVE_PREFIX = 'game:';

/**
 * 保存游戏数据
 */
export async function saveGameData(userId: string, gameSave: GameSave): Promise<void> {
  const result = await putData<GameSave>(`${GAME_SAVE_PREFIX}${userId}`, gameSave);
  if (!result) {
    throw new Error('保存游戏数据失败');
  }
}

/**
 * 获取游戏数据
 */
export async function getGameData(userId: string): Promise<GameSave | null> {
  return await getData<GameSave>(`${GAME_SAVE_PREFIX}${userId}`);
}

/**
 * 删除游戏数据
 */
export async function deleteGameData(userId: string): Promise<void> {
  await db.del(`${GAME_SAVE_PREFIX}${userId}`);
}

/**
 * 添加行星到用户游戏数据
 */
export async function addPlanetToUser(userId: string, planet: Planet): Promise<void> {
  let gameSave = await getGameData(userId);
  
  if (!gameSave) {
    gameSave = {
      userId,
      planets: [planet],
      lastSaveTime: Date.now()
    };
  } else {
    gameSave.planets.push(planet);
    gameSave.lastSaveTime = Date.now();
  }
  
  await saveGameData(userId, gameSave);
}

/**
 * 从用户游戏数据中移除行星
 */
export async function removePlanetFromUser(userId: string, planetId: string): Promise<void> {
  const gameSave = await getGameData(userId);
  
  if (gameSave) {
    gameSave.planets = gameSave.planets.filter(p => p.id !== planetId);
    gameSave.lastSaveTime = Date.now();
    await saveGameData(userId, gameSave);
  }
}