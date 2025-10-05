<template>
  <div class="planet-page">
    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <button @click="handleBack" class="btn-back">
        ← 返回宇宙
      </button>
      
      <div class="planet-title">
        <h2 v-if="currentPlanet">{{ currentPlanet.name || currentPlanet.id }}</h2>
      </div>
      
      <div class="toolbar-actions">
        <button @click="showProductionPanel = !showProductionPanel" class="btn-tool">
          📊 生产
        </button>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="planet-content">
      <!-- 行星网格 -->
      <div class="grid-section">
        <PlanetGrid
          v-if="currentPlanet"
          :planet="currentPlanet"
          @cell-click="handleCellClick"
        />
        <div v-else class="loading">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
      </div>

      <!-- 侧边栏 -->
      <div class="sidebar">
        <!-- 建筑面板 -->
        <BuildingPanel
          v-if="showBuildingPanel"
          @close="showBuildingPanel = false"
          @build="handleBuild"
          @upgrade="handleUpgrade"
          @demolish="handleDemolish"
        />

        <!-- 生产面板 -->
        <div v-if="showProductionPanel" class="production-panel">
          <div class="panel-header">
            <h3>生产统计</h3>
            <button @click="showProductionPanel = false" class="btn-close">✕</button>
          </div>
          
          <div class="production-stats">
            <div class="stat-section">
              <h4>一级资源</h4>
              <div class="stat-item">
                <span class="icon">⛏️</span>
                <span class="name">矿物</span>
                <span class="value">+{{ formatNumber(planetProduction.minerals) }}/秒</span>
              </div>
              <div class="stat-item">
                <span class="icon">⚡</span>
                <span class="name">电力</span>
                <span class="value">+{{ formatNumber(planetProduction.energy) }}/秒</span>
              </div>
              <div class="stat-item">
                <span class="icon">🌾</span>
                <span class="name">食物</span>
                <span class="value">+{{ formatNumber(planetProduction.food) }}/秒</span>
              </div>
            </div>

            <div class="stat-section">
              <h4>二级资源</h4>
              <div class="stat-item">
                <span class="icon">🔩</span>
                <span class="name">合金</span>
                <span class="value">+{{ formatNumber(planetProduction.alloys) }}/秒</span>
              </div>
              <div class="stat-item">
                <span class="icon">🔋</span>
                <span class="name">电池</span>
                <span class="value">+{{ formatNumber(planetProduction.powerCells) }}/秒</span>
              </div>
              <div class="stat-item">
                <span class="icon">📦</span>
                <span class="name">消费品</span>
                <span class="value">+{{ formatNumber(planetProduction.consumerGoods) }}/秒</span>
              </div>
            </div>

            <div class="buildings-summary">
              <h4>建筑统计</h4>
              <div class="summary-item">
                <span class="label">总建筑数:</span>
                <span class="value">{{ totalBuildings }}</span>
              </div>
              <div class="summary-item">
                <span class="label">运行中:</span>
                <span class="value">{{ activeBuildings }}</span>
              </div>
              <div class="summary-item">
                <span class="label">建造中:</span>
                <span class="value">{{ buildingInProgress }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { usePlanetStore } from '../stores/planet';
import { useResourcesStore } from '../stores/resources';
import { getPlanetById, buildBuilding, updateBuilding } from '../services/planet';
import { subscribePlanet, unsubscribePlanet, getSocket } from '../services/socket';
import PlanetGrid from '../components/PlanetGrid.vue';
import BuildingPanel from '../components/BuildingPanel.vue';
import { BUILDING_CONFIGS, type BuildingType } from '../types/building';
import { v4 as uuidv4 } from 'uuid';

const router = useRouter();
const route = useRoute();
const planetStore = usePlanetStore();
const resourcesStore = useResourcesStore();

const planetId = computed(() => route.params.id as string);
const showBuildingPanel = ref(false);
const showProductionPanel = ref(false);

// 当前行星
const currentPlanet = computed(() => planetStore.currentPlanet);

// 行星生产数据
const planetProduction = computed(() => planetStore.planetProduction);

// 建筑统计
const totalBuildings = computed(() => currentPlanet.value?.buildings.length || 0);
const activeBuildings = computed(() => 
  currentPlanet.value?.buildings.filter(b => b.status === 'active').length || 0
);
const buildingInProgress = computed(() =>
  currentPlanet.value?.buildings.filter(b => b.status === 'building' || b.status === 'upgrading').length || 0
);

/**
 * 加载行星数据
 */
async function loadPlanet() {
  const response = await getPlanetById(planetId.value);
  
  if (response.success && response.planet) {
    planetStore.setCurrentPlanet(response.planet);
    resourcesStore.setPlanetResources(response.planet.id, response.planet.resources);
    
    // 订阅行星更新
    subscribePlanet(planetId.value);
    
    // 监听Socket更新
    const socket = getSocket();
    if (socket) {
      socket.on('planet:update', (data: any) => {
        if (data.planetId === planetId.value && currentPlanet.value) {
          // 更新资源
          currentPlanet.value.resources = data.resources;
          resourcesStore.setPlanetResources(data.planetId, data.resources);
          
          // 更新建筑状态
          if (data.buildings) {
            currentPlanet.value.buildings = data.buildings;
          }
        }
      });
    }
  } else {
    console.error('加载行星失败:', response.message);
    router.push('/universe');
  }
}

/**
 * 格式化数字
 */
function formatNumber(num: number): string {
  return num.toFixed(2);
}

/**
 * 处理单元格点击
 */
function handleCellClick(x: number, y: number) {
  showBuildingPanel.value = true;
  showProductionPanel.value = false;
}

/**
 * 处理建造
 */
async function handleBuild(buildingType: BuildingType) {
  if (!planetStore.selectedPosition || !currentPlanet.value) return;

  const config = BUILDING_CONFIGS[buildingType];
  const newBuilding = {
    id: uuidv4(),
    planetId: currentPlanet.value.id,
    type: buildingType,
    level: 1,
    positionX: planetStore.selectedPosition.x,
    positionY: planetStore.selectedPosition.y,
    status: 'building' as const,
    constructionStartTime: Date.now(),
    constructionEndTime: Date.now() + config.buildTime * 1000,
    production: config.production,
    adjacencyBonus: 0
  };

  // 发送到后端
  const response = await buildBuilding(currentPlanet.value.id, newBuilding);
  
  if (response.success && response.planet) {
    planetStore.setCurrentPlanet(response.planet);
    showBuildingPanel.value = false;
    console.log('✅ 建造成功:', buildingType);
  } else {
    console.error('❌ 建造失败:', response.message);
  }
}

/**
 * 处理升级
 */
async function handleUpgrade(buildingId: string) {
  if (!currentPlanet.value) return;
  
  const building = currentPlanet.value.buildings.find(b => b.id === buildingId);
  if (!building) return;
  
  const response = await updateBuilding(
    currentPlanet.value.id,
    buildingId,
    'upgrade',
    {
      status: 'upgrading',
      constructionStartTime: Date.now(),
      constructionEndTime: Date.now() + 20000
    }
  );

  if (response.success && response.planet) {
    planetStore.setCurrentPlanet(response.planet);
    console.log('✅ 开始升级:', buildingId);
  } else {
    console.error('❌ 升级失败:', response.message);
  }
}

/**
 * 处理拆除
 */
async function handleDemolish(buildingId: string) {
  if (!currentPlanet.value) return;
  
  const response = await updateBuilding(currentPlanet.value.id, buildingId, 'demolish');
  
  if (response.success && response.planet) {
    planetStore.setCurrentPlanet(response.planet);
    showBuildingPanel.value = false;
    console.log('✅ 拆除成功:', buildingId);
  } else {
    console.error('❌ 拆除失败:', response.message);
  }
}

/**
 * 返回宇宙
 */
function handleBack() {
  planetStore.clearCurrentPlanet();
  router.push('/universe');
}

// 生命周期
onMounted(() => {
  loadPlanet();
});

onBeforeUnmount(() => {
  // 取消订阅
  unsubscribePlanet(planetId.value);
});

// 监听路由变化
watch(() => route.params.id, () => {
  if (route.params.id) {
    // 取消之前的订阅
    unsubscribePlanet(planetId.value);
    loadPlanet();
  }
});
</script>

<style scoped>
.planet-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0a0e27;
  overflow: hidden;
}

/* 顶部工具栏 */
.top-toolbar {
  height: 60px;
  background: linear-gradient(180deg, rgba(20, 30, 50, 0.95) 0%, rgba(20, 30, 50, 0.8) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(74, 144, 226, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 10;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.4);
  border-radius: 6px;
  color: #4A90E2;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4A90E2;
}

.planet-title h2 {
  margin: 0;
  color: #4A90E2;
  font-size: 20px;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

.btn-tool {
  padding: 8px 16px;
  background: rgba(74, 144, 226, 0.2);
  border: 1px solid rgba(74, 144, 226, 0.4);
  border-radius: 6px;
  color: #4A90E2;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-tool:hover {
  background: rgba(74, 144, 226, 0.3);
  border-color: #4A90E2;
}

/* 主要内容 */
.planet-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.grid-section {
  flex: 1;
  overflow: hidden;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #8FA3C1;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 144, 226, 0.3);
  border-top-color: #4A90E2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.sidebar {
  width: 400px;
  background: rgba(10, 20, 40, 0.8);
  border-left: 1px solid rgba(74, 144, 226, 0.3);
  overflow-y: auto;
  padding: 20px;
}

.production-panel {
  background: rgba(20, 30, 50, 0.95);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 20px;
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
  color: #4A90E2;
  font-size: 20px;
}

.btn-close {
  background: none;
  border: none;
  color: #8FA3C1;
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
  color: #FF6B7A;
}

.production-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-section h4 {
  margin: 0 0 12px 0;
  color: #5FD98A;
  font-size: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(74, 144, 226, 0.1);
  border-radius: 4px;
  margin-bottom: 6px;
  font-size: 14px;
}

.stat-item .icon {
  font-size: 20px;
}

.stat-item .name {
  flex: 1;
  color: #B0C4DE;
}

.stat-item .value {
  color: #5FD98A;
  font-weight: 600;
  font-family: 'Courier New', monospace;
}

.buildings-summary h4 {
  margin: 0 0 12px 0;
  color: #4A90E2;
  font-size: 16px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  font-size: 14px;
  margin-bottom: 4px;
}

.summary-item .label {
  color: #8FA3C1;
}

.summary-item .value {
  color: #4A90E2;
  font-weight: 600;
}

/* 滚动条样式 */
.sidebar::-webkit-scrollbar {
  width: 8px;
}

.sidebar::-webkit-scrollbar-track {
  background: rgba(10, 20, 40, 0.4);
  border-radius: 4px;
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(74, 144, 226, 0.4);
  border-radius: 4px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 144, 226, 0.6);
}
</style>
