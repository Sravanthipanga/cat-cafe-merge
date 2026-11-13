/**
 * Board operations for Cat Café Merge.
 * The board is a 5x4 grid (20 cells), stored as a flat array of
 * tier numbers (1..10) or null for an empty cell.
 * Pure functions — no React / React Native imports.
 */
import { MAX_TIER } from './tiers';

export const BOARD_COLS = 4;
export const BOARD_ROWS = 5;
export const BOARD_SIZE = BOARD_COLS * BOARD_ROWS; // 20

export type Board = (number | null)[];

export function createEmptyBoard(): Board {
  return new Array<number | null>(BOARD_SIZE).fill(null);
}

/** Indices of all empty cells, in order. */
export function emptyCellIndices(board: Board): number[] {
  const out: number[] = [];
  board.forEach((cell, i) => {
    if (cell === null) out.push(i);
  });
  return out;
}

export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

/** First index holding a cat of the given tier, or -1. */
export function findCatIndex(board: Board, tier: number): number {
  return board.findIndex((cell) => cell === tier);
}

/**
 * Spawn a tier-1 Kitten into a random empty cell.
 * Returns the new board and the index used, or null if the board is full.
 */
export function spawnCat(
  board: Board,
  rng: () => number = Math.random,
): { board: Board; index: number } | null {
  const empties = emptyCellIndices(board);
  if (empties.length === 0) return null;
  const pick = empties[Math.floor(rng() * empties.length)];
  const next = [...board];
  next[pick] = 1;
  return { board: next, index: pick };
}

/** Can the cat at `from` merge into the cat at `to`? */
export function canMerge(board: Board, from: number, to: number): boolean {
  if (from === to) return false;
  if (from < 0 || to < 0 || from >= BOARD_SIZE || to >= BOARD_SIZE) return false;
  const a = board[from];
  const b = board[to];
  if (a === null || b === null) return false;
  if (a !== b) return false;
  if (a >= MAX_TIER) return false;
  return true;
}

/**
 * Merge the cat at `from` into the cat at `to`, producing tier+1 at `to`
 * and emptying `from`. Returns the new board and the new tier,
 * or null if the merge is not legal.
 */
export function mergeCats(
  board: Board,
  from: number,
  to: number,
): { board: Board; newTier: number } | null {
  if (!canMerge(board, from, to)) return null;
  const newTier = (board[to] as number) + 1;
  const next = [...board];
  next[to] = newTier;
  next[from] = null;
  return { board: next, newTier };
}
