/**
 * 用户状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types/user';
import { initSocket, disconnectSocket, getSocket } from '../services/socket';

export const useUserStore = defineStore('user', () => {
  // 状态
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  
  /**
   * 设置用户信息
   */
  function setUser(userData: User, authToken: string) {
    user.value = userData;
    token.value = authToken;
    
    // 保存到 localStorage
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // 初始化 Socket 连接
    const socket = initSocket(authToken);
    
    // 监听重连
    socket.on('reconnect', () => {
      console.log('🔄 Socket 重新连接成功');
    });
  }
  
  /**
   * 清除用户信息
   */
  function clearUser() {
    user.value = null;
    token.value = null;
    
    // 清除 localStorage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    
    // 断开 Socket 连接
    disconnectSocket();
  }
  
  /**
   * 从 localStorage 恢复用户信息
   */
  function restoreUser() {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken;
        user.value = JSON.parse(savedUser);
        
        // 初始化 Socket 连接
        const socket = initSocket(savedToken);
        
        // 监听重连
        socket.on('reconnect', () => {
          console.log('🔄 Socket 重新连接成功');
        });
      } catch (error) {
        console.error('恢复用户信息失败:', error);
        clearUser();
      }
    }
  }
  
  /**
   * 登出
   */
  function logout() {
    clearUser();
  }
  
  return {
    user,
    token,
    isAuthenticated,
    setUser,
    clearUser,
    restoreUser,
    logout
  };
}, {
  persist: true  // 使用 pinia-plugin-persistedstate 持久化
});
