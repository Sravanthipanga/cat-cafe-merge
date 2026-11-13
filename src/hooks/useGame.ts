/**
 * useGame — owns the Cat Café Merge game state, persistence
 * (AsyncStorage), energy regen ticking, and customer refills.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { canMerge } from '../game/board';
import {
  createInitialState,
  deserializeState,
  doMerge,
  doServe,
  doSpawn,
  GameState,
  refillOrders,
  serializeState,
  tickEnergy,
} from '../game/state';

const STORAGE_KEY = 'cat-cafe-merge-save-v1';
const ORDER_REFILL_DELAY_MS = 4000;

export interface UseGame {
  loaded: boolean;
  state: GameState | null;
  selectedIndex: number | null;
  /** Board index of the most recent merge result + a counter to retrigger animation */
  lastMerge: { index: number; count: number } | null;
  message: string | null;
  spawn: () => void;
  tapCell: (index: number) => void;
  serve: (orderId: number) => void;
  reset: () => void;
}

export function useGame(): UseGame {
  const [state, setState] = useState<GameState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lastMerge, setLastMerge] = useState<{ index: number; count: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flashMessage = useCallback((text: string) => {
    setMessage(text);
    if (messageTimer.current) clearTimeout(messageTimer.current);
    messageTimer.current = setTimeout(() => setMessage(null), 2800);
  }, []);

  // Load the saved game (or start fresh) once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let initial: GameState | null = null;
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        initial = deserializeState(raw);
      } catch {
        initial = null;
      }
      if (cancelled) return;
      const now = Date.now();
      setState(initial ? tickEnergy(initial, now) : createInitialState(now));
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist on every change after loading.
  useEffect(() => {
    if (!loaded || !state) return;
    AsyncStorage.setItem(STORAGE_KEY, serializeState(state)).catch(() => undefined);
  }, [state, loaded]);

  // Tick energy regeneration once a second.
  useEffect(() => {
    if (!loaded) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (!prev) return prev;
        const next = tickEnergy(prev, Date.now());
        return next === prev ? prev : next;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [loaded]);

  // Refill empty order slots after a short delay.
  const hasEmptySlot = state?.orders.some((o) => o === null) ?? false;
  useEffect(() => {
    if (!loaded || !hasEmptySlot) return;
    const id = setTimeout(() => {
      setState((prev) => (prev ? refillOrders(prev) : prev));
    }, ORDER_REFILL_DELAY_MS);
    return () => clearTimeout(id);
  }, [loaded, hasEmptySlot]);

  const spawn = useCallback(() => {
    setState((prev) => {
      if (!prev) return prev;
      const result = doSpawn(prev, Date.now());
      if (!result.ok) {
        const full = prev.board.every((c) => c !== null);
        flashMessage(full ? 'The café is full! Merge or serve a cat. 🐱' : 'Not enough energy ⚡ — it refills over time.');
        return result.state;
      }
      return result.state;
    });
  }, [flashMessage]);

  const tapCell = useCallback(
    (index: number) => {
      if (!state) return;
      const tapped = state.board[index];
      if (selectedIndex === null) {
        if (tapped !== null) setSelectedIndex(index);
        return;
      }
      if (selectedIndex === index) {
        setSelectedIndex(null);
        return;
      }
      if (canMerge(state.board, selectedIndex, index)) {
        const result = doMerge(state, selectedIndex, index, Date.now());
        if (result.ok) {
          setState(result.state);
          setLastMerge({ index, count: (lastMerge?.count ?? 0) + 1 });
          if (result.mandalaCompleted) {
            flashMessage('🌸 Mandala complete! +250 🪙 +1 ⭐');
          }
        }
        setSelectedIndex(null);
        return;
      }
      // Not a legal merge — move the selection to the newly tapped cat.
      if (tapped !== null) setSelectedIndex(index);
    },
    [state, selectedIndex, lastMerge, flashMessage],
  );

  const serve = useCallback(
    (orderId: number) => {
      if (!state) return;
      const result = doServe(state, orderId, Date.now());
      if (result.ok) {
        setState(result.state);
        setSelectedIndex(null);
        flashMessage('Order served! 🎉 A happy customer leaves a tip.');
      }
    },
    [state, flashMessage],
  );

  const reset = useCallback(() => {
    const fresh = createInitialState(Date.now());
    setState(fresh);
    setSelectedIndex(null);
    setLastMerge(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => undefined);
    flashMessage('Fresh café, fresh cats! ☕🐱');
  }, [flashMessage]);

  return { loaded, state, selectedIndex, lastMerge, message, spawn, tapCell, serve, reset };
}
