/**
 * 用户认证服务
 */

import { v4 as uuidv4 } from 'uuid';
import { hashPassword, verifyPassword } from '../utils/encryption';
import { generateToken } from '../utils/jwt';
import { createUser, getUserByEmail, emailExists, updateUser } from '../database/userDB';
import type { User } from '../types';

/**
 * 验证码验证（测试阶段：任意6位数字通过）
 */
function verifyCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

/**
 * 用户注册
 */
export async function register(
  email: string,
  password: string,
  username: string,
  verificationCode: string
): Promise<{ success: boolean; message: string; token?: string; user?: Omit<User, 'passwordHash'> }> {
  try {
    // 验证验证码
    if (!verifyCode(verificationCode)) {
      return { success: false, message: '验证码格式错误，请输入6位数字' };
    }
    
    // 检查邮箱是否已存在
    if (await emailExists(email)) {
      return { success: false, message: '该邮箱已被注册' };
    }
    
    // 加密密码
    const passwordHash = await hashPassword(password);
    
    // 创建用户
    const user: User = {
      id: uuidv4(),
      email,
      passwordHash,
      username,
      level: 1,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      offlineTime: Date.now()
    };
    
    await createUser(user);
    
    // 生成 JWT Token
    const token = generateToken({ userId: user.id, email: user.email });
    
    // 返回用户信息（不包含密码哈希）
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return {
      success: true,
      message: '注册成功',
      token,
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('注册失败:', error);
    return { success: false, message: '注册失败，请稍后重试' };
  }
}

/**
 * 用户登录
 */
export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; token?: string; user?: Omit<User, 'passwordHash'> }> {
  try {
    // 查找用户
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, message: '邮箱或密码错误' };
    }
    
    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, message: '邮箱或密码错误' };
    }
    
    // 更新最后登录时间
    await updateUser(user.id, { lastLoginAt: Date.now(), offlineTime: Date.now() });
    
    // 生成 JWT Token
    const token = generateToken({ userId: user.id, email: user.email });
    
    // 返回用户信息（不包含密码哈希）
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    return {
      success: true,
      message: '登录成功',
      token,
      user: userWithoutPassword
    };
  } catch (error) {
    console.error('登录失败:', error);
    return { success: false, message: '登录失败，请稍后重试' };
  }
}

/**
 * 找回密码
 */
export async function resetPassword(
  email: string,
  verificationCode: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 验证验证码
    if (!verifyCode(verificationCode)) {
      return { success: false, message: '验证码格式错误，请输入6位数字' };
    }
    
    // 查找用户
    const user = await getUserByEmail(email);
    if (!user) {
      return { success: false, message: '该邮箱未注册' };
    }
    
    // 加密新密码
    const passwordHash = await hashPassword(newPassword);
    
    // 更新密码
    await updateUser(user.id, { passwordHash });
    
    return { success: true, message: '密码重置成功' };
  } catch (error) {
    console.error('重置密码失败:', error);
    return { success: false, message: '密码重置失败，请稍后重试' };
  }
}

/**
 * 发送验证码（预留接口，测试阶段不实现）
 */
export async function sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
  // 测试阶段直接返回成功
  console.log(`[测试模式] 发送验证码到 ${email}，任意6位数字可通过验证`);
  return { success: true, message: '验证码已发送（测试模式：任意6位数字可通过验证）' };
}
