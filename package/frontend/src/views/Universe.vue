<template>
  <div class="universe-page">
    <!-- 宇宙画布 -->
    <UniverseCanvas />

    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <div class="game-title">
        <h1>星河之怒</h1>
        <span class="username">{{ userStore.user?.username }}</span>
      </div>

      <div class="toolbar-actions">
        <button @click="handleLogout" class="btn-logout">
          <span class="icon">🚪</span>
          登出
        </button>
      </div>
    </div>

    <!-- 资源显示 HUD -->
    <div class="resources-hud">
      <div class="resource-group primary">
        <div class="resource-item">
          <span class="icon">⛏️</span>
          <span class="label">矿物</span>
          <span class="value">{{ formatNumber(resources.minerals) }}</span>
        </div>
        <div class="resource-item">
          <span class="icon">⚡</span>
          <span class="label">电力</span>
          <span class="value">{{ formatNumber(resources.energy) }}</span>
        </div>
        <div class="resource-item">
          <span class="icon">🌾</span>
          <span class="label">食物</span>
          <span class="value">{{ formatNumber(resources.food) }}</span>
        </div>
      </div>

      <div class="resource-group secondary">
        <div class="resource-item">
          <span class="icon">🔩</span>
          <span class="label">合金</span>
          <span class="value">{{ formatNumber(resources.alloys) }}</span>
        </div>
        <div class="resource-item">
          <span class="icon">🔋</span>
          <span class="label">电池</span>
          <span class="value">{{ formatNumber(resources.powerCells) }}</span>
        </div>
        <div class="resource-item">
          <span class="icon">📦</span>
          <span class="label">消费品</span>
          <span class="value">{{ formatNumber(resources.consumerGoods) }}</span>
        </div>
      </div>
    </div>

    <!-- 行星列表 -->
    <div class="planets-panel">
      <h3>我的行星</h3>
      <div class="planets-list">
        <div v-if="myPlanets.length === 0" class="no-planets">
          暂无行星，请占领一个行星开始游戏
        </div>
        <div
          v-for="planet in myPlanets"
          :key="planet.id"
          class="planet-item"
          @click="goToPlanet(planet.id)"
        >
          <span class="planet-type">{{ getPlanetTypeName(planet.type) }}</span>
          <span class="planet-id">{{ planet.id }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { useUniverseStore } from "../stores/universe";
import { useResourcesStore } from "../stores/resources";
import UniverseCanvas from "../components/UniverseCanvas.vue";
import { PLANET_TYPE_NAMES } from "../types/planet";
import { getMyPlanets, claimOfflineRewards } from "../services/planet";

const router = useRouter();
const userStore = useUserStore();
const universeStore = useUniverseStore();
const resourcesStore = useResourcesStore();

// 资源（从resourcesStore获取）
const resources = computed(() => resourcesStore.globalResources);

// 我的行星列表
const myPlanets = ref<any[]>([]);

// 加载中
const loading = ref(true);

/**
 * 加载玩家数据
 */
async function loadPlayerData() {
  loading.value = true;

  try {
    // 获取行星列表
    const response = await getMyPlanets();
    if (response.success && response.planets) {
      myPlanets.value = response.planets;

      // 更新资源状态
      response.planets.forEach((planet) => {
        resourcesStore.setPlanetResources(planet.id, planet.resources);
      });

      // 如果有离线时间，领取离线收益
      if (userStore.user) {
        const offlineResponse = await claimOfflineRewards();
        if (offlineResponse.success && offlineResponse.offlineTime) {
          const hours = Math.floor(
            offlineResponse.offlineTime / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (offlineResponse.offlineTime % (1000 * 60 * 60)) / (1000 * 60)
          );

          if (hours > 0 || minutes > 0) {
            console.log(`🎁 离线收益已领取: ${hours}小时${minutes}分钟`);

            // 更新行星资源
            if (offlineResponse.planets) {
              myPlanets.value = offlineResponse.planets;
              offlineResponse.planets.forEach((planet) => {
                resourcesStore.setPlanetResources(planet.id, planet.resources);
              });
            }
          }
        }
      }

      // 设置Socket监听
      resourcesStore.setupSocketListeners();
    }
  } catch (error) {
    console.error("加载玩家数据失败:", error);
  } finally {
    loading.value = false;
  }
}

// 生命周期
onMounted(() => {
  loadPlayerData();
});

/**
 * 格式化数字显示
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toFixed(0);
}

/**
 * 获取行星类型名称
 */
function getPlanetTypeName(type: string): string {
  return PLANET_TYPE_NAMES[type as keyof typeof PLANET_TYPE_NAMES] || type;
}

/**
 * 跳转到行星详情
 */
function goToPlanet(planetId: string) {
  router.push(`/planet/${planetId}`);
}

/**
 * 登出
 */
function handleLogout() {
  userStore.logout();
  router.push("/login");
}
</script>

<style scoped>
.universe-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* 顶部工具栏 */
.top-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(
    180deg,
    rgba(20, 30, 50, 0.95) 0%,
    transparent 100%
  );
  backdrop-filter: blur(10px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  z-index: 10;
}

.game-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.game-title h1 {
  font-size: 24px;
  color: #4a90e2;
  margin: 0;
  text-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
}

.game-title .username {
  font-size: 14px;
  color: #8fa3c1;
  padding: 4px 12px;
  background: rgba(74, 144, 226, 0.2);
  border-radius: 12px;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

.btn-logout {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(220, 53, 69, 0.2);
  border: 1px solid rgba(220, 53, 69, 0.4);
  border-radius: 6px;
  color: #ff6b7a;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-logout:hover {
  background: rgba(220, 53, 69, 0.3);
  border-color: #ff6b7a;
}

/* 资源显示 HUD */
.resources-hud {
  position: absolute;
  top: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 10;
}

.resource-group {
  background: rgba(20, 30, 50, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.resource-group.secondary {
  border-color: rgba(139, 99, 20, 0.3);
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.resource-item .icon {
  font-size: 18px;
}

.resource-item .label {
  color: #8fa3c1;
  min-width: 60px;
}

.resource-item .value {
  color: #4a90e2;
  font-weight: 600;
  font-family: "Courier New", monospace;
  margin-left: auto;
}

/* 行星列表面板 */
.planets-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 300px;
  max-height: 300px;
  background: rgba(20, 30, 50, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 16px;
  z-index: 10;
}

.planets-panel h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #4a90e2;
}

.planets-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}

.no-planets {
  color: #6b7b94;
  font-size: 14px;
  text-align: center;
  padding: 20px;
}

.planet-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(74, 144, 226, 0.1);
  border: 1px solid rgba(74, 144, 226, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.planet-item:hover {
  background: rgba(74, 144, 226, 0.2);
  border-color: #4a90e2;
}

.planet-item .planet-type {
  color: #4a90e2;
  font-weight: 600;
}

.planet-item .planet-id {
  color: #8fa3c1;
  font-size: 12px;
  font-family: "Courier New", monospace;
}

/* 滚动条样式 */
.planets-list::-webkit-scrollbar {
  width: 6px;
}

.planets-list::-webkit-scrollbar-track {
  background: rgba(10, 20, 40, 0.4);
  border-radius: 3px;
}

.planets-list::-webkit-scrollbar-thumb {
  background: rgba(74, 144, 226, 0.4);
  border-radius: 3px;
}

.planets-list::-webkit-scrollbar-thumb:hover {
  background: rgba(74, 144, 226, 0.6);
}
</style>
