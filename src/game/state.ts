/**
 * Full game state for Cat Café Merge: creation, actions (spawn / merge /
 * serve / refill / energy tick), and JSON serialisation for persistence.
 * Pure functions — no React / React Native imports.
 */
import {
  Board,
  BOARD_SIZE,
  createEmptyBoard,
  findCatIndex,
  mergeCats,
  spawnCat,
} from './board';
import { advanceMandala, createMandala, MandalaState } from './mandala';
import { generateOrder, generateOrders, ORDER_SLOTS, Order } from './orders';
import { CAT_TIERS, getTier } from './tiers';

export const MAX_ENERGY = 20;
export const SPAWN_ENERGY_COST = 1;
export const MERGE_ENERGY_REFUND = 1;
export const ENERGY_REGEN_MS = 30_000;

export interface GameState {
  version: 1;
  board: Board;
  coins: number;
  stars: number;
  energy: number;
  /** Timestamp (ms) from which energy regen is calculated */
  lastEnergyAt: number;
  /** Always ORDER_SLOTS entries; null = waiting for a new customer */
  orders: (Order | null)[];
  nextOrderId: number;
  mandala: MandalaState;
  /** Tier numbers the player has ever owned, sorted ascending */
  discovered: number[];
  totalMerges: number;
  totalServed: number;
  mandalasCompleted: number;
  highestTier: number;
  totalCoinsEarned: number;
}

export function createInitialState(
  now: number = Date.now(),
  rng: () => number = Math.random,
): GameState {
  const orders = generateOrders(ORDER_SLOTS, 1, rng);
  return {
    version: 1,
    board: createEmptyBoard(),
    coins: 0,
    stars: 0,
    energy: MAX_ENERGY,
    lastEnergyAt: now,
    orders,
    nextOrderId: ORDER_SLOTS + 1,
    mandala: createMandala(),
    discovered: [],
    totalMerges: 0,
    totalServed: 0,
    mandalasCompleted: 0,
    highestTier: 0,
    totalCoinsEarned: 0,
  };
}

/**
 * Apply energy regeneration based on elapsed time.
 * +1 energy per ENERGY_REGEN_MS, capped at MAX_ENERGY.
 */
export function tickEnergy(state: GameState, now: number): GameState {
  if (state.energy >= MAX_ENERGY) {
    return state.lastEnergyAt === now ? state : { ...state, lastEnergyAt: now };
  }
  const elapsed = now - state.lastEnergyAt;
  if (elapsed < ENERGY_REGEN_MS) return state;
  const gained = Math.floor(elapsed / ENERGY_REGEN_MS);
  const energy = Math.min(MAX_ENERGY, state.energy + gained);
  const lastEnergyAt =
    energy >= MAX_ENERGY ? now : state.lastEnergyAt + gained * ENERGY_REGEN_MS;
  return { ...state, energy, lastEnergyAt };
}

function withDiscovery(state: GameState, tier: number): Partial<GameState> {
  const discovered = state.discovered.includes(tier)
    ? state.discovered
    : [...state.discovered, tier].sort((a, b) => a - b);
  return {
    discovered,
    highestTier: Math.max(state.highestTier, tier),
  };
}

export interface ActionResult {
  state: GameState;
  ok: boolean;
  /** Board index that changed, for animations */
  changedIndex?: number;
  /** True when this action completed the mandala */
  mandalaCompleted?: boolean;
}

/** Spawn a Kitten. Costs 1 energy; fails on a full board or no energy. */
export function doSpawn(
  state: GameState,
  now: number = Date.now(),
  rng: () => number = Math.random,
): ActionResult {
  const ticked = tickEnergy(state, now);
  if (ticked.energy < SPAWN_ENERGY_COST) return { state: ticked, ok: false };
  const spawned = spawnCat(ticked.board, rng);
  if (!spawned) return { state: ticked, ok: false };
  const next: GameState = {
    ...ticked,
    board: spawned.board,
    energy: ticked.energy - SPAWN_ENERGY_COST,
    lastEnergyAt: ticked.energy - SPAWN_ENERGY_COST >= MAX_ENERGY ? now : ticked.lastEnergyAt,
    ...withDiscovery(ticked, 1),
  };
  return { state: next, ok: true, changedIndex: spawned.index };
}

/** Merge the cat at `from` into the cat at `to`. Refunds 1 energy. */
export function doMerge(
  state: GameState,
  from: number,
  to: number,
  now: number = Date.now(),
): ActionResult {
  const ticked = tickEnergy(state, now);
  const merged = mergeCats(ticked.board, from, to);
  if (!merged) return { state: ticked, ok: false };

  const mandalaResult = advanceMandala(ticked.mandala);
  const mergeCoins = getTier(merged.newTier).coinValue;
  const coinsEarned = mergeCoins + mandalaResult.bonusCoins;

  const next: GameState = {
    ...ticked,
    board: merged.board,
    coins: ticked.coins + coinsEarned,
    totalCoinsEarned: ticked.totalCoinsEarned + coinsEarned,
    stars: ticked.stars + mandalaResult.bonusStars,
    energy: Math.min(MAX_ENERGY, ticked.energy + MERGE_ENERGY_REFUND),
    mandala: mandalaResult.mandala,
    mandalasCompleted: ticked.mandalasCompleted + (mandalaResult.completed ? 1 : 0),
    totalMerges: ticked.totalMerges + 1,
    ...withDiscovery(ticked, merged.newTier),
  };
  return {
    state: next,
    ok: true,
    changedIndex: to,
    mandalaCompleted: mandalaResult.completed,
  };
}

/**
 * Serve an order: removes the first board cat matching the order's tier,
 * pays the reward, and leaves the slot empty (refilled later by refillOrders).
 */
export function doServe(
  state: GameState,
  orderId: number,
  now: number = Date.now(),
): ActionResult {
  const ticked = tickEnergy(state, now);
  const slot = ticked.orders.findIndex((o) => o !== null && o.id === orderId);
  if (slot === -1) return { state: ticked, ok: false };
  const order = ticked.orders[slot] as Order;
  const catIndex = findCatIndex(ticked.board, order.tier);
  if (catIndex === -1) return { state: ticked, ok: false };

  const board = [...ticked.board];
  board[catIndex] = null;
  const orders = [...ticked.orders];
  orders[slot] = null;

  const next: GameState = {
    ...ticked,
    board,
    orders,
    coins: ticked.coins + order.coinsReward,
    totalCoinsEarned: ticked.totalCoinsEarned + order.coinsReward,
    stars: ticked.stars + order.starsReward,
    totalServed: ticked.totalServed + 1,
  };
  return { state: next, ok: true, changedIndex: catIndex };
}

/** Fill any empty order slots with fresh customers. */
export function refillOrders(
  state: GameState,
  rng: () => number = Math.random,
): GameState {
  if (state.orders.every((o) => o !== null)) return state;
  let nextId = state.nextOrderId;
  const orders = state.orders.map((o) => {
    if (o !== null) return o;
    const fresh = generateOrder(nextId, rng);
    nextId += 1;
    return fresh;
  });
  return { ...state, orders, nextOrderId: nextId };
}

/** Serialise the state for AsyncStorage. */
export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

function isValidState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    s.version === 1 &&
    Array.isArray(s.board) &&
    s.board.length === BOARD_SIZE &&
    typeof s.coins === 'number' &&
    typeof s.stars === 'number' &&
    typeof s.energy === 'number' &&
    typeof s.lastEnergyAt === 'number' &&
    Array.isArray(s.orders) &&
    s.orders.length === ORDER_SLOTS &&
    typeof s.nextOrderId === 'number' &&
    typeof s.mandala === 'object' &&
    s.mandala !== null &&
    Array.isArray(s.discovered) &&
    typeof s.totalMerges === 'number' &&
    typeof s.mandalasCompleted === 'number' &&
    typeof s.highestTier === 'number'
  );
}

/**
 * Deserialise a saved state. Returns null for anything missing,
 * corrupt, or from an incompatible version.
 */
export function deserializeState(json: string | null): GameState | null {
  if (!json) return null;
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isValidState(parsed)) return null;
    // Defensive: only keep valid tier numbers on the board / in discoveries.
    const validTiers = new Set(CAT_TIERS.map((t) => t.tier));
    const board = parsed.board.map((c) => (c !== null && validTiers.has(c) ? c : null));
    const discovered = parsed.discovered.filter((t) => validTiers.has(t));
    return { ...parsed, board, discovered };
  } catch {
    return null;
  }
}
