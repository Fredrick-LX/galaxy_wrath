/**
 * 用户相关类型定义
 */

// 用户信息接口
export interface User {
  id: string;              // UUID
  email: string;           // 邮箱
  username: string;        // 用户名
  level: number;           // 等级（当前锁定为1）
  createdAt: number;       // 创建时间戳
  lastLoginAt: number;     // 最后登录时间戳
  offlineTime: number;     // 离线时间戳
}

// 登录请求
export interface LoginRequest {
  email: string;
  password: string;
}

// 注册请求
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  verificationCode: string;  // 验证码（测试阶段任意6位数字）
}

// 找回密码请求
export interface ResetPasswordRequest {
  email: string;
  verificationCode: string;  // 验证码（测试阶段任意6位数字）
  newPassword: string;
}

// 认证响应
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

// 验证码请求（预留接口）
export interface VerificationCodeRequest {
  email: string;
}
