<template>
  <div class="planet-grid-container">
    <div class="planet-info-header">
      <h2>{{ planet.name || planet.id }}</h2>
      <div class="planet-meta">
        <span class="planet-type">{{ getPlanetTypeName(planet.type) }}</span>
        <span class="planet-size">大小: {{ planet.size }}×{{ planet.size }}</span>
      </div>
    </div>

    <div class="planet-grid" :style="gridStyle">
      <div
        v-for="(row, y) in planet.zones"
        :key="y"
        class="grid-row"
      >
        <div
          v-for="(zone, x) in row"
          :key="`${y}-${x}`"
          class="grid-cell"
          :class="{ 
            'has-building': hasBuilding(x, y),
            'selected': isSelected(x, y),
            'can-build': canBuildHere(x, y)
          }"
          :style="{ backgroundColor: zone.color }"
          @click="handleCellClick(x, y)"
          @mouseenter="hoveredCell = { x, y }"
          @mouseleave="hoveredCell = null"
        >
          <!-- 区划类型标签 -->
          <div class="zone-label">{{ getZoneTypeName(zone.type) }}</div>
          
          <!-- 建筑 -->
          <div v-if="hasBuilding(x, y)" class="building">
            <div class="building-icon">{{ getBuildingIcon(x, y) }}</div>
            <div class="building-level">Lv.{{ getBuildingLevel(x, y) }}</div>
          </div>
          
          <!-- 建造中标识 -->
          <div v-if="isBuildingInProgress(x, y)" class="building-progress">
            <div class="progress-spinner"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮信息提示 -->
    <div v-if="hoveredCell" class="cell-tooltip" :style="tooltipStyle">
      <div class="tooltip-content">
        <div class="tooltip-position">位置: ({{ hoveredCell.x }}, {{ hoveredCell.y }})</div>
        <div class="tooltip-zone">
          区划: {{ getZoneTypeName(planet.zones[hoveredCell.y][hoveredCell.x].type) }}
        </div>
        <div v-if="hasBuilding(hoveredCell.x, hoveredCell.y)" class="tooltip-building">
          <div class="building-name">{{ getBuildingName(hoveredCell.x, hoveredCell.y) }}</div>
          <div class="building-info">{{ getBuildingInfo(hoveredCell.x, hoveredCell.y) }}</div>
        </div>
        <div v-else class="tooltip-empty">
          空地
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Planet } from '../types/planet';
import { PLANET_TYPE_NAMES, ZONE_TYPE_NAMES } from '../types/planet';
import { BUILDING_CONFIGS } from '../types/building';
import { usePlanetStore } from '../stores/planet';

const props = defineProps<{
  planet: Planet;
}>();

const emit = defineEmits<{
  cellClick: [x: number, y: number];
}>();

const planetStore = usePlanetStore();
const hoveredCell = ref<{ x: number; y: number } | null>(null);

// 网格样式
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${props.planet.size}, 1fr)`,
  gridTemplateRows: `repeat(${props.planet.size}, 1fr)`
}));

// 提示框样式
const tooltipStyle = computed(() => {
  if (!hoveredCell.value) return {};
  return {
    left: `${(hoveredCell.value.x + 1) * 100 / props.planet.size}%`,
    top: `${(hoveredCell.value.y + 0.5) * 100 / props.planet.size}%`
  };
});

/**
 * 获取行星类型名称
 */
function getPlanetTypeName(type: string): string {
  return PLANET_TYPE_NAMES[type as keyof typeof PLANET_TYPE_NAMES] || type;
}

/**
 * 获取区划类型名称
 */
function getZoneTypeName(type: string): string {
  return ZONE_TYPE_NAMES[type as keyof typeof ZONE_TYPE_NAMES] || type;
}

/**
 * 检查位置是否有建筑
 */
function hasBuilding(x: number, y: number): boolean {
  return !!planetStore.getBuildingAt(x, y);
}

/**
 * 检查位置是否被选中
 */
function isSelected(x: number, y: number): boolean {
  return planetStore.selectedPosition?.x === x && planetStore.selectedPosition?.y === y;
}

/**
 * 检查是否可以在此建造
 */
function canBuildHere(x: number, y: number): boolean {
  return planetStore.canBuildAt(x, y);
}

/**
 * 检查建筑是否正在建造中
 */
function isBuildingInProgress(x: number, y: number): boolean {
  const building = planetStore.getBuildingAt(x, y);
  return building?.status === 'building' || building?.status === 'upgrading';
}

/**
 * 获取建筑图标
 */
function getBuildingIcon(x: number, y: number): string {
  const building = planetStore.getBuildingAt(x, y);
  if (!building) return '';
  
  const icons: Record<string, string> = {
    miningDrill: '⛏️',
    powerPlant: '⚡',
    hydroponicFarm: '🌾',
    refinery: '🏭',
    transformer: '🔋',
    foodProcessor: '🏪',
    residentialBlock: '🏘️',
    systemFortress: '🏰',
    colonyShipyard: '🚀'
  };
  
  return icons[building.type] || '🏗️';
}

/**
 * 获取建筑等级
 */
function getBuildingLevel(x: number, y: number): number {
  const building = planetStore.getBuildingAt(x, y);
  return building?.level || 1;
}

/**
 * 获取建筑名称
 */
function getBuildingName(x: number, y: number): string {
  const building = planetStore.getBuildingAt(x, y);
  if (!building) return '';
  return BUILDING_CONFIGS[building.type]?.name || building.type;
}

/**
 * 获取建筑信息
 */
function getBuildingInfo(x: number, y: number): string {
  const building = planetStore.getBuildingAt(x, y);
  if (!building) return '';
  
  if (building.status === 'building') {
    return '建造中...';
  }
  if (building.status === 'upgrading') {
    return '升级中...';
  }
  
  const bonus = planetStore.calculateAdjacencyBonus(building);
  return `等级 ${building.level} | 加成: +${(bonus * 100).toFixed(1)}%`;
}

/**
 * 处理单元格点击
 */
function handleCellClick(x: number, y: number) {
  planetStore.selectPosition(x, y);
  emit('cellClick', x, y);
}
</script>

<style scoped>
.planet-grid-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.planet-info-header {
  background: rgba(20, 30, 50, 0.85);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 16px;
}

.planet-info-header h2 {
  margin: 0 0 8px 0;
  color: #4A90E2;
  font-size: 24px;
}

.planet-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
}

.planet-type {
  color: #5FD98A;
  font-weight: 600;
}

.planet-size {
  color: #8FA3C1;
}

.planet-grid {
  flex: 1;
  display: grid;
  gap: 2px;
  background: rgba(10, 20, 40, 0.8);
  border: 2px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 4px;
  overflow: hidden;
  max-height: calc(100vh - 200px);
  width: fit-content;
  margin: 0 auto;
}

.grid-row {
  display: contents;
}

.grid-cell {
  position: relative;
  aspect-ratio: 1;
  border: 1px solid rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 120px;
  max-height: 120px;
}

.grid-cell:hover {
  filter: brightness(1.2);
  border-color: rgba(74, 144, 226, 0.6);
  z-index: 10;
}

.grid-cell.selected {
  border: 2px solid #4A90E2;
  box-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
  z-index: 11;
}

.grid-cell.has-building {
  border-color: rgba(74, 144, 226, 0.5);
}

.grid-cell.can-build:not(.has-building):hover::after {
  content: '+';
  position: absolute;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.5);
}

.zone-label {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: 8px;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(0, 0, 0, 0.5);
  padding: 1px 3px;
  border-radius: 2px;
  pointer-events: none;
}

.building {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.building-icon {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
}

.building-level {
  position: absolute;
  bottom: 2px;
  right: 2px;
  font-size: 10px;
  font-weight: 600;
  color: #4A90E2;
  background: rgba(0, 0, 0, 0.7);
  padding: 1px 4px;
  border-radius: 4px;
}

.building-progress {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.progress-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(74, 144, 226, 0.3);
  border-top-color: #4A90E2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.cell-tooltip {
  position: absolute;
  z-index: 1000;
  pointer-events: none;
  transform: translateX(8px);
}

.tooltip-content {
  background: rgba(20, 30, 50, 0.95);
  border: 1px solid rgba(74, 144, 226, 0.5);
  border-radius: 6px;
  padding: 12px;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  font-size: 12px;
}

.tooltip-position,
.tooltip-zone {
  color: #8FA3C1;
  margin-bottom: 4px;
}

.tooltip-building {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(74, 144, 226, 0.3);
}

.building-name {
  color: #4A90E2;
  font-weight: 600;
  margin-bottom: 4px;
}

.building-info {
  color: #B0C4DE;
  font-size: 11px;
}

.tooltip-empty {
  color: #6B7B94;
  font-style: italic;
}
</style>
