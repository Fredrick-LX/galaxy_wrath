/**
 * 行星生成算法
 */

import seedrandom from 'seedrandom';
import type { Planet, PlanetType, Zone, ZoneType } from '../types/planet';
import { PLANET_TYPE_MODIFIERS, ZONE_COLORS } from '../types/planet';
import { INITIAL_RESOURCES } from '../types/resource';
import type { NoiseGenerator } from './noiseGenerator';
import type { GalaxyConfig } from './galaxyGenerator';

/**
 * 所有行星类型
 */
const PLANET_TYPES: PlanetType[] = [
  'mountain',
  'swamp',
  'frozen',
  'lava',
  'arid',
  'tropical',
  'tundra'
];

/**
 * 根据行星类型和噪声值生成区划分布
 */
function generateZones(
  planetType: PlanetType,
  size: number,
  seed: number,
  noiseGenerator: NoiseGenerator
): Zone[][] {
  const rng = seedrandom(seed.toString());
  const zones: Zone[][] = [];

  // 根据行星类型设置区划概率
  const zoneProbabilities = getZoneProbabilities(planetType);

  for (let y = 0; y < size; y++) {
    const row: Zone[] = [];
    for (let x = 0; x < size; x++) {
      // 使用噪声和随机数决定区划类型
      const noiseValue = noiseGenerator.getNormalized2D(
        seed + x * 100,
        seed + y * 100,
        0.3
      );
      const randomValue = rng();
      const combinedValue = (noiseValue + randomValue) / 2;

      const zoneType = selectZoneType(combinedValue, zoneProbabilities);
      row.push({
        type: zoneType,
        color: ZONE_COLORS[zoneType]
      });
    }
    zones.push(row);
  }

  return zones;
}

/**
 * 根据行星类型获取区划概率分布
 */
function getZoneProbabilities(planetType: PlanetType): Record<ZoneType, number> {
  switch (planetType) {
    case 'mountain':
      return {
        mining: 0.5,
        power: 0.2,
        agricultural: 0.1,
        wasteland: 0.2
      };
    case 'swamp':
      return {
        mining: 0.2,
        power: 0.2,
        agricultural: 0.3,
        wasteland: 0.3
      };
    case 'frozen':
      return {
        mining: 0.3,
        power: 0.3,
        agricultural: 0.1,
        wasteland: 0.3
      };
    case 'lava':
      return {
        mining: 0.50,
        power: 0.20,
        agricultural: 0.05,
        wasteland: 0.25
      };
    case 'arid':
      return {
        mining: 0.35,
        power: 0.25,
        agricultural: 0.15,
        wasteland: 0.25
      };
    case 'tropical':
      return {
        mining: 0.15,
        power: 0.20,
        agricultural: 0.40,
        wasteland: 0.25
      };
    case 'tundra':
      return {
        mining: 0.25,
        power: 0.3,
        agricultural: 0.15,
        wasteland: 0.3
      };
    default:
      return {
        mining: 0.25,
        power: 0.25,
        agricultural: 0.25,
        wasteland: 0.25
      };
  }
}

/**
 * 根据值和概率分布选择区划类型
 */
function selectZoneType(
  value: number,
  probabilities: Record<ZoneType, number>
): ZoneType {
  let cumulative = 0;
  const types: ZoneType[] = ['mining', 'power', 'agricultural', 'wasteland'];

  for (const type of types) {
    cumulative += probabilities[type];
    if (value <= cumulative) {
      return type;
    }
  }

  return 'wasteland'; // 默认
}

/**
 * 根据噪声值选择行星类型
 */
function selectPlanetType(noiseValue: number, rng: () => number): PlanetType {
  // 使用噪声值和随机数组合
  const combinedValue = (noiseValue + rng()) / 2;

  if (combinedValue < 0.14) return 'mountain';
  if (combinedValue < 0.28) return 'swamp';
  if (combinedValue < 0.42) return 'frozen';
  if (combinedValue < 0.56) return 'lava';
  if (combinedValue < 0.70) return 'arid';
  if (combinedValue < 0.84) return 'tropical';
  return 'tundra';
}

/**
 * 生成行星
 * @param galaxyId 星系ID
 * @param position 在星系中的位置（0-80）
 * @param seed 行星种子
 * @param config 星系配置
 * @param noiseGenerator 噪声生成器
 * @returns 行星对象
 */
export function generatePlanet(
  galaxyId: string,
  position: number,
  seed: number,
  config: GalaxyConfig,
  noiseGenerator: NoiseGenerator
): Planet {
  const rng = seedrandom(seed.toString());
  const planetId = `${galaxyId}_${position}`;

  // 使用噪声决定行星类型
  const noiseValue = noiseGenerator.getNormalized2D(seed, seed + 1000, 0.05);
  const planetType = selectPlanetType(noiseValue, rng);

  // 随机生成行星大小
  const size = Math.floor(
    rng() * (config.maxPlanetSize - config.minPlanetSize + 1) + config.minPlanetSize
  );

  // 生成区划
  const zones = generateZones(planetType, size, seed, noiseGenerator);

  return {
    id: planetId,
    galaxyId,
    position,
    type: planetType,
    size,
    ownerId: null,
    zones,
    buildings: [],
    resources: { ...INITIAL_RESOURCES }
  };
}

/**
 * 生成行星名称（基于位置和类型）
 */
export function generatePlanetName(
  galaxyId: string,
  position: number,
  planetType: PlanetType,
  seed: number
): string {
  const rng = seedrandom(seed.toString());
  
  // 希腊字母
  const greekLetters = [
    'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
    'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
    'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega'
  ];
  
  // 随机数字
  const number = Math.floor(rng() * 9999);
  
  // 选择希腊字母
  const letter = greekLetters[Math.floor(rng() * greekLetters.length)];
  
  return `${galaxyId}-${letter}-${number}`;
}
