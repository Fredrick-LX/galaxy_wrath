/**
 * 宇宙服务 - 初始行星分配
 */

import { GLOBAL_SEED, INITIAL_RESOURCES } from '../config/constants';
import type { Planet } from '../types';
import { createSeededRandom } from '../utils/noiseGenerator';
import { generateGalaxyPlanets } from '../utils/galaxyGenerator';
import { generateBalancedStartingZones } from '../utils/planetGenerator';

/**
 * 为新玩家分配初始行星
 */
export async function assignStartingPlanet(userId: string): Promise<Planet> {
    // 使用用户ID和全局种子生成唯一的随机数生成器
    const userSeed = `${GLOBAL_SEED}_user_${userId}`;
    const rng = createSeededRandom(userSeed);

    // 在较远的范围内随机选择一个星系坐标（避开0坐标）
    let gridX = Math.floor((rng() - 0.5) * 100); // -50 到 50
    let gridY = Math.floor((rng() - 0.5) * 100);

    // 确保不在原点或坐标轴上
    if (gridX === 0) gridX = rng() > 0.5 ? 1 : -1;
    if (gridY === 0) gridY = rng() > 0.5 ? 1 : -1;

    // 生成星系ID
    const absX = Math.abs(gridX);
    const absY = Math.abs(gridY);
    const dirX = gridX > 0 ? 'E' : 'W';
    const dirY = gridY > 0 ? 'N' : 'S';
    const galaxyId = `${dirY}${absY}${dirX}${absX}`;

    // 生成该星系的所有行星
    const galaxyPlanets = generateGalaxyPlanets(galaxyId);

    // 如果星系中没有行星，尝试其他星系
    if (galaxyPlanets.length === 0) {
        // 递归尝试下一个星系（通过修改用户ID的种子）
        return assignStartingPlanet(userId + '_retry');
    }

    // 随机选择一个行星
    const randomIndex = Math.floor(rng() * galaxyPlanets.length);
    const selectedPlanet = galaxyPlanets[randomIndex];

    const planetId = `${galaxyId}_${selectedPlanet.position}`;

    // 使用噪声生成器生成行星区划
    const zones = generateBalancedStartingZones(planetId, selectedPlanet.size);

    // 生成初始行星
    const planet: Planet = {
        id: planetId,
        galaxyId,
        position: selectedPlanet.position,
        type: selectedPlanet.type,
        size: selectedPlanet.size,
        ownerId: userId,
        zones,
        buildings: [],
        resources: { ...INITIAL_RESOURCES }
    };

    return planet;
}


/**
 * 检查行星是否已被占领
 */
export function isPlanetOccupied(planetId: string, allPlanets: Planet[]): boolean {
    return allPlanets.some(p => p.id === planetId && p.ownerId !== null);
}
