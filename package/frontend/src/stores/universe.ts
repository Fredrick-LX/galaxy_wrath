/**
 * 宇宙状态管理 - 从后端获取数据
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Galaxy } from '../types/galaxy';
import { DEFAULT_GALAXY_CONFIG } from '../types/galaxy';
import type { Planet } from '../types/planet';
import { getGalaxies, type UniverseGalaxyData, type UniverseGalaxyPlanet } from '../services/universe';

export const useUniverseStore = defineStore('universe', () => {
    // 状态
    const galaxies = ref<Map<string, Galaxy>>(new Map());
    const config = ref(DEFAULT_GALAXY_CONFIG);
    const viewportCenter = ref({ x: 0, y: 0 });
    const viewportSize = ref({ width: 1920, height: 1080 });
    const viewportScale = ref(1); // 当前缩放比例
    const isInitialized = ref(false);
    const isLoading = ref(false);
    
    // 视口状态保存（用于返回时恢复）
    const savedViewportState = ref<{ x: number; y: number; scale: number } | null>(null);
    
    // 目标位置（用于外部触发的视口移动）
    const targetPosition = ref<{ x: number; y: number; timestamp: number } | null>(null);
    
    // 加载节流控制
    let lastLoadTime = 0;
    const LOAD_THROTTLE_MS = 200; // 200ms节流间隔

    /**
     * 初始化宇宙
     */
    function initUniverse(seed?: number) {
        const actualSeed = seed || config.value.globalSeed;
        config.value.globalSeed = actualSeed;
        isInitialized.value = true;

        console.log(`🌌 宇宙已初始化，种子: ${actualSeed}`);

        // 加载初始视口范围的星系
        loadVisibleGalaxies();
    }

    /**
     * 计算视口范围内的星系网格坐标（包含预加载缓冲区，考虑缩放）
     */
    function calculateViewportGalaxies(
        centerX: number,
        centerY: number,
        width: number,
        height: number,
        scale: number,
        galaxySize: number
    ) {
        // 根据缩放比例计算实际可见范围
        // 缩放越小，能看到的范围越大
        const actualWidth = width / scale;
        const actualHeight = height / scale;
        
        const halfWidth = actualWidth / 2;
        const halfHeight = actualHeight / 2;

        // 预加载缓冲区：视口外额外加载2个星系的距离
        const bufferDistance = galaxySize * 2;

        // 计算视口边界（扩展缓冲区）
        const left = centerX - halfWidth - bufferDistance;
        const right = centerX + halfWidth + bufferDistance;
        const top = centerY - halfHeight - bufferDistance;
        const bottom = centerY + halfHeight + bufferDistance;

        // 将像素坐标转换为网格坐标（考虑拼接后的坐标系统）
        // 正数区域：gridX = floor(x/galaxySize) + 1
        // 负数区域：gridX = ceil(x/galaxySize) - 1
        const startX = left >= 0 ? Math.floor(left / galaxySize) + 1 : Math.ceil(left / galaxySize) - 1;
        const endX = right >= 0 ? Math.floor(right / galaxySize) + 1 : Math.ceil(right / galaxySize) - 1;
        const startY = top >= 0 ? Math.floor(top / galaxySize) + 1 : Math.ceil(top / galaxySize) - 1;
        const endY = bottom >= 0 ? Math.floor(bottom / galaxySize) + 1 : Math.ceil(bottom / galaxySize) - 1;

        return { startX, startY, endX, endY };
    }

    /**
     * 将后端数据转换为前端 Galaxy 格式
     */
    function convertToGalaxy(galaxyData: UniverseGalaxyData): Galaxy {
        const galaxySize = config.value.galaxySize;

        // 创建 81 个位置的数组
        const planets: (Planet | null)[] = new Array(81).fill(null);

        // 填充行星数据
        galaxyData.planets.forEach((planet: UniverseGalaxyPlanet) => {
            if (planet.position >= 0 && planet.position < 81) {
                planets[planet.position] = {
                    id: `${galaxyData.id}_${planet.position}`,
                    galaxyId: galaxyData.id,
                    position: planet.position,
                    type: planet.type,
                    size: planet.size,
                    name: `${galaxyData.id}-${planet.position}`,
                    ownerId: null
                } as Planet;
            }
        });

        // 将网格坐标转换为像素坐标（拼接四个象限，无间隙）
        // gridX=1 -> galaxySize/2, gridX=-1 -> -galaxySize/2
        // gridX=2 -> 1.5*galaxySize, gridX=-2 -> -1.5*galaxySize
        const coordinateX = galaxyData.gridX > 0 
            ? (galaxyData.gridX - 0.5) * galaxySize 
            : (galaxyData.gridX + 0.5) * galaxySize;
        const coordinateY = galaxyData.gridY > 0 
            ? (galaxyData.gridY - 0.5) * galaxySize 
            : (galaxyData.gridY + 0.5) * galaxySize;

        return {
            id: galaxyData.id,
            coordinateX,
            coordinateY,
            gridX: galaxyData.gridX,
            gridY: galaxyData.gridY,
            planets,
            seed: config.value.globalSeed,
            hasPlayer: false
        };
    }

    /**
     * 从后端加载视口可见的星系
     */
    async function loadVisibleGalaxies() {
        if (isLoading.value) return;
        
        isLoading.value = true;

        try {
            const range = calculateViewportGalaxies(
                viewportCenter.value.x,
                viewportCenter.value.y,
                viewportSize.value.width,
                viewportSize.value.height,
                viewportScale.value,
                config.value.galaxySize
            );

            const response = await getGalaxies(
                range.startX,
                range.startY,
                range.endX,
                range.endY
            );

            if (response.success && response.galaxies) {
                // 转换并添加到已加载的星系集合
                response.galaxies.forEach((galaxyData) => {
                    if (!galaxies.value.has(galaxyData.id)) {
                        const galaxy = convertToGalaxy(galaxyData);
                        galaxies.value.set(galaxy.id, galaxy);
                    }
                });

                console.log(`📡 已从后端加载星系: ${galaxies.value.size} 个 (缩放: ${(viewportScale.value * 100).toFixed(0)}%)`);
            } else {
                console.error('加载星系失败:', response.message);
            }
        } catch (error) {
            console.error('加载星系出错:', error);
        } finally {
            isLoading.value = false;
        }
    }

    /**
     * 更新视口中心
     */
    function updateViewportCenter(x: number, y: number, skipLoad = false) {
        viewportCenter.value = { x, y };
        
        // 如果skipLoad为true，只更新状态，不加载
        if (skipLoad) {
            return;
        }
        
        // 节流控制：避免频繁加载
        const now = Date.now();
        if (now - lastLoadTime < LOAD_THROTTLE_MS && !isLoading.value) {
            return;
        }
        
        lastLoadTime = now;
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
     * 更新视口缩放
     */
    function updateViewportScale(scale: number, skipLoad = false) {
        viewportScale.value = scale;
        
        // 如果skipLoad为true，只更新状态，不加载
        if (skipLoad) {
            return;
        }
        
        // 缩放变化时需要重新加载星系
        const now = Date.now();
        if (now - lastLoadTime >= LOAD_THROTTLE_MS) {
            lastLoadTime = now;
            loadVisibleGalaxies();
        }
    }

    /**
     * 保存视口状态
     */
    function saveViewportState(x: number, y: number, scale: number) {
        savedViewportState.value = { x, y, scale };
    }

    /**
     * 获取保存的视口状态
     */
    function getSavedViewportState() {
        return savedViewportState.value;
    }

    /**
     * 清除保存的视口状态
     */
    function clearSavedViewportState() {
        savedViewportState.value = null;
    }

    /**
     * 移动视口到指定位置（用于定位功能）
     */
    function moveToPosition(x: number, y: number) {
        // 更新状态
        viewportCenter.value = { x, y };
        
        // 设置目标位置，让 UniverseCanvas 监听并移动 viewport
        targetPosition.value = { x, y, timestamp: Date.now() };
        
        // 立即加载星系（绕过节流）
        lastLoadTime = 0;
        loadVisibleGalaxies();
    }

    /**
     * 根据ID获取星系
     */
    function getGalaxyById(id: string): Galaxy | undefined {
        return galaxies.value.get(id);
    }

    /**
     * 清理距离视口较远的星系（内存优化）
     */
    function cleanupDistantGalaxies() {
        // 根据缩放比例计算实际可见范围
        const actualWidth = viewportSize.value.width / viewportScale.value;
        const actualHeight = viewportSize.value.height / viewportScale.value;
        
        // 清理距离：实际视口范围 + 预加载缓冲区 + 额外安全距离
        const bufferDistance = config.value.galaxySize * 2;
        const safetyMargin = config.value.galaxySize * 3;
        const maxWidth = actualWidth / 2 + bufferDistance + safetyMargin;
        const maxHeight = actualHeight / 2 + bufferDistance + safetyMargin;
        const maxDistance = Math.sqrt(maxWidth * maxWidth + maxHeight * maxHeight);
        
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
        config,
        viewportCenter,
        viewportSize,
        viewportScale,
        isInitialized,
        isLoading,
        targetPosition,

        // 计算属性
        visibleGalaxies,

        // 方法
        initUniverse,
        loadVisibleGalaxies,
        updateViewportCenter,
        updateViewportSize,
        updateViewportScale,
        saveViewportState,
        getSavedViewportState,
        clearSavedViewportState,
        moveToPosition,
        getGalaxyById,
        cleanupDistantGalaxies
    };
});
