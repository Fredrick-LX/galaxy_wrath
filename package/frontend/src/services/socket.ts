/**
 * WebSocket 服务
 */

import { io, type Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

/**
 * 初始化 Socket 连接
 */
export function initSocket(token: string): Socket {
    if (socket && socket.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        auth: {
            token
        }
    });

    socket.on('connect', () => {
        console.log('✅ Socket 连接成功');
    });

    socket.on('connected', (data) => {
        console.log('📡 服务器确认连接:', data);
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket 连接断开');
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Socket 连接错误:', error.message);
    });

    return socket;
}

/**
 * 获取 Socket 实例
 */
export function getSocket(): Socket | null {
    return socket;
}

/**
 * 断开 Socket 连接
 */
export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

/**
 * 订阅行星更新
 */
export function subscribePlanet(planetId: string): void {
    if (socket && socket.connected) {
        socket.emit('subscribe:planet', planetId);
    }
}

/**
 * 取消订阅行星更新
 */
export function unsubscribePlanet(planetId: string): void {
    if (socket && socket.connected) {
        socket.emit('unsubscribe:planet', planetId);
    }
}

/**
 * 请求行星最新状态
 */
export function requestPlanetUpdate(planetId: string): void {
    if (socket && socket.connected) {
        socket.emit('request:planet', planetId);
    }
}

/**
 * 保存游戏进度
 */
export function saveGame(): Promise<{ success: boolean; message?: string }> {
    return new Promise((resolve) => {
        if (!socket || !socket.connected) {
            resolve({ success: false, message: 'Socket 未连接' });
            return;
        }

        socket.emit('save:game');

        socket.once('save:success', (_) => {
            console.log('💾 游戏进度已保存');
            resolve({ success: true });
        });

        socket.once('save:error', (data) => {
            console.error('💾 保存失败:', data);
            resolve({ success: false, message: data.message });
        });

        // 超时处理
        setTimeout(() => {
            resolve({ success: false, message: '保存超时' });
        }, 5000);
    });
}
