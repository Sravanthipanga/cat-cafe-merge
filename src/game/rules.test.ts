import { describe, expect, it } from 'vitest';
import {
  Board,
  BOARD_SIZE,
  canMerge,
  createEmptyBoard,
  mergeCats,
  spawnCat,
} from './board';
import {
  advanceMandala,
  createMandala,
  getPalette,
  MANDALA_PALETTES,
  MANDALA_SEGMENTS,
  segmentColor,
} from './mandala';
import {
  generateOrder,
  generateOrders,
  MAX_ORDER_TIER,
  MIN_ORDER_TIER,
  rewardForTier,
} from './orders';
import {
  createInitialState,
  deserializeState,
  doMerge,
  doServe,
  doSpawn,
  ENERGY_REGEN_MS,
  GameState,
  MAX_ENERGY,
  serializeState,
  tickEnergy,
} from './state';
import { CAT_TIERS, getTier, MAX_TIER } from './tiers';

const zeroRng = () => 0;

/** Small deterministic LCG so "random" play sessions are reproducible. */
function lcg(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

function stateWithBoard(board: Board): GameState {
  const base = createInitialState(0, zeroRng);
  return { ...base, board };
}

/** Merge the first legal pair found on the board; returns null if none. */
function mergeFirstPair(board: Board): { board: Board; newTier: number } | null {
  for (let from = 0; from < BOARD_SIZE; from++) {
    for (let to = 0; to < BOARD_SIZE; to++) {
      if (canMerge(board, from, to)) return mergeCats(board, from, to);
    }
  }
  return null;
}

describe('merge chains', () => {
  it('climbs the full chain from two Kittens to the Legendary Golden Neko', () => {
    for (let tier = 1; tier < MAX_TIER; tier++) {
      const board = createEmptyBoard();
      board[0] = tier;
      board[1] = tier;
      const result = mergeCats(board, 0, 1);
      expect(result).not.toBeNull();
      expect(result!.newTier).toBe(tier + 1);
      expect(result!.board[1]).toBe(tier + 1);
    }
  });

  it('collapses a full board of 16 Kittens into one tier-5 cat in 15 merges', () => {
    let board = createEmptyBoard();
    for (let i = 0; i < 16; i++) board[i] = 1;
    let merges = 0;
    let step = mergeFirstPair(board);
    while (step) {
      board = step.board;
      merges += 1;
      step = mergeFirstPair(board);
    }
    expect(merges).toBe(15);
    const remaining = board.filter((c) => c !== null);
    expect(remaining).toEqual([5]);
  });

  it('canMerge rejects the same cell, out-of-bounds and empty cells', () => {
    const board = createEmptyBoard();
    board[3] = 2;
    board[4] = 2;
    expect(canMerge(board, 3, 3)).toBe(false);
    expect(canMerge(board, -1, 4)).toBe(false);
    expect(canMerge(board, 3, BOARD_SIZE)).toBe(false);
    expect(canMerge(board, 0, 4)).toBe(false); // empty source
    expect(canMerge(board, 3, 0)).toBe(false); // empty target
    expect(canMerge(board, 3, 4)).toBe(true);
  });

  it('mergeCats does not mutate the input board', () => {
    const board = createEmptyBoard();
    board[0] = 2;
    board[1] = 2;
    const before = [...board];
    mergeCats(board, 0, 1);
    expect(board).toEqual(before);
  });
});

describe('spawning', () => {
  it('an rng near 1 spawns into the last empty cell', () => {
    const board = createEmptyBoard();
    board[BOARD_SIZE - 1] = 7;
    board[0] = 7;
    const result = spawnCat(board, () => 0.9999);
    expect(result).not.toBeNull();
    expect(result!.index).toBe(BOARD_SIZE - 2);
    expect(result!.board[BOARD_SIZE - 2]).toBe(1);
  });
});

describe('tier table', () => {
  it('getTier throws for tiers outside 1..10', () => {
    expect(() => getTier(0)).toThrow();
    expect(() => getTier(MAX_TIER + 1)).toThrow();
    expect(getTier(1).name).toBe('Kitten');
    expect(getTier(MAX_TIER).name).toBe('Legendary Golden Neko');
  });

  it('coin values strictly increase with tier', () => {
    for (let i = 1; i < CAT_TIERS.length; i++) {
      expect(CAT_TIERS[i].coinValue).toBeGreaterThan(CAT_TIERS[i - 1].coinValue);
    }
  });
});

describe('order rewards', () => {
  it('rewardForTier follows the coin formula and the tier-6 star bonus', () => {
    expect(rewardForTier(2)).toEqual({ coins: 16, stars: 1 });
    expect(rewardForTier(5)).toEqual({ coins: 50, stars: 1 });
    expect(rewardForTier(6)).toEqual({ coins: 74, stars: 2 });
    expect(rewardForTier(7)).toEqual({ coins: 106, stars: 2 });
  });

  it('generateOrder hits the min tier at rng 0 and the max tier near rng 1', () => {
    const low = generateOrder(1, () => 0);
    expect(low.tier).toBe(MIN_ORDER_TIER);
    const high = generateOrder(2, () => 0.9999);
    expect(high.tier).toBe(MAX_ORDER_TIER);
    for (const order of [low, high]) {
      const reward = rewardForTier(order.tier);
      expect(order.coinsReward).toBe(reward.coins);
      expect(order.starsReward).toBe(reward.stars);
    }
  });

  it('generateOrders returns consecutive ids', () => {
    const orders = generateOrders(3, 10, zeroRng);
    expect(orders.map((o) => o.id)).toEqual([10, 11, 12]);
  });
});

describe('order completion', () => {
  it('serving an unknown order id fails and pays nothing', () => {
    const state = stateWithBoard(createEmptyBoard());
    const result = doServe(state, 424242, 0);
    expect(result.ok).toBe(false);
    expect(result.state.coins).toBe(state.coins);
    expect(result.state.totalServed).toBe(0);
  });

  it('serving removes only the first matching cat', () => {
    const board = createEmptyBoard();
    board[2] = 3;
    board[6] = 3;
    const state = stateWithBoard(board);
    const order = { id: 5, tier: 3, coinsReward: 22, starsReward: 1 };
    const withOrder: GameState = { ...state, orders: [order, null, null] };
    const result = doServe(withOrder, 5, 0);
    expect(result.ok).toBe(true);
    expect(result.state.board[2]).toBeNull();
    expect(result.state.board[6]).toBe(3);
  });

  it('serving a tier-6 order pays 2 stars', () => {
    const board = createEmptyBoard();
    board[0] = 6;
    const state = stateWithBoard(board);
    const order = { id: 6, tier: 6, coinsReward: 74, starsReward: 2 };
    const withOrder: GameState = { ...state, orders: [order, null, null] };
    const result = doServe(withOrder, 6, 0);
    expect(result.ok).toBe(true);
    expect(result.state.stars).toBe(state.stars + 2);
  });
});

describe('economy invariants', () => {
  it('spawning at 1 energy succeeds and lands on exactly 0; at 0 it fails cleanly', () => {
    const one: GameState = { ...createInitialState(0, zeroRng), energy: 1 };
    const spent = doSpawn(one, 0, zeroRng);
    expect(spent.ok).toBe(true);
    expect(spent.state.energy).toBe(0);

    const broke: GameState = { ...createInitialState(0, zeroRng), energy: 0 };
    const failed = doSpawn(broke, 0, zeroRng);
    expect(failed.ok).toBe(false);
    expect(failed.state.energy).toBe(0);
  });

  it('a merge pays exactly the new tier coin value when the mandala does not complete', () => {
    const board = createEmptyBoard();
    board[0] = 4;
    board[1] = 4;
    const state = stateWithBoard(board); // mandala starts at 0 lit segments
    const result = doMerge(state, 0, 1, 0);
    expect(result.ok).toBe(true);
    expect(result.mandalaCompleted).toBe(false);
    expect(result.state.coins).toBe(state.coins + getTier(5).coinValue);
    expect(result.state.totalCoinsEarned).toBe(
      state.totalCoinsEarned + getTier(5).coinValue,
    );
  });

  it('a long scripted session never breaks the coin / energy invariants', () => {
    const rng = lcg(42);
    let state = createInitialState(0, rng);
    let prevTotalEarned = 0;
    for (let stepCount = 0; stepCount < 300; stepCount++) {
      const now = stepCount * 1000;
      const pair = (() => {
        for (let f = 0; f < BOARD_SIZE; f++) {
          for (let t = 0; t < BOARD_SIZE; t++) {
            if (canMerge(state.board, f, t)) return { f, t };
          }
        }
        return null;
      })();
      const servable = state.orders.find(
        (o) => o !== null && state.board.includes(o.tier),
      );
      if (pair && rng() < 0.6) {
        state = doMerge(state, pair.f, pair.t, now).state;
      } else if (servable) {
        state = doServe(state, servable.id, now).state;
      } else {
        state = doSpawn(state, now, rng).state;
      }
      expect(state.coins).toBeGreaterThanOrEqual(0);
      // Nothing in the game spends coins, so the balance is the lifetime total.
      expect(state.coins).toBe(state.totalCoinsEarned);
      expect(state.totalCoinsEarned).toBeGreaterThanOrEqual(prevTotalEarned);
      expect(state.energy).toBeGreaterThanOrEqual(0);
      expect(state.energy).toBeLessThanOrEqual(MAX_ENERGY);
      prevTotalEarned = state.totalCoinsEarned;
    }
    // The session must have actually played, not idled.
    expect(state.totalMerges).toBeGreaterThan(0);
    expect(state.totalCoinsEarned).toBeGreaterThan(0);
  });

  it('tickEnergy grants nothing before the interval and exactly 1 at it', () => {
    const state: GameState = {
      ...createInitialState(0, zeroRng),
      energy: 3,
      lastEnergyAt: 0,
    };
    expect(tickEnergy(state, ENERGY_REGEN_MS - 1).energy).toBe(3);
    expect(tickEnergy(state, ENERGY_REGEN_MS).energy).toBe(4);
  });
});

describe('mandala palettes', () => {
  it('palettes advance on each completion and wrap after all five', () => {
    let mandala = createMandala();
    let completions = 0;
    for (let i = 0; i < MANDALA_SEGMENTS * MANDALA_PALETTES.length; i++) {
      const step = advanceMandala(mandala);
      mandala = step.mandala;
      if (step.completed) completions += 1;
    }
    expect(completions).toBe(MANDALA_PALETTES.length);
    expect(mandala.paletteIndex).toBe(0);
    expect(mandala.lit).toBe(0);
  });

  it('segmentColor always returns a colour from the current palette', () => {
    const mandala = { lit: 0, paletteIndex: 2 };
    const palette = getPalette(mandala.paletteIndex);
    for (let i = 0; i < MANDALA_SEGMENTS; i++) {
      expect(palette.colors).toContain(segmentColor(mandala, i));
    }
    expect(getPalette(7)).toBe(MANDALA_PALETTES[2]);
  });
});

describe('persistence hardening', () => {
  it('invalid tier numbers on the board are sanitised to empty cells', () => {
    const state = stateWithBoard(createEmptyBoard());
    const raw = JSON.parse(serializeState(state)) as Record<string, unknown>;
    raw.board = [99, 0, 3, ...new Array(BOARD_SIZE - 3).fill(null)];
    const restored = deserializeState(JSON.stringify(raw));
    expect(restored).not.toBeNull();
    expect(restored!.board[0]).toBeNull();
    expect(restored!.board[1]).toBeNull();
    expect(restored!.board[2]).toBe(3);
  });

  it('invalid discoveries are filtered out of a restored save', () => {
    const state = stateWithBoard(createEmptyBoard());
    const raw = JSON.parse(serializeState(state)) as Record<string, unknown>;
    raw.discovered = [1, 99, 3, -2];
    const restored = deserializeState(JSON.stringify(raw));
    expect(restored).not.toBeNull();
    expect(restored!.discovered).toEqual([1, 3]);
  });

  it('saves with the wrong shape are rejected', () => {
    const state = stateWithBoard(createEmptyBoard());
    const good = JSON.parse(serializeState(state)) as Record<string, unknown>;

    const shortBoard = { ...good, board: new Array(BOARD_SIZE - 1).fill(null) };
    expect(deserializeState(JSON.stringify(shortBoard))).toBeNull();

    const shortOrders = { ...good, orders: [null, null] };
    expect(deserializeState(JSON.stringify(shortOrders))).toBeNull();

    const stringCoins = { ...good, coins: 'lots' };
    expect(deserializeState(JSON.stringify(stringCoins))).toBeNull();

    const futureVersion = { ...good, version: 2 };
    expect(deserializeState(JSON.stringify(futureVersion))).toBeNull();
  });
});
