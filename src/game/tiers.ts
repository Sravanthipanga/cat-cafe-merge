/**
 * Cat tier definitions for Cat Café Merge.
 * Pure data — no React / React Native imports.
 */

export interface CatTier {
  /** Tier number, 1..10 */
  tier: number;
  name: string;
  emoji: string;
  /** Soft background colour for the board cell */
  color: string;
  /** Coins awarded when this tier is created by a merge */
  coinValue: number;
  /** One-line description shown on the Collection screen */
  description: string;
}

export const MAX_TIER = 10;

export const CAT_TIERS: CatTier[] = [
  {
    tier: 1,
    name: 'Kitten',
    emoji: '🐱',
    color: '#FDE2E4',
    coinValue: 0,
    description: 'A tiny café guest who naps in the teacups and dreams of cream.',
  },
  {
    tier: 2,
    name: 'Mochi',
    emoji: '🐈',
    color: '#FFE5B4',
    coinValue: 3,
    description: 'Soft, round, and always first in line for steamed milk.',
  },
  {
    tier: 3,
    name: 'Biscuit',
    emoji: '🐈‍⬛',
    color: '#D8C3A5',
    coinValue: 6,
    description: 'A dapper shadow who guards the biscuit tin with his life.',
  },
  {
    tier: 4,
    name: 'Latte',
    emoji: '🧋',
    color: '#EFC3A0',
    coinValue: 12,
    description: 'Half cat, half bubble tea — fully committed to the café aesthetic.',
  },
  {
    tier: 5,
    name: 'Captain Whiskers',
    emoji: '🎩',
    color: '#B8D8BA',
    coinValue: 20,
    description: 'Retired sea captain. Now sails a sea of saucers and tells tall tails.',
  },
  {
    tier: 6,
    name: 'Ninja Neko',
    emoji: '🥷',
    color: '#C3B2E0',
    coinValue: 32,
    description: 'Moves silently between the tables. Your fries never stood a chance.',
  },
  {
    tier: 7,
    name: 'Wizard Whiskers',
    emoji: '🧙',
    color: '#A8C3E8',
    coinValue: 48,
    description: 'Can turn water into milk and Mondays into Fridays.',
  },
  {
    tier: 8,
    name: 'Disco Diva',
    emoji: '🪩',
    color: '#F6B8D8',
    coinValue: 70,
    description: 'Every hour is golden hour when she struts across the counter.',
  },
  {
    tier: 9,
    name: 'Royal Rajah',
    emoji: '👑',
    color: '#F9DC5C',
    coinValue: 100,
    description: 'Royalty. Expects the sunny window seat — and gets it. Every time.',
  },
  {
    tier: 10,
    name: 'Legendary Golden Neko',
    emoji: '🌟',
    color: '#FFD700',
    coinValue: 150,
    description: 'Said to grant wishes, refill the cream forever, and purr in pure gold.',
  },
];

/** Look up a tier definition by tier number (1..10). */
export function getTier(tier: number): CatTier {
  const found = CAT_TIERS[tier - 1];
  if (!found || found.tier !== tier) {
    throw new Error(`Unknown cat tier: ${tier}`);
  }
  return found;
}
