/**
 * The Merge Mandala: a 24-segment circle that fills up as you merge.
 * Completing it pays a big bonus and restarts it with a new palette.
 * Pure functions — no React / React Native imports.
 */

export const MANDALA_SEGMENTS = 24;
export const MANDALA_BONUS_COINS = 250;
export const MANDALA_BONUS_STARS = 1;

export interface MandalaPalette {
  name: string;
  colors: string[];
}

export const MANDALA_PALETTES: MandalaPalette[] = [
  { name: 'Sakura', colors: ['#FF8FAB', '#FFB3C6', '#FFC2D1', '#FF7096', '#FEC5BB'] },
  { name: 'Matcha', colors: ['#95D5B2', '#74C69D', '#52B788', '#B7E4C7', '#40916C'] },
  { name: 'Ocean', colors: ['#48CAE4', '#00B4D8', '#90E0EF', '#0077B6', '#ADE8F4'] },
  { name: 'Sunset', colors: ['#FFB703', '#FB8500', '#FFD60A', '#FF9770', '#F4845F'] },
  { name: 'Lavender', colors: ['#B892FF', '#9D7BFF', '#CDB4F0', '#FFC8DD', '#A2D2FF'] },
];

export interface MandalaState {
  /** How many segments are lit, 0..24 */
  lit: number;
  /** Index into MANDALA_PALETTES */
  paletteIndex: number;
}

export function createMandala(): MandalaState {
  return { lit: 0, paletteIndex: 0 };
}

export function getPalette(paletteIndex: number): MandalaPalette {
  return MANDALA_PALETTES[paletteIndex % MANDALA_PALETTES.length];
}

/** Colour for a segment of the current mandala. */
export function segmentColor(mandala: MandalaState, segmentIndex: number): string {
  const palette = getPalette(mandala.paletteIndex);
  return palette.colors[segmentIndex % palette.colors.length];
}

export interface MandalaAdvance {
  mandala: MandalaState;
  completed: boolean;
  bonusCoins: number;
  bonusStars: number;
}

/**
 * Light the next segment after a merge. If that completes the mandala,
 * it resets to empty with the next palette and reports the bonus.
 */
export function advanceMandala(mandala: MandalaState): MandalaAdvance {
  const nextLit = mandala.lit + 1;
  if (nextLit >= MANDALA_SEGMENTS) {
    return {
      mandala: {
        lit: 0,
        paletteIndex: (mandala.paletteIndex + 1) % MANDALA_PALETTES.length,
      },
      completed: true,
      bonusCoins: MANDALA_BONUS_COINS,
      bonusStars: MANDALA_BONUS_STARS,
    };
  }
  return {
    mandala: { lit: nextLit, paletteIndex: mandala.paletteIndex },
    completed: false,
    bonusCoins: 0,
    bonusStars: 0,
  };
}
