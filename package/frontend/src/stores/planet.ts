/**
 * 行星状态管理
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Planet } from '../types/planet';
import type { Building } from '../types/building';

export const usePlanetStore = defineStore('planet', () => {
    // 状态
    const currentPlanet = ref<Planet | null>(null);
    const selectedBuilding = ref<Building | null>(null);
    const selectedPosition = ref<{ x: number; y: number } | null>(null);

    /**
     * 设置当前行星
     */
    function setCurrentPlanet(planet: Planet) {
        currentPlanet.value = planet;
        selectedBuilding.value = null;
        selectedPosition.value = null;
    }

    /**
     * 清除当前行星
     */
    function clearCurrentPlanet() {
        currentPlanet.value = null;
        selectedBuilding.value = null;
        selectedPosition.value = null;
    }

    /**
     * 选择建筑
     */
    function selectBuilding(building: Building) {
        selectedBuilding.value = building;
    }

    /**
     * 取消选择建筑
     */
    function deselectBuilding() {
        selectedBuilding.value = null;
    }

    /**
     * 选择位置
     */
    function selectPosition(x: number, y: number) {
        selectedPosition.value = { x, y };
    }

    /**
     * 取消选择位置
     */
    function deselectPosition() {
        selectedPosition.value = null;
    }

    /**
     * 在指定位置添加建筑
     */
    function addBuilding(building: Building) {
        if (!currentPlanet.value) return;
        currentPlanet.value.buildings.push(building);
    }

    /**
     * 移除建筑
     */
    function removeBuilding(buildingId: string) {
        if (!currentPlanet.value) return;
        const index = currentPlanet.value.buildings.findIndex(b => b.id === buildingId);
        if (index !== -1) {
            currentPlanet.value.buildings.splice(index, 1);
        }
    }

    /**
     * 更新建筑
     */
    function updateBuilding(buildingId: string, updates: Partial<Building>) {
        if (!currentPlanet.value) return;
        const building = currentPlanet.value.buildings.find(b => b.id === buildingId);
        if (building) {
            Object.assign(building, updates);
        }
    }

    /**
     * 获取指定位置的建筑
     */
    function getBuildingAt(x: number, y: number): Building | null {
        if (!currentPlanet.value) return null;
        return currentPlanet.value.buildings.find(
            b => b.positionX === x && b.positionY === y
        ) || null;
    }

    /**
     * 检查位置是否可以建造
     */
    function canBuildAt(x: number, y: number): boolean {
        if (!currentPlanet.value) return false;

        // 检查是否超出边界
        if (x < 0 || x >= currentPlanet.value.size || y < 0 || y >= currentPlanet.value.size) {
            return false;
        }

        // 检查是否已有建筑
        return !getBuildingAt(x, y);
    }

    /**
     * 计算建筑的相邻加成
     */
    function calculateAdjacencyBonus(building: Building): number {
        if (!currentPlanet.value) return 0;

        const adjacentPositions = [
            { x: building.positionX - 1, y: building.positionY },     // 左
            { x: building.positionX + 1, y: building.positionY },     // 右
            { x: building.positionX, y: building.positionY - 1 },     // 上
            { x: building.positionX, y: building.positionY + 1 }      // 下
        ];

        let bonus = 0;
        adjacentPositions.forEach(pos => {
            const adjacentBuilding = getBuildingAt(pos.x, pos.y);
            if (adjacentBuilding && adjacentBuilding.type === building.type) {
                bonus += 0.025; // 每个相邻的同类建筑增加2.5%
            }
        });

        return bonus;
    }

    /**
     * 计算行星总产能
     */
    const planetProduction = computed(() => {
        if (!currentPlanet.value) {
            return {
                minerals: 0,
                energy: 0,
                food: 0,
                alloys: 0,
                powerCells: 0,
                consumerGoods: 0
            };
        }

        const production: Record<string, number> = {
            minerals: 0,
            energy: 0,
            food: 0,
            alloys: 0,
            powerCells: 0,
            consumerGoods: 0
        };

        currentPlanet.value.buildings.forEach(building => {
            if (building.status === 'active') {
                const bonus = 1 + calculateAdjacencyBonus(building);
                Object.entries(building.production.output).forEach(([resource, amount]) => {
                    if (production[resource] !== undefined) {
                        production[resource] += amount * bonus * building.production.rate;
                    }
                });
            }
        });

        return production;
    });

    return {
        // 状态
        currentPlanet,
        selectedBuilding,
        selectedPosition,

        // 计算属性
        planetProduction,

        // 方法
        setCurrentPlanet,
        clearCurrentPlanet,
        selectBuilding,
        deselectBuilding,
        selectPosition,
        deselectPosition,
        addBuilding,
        removeBuilding,
        updateBuilding,
        getBuildingAt,
        canBuildAt,
        calculateAdjacencyBonus
    };
});
