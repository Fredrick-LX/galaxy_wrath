<template>
  <div class="building-panel">
    <div class="panel-header">
      <h3>建筑</h3>
      <button @click="emit('close')" class="btn-close">✕</button>
    </div>

    <!-- 选中位置信息 -->
    <div v-if="selectedPosition" class="selected-info">
      <div class="info-item">
        <span class="label">位置:</span>
        <span class="value"
          >({{ selectedPosition.x }}, {{ selectedPosition.y }})</span
        >
      </div>
      <div class="info-item">
        <span class="label">区划:</span>
        <span class="value">{{ currentZoneType }}</span>
      </div>
    </div>

    <!-- 已有建筑信息 -->
    <div v-if="existingBuilding" class="building-info">
      <div class="building-header">
        <span class="building-icon">{{
          getBuildingIcon(existingBuilding.type)
        }}</span>
        <div class="building-details">
          <h4>{{ getBuildingName(existingBuilding.type) }}</h4>
          <p class="building-desc">
            {{ getBuildingDesc(existingBuilding.type) }}
          </p>
        </div>
      </div>

      <div class="building-stats">
        <div class="stat-item">
          <span class="label">等级:</span>
          <span class="value">{{ existingBuilding.level }}</span>
        </div>
        <div class="stat-item">
          <span class="label">状态:</span>
          <span class="value">{{
            getStatusText(existingBuilding.status)
          }}</span>
        </div>
        <div class="stat-item">
          <span class="label">相邻加成:</span>
          <span class="value">+{{ (adjacencyBonus * 100).toFixed(1) }}%</span>
        </div>
      </div>

      <!-- 生产信息 -->
      <div v-if="existingBuilding.status === 'active'" class="production-info">
        <h5>生产</h5>
        <div
          v-for="(amount, resource) in existingBuilding.production.output"
          :key="resource"
          class="production-item"
        >
          <span class="resource-icon">{{ getResourceIcon(resource) }}</span>
          <span class="resource-name">{{ getResourceName(resource) }}</span>
          <span class="resource-amount"
            >+{{ calculateProduction(amount) }}/秒</span
          >
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="building-actions">
        <button
          v-if="canUpgrade"
          @click="handleUpgrade"
          class="btn-action btn-upgrade"
          :disabled="upgrading"
        >
          {{
            upgrading ? "升级中..." : `升级 (Lv.${existingBuilding.level + 1})`
          }}
        </button>
        <button
          @click="handleDemolish"
          class="btn-action btn-demolish"
          :disabled="demolishing"
        >
          {{ demolishing ? "拆除中..." : "拆除建筑" }}
        </button>
      </div>
    </div>

    <!-- 建造新建筑 -->
    <div v-else class="build-menu">
      <h4>建造建筑</h4>
      <div class="building-list">
        <div
          v-for="config in availableBuildings"
          :key="config.type"
          class="building-option"
          :class="{ disabled: !canAfford(config) }"
          @click="handleBuild(config)"
        >
          <div class="option-header">
            <span class="option-icon">{{ getBuildingIcon(config.type) }}</span>
            <div class="option-info">
              <h5>{{ config.name }}</h5>
              <p>{{ config.description }}</p>
            </div>
          </div>

          <div class="option-cost">
            <span class="cost-label">建造消耗:</span>
            <div class="cost-items">
              <span
                v-for="(amount, resource) in config.cost"
                :key="resource"
                class="cost-item"
              >
                <span class="resource-icon">{{
                  getResourceIcon(resource)
                }}</span>
                {{ amount }}
              </span>
            </div>
          </div>

          <div class="option-time">
            <span>⏱️ {{ config.buildTime }}秒</span>
          </div>
        </div>

        <div v-if="availableBuildings.length === 0" class="no-buildings">
          当前区划无可建造建筑
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { usePlanetStore } from "../stores/planet";
import { BUILDING_CONFIGS, type BuildingType } from "../types/building";
import type { Building } from "../types/building";
import type { ZoneType } from "../types/planet";
import { ZONE_TYPE_NAMES } from "../types/planet";

const emit = defineEmits<{
  close: [];
  build: [buildingType: BuildingType];
  upgrade: [buildingId: string];
  demolish: [buildingId: string];
}>();

const planetStore = usePlanetStore();

const upgrading = ref(false);
const demolishing = ref(false);

// 选中的位置
const selectedPosition = computed(() => planetStore.selectedPosition);

// 当前位置的区划类型
const currentZoneType = computed(() => {
  if (!selectedPosition.value || !planetStore.currentPlanet) return "";
  const { x, y } = selectedPosition.value;
  const zone = planetStore.currentPlanet.zones[y]?.[x];
  return zone ? ZONE_TYPE_NAMES[zone.type] : "";
});

// 已有建筑
const existingBuilding = computed(() => {
  if (!selectedPosition.value) return null;
  return planetStore.getBuildingAt(
    selectedPosition.value.x,
    selectedPosition.value.y
  );
});

// 相邻加成
const adjacencyBonus = computed(() => {
  if (!existingBuilding.value) return 0;
  return planetStore.calculateAdjacencyBonus(existingBuilding.value);
});

// 可升级
const canUpgrade = computed(() => {
  if (!existingBuilding.value) return false;
  const config = BUILDING_CONFIGS[existingBuilding.value.type];
  return existingBuilding.value.level < config.maxLevel;
});

// 可用建筑列表
const availableBuildings = computed(() => {
  if (!selectedPosition.value || !planetStore.currentPlanet) return [];

  const { x, y } = selectedPosition.value;
  const zone = planetStore.currentPlanet.zones[y]?.[x];
  if (!zone) return [];

  return Object.entries(BUILDING_CONFIGS)
    .filter(([_, config]) => config.requiredZone === zone.type)
    .map(([type, config]) => ({ type: type as BuildingType, ...config }));
});

/**
 * 获取建筑图标
 */
function getBuildingIcon(type: string): string {
  const icons: Record<string, string> = {
    miningDrill: "⛏️",
    powerPlant: "⚡",
    hydroponicFarm: "🌾",
    refinery: "🏭",
    transformer: "🔋",
    foodProcessor: "🏪",
    residentialBlock: "🏘️",
    systemFortress: "🏰",
    colonyShipyard: "🚀",
  };
  return icons[type] || "🏗️";
}

/**
 * 获取建筑名称
 */
function getBuildingName(type: string): string {
  return BUILDING_CONFIGS[type as BuildingType]?.name || type;
}

/**
 * 获取建筑描述
 */
function getBuildingDesc(type: string): string {
  return BUILDING_CONFIGS[type as BuildingType]?.description || "";
}

/**
 * 获取状态文本
 */
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    building: "建造中",
    active: "运行中",
    upgrading: "升级中",
  };
  return statusMap[status] || status;
}

/**
 * 获取资源图标
 */
function getResourceIcon(resource: string): string {
  const icons: Record<string, string> = {
    minerals: "⛏️",
    energy: "⚡",
    food: "🌾",
    alloys: "🔩",
    powerCells: "🔋",
    consumerGoods: "📦",
  };
  return icons[resource] || "📦";
}

/**
 * 获取资源名称
 */
function getResourceName(resource: string): string {
  const names: Record<string, string> = {
    minerals: "矿物",
    energy: "电力",
    food: "食物",
    alloys: "合金",
    powerCells: "电池",
    consumerGoods: "消费品",
  };
  return names[resource] || resource;
}

/**
 * 计算实际产量
 */
function calculateProduction(baseAmount: number): string {
  const bonus = 1 + adjacencyBonus.value;
  return (baseAmount * bonus).toFixed(2);
}

/**
 * 检查是否能负担建造成本
 */
function canAfford(config: any): boolean {
  // TODO: 实际检查资源
  return true;
}

/**
 * 处理建造
 */
function handleBuild(config: any) {
  if (!canAfford(config)) return;
  emit("build", config.type as BuildingType);
}

/**
 * 处理升级
 */
async function handleUpgrade() {
  if (!existingBuilding.value) return;
  upgrading.value = true;
  try {
    emit("upgrade", existingBuilding.value.id);
    // TODO: 等待升级完成
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } finally {
    upgrading.value = false;
  }
}

/**
 * 处理拆除
 */
async function handleDemolish() {
  if (!existingBuilding.value) return;

  if (!confirm("确定要拆除这个建筑吗？")) return;

  demolishing.value = true;
  try {
    emit("demolish", existingBuilding.value.id);
    await new Promise((resolve) => setTimeout(resolve, 500));
  } finally {
    demolishing.value = false;
  }
}
</script>

<style scoped>
.building-panel {
  background: rgba(20, 30, 50, 0.95);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
  min-width: 350px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(74, 144, 226, 0.3);
}

.panel-header h3 {
  margin: 0;
  color: #4a90e2;
  font-size: 20px;
}

.btn-close {
  background: none;
  border: none;
  color: #8fa3c1;
  font-size: 24px;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s ease;
}

.btn-close:hover {
  color: #ff6b7a;
}

.selected-info {
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: #8fa3c1;
}

.info-item .value {
  color: #e0e6f0;
  font-weight: 600;
}

.building-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.building-header {
  display: flex;
  gap: 12px;
}

.building-icon {
  font-size: 48px;
}

.building-details h4 {
  margin: 0 0 4px 0;
  color: #4a90e2;
  font-size: 18px;
}

.building-desc {
  margin: 0;
  color: #8fa3c1;
  font-size: 13px;
}

.building-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: rgba(10, 20, 40, 0.5);
  border-radius: 6px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.stat-item .label {
  color: #8fa3c1;
}

.stat-item .value {
  color: #4a90e2;
  font-weight: 600;
}

.production-info h5 {
  margin: 0 0 8px 0;
  color: #5fd98a;
  font-size: 16px;
}

.production-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: rgba(95, 217, 138, 0.1);
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 14px;
}

.resource-icon {
  font-size: 18px;
}

.resource-name {
  flex: 1;
  color: #b0c4de;
}

.resource-amount {
  color: #5fd98a;
  font-weight: 600;
}

.building-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-action {
  padding: 10px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-upgrade {
  background: linear-gradient(135deg, #5fd98a 0%, #4caf50 100%);
  color: white;
}

.btn-upgrade:hover:not(:disabled) {
  background: linear-gradient(135deg, #70e99a 0%, #5dbf60 100%);
  box-shadow: 0 4px 12px rgba(95, 217, 138, 0.4);
}

.btn-demolish {
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.4);
  color: #ff6b7a;
}

.btn-demolish:hover:not(:disabled) {
  background: rgba(220, 53, 69, 0.3);
  border-color: #ff6b7a;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.build-menu h4 {
  margin: 0 0 12px 0;
  color: #4a90e2;
  font-size: 18px;
}

.building-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.building-option {
  padding: 12px;
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.building-option:hover:not(.disabled) {
  background: rgba(74, 144, 226, 0.2);
  border-color: #4a90e2;
}

.building-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.option-header {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.option-icon {
  font-size: 36px;
}

.option-info h5 {
  margin: 0 0 4px 0;
  color: #4a90e2;
  font-size: 16px;
}

.option-info p {
  margin: 0;
  color: #8fa3c1;
  font-size: 12px;
}

.option-cost {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 12px;
}

.cost-label {
  color: #8fa3c1;
}

.cost-items {
  display: flex;
  gap: 8px;
}

.cost-item {
  color: #b0c4de;
  display: flex;
  align-items: center;
  gap: 2px;
}

.option-time {
  font-size: 12px;
  color: #8fa3c1;
}

.no-buildings {
  text-align: center;
  padding: 20px;
  color: #6b7b94;
  font-style: italic;
}

/* 滚动条样式 */
.building-panel::-webkit-scrollbar {
  width: 8px;
}

.building-panel::-webkit-scrollbar-track {
  background: rgba(10, 20, 40, 0.4);
  border-radius: 4px;
}

.building-panel::-webkit-scrollbar-thumb {
  background: rgba(74, 144, 226, 0.4);
  border-radius: 4px;
}

.building-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 144, 226, 0.6);
}
</style>
