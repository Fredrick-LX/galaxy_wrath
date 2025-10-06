/**
 * 资源状态管理
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { ResourceStorage } from '../types/resource';
import { INITIAL_RESOURCES } from '../types/resource';
import { getSocket } from '../services/socket';

export const useResourcesStore = defineStore('resources', () => {
    // 全局资源（所有行星的总和）
    const globalResources = ref<ResourceStorage>({ ...INITIAL_RESOURCES });

    // 行星资源映射
    const planetResources = ref<Map<string, ResourceStorage>>(new Map());

    /**
     * 设置行星资源
     */
    function setPlanetResources(planetId: string, resources: ResourceStorage) {
        planetResources.value.set(planetId, { ...resources });
        updateGlobalResources();
    }

    /**
     * 更新全局资源（所有行星总和）
     */
    function updateGlobalResources() {
        const total: ResourceStorage = { ...INITIAL_RESOURCES };

        planetResources.value.forEach(resources => {
            Object.keys(total).forEach(key => {
                const resourceKey = key as keyof ResourceStorage;
                total[resourceKey] += resources[resourceKey];
            });
        });

        globalResources.value = total;
    }

    /**
     * 监听行星更新（通过Socket）
     */
    function setupSocketListeners() {
        const socket = getSocket();
        if (!socket) return;

        socket.on('planet:update', (data: { planetId: string; resources: ResourceStorage; buildings: any[] }) => {
            console.log('📡 收到行星更新:', data.planetId);
            setPlanetResources(data.planetId, data.resources);
        });
    }

    /**
     * 清除资源
     */
    function clearResources() {
        globalResources.value = { ...INITIAL_RESOURCES };
        planetResources.value.clear();
    }

    return {
        globalResources,
        planetResources,
        setPlanetResources,
        updateGlobalResources,
        setupSocketListeners,
        clearResources
    };
});
