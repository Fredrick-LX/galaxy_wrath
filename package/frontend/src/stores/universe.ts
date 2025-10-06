/**
 * 宇宙状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Galaxy } from '../types/galaxy';
import { DEFAULT_GALAXY_CONFIG } from '../types/galaxy';
import type { INoiseGenerator } from '../utils/noiseGenerator';
import { initGlobalNoiseGenerator } from '../utils/noiseGenerator';
import { generateGalaxy, generateGalaxies, calculateViewportGalaxies } from '../utils/galaxyGenerator';

export const useUniverseStore = defineStore('universe', () => {
    // 状态
    const galaxies = ref<Map<string, Galaxy>>(new Map());
    const noiseGenerator = ref<INoiseGenerator | null>(null);
    const config = ref(DEFAULT_GALAXY_CONFIG);
    const viewportCenter = ref({ x: 0, y: 0 });
    const viewportSize = ref({ width: 1920, height: 1080 });
    const isInitialized = ref(false);

    /**
     * 初始化宇宙
     */
    function initUniverse(seed?: number) {
        const actualSeed = seed || config.value.globalSeed;
        config.value.globalSeed = actualSeed;

        // 初始化噪声生成器
        noiseGenerator.value = initGlobalNoiseGenerator(actualSeed);
        isInitialized.value = true;

        console.log(`🌌 宇宙已初始化，种子: ${actualSeed}`);

        // 加载初始视口范围的星系
        loadVisibleGalaxies();
    }

    /**
     * 加载视口可见的星系
     */
    function loadVisibleGalaxies() {
        if (!noiseGenerator.value) {
            console.error('噪声生成器未初始化');
            return;
        }

        const range = calculateViewportGalaxies(
            viewportCenter.value.x,
            viewportCenter.value.y,
            viewportSize.value.width,
            viewportSize.value.height,
            config.value.galaxySize
        );

        const newGalaxies = generateGalaxies(
            range.startX,
            range.startY,
            range.endX,
            range.endY,
            config.value,
            noiseGenerator.value
        );

        // 添加到已加载的星系集合
        newGalaxies.forEach(galaxy => {
            if (!galaxies.value.has(galaxy.id)) {
                galaxies.value.set(galaxy.id, galaxy);
            }
        });

        console.log(`📡 已加载星系: ${galaxies.value.size} 个`);
    }

    /**
     * 更新视口中心
     */
    function updateViewportCenter(x: number, y: number) {
        viewportCenter.value = { x, y };
        // 检查是否需要加载新的星系
        loadVisibleGalaxies();
    }

    /**
     * 更新视口大小
     */
    function updateViewportSize(width: number, height: number) {
        viewportSize.value = { width, height };
    }

    /**
     * 根据ID获取星系
     */
    function getGalaxyById(id: string): Galaxy | undefined {
        return galaxies.value.get(id);
    }

    /**
     * 根据网格坐标获取或生成星系
     */
    function getOrCreateGalaxy(gridX: number, gridY: number): Galaxy | null {
        if (!noiseGenerator.value) {
            return null;
        }

        const galaxy = generateGalaxy(gridX, gridY, config.value, noiseGenerator.value);

        if (!galaxies.value.has(galaxy.id)) {
            galaxies.value.set(galaxy.id, galaxy);
        }

        return galaxies.value.get(galaxy.id)!;
    }

    /**
     * 清理距离视口较远的星系（内存优化）
     */
    function cleanupDistantGalaxies() {
        const maxDistance = config.value.galaxySize * 10; // 10个星系的距离
        const toRemove: string[] = [];

        galaxies.value.forEach((galaxy, id) => {
            const dx = galaxy.coordinateX - viewportCenter.value.x;
            const dy = galaxy.coordinateY - viewportCenter.value.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > maxDistance) {
                toRemove.push(id);
            }
        });

        toRemove.forEach(id => galaxies.value.delete(id));

        if (toRemove.length > 0) {
            console.log(`🧹 清理了 ${toRemove.length} 个远距离星系`);
        }
    }

    /**
     * 获取所有已加载的星系
     */
    const loadedGalaxies = computed(() => Array.from(galaxies.value.values()));

    /**
     * 获取视口范围内的星系
     */
    const visibleGalaxies = computed(() => {
        const halfWidth = viewportSize.value.width / 2;
        const halfHeight = viewportSize.value.height / 2;

        return loadedGalaxies.value.filter(galaxy => {
            const dx = Math.abs(galaxy.coordinateX - viewportCenter.value.x);
            const dy = Math.abs(galaxy.coordinateY - viewportCenter.value.y);

            return dx < halfWidth + config.value.galaxySize &&
                dy < halfHeight + config.value.galaxySize;
        });
    });

    return {
        // 状态
        galaxies: loadedGalaxies,
        noiseGenerator,
        config,
        viewportCenter,
        viewportSize,
        isInitialized,

        // 计算属性
        visibleGalaxies,

        // 方法
        initUniverse,
        loadVisibleGalaxies,
        updateViewportCenter,
        updateViewportSize,
        getGalaxyById,
        getOrCreateGalaxy,
        cleanupDistantGalaxies
    };
});
