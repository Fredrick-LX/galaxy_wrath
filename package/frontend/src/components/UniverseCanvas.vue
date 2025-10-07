<template>
  <div ref="containerRef" class="universe-canvas">
    <canvas ref="canvasRef"></canvas>

    <!-- HUD 信息 -->
    <div class="universe-hud">
      <div class="hud-section coordinates">
        <span class="label">坐标:</span>
        <span class="value"
          >X: {{ Math.round(viewportX) }}, Y: {{ Math.round(viewportY) }}</span
        >
      </div>

      <div class="hud-section zoom">
        <span class="label">缩放:</span>
        <span class="value">{{ (zoom * 100).toFixed(0) }}%</span>
      </div>

      <div class="hud-section galaxies">
        <span class="label">已加载星系:</span>
        <span class="value">{{ loadedGalaxies }}</span>
      </div>

      <div class="hud-section fps">
        <span class="label">FPS:</span>
        <span class="value">{{ fps }}</span>
      </div>
    </div>

    <!-- 控制说明 -->
    <div class="controls-hint">
      <p>拖动: 移动视图</p>
      <p>鼠标滚轮: 缩放</p>
      <p>点击星系: 查看详情</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRouter } from "vue-router";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import { useUniverseStore } from "../stores/universe";
import type { Galaxy } from "../types/galaxy";

const universeStore = useUniverseStore();
const router = useRouter();

// 响应式变量
const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const viewportX = ref(0);
const viewportY = ref(0);
const zoom = ref(1);
const loadedGalaxies = ref(0);
const fps = ref(60);

let app: PIXI.Application | null = null;
let viewport: Viewport | null = null;
let galaxyGraphics = new Map<string, PIXI.Container>();
let lastTime = performance.now();
let frameCount = 0;

/**
 * 初始化 Pixi.js
 */
async function initPixi() {
  if (!containerRef.value || !canvasRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  // 创建 Pixi 应用
  app = new PIXI.Application();
  await app.init({
    canvas: canvasRef.value,
    width,
    height,
    backgroundColor: 0x0a0e27,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  // 创建视口
  viewport = new Viewport({
    screenWidth: width,
    screenHeight: height,
    worldWidth: 100000,
    worldHeight: 100000,
    events: app.renderer.events,
  });

  app.stage.addChild(viewport);

  // 启用视口交互
  viewport
    .drag()
    .pinch()
    .wheel({
      smooth: 3,
      percent: 0.1,
    })
    .decelerate()
    .clampZoom({
      minScale: 0.5,
      maxScale: 1.75,
    });

  // 监听视口移动和缩放（先设置监听器）
  viewport.on("moved", updateViewportInfo);
  viewport.on("zoomed", updateViewportZoom);

  // 先更新视口大小
  universeStore.updateViewportSize(width, height);

  // 设置视口初始位置（恢复保存的状态或居中显示）
  const savedState = universeStore.getSavedViewportState();
  if (savedState) {
    viewport.moveCenter(savedState.x, savedState.y);
    viewport.setZoom(savedState.scale);
    // 更新store的状态值，但不触发加载（skipLoad=true）
    universeStore.updateViewportCenter(savedState.x, savedState.y, true);
    universeStore.updateViewportScale(savedState.scale, true);
    universeStore.clearSavedViewportState();
  } else {
    viewport.moveCenter(0, 0);
    // 更新store的状态值，但不触发加载（skipLoad=true）
    universeStore.updateViewportCenter(0, 0, true);
    universeStore.updateViewportScale(1, true);
  }

  // 初始化宇宙（此时store已有正确的视口信息，会触发加载）
  universeStore.initUniverse();

  // 开始渲染循环
  app.ticker.add(renderLoop);

  console.log("✅ Pixi.js 初始化完成");
}

/**
 * 更新视口信息
 */
function updateViewportInfo() {
  if (!viewport) return;

  viewportX.value = viewport.center.x;
  viewportY.value = viewport.center.y;
  zoom.value = viewport.scale.x;

  // 更新宇宙store
  universeStore.updateViewportCenter(viewport.center.x, viewport.center.y);
}

/**
 * 更新视口缩放
 */
function updateViewportZoom() {
  if (!viewport) return;
  
  zoom.value = viewport.scale.x;
  
  // 更新宇宙store的缩放
  universeStore.updateViewportScale(viewport.scale.x);
}

let lastRenderTime = 0;
const RENDER_THROTTLE = 100; // 限制渲染频率为10次/秒

/**
 * 渲染循环（优化版）
 */
function renderLoop() {
  const currentTime = performance.now();

  // 计算FPS
  frameCount++;
  if (currentTime - lastTime >= 1000) {
    fps.value = frameCount;
    frameCount = 0;
    lastTime = currentTime;
  }

  // 节流：只在必要时重新渲染星系
  if (currentTime - lastRenderTime > RENDER_THROTTLE) {
    renderVisibleGalaxies();
    lastRenderTime = currentTime;
  }

  // 定期清理远距离星系（降低频率）
  if (frameCount % 600 === 0) {
    universeStore.cleanupDistantGalaxies();
  }
}

/**
 * 渲染可见星系
 */
function renderVisibleGalaxies() {
  if (!viewport) return;

  const visibleGalaxies = universeStore.visibleGalaxies;
  loadedGalaxies.value = universeStore.galaxies.length;

  // 移除不再可见的星系图形
  const visibleIds = new Set(visibleGalaxies.map((g) => g.id));
  galaxyGraphics.forEach((graphics, id) => {
    if (!visibleIds.has(id)) {
      viewport!.removeChild(graphics);
      graphics.destroy();
      galaxyGraphics.delete(id);
    }
  });

  // 渲染可见星系
  visibleGalaxies.forEach((galaxy) => {
    if (!galaxyGraphics.has(galaxy.id)) {
      const graphics = renderGalaxy(galaxy);
      viewport!.addChild(graphics);
      galaxyGraphics.set(galaxy.id, graphics);
    }
  });
}

/**
 * 渲染单个星系（优化版本）
 */
function renderGalaxy(galaxy: Galaxy): PIXI.Container {
  const container = new PIXI.Container();
  container.x = galaxy.coordinateX;
  container.y = galaxy.coordinateY;

  const gridSize = universeStore.config.galaxyGridSize;
  const cellSize = universeStore.config.galaxySize / gridSize;

  // 使用单个 Graphics 对象绘制所有内容
  const graphics = new PIXI.Graphics();

  // 绘制星系边框（加强视觉效果）
  graphics.rect(
    -universeStore.config.galaxySize / 2,
    -universeStore.config.galaxySize / 2,
    universeStore.config.galaxySize,
    universeStore.config.galaxySize
  );
  graphics.stroke({ width: 4, color: 0x4a90e2, alpha: 0.5 });

  // 绘制星系背景（略微发光）
  graphics.rect(
    -universeStore.config.galaxySize / 2,
    -universeStore.config.galaxySize / 2,
    universeStore.config.galaxySize,
    universeStore.config.galaxySize
  );
  graphics.fill({ color: 0x0a0e27, alpha: 0.3 });

  // 行星颜色映射（预定义避免重复创建）
  const colors: Record<string, number> = {
    mountain: 0x8b7355,
    swamp: 0x5f7f5f,
    frozen: 0xa0d8ef,
    lava: 0xff4500,
    arid: 0xd2b48c,
    tropical: 0x228b22,
    tundra: 0xb0c4de,
  };

  // 批量绘制行星
  galaxy.planets.forEach((planet, index) => {
    if (!planet) return;

    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const x =
      col * cellSize - universeStore.config.galaxySize / 2 + cellSize / 2;
    const y =
      row * cellSize - universeStore.config.galaxySize / 2 + cellSize / 2;
    const radius = planet.size * 3;

    // 绘制行星光晕（外层）
    graphics.circle(x, y, radius + 4);
    graphics.fill({ color: colors[planet.type] || 0x8fa3c1, alpha: 0.3 });

    // 绘制行星主体
    graphics.circle(x, y, radius);
    graphics.fill({ color: colors[planet.type] || 0x8fa3c1 });

    // 添加高光效果
    graphics.circle(x - radius * 0.3, y - radius * 0.3, radius * 0.4);
    graphics.fill({ color: 0xffffff, alpha: 0.3 });

    // 如果行星被占领，添加闪烁边框
    if (planet.ownerId) {
      graphics.circle(x, y, radius + 2);
      graphics.stroke({ width: 3, color: 0x4a90e2, alpha: 0.8 });
      graphics.circle(x, y, radius + 4);
      graphics.stroke({ width: 1, color: 0x4a90e2, alpha: 0.4 });
    }
  });

  container.addChild(graphics);

  // 为每个行星添加独立的交互区域和名称
  galaxy.planets.forEach((planet, index) => {
    if (!planet) return;

    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const x =
      col * cellSize - universeStore.config.galaxySize / 2 + cellSize / 2;
    const y =
      row * cellSize - universeStore.config.galaxySize / 2 + cellSize / 2;
    const radius = planet.size * 3;

    // 创建透明的交互区域
    const hitArea = new PIXI.Graphics();
    hitArea.circle(x, y, radius + 5);
    hitArea.fill({ color: 0x000000, alpha: 0.01 });
    hitArea.eventMode = "static";
    hitArea.cursor = "pointer";
    hitArea.on("pointerdown", (event) => {
      event.stopPropagation();
      console.log("点击行星:", planet.id, planet.name);
      
      // 保存当前视口状态
      if (viewport) {
        universeStore.saveViewportState(
          viewport.center.x,
          viewport.center.y,
          viewport.scale.x
        );
      }
      
      // 跳转到行星详情页
      router.push(`/planet/${planet.id}`);
    });

    container.addChild(hitArea);

    // 显示行星名称（所有缩放级别）
    if (planet.name) {
      const nameText = new PIXI.Text({
        text: planet.name,
        style: {
          fontSize: 12,
          fill: planet.ownerId ? 0x4a90e2 : 0x8fa3c1,
          align: "center",
          fontWeight: planet.ownerId ? "bold" : "normal",
        },
      });
      nameText.anchor.set(0.5);
      nameText.x = x;
      nameText.y = y + radius + 12;
      container.addChild(nameText);
    }
  });

  // 仅在缩放较大时添加文本（按需创建）
  if (viewport && viewport.scale.x > 1) {
    const text = new PIXI.Text({
      text: galaxy.id,
      style: {
        fontSize: 20,
        fill: 0x8fa3c1,
        align: "center",
      },
    });
    text.anchor.set(0.5);
    text.y = -universeStore.config.galaxySize / 2 - 30;
    container.addChild(text);
  }

  return container;
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
  if (!app || !viewport || !containerRef.value) return;

  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  app.renderer.resize(width, height);
  viewport.resize(width, height);
  universeStore.updateViewportSize(width, height);
}

// 生命周期
onMounted(() => {
  initPixi();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);

  if (app) {
    app.destroy(true, { children: true });
  }

  galaxyGraphics.forEach((graphics) => graphics.destroy());
  galaxyGraphics.clear();
});

// 监听可见星系变化
watch(
  () => universeStore.visibleGalaxies,
  () => {
    renderVisibleGalaxies();
  },
  { deep: true }
);

// 监听目标位置变化（用于定位功能）
watch(
  () => universeStore.targetPosition,
  (newTarget) => {
    if (newTarget && viewport) {
      console.log(`🎯 移动视口到目标位置: (${newTarget.x}, ${newTarget.y})`);
      viewport.moveCenter(newTarget.x, newTarget.y);
    }
  },
  { deep: true }
);
</script>

<style scoped>
.universe-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%);
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.universe-hud {
  position: absolute;
  top: 80px;
  left: 20px;
  background: rgba(20, 30, 50, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 250px;
}

.hud-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.hud-section .label {
  color: #8fa3c1;
  font-weight: 500;
}

.hud-section .value {
  color: #4a90e2;
  font-weight: 600;
  font-family: "Courier New", monospace;
}

.controls-hint {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(20, 30, 50, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(74, 144, 226, 0.3);
  border-radius: 8px;
  padding: 16px;
  font-size: 12px;
  color: #8fa3c1;
}

.controls-hint p {
  margin: 4px 0;
}
</style>
