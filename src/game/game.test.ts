import { describe, expect, it } from 'vitest';
import {
  BOARD_SIZE,
  canMerge,
  createEmptyBoard,
  isBoardFull,
  mergeCats,
  spawnCat,
} from './board';
import { advanceMandala, createMandala, MANDALA_SEGMENTS } from './mandala';
import { generateOrder, MAX_ORDER_TIER, MIN_ORDER_TIER } from './orders';
import {
  createInitialState,
  deserializeState,
  doMerge,
  doServe,
  doSpawn,
  ENERGY_REGEN_MS,
  GameState,
  MAX_ENERGY,
  refillOrders,
  serializeState,
  tickEnergy,
} from './state';
import { CAT_TIERS, MAX_TIER } from './tiers';

/** Deterministic RNG cycling through the given values. */
function rngFrom(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

const zeroRng = () => 0;

function stateWithBoard(board: (number | null)[]): GameState {
  const base = createInitialState(0, zeroRng);
  return { ...base, board };
}

describe('tiers', () => {
  it('defines exactly 10 tiers ending with the Legendary Golden Neko', () => {
    expect(CAT_TIERS).toHaveLength(10);
    expect(CAT_TIERS[MAX_TIER - 1].name).toBe('Legendary Golden Neko');
    CAT_TIERS.forEach((t, i) => expect(t.tier).toBe(i + 1));
  });
});

describe('board', () => {
  it('spawn only ever fills empty cells', () => {
    const board = createEmptyBoard();
    board[0] = 5;
    board[1] = 5;
    // rng = 0 always picks the first empty cell
    const result = spawnCat(board, zeroRng);
    expect(result).not.toBeNull();
    expect(result!.index).toBe(2);
    expect(result!.board[2]).toBe(1);
    expect(board[2]).toBeNull(); // original untouched
  });

  it('spawn returns null on a full board', () => {
    const board = new Array(BOARD_SIZE).fill(1);
    expect(isBoardFull(board)).toBe(true);
    expect(spawnCat(board, zeroRng)).toBeNull();
  });

  it('merge requires two cats of the same tier', () => {
    const board = createEmptyBoard();
    board[0] = 2;
    board[1] = 3;
    expect(canMerge(board, 0, 1)).toBe(false);
    expect(mergeCats(board, 0, 1)).toBeNull();
    board[1] = 2;
    expect(canMerge(board, 0, 1)).toBe(true);
  });

  it('merge produces tier+1 in the target cell and empties the source', () => {
    const board = createEmptyBoard();
    board[4] = 3;
    board[7] = 3;
    const result = mergeCats(board, 4, 7);
    expect(result).not.toBeNull();
    expect(result!.newTier).toBe(4);
    expect(result!.board[7]).toBe(4);
    expect(result!.board[4]).toBeNull();
  });

  it('tier 10 cats cannot merge further', () => {
    const board = createEmptyBoard();
    board[0] = MAX_TIER;
    board[1] = MAX_TIER;
    expect(canMerge(board, 0, 1)).toBe(false);
    expect(mergeCats(board, 0, 1)).toBeNull();
  });
});

describe('orders', () => {
  it('order generation only ever requests tiers 2-7', () => {
    const rng = rngFrom([0, 0.2, 0.4, 0.6, 0.8, 0.999]);
    for (let id = 1; id <= 60; id++) {
      const order = generateOrder(id, rng);
      expect(order.tier).toBeGreaterThanOrEqual(MIN_ORDER_TIER);
      expect(order.tier).toBeLessThanOrEqual(MAX_ORDER_TIER);
      expect(order.coinsReward).toBeGreaterThan(0);
      expect(order.starsReward).toBeGreaterThanOrEqual(1);
    }
  });

  it('serving an order removes the cat and pays the reward', () => {
    const board = createEmptyBoard();
    board[5] = 3;
    const state = stateWithBoard(board);
    const order = { id: 99, tier: 3, coinsReward: 22, starsReward: 1 };
    const withOrder: GameState = { ...state, orders: [order, null, null] };
    const result = doServe(withOrder, 99, 0);
    expect(result.ok).toBe(true);
    expect(result.state.board[5]).toBeNull();
    expect(result.state.coins).toBe(state.coins + 22);
    expect(result.state.stars).toBe(state.stars + 1);
    expect(result.state.totalServed).toBe(1);
    expect(result.state.orders[0]).toBeNull();
  });

  it('serving fails when the player has no matching cat', () => {
    const state = stateWithBoard(createEmptyBoard());
    const order = { id: 7, tier: 4, coinsReward: 34, starsReward: 1 };
    const withOrder: GameState = { ...state, orders: [order, null, null] };
    const result = doServe(withOrder, 7, 0);
    expect(result.ok).toBe(false);
    expect(result.state.coins).toBe(state.coins);
  });

  it('refillOrders replaces served slots with new customers', () => {
    const state = createInitialState(0, zeroRng);
    const withGap: GameState = { ...state, orders: [null, state.orders[1], null] };
    const refilled = refillOrders(withGap, zeroRng);
    expect(refilled.orders.every((o) => o !== null)).toBe(true);
    expect(refilled.nextOrderId).toBe(state.nextOrderId + 2);
  });
});

describe('mandala', () => {
  it('advances by one segment per merge', () => {
    const start = createMandala();
    const once = advanceMandala(start);
    expect(once.mandala.lit).toBe(1);
    expect(once.completed).toBe(false);
    const twice = advanceMandala(once.mandala);
    expect(twice.mandala.lit).toBe(2);
  });

  it('completes at 24 segments with a bonus and a fresh palette', () => {
    const almost = { lit: MANDALA_SEGMENTS - 1, paletteIndex: 0 };
    const result = advanceMandala(almost);
    expect(result.completed).toBe(true);
    expect(result.bonusCoins).toBeGreaterThan(0);
    expect(result.bonusStars).toBe(1);
    expect(result.mandala.lit).toBe(0);
    expect(result.mandala.paletteIndex).toBe(1);
  });

  it('a merge that completes the mandala pays the bonus through game state', () => {
    const board = createEmptyBoard();
    board[0] = 1;
    board[1] = 1;
    const state: GameState = {
      ...stateWithBoard(board),
      mandala: { lit: MANDALA_SEGMENTS - 1, paletteIndex: 0 },
    };
    const result = doMerge(state, 0, 1, 0);
    expect(result.ok).toBe(true);
    expect(result.mandalaCompleted).toBe(true);
    expect(result.state.mandalasCompleted).toBe(1);
    expect(result.state.mandala.lit).toBe(0);
    expect(result.state.coins).toBeGreaterThanOrEqual(250);
    expect(result.state.stars).toBe(state.stars + 1);
  });
});

describe('energy', () => {
  it('spawning costs 1 energy', () => {
    const state = createInitialState(0, zeroRng);
    const result = doSpawn(state, 0, zeroRng);
    expect(result.ok).toBe(true);
    expect(result.state.energy).toBe(MAX_ENERGY - 1);
  });

  it('spawning fails with no energy', () => {
    const state: GameState = { ...createInitialState(0, zeroRng), energy: 0 };
    const result = doSpawn(state, 0, zeroRng);
    expect(result.ok).toBe(false);
  });

  it('merging refunds 1 energy, capped at the max', () => {
    const board = createEmptyBoard();
    board[0] = 2;
    board[1] = 2;
    const low: GameState = { ...stateWithBoard(board), energy: 5 };
    const merged = doMerge(low, 0, 1, 0);
    expect(merged.state.energy).toBe(6);

    const full: GameState = { ...stateWithBoard(board), energy: MAX_ENERGY };
    const mergedFull = doMerge(full, 0, 1, 0);
    expect(mergedFull.state.energy).toBe(MAX_ENERGY);
  });

  it('energy regenerates 1 per interval over time', () => {
    const state: GameState = {
      ...createInitialState(0, zeroRng),
      energy: 10,
      lastEnergyAt: 0,
    };
    const later = tickEnergy(state, ENERGY_REGEN_MS * 3 + 1);
    expect(later.energy).toBe(13);
    const capped = tickEnergy(state, ENERGY_REGEN_MS * 100);
    expect(capped.energy).toBe(MAX_ENERGY);
  });
});

describe('persistence', () => {
  it('serialise / deserialise round-trips the full state', () => {
    const board = createEmptyBoard();
    board[3] = 4;
    board[9] = 2;
    const state: GameState = {
      ...stateWithBoard(board),
      coins: 123,
      stars: 5,
      energy: 17,
      discovered: [1, 2, 4],
      highestTier: 4,
      totalMerges: 9,
      mandala: { lit: 11, paletteIndex: 2 },
    };
    const restored = deserializeState(serializeState(state));
    expect(restored).toEqual(state);
  });

  it('deserialise rejects corrupt or incompatible saves', () => {
    expect(deserializeState(null)).toBeNull();
    expect(deserializeState('not json')).toBeNull();
    expect(deserializeState('{"version":99}')).toBeNull();
    expect(deserializeState('{}')).toBeNull();
  });

  it('merging records discovery and stats', () => {
    const board = createEmptyBoard();
    board[0] = 4;
    board[1] = 4;
    const state = stateWithBoard(board);
    const result = doMerge(state, 0, 1, 0);
    expect(result.state.discovered).toContain(5);
    expect(result.state.highestTier).toBe(5);
    expect(result.state.totalMerges).toBe(1);
    expect(result.state.coins).toBeGreaterThan(0);
  });
});
