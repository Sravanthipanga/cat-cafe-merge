/**
 * Café customer orders for Cat Café Merge.
 * Pure functions — no React / React Native imports.
 */
import { getTier } from './tiers';

export interface Order {
  id: number;
  /** Requested cat tier (always 2..7) */
  tier: number;
  coinsReward: number;
  starsReward: number;
}

export const ORDER_SLOTS = 3;
export const MIN_ORDER_TIER = 2;
export const MAX_ORDER_TIER = 7;

/** Reward for serving a cat of the given tier. */
export function rewardForTier(tier: number): { coins: number; stars: number } {
  return {
    coins: 10 + getTier(tier).coinValue * 2,
    stars: tier >= 6 ? 2 : 1,
  };
}

/** Generate one order for a random tier in 2..7. */
export function generateOrder(id: number, rng: () => number = Math.random): Order {
  const span = MAX_ORDER_TIER - MIN_ORDER_TIER + 1;
  const tier = MIN_ORDER_TIER + Math.floor(rng() * span);
  const reward = rewardForTier(tier);
  return { id, tier, coinsReward: reward.coins, starsReward: reward.stars };
}

/** Generate a full set of fresh orders with consecutive ids. */
export function generateOrders(
  count: number,
  startId: number,
  rng: () => number = Math.random,
): Order[] {
  return Array.from({ length: count }, (_, i) => generateOrder(startId + i, rng));
}
