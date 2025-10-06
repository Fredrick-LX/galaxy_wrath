/**
 * 柏林噪声生成器
 * 使用 simplex-noise 库实现
 */

import { createNoise2D, createNoise3D, type NoiseFunction2D, type NoiseFunction3D } from 'simplex-noise';
import seedrandom from 'seedrandom';

/**
 * 噪声生成器接口
 */
export interface INoiseGenerator {
    get2D(x: number, y: number, scale?: number): number;
    get3D(x: number, y: number, z: number, scale?: number): number;
    getNormalized2D(x: number, y: number, scale?: number): number;
    fbm(x: number, y: number, octaves?: number, persistence?: number, lacunarity?: number, scale?: number): number;
    fbmNormalized(x: number, y: number, octaves?: number, persistence?: number, lacunarity?: number, scale?: number): number;
    getIslandNoise(x: number, y: number, centerX: number, centerY: number, radius: number, scale?: number): number;
    getSeed(): number;
}

/**
 * 噪声生成器类
 */
export class NoiseGenerator implements INoiseGenerator {
    private noise2D: NoiseFunction2D;
    private noise3D: NoiseFunction3D;
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
        const rng = seedrandom(seed.toString());
        this.noise2D = createNoise2D(rng);
        this.noise3D = createNoise3D(rng);
    }

    /**
     * 获取2D噪声值
     * @param x X坐标
     * @param y Y坐标
     * @param scale 缩放比例（越小噪声变化越平滑）
     * @returns 噪声值 [-1, 1]
     */
    get2D(x: number, y: number, scale: number = 0.01): number {
        return this.noise2D(x * scale, y * scale);
    }

    /**
     * 获取3D噪声值
     * @param x X坐标
     * @param y Y坐标
     * @param z Z坐标
     * @param scale 缩放比例
     * @returns 噪声值 [-1, 1]
     */
    get3D(x: number, y: number, z: number, scale: number = 0.01): number {
        return this.noise3D(x * scale, y * scale, z * scale);
    }

    /**
     * 获取归一化的噪声值
     * @param x X坐标
     * @param y Y坐标
     * @param scale 缩放比例
     * @returns 噪声值 [0, 1]
     */
    getNormalized2D(x: number, y: number, scale: number = 0.01): number {
        return (this.get2D(x, y, scale) + 1) / 2;
    }

    /**
     * 分形布朗运动（多层噪声叠加）
     * @param x X坐标
     * @param y Y坐标
     * @param octaves 八度数（层数）
     * @param persistence 持续度（每层的振幅衰减）
     * @param lacunarity 间隙度（每层的频率增长）
     * @param scale 初始缩放比例
     * @returns 噪声值 [-1, 1]
     */
    fbm(
        x: number,
        y: number,
        octaves: number = 4,
        persistence: number = 0.5,
        lacunarity: number = 2.0,
        scale: number = 0.01
    ): number {
        let total = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            total += this.get2D(x * frequency, y * frequency, scale) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }

        return total / maxValue;
    }

    /**
     * 获取归一化的分形布朗运动噪声值
     * @returns 噪声值 [0, 1]
     */
    fbmNormalized(
        x: number,
        y: number,
        octaves: number = 4,
        persistence: number = 0.5,
        lacunarity: number = 2.0,
        scale: number = 0.01
    ): number {
        return (this.fbm(x, y, octaves, persistence, lacunarity, scale) + 1) / 2;
    }

    /**
     * 生成岛屿形状的噪声（中心高，边缘低）
     * @param x X坐标
     * @param y Y坐标
     * @param centerX 中心X坐标
     * @param centerY 中心Y坐标
     * @param radius 半径
     * @param scale 缩放比例
     * @returns 噪声值 [0, 1]
     */
    getIslandNoise(
        x: number,
        y: number,
        centerX: number,
        centerY: number,
        radius: number,
        scale: number = 0.01
    ): number {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const distanceFactor = Math.max(0, 1 - distance / radius);

        const noise = this.getNormalized2D(x, y, scale);
        return noise * distanceFactor;
    }

    /**
     * 获取种子值
     */
    getSeed(): number {
        return this.seed;
    }
}

/**
 * 创建全局噪声生成器
 */
let globalNoiseGenerator: INoiseGenerator | null = null;

export function initGlobalNoiseGenerator(seed: number): INoiseGenerator {
    globalNoiseGenerator = new NoiseGenerator(seed);
    return globalNoiseGenerator;
}

export function getGlobalNoiseGenerator(): INoiseGenerator {
    if (!globalNoiseGenerator) {
        throw new Error('全局噪声生成器未初始化，请先调用 initGlobalNoiseGenerator');
    }
    return globalNoiseGenerator;
}
