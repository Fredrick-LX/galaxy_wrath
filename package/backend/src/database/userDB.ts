/**
 * 用户数据库操作
 */

import { db, DB_PREFIX, putData, getData, updateData } from './db';
import type { User } from '../types';

/**
 * 创建用户
 */
export async function createUser(user: User): Promise<void> {
  try {
    // 保存用户信息
    const userResult = await putData<User>(`${DB_PREFIX.USER}${user.id}`, user);
    // 创建邮箱索引
    const emailResult = await putData<string>(`${DB_PREFIX.USER_EMAIL_INDEX}${user.email}`, user.id);
    
    if (!userResult || !emailResult) {
      throw new Error('创建用户失败');
    }
  } catch (error) {
    console.error('创建用户失败:', error);
    throw new Error('创建用户失败');
  }
}

/**
 * 根据ID获取用户
 */
export async function getUserById(userId: string): Promise<User | null> {
  return await getData<User>(`${DB_PREFIX.USER}${userId}`);
}

/**
 * 根据邮箱获取用户
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    // 先通过邮箱索引获取用户ID
    const userId = await getData<string>(`${DB_PREFIX.USER_EMAIL_INDEX}${email}`);
    if (!userId) {
      return null;
    }
    // 再根据ID获取用户信息
    return await getUserById(userId);
  } catch (error) {
    console.error('根据邮箱获取用户失败:', error);
    return null;
  }
}

/**
 * 更新用户信息
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<void> {
  try {
    const result = await updateData<User>(`${DB_PREFIX.USER}${userId}`, updates);
    if (!result) {
      throw new Error('更新用户失败');
    }
  } catch (error) {
    console.error('更新用户失败:', error);
    throw new Error('更新用户失败');
  }
}

/**
 * 删除用户
 */
export async function deleteUser(userId: string): Promise<void> {
  try {
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    // 删除用户信息
    await db.del(`${DB_PREFIX.USER}${userId}`);
    // 删除邮箱索引
    await db.del(`${DB_PREFIX.USER_EMAIL_INDEX}${user.email}`);
  } catch (error) {
    console.error('删除用户失败:', error);
    throw new Error('删除用户失败');
  }
}

/**
 * 检查邮箱是否已存在
 */
export async function emailExists(email: string): Promise<boolean> {
  try {
    const userId = await getData<string>(`${DB_PREFIX.USER_EMAIL_INDEX}${email}`);
    return userId !== null;
  } catch (error) {
    console.error('检查邮箱时发生错误:', error);
    throw error;
  }
}
