/**
 * 认证服务 - 基于 Socket.io
 */

import { io, type Socket } from 'socket.io-client';
import type {
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  AuthResponse,
  VerificationCodeRequest
} from '../types/user';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let authSocket: Socket | null = null;

/**
 * 获取或创建未认证的 Socket 连接（用于登录注册）
 */
function getAuthSocket(): Socket {
  if (!authSocket || !authSocket.connected) {
    authSocket = io(SOCKET_URL, {
      auth: {
        token: '' // 未认证状态
      }
    });
  }
  return authSocket;
}

/**
 * 用户注册
 */
export async function register(data: RegisterRequest): Promise<AuthResponse> {
  return new Promise((resolve, reject) => {
    const socket = getAuthSocket();
    
    const timeout = setTimeout(() => {
      reject(new Error('注册请求超时，请稍后重试'));
    }, 10000);
    
    socket.emit('auth:register', data, (response: AuthResponse) => {
      clearTimeout(timeout);
      resolve(response);
    });
  });
}

/**
 * 用户登录
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  return new Promise((resolve, reject) => {
    const socket = getAuthSocket();
    
    const timeout = setTimeout(() => {
      reject(new Error('登录请求超时，请稍后重试'));
    }, 10000);
    
    socket.emit('auth:login', data, (response: AuthResponse) => {
      clearTimeout(timeout);
      resolve(response);
    });
  });
}

/**
 * 找回密码
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<AuthResponse> {
  return new Promise((resolve, reject) => {
    const socket = getAuthSocket();
    
    const timeout = setTimeout(() => {
      reject(new Error('密码重置请求超时，请稍后重试'));
    }, 10000);
    
    socket.emit('auth:reset-password', data, (response: AuthResponse) => {
      clearTimeout(timeout);
      resolve(response);
    });
  });
}

/**
 * 发送验证码
 */
export async function sendVerificationCode(data: VerificationCodeRequest): Promise<AuthResponse> {
  return new Promise((resolve, reject) => {
    const socket = getAuthSocket();
    
    const timeout = setTimeout(() => {
      reject(new Error('发送验证码请求超时，请稍后重试'));
    }, 10000);
    
    socket.emit('auth:send-code', data, (response: AuthResponse) => {
      clearTimeout(timeout);
      resolve(response);
    });
  });
}

/**
 * 断开认证 Socket（在成功登录后调用，切换到主 Socket）
 */
export function disconnectAuthSocket(): void {
  if (authSocket) {
    authSocket.disconnect();
    authSocket = null;
  }
}