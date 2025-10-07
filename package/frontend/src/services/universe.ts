/**
 * 宇宙服务 - 与后端通信获取宇宙数据
 */

import { getSocket } from './socket';

export interface UniverseGalaxyPlanet {
    position: number;
    type: 'mountain' | 'swamp' | 'frozen' | 'lava' | 'arid' | 'tropical' | 'tundra';
    size: number;
    x: number;
    y: number;
}

export interface UniverseGalaxyData {
    id: string;
    gridX: number;
    gridY: number;
    planets: UniverseGalaxyPlanet[];
}

/**
 * 获取视口范围内的星系数据
 */
export function getGalaxies(
    startX: number,
    startY: number,
    endX: number,
    endY: number
): Promise<{ success: boolean; galaxies?: UniverseGalaxyData[]; message?: string }> {
    return new Promise((resolve) => {
        const socket = getSocket();
        if (!socket || !socket.connected) {
            resolve({ success: false, message: 'Socket 未连接' });
            return;
        }

        socket.emit('universe:get-galaxies', { startX, startY, endX, endY }, (response: any) => {
            resolve(response);
        });

        // 超时处理
        setTimeout(() => {
            resolve({ success: false, message: '请求超时' });
        }, 10000);
    });
}

/**
 * 获取单个星系的行星数据
 */
export function getGalaxyPlanets(
    galaxyId: string
): Promise<{ success: boolean; galaxyId?: string; planets?: UniverseGalaxyPlanet[]; message?: string }> {
    return new Promise((resolve) => {
        const socket = getSocket();
        if (!socket || !socket.connected) {
            resolve({ success: false, message: 'Socket 未连接' });
            return;
        }

        socket.emit('universe:get-galaxy-planets', { galaxyId }, (response: any) => {
            resolve(response);
        });

        // 超时处理
        setTimeout(() => {
            resolve({ success: false, message: '请求超时' });
        }, 5000);
    });
}

/**
 * 获取特定位置的行星信息
 */
export function getPlanetAtPosition(
    galaxyId: string,
    position: number
): Promise<{ success: boolean; planet?: UniverseGalaxyPlanet; message?: string }> {
    return new Promise((resolve) => {
        const socket = getSocket();
        if (!socket || !socket.connected) {
            resolve({ success: false, message: 'Socket 未连接' });
            return;
        }

        socket.emit('universe:get-planet-at-position', { galaxyId, position }, (response: any) => {
            resolve(response);
        });

        // 超时处理
        setTimeout(() => {
            resolve({ success: false, message: '请求超时' });
        }, 5000);
    });
}

