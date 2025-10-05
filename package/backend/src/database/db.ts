/**
 * 数据库初始化
 */

import { Level } from 'level';
import path from 'path';

// 数据库路径
const DB_PATH = path.join(process.cwd(), 'data', 'galaxy_wrath_db');

// 数据库前缀
const DB_PREFIX = {
  USER: 'user:',
  USER_EMAIL_INDEX: 'email:',
  GAME_SAVE: 'game:',
  PLANET: 'planet:',
  BUILDING: 'building:'
};

// 创建数据库实例（使用 utf8 编码，手动序列化）
const db = new Level(DB_PATH, { valueEncoding: 'utf8' });

/**
 * 序列化数据为 JSON 字符串
 */
function serialize<T>(data: T): string {
  return JSON.stringify(data);
}

/**
 * 反序列化 JSON 字符串为对象
 */
function deserialize<T>(data: string): T {
  return JSON.parse(data) as T;
}

/**
 * 插入数据到数据库
 */
async function putData<T>(key: string, data: T): Promise<boolean> {
  try {
    const serializedData = serialize(data);
    await db.put(key, serializedData);
    return true;
  } catch (error) {
    console.error('插入数据失败:', error);
    return false;
  }
}

/**
 * 从数据库获取数据
 */
async function getData<T>(key: string): Promise<T | null> {
  try {
    const data = await db.get(key);
    return deserialize<T>(data);
  } catch (error: any) {
    // 键不存在时返回 null，不打印错误
    if (error.notFound || error.code === 'LEVEL_NOT_FOUND' || error.type === 'NotFoundError') {
      return null;
    }
    console.error('获取数据失败:', error);
    return null;
  }
}

/**
 * 更新数据库中的数据
 */
async function updateData<T>(
  key: string,
  partialData: Partial<T>,
  mergeFunction?: (oldData: T, newData: Partial<T>) => T
): Promise<boolean> {
  try {
    // 获取当前数据
    const currentData = await getData<T>(key);
    if (currentData === null) {
      throw new Error(`未找到键为 ${key} 的数据`);
    }

    // 使用提供的合并函数或默认合并逻辑来合并数据
    const mergedData = mergeFunction
      ? mergeFunction(currentData, partialData)
      : { ...currentData, ...partialData };

    // 序列化合并后的数据并存储
    const serializedData = serialize(mergedData);
    await db.put(key, serializedData);
    return true;
  } catch (error) {
    console.error('更新数据失败:', error);
    return false;
  }
}

/**
 * 根据前缀获取所有匹配的键
 */
async function getKeys(prefix: string): Promise<string[] | null> {
  try {
    const keys: string[] = [];
    const stream = db.keys({ gte: prefix, lt: prefix + '\uffff' });
    for await (const key of stream) {
      keys.push(key);
    }
    return keys;
  } catch (error) {
    console.error('获取键列表失败:', error);
    return null;
  }
}

/**
 * 初始化数据库
 */
async function initDatabase(): Promise<void> {
  try {
    await db.open();
    console.log('✅ LevelDB 数据库已初始化');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 关闭数据库
 */
async function closeDatabase(): Promise<void> {
  try {
    await db.close();
    console.log('✅ LevelDB 数据库已关闭');
  } catch (error) {
    console.error('❌ 关闭数据库失败:', error);
    throw error;
  }
}

export {
  DB_PREFIX,
  db,
  putData,
  getData,
  updateData,
  getKeys,
  initDatabase,
  closeDatabase
};