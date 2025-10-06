<template>
  <canvas
    ref="canvasRef"
    class="star-background"
    :width="width"
    :height="height"
  ></canvas>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

// 星星接口
interface Star {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

// Props
const props = withDefaults(
  defineProps<{
    starCount?: number;
    parallaxStrength?: number;
  }>(),
  {
    starCount: 200,
    parallaxStrength: 0.02,
  }
);

// 响应式变量
const canvasRef = ref<HTMLCanvasElement | null>(null);
const width = ref(window.innerWidth);
const height = ref(window.innerHeight);
const stars = ref<Star[]>([]);
const mouseX = ref(0);
const mouseY = ref(0);
let animationId: number | null = null;

/**
 * 初始化星星
 */
function initStars() {
  stars.value = [];
  for (let i = 0; i < props.starCount; i++) {
    stars.value.push({
      x: Math.random() * width.value,
      y: Math.random() * height.value,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: (Math.random() - 0.5) * 0.2,
      opacity: Math.random() * 0.5 + 0.3,
    });
  }
}

/**
 * 绘制星星
 */
function drawStars() {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 清空画布
  ctx.clearRect(0, 0, width.value, height.value);

  // 绘制每颗星星
  stars.value.forEach((star) => {
    // 视差效果
    const parallaxX =
      (mouseX.value - width.value / 2) * props.parallaxStrength * star.size;
    const parallaxY =
      (mouseY.value - height.value / 2) * props.parallaxStrength * star.size;

    // 更新位置
    star.x += star.speedX;
    star.y += star.speedY;

    // 边界检查
    if (star.x < 0) star.x = width.value;
    if (star.x > width.value) star.x = 0;
    if (star.y < 0) star.y = height.value;
    if (star.y > height.value) star.y = 0;

    // 绘制星星
    ctx.beginPath();
    ctx.arc(star.x + parallaxX, star.y + parallaxY, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 220, 255, ${star.opacity})`;
    ctx.fill();
  });

  // 继续动画
  animationId = requestAnimationFrame(drawStars);
}

/**
 * 处理窗口大小变化
 */
function handleResize() {
  width.value = window.innerWidth;
  height.value = window.innerHeight;
  initStars();
}

/**
 * 处理鼠标移动
 */
function handleMouseMove(event: MouseEvent) {
  mouseX.value = event.clientX;
  mouseY.value = event.clientY;
}

// 生命周期
onMounted(() => {
  initStars();
  drawStars();

  window.addEventListener("resize", handleResize);
  window.addEventListener("mousemove", handleMouseMove);
});

onBeforeUnmount(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener("resize", handleResize);
  window.removeEventListener("mousemove", handleMouseMove);
});
</script>

<style scoped>
.star-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #2c3e5c 100%);
}
</style>
