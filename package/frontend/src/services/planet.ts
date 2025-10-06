/**
 * 行星服务 - 基于 Socket.io
 */

import { getSocket } from './socket';
import type { Planet } from '../types/planet';
import type { Building } from '../types/building';

/**
 * 获取玩家的所有行星
 */
export async function getMyPlanets(): Promise<{ success: boolean; planets?: Planet[]; message?: string }> {
    return new Promise((resolve, reject) => {
        const socket = getSocket();
        if (!socket || !socket.connected) {
            resolve({ success: false, message: 'Socket 未连接' });
            return;
        }

        const timeout = setTimeout(() => {
            reject(new Error('获取行星请求超时'));
        }, 10000);

        socket.emit('planet:get-my-planets', (response: any) => {
            clearTimeout(timeout);
            resolve(response);
        });
    });
}

/**
 * 获取单个行星详情
 */
export async function getPlanetById(planetId: string): Promise<{ success: boolean; planet?: Planet; message?: string }> {
    return new Promise((resolve, reject) => {
        const socket = getSocket();
        if (!socket || !socket.connected) {
            resolve({ success: false, message: 'Socket 未连接' });
            return;
        }

        const timeout = setTimeout(() => {
            reject(new Error('获取行星详情请求超时'));
        }, 10000);

        socket.emit('planet:get-detail', { planetId }, (response: any) => {
            clearTimeout(timeout);
            resolve(response);
        });
    });
}

/**
 * 在行星上建造建筑
 */
export async function buildBuilding(
    planetId: string,
    building: Building
): Promise<{ success: boolean; planet?: Planet; message?: string }> {
    return new Promise((resolve, reject) => {
        const socket = getSocket();
        if (!socket || !socket.connected) {
            resolve({ success: false, message: 'Socket 未连接' });
            return;
        }

        const timeout = setTimeout(() => {
            reject(new Error('建造建筑请求超时'));
        }, 10000);

        socket.emit('planet:build', { planetId, building }, (response: any) => {
            clearTimeout(timeout);
            resolve(response);
        });
    });
}

/**
 * 更新建筑（升级、拆除）
 */
export async function updateBuilding(
    planetId: string,
    buildingId: string,
    action: 'upgrade' | 'demolish' | 'update',
    updates?: Partial<Building>
): Promise<{ success: boolean; planet?: Planet; message?: string }> {
    return new Promise((resolve, reject) => {
        const socket = getSocket();
        if (!socket || !socket.connected) {
            resolve({ success: false, message: 'Socket 未连接' });
            return;
        }

        const timeout = setTimeout(() => {
            reject(new Error('更新建筑请求超时'));
        }, 10000);

        socket.emit('planet:update-building', { planetId, buildingId, action, updates }, (response: any) => {
            clearTimeout(timeout);
            resolve(response);
        });
    });
}

/**
 * 领取离线收益
 */
export async function claimOfflineRewards(): Promise<{
    success: boolean;
    planets?: Planet[];
    rewards?: Record<string, any>;
    offlineTime?: number;
    message?: string;
}> {
    return new Promise((resolve, reject) => {
        const socket = getSocket();
        if (!socket || !socket.connected) {
            resolve({ success: false, message: 'Socket 未连接' });
            return;
        }

        const timeout = setTimeout(() => {
            reject(new Error('领取离线收益请求超时'));
        }, 10000);

        socket.emit('planet:claim-offline-rewards', (response: any) => {
            clearTimeout(timeout);
            resolve(response);
        });
    });
}