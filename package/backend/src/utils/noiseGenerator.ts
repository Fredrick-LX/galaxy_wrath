/**
 * 噪声生成器 - 使用 simplex-noise 和 alea
 */

import { createNoise2D, createNoise3D, createNoise4D } from 'simplex-noise';
import alea from 'alea';

/**
 * 创建带种子的 2D 噪声生成器
 */
export function createSeededNoise2D(seed: string | number) {
    const prng = alea(seed);
    return createNoise2D(prng);
}

/**
 * 创建带种子的 3D 噪声生成器
 */
export function createSeededNoise3D(seed: string | number) {
    const prng = alea(seed);
    return createNoise3D(prng);
}

/**
 * 创建带种子的 4D 噪声生成器
 */
export function createSeededNoise4D(seed: string | number) {
    const prng = alea(seed);
    return createNoise4D(prng);
}

/**
 * 带种子的随机数生成器
 */
export function createSeededRandom(seed: string | number) {
    return alea(seed);
}

/**
 * 多层噪声（Fractal/Octave Noise）
 * 用于生成更复杂、更自然的地形
 */
export function octaveNoise2D(
    noise2D: ReturnType<typeof createNoise2D>,
    x: number,
    y: number,
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2.0,
    scale: number = 1.0
): number {
    let total = 0;
    let frequency = scale;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        total += noise2D(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return total / maxValue;
}

/**
 * 多层 3D 噪声
 */
export function octaveNoise3D(
    noise3D: ReturnType<typeof createNoise3D>,
    x: number,
    y: number,
    z: number,
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2.0,
    scale: number = 1.0
): number {
    let total = 0;
    let frequency = scale;
    let amplitude = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        total += noise3D(x * frequency, y * frequency, z * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }

    return total / maxValue;
}

/**
 * 将噪声值从 [-1, 1] 映射到 [0, 1]
 */
export function normalizeNoise(value: number): number {
    return (value + 1) / 2;
}

/**
 * 将噪声值映射到指定范围
 */
export function mapNoise(value: number, min: number, max: number): number {
    const normalized = normalizeNoise(value);
    return min + normalized * (max - min);
}

