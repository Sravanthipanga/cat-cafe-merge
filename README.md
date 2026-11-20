# 🐱 Cat Café Merge ☕

A cozy merge game for iOS, Android, and the web — built with **Expo / React Native + TypeScript** from a single codebase.

Welcome kittens to your café, merge two cats of the same tier into a rarer cat, serve customer orders, and light up the Merge Mandala — all the way to the **Legendary Golden Neko** 🌟.

**▶ Play the live web preview: https://cat-cafe-merge.vercel.app/**

[![CI](https://github.com/Sravanthipanga/cat-cafe-merge/actions/workflows/ci.yml/badge.svg)](https://github.com/Sravanthipanga/cat-cafe-merge/actions/workflows/ci.yml)

## 📸 Screenshots

No static screenshots are checked into this repo — the fastest way to see the
game is the [live web preview](https://cat-cafe-merge.vercel.app/), which is
the current `main` branch deployed to Vercel. The Play screen shows the
Mandala, the three customer orders, and the 4×5 café board; the Cats tab is
the collection of discovered tiers and the About tab holds lifetime stats.

## 🎮 How to play

- Tap **"New Kitten"** to welcome a Kitten to the café board (costs 1 ⚡ energy).
- **Tap a cat, then tap another cat of the same tier** to merge them into the next tier.
- Every merge earns **coins**, refunds **1 ⚡**, and lights the next petal of the **Mandala**.
- **Serve customer orders** — customers ask for Tier 2–7 cats — to earn coins and ⭐ stars. Served orders are replaced by a new customer after a few seconds.
- Complete all **24 Mandala petals** for **+250 🪙 and +1 ⭐**, then a fresh Mandala begins in a brand-new colour palette.
- Energy refills by 1 every 30 seconds, up to 20.
- There are **10 cat tiers** to discover: Kitten → Mochi → Biscuit → Latte → Captain Whiskers → Ninja Neko → Wizard Whiskers → Disco Diva → Royal Rajah → Legendary Golden Neko.
- Your progress (board, coins, stars, orders, Mandala, collection, stats) is saved automatically on the device.

## 🧰 Tech stack

- **Expo SDK 58** (React Native 0.88, React 19) — one codebase for iOS, Android, and web (react-native-web)
- **TypeScript** in strict mode, zero `tsc --noEmit` errors (see Testing)
- **State**: a single React hook (`useGame`) holding one immutable `GameState`,
  updated only through pure action functions — no external state library
- **Persistence**: `@react-native-async-storage/async-storage`, JSON with a
  version field and defensive validation on load
- **Rendering extras**: `react-native-svg` for the Mandala, the built-in
  `Animated` API for merge "pop" animations
- **Tests**: Vitest against the pure game-logic modules
- **Web analytics**: `@vercel/analytics`, web bundle only (see Key decisions)

## 🏗️ Architecture

```
App.tsx                  Screens + tab navigation (Play / Cats / About), resource header
index.ts                 registerRootComponent entry point
src/
  game/                  Pure TypeScript game core — zero React / RN imports
    tiers.ts             The 10 cat tiers: names, colours, coin values
    board.ts             4×5 board (flat 20-cell array): spawn, canMerge, mergeCats
    orders.ts            Customer orders (tiers 2–7) and the reward formula
    mandala.ts           24-segment Merge Mandala, 5 rotating palettes, completion bonus
    state.ts             GameState + every action (spawn / merge / serve / refill /
                         energy tick) as pure functions, plus save serialisation
    game.test.ts         Behaviour tests for the core rules
    rules.test.ts        Chain / invariant / persistence-hardening tests
  hooks/
    useGame.ts           The only stateful layer: owns GameState, AsyncStorage
                         load/save, the 1s energy-regen tick, delayed order
                         refills, tap-to-select/merge interaction state
  components/
    BoardView.tsx        The café board grid with animated cat cells
    OrdersBar.tsx        The three customer orders + serve buttons
    MandalaView.tsx      SVG Mandala ring
    CollectionTab.tsx    Discovered-tier collection
    AboutTab.tsx         Stats + reset
    VercelAnalytics.tsx        Native variant — renders nothing (no-op)
    VercelAnalytics.web.tsx    Web variant — renders <Analytics /> from @vercel/analytics
```

**How the merge grid works.** The board is a flat array of 20 cells
(`(tier | null)[]`, row-major, 4 columns). All rules live in `board.ts`:
`spawnCat` drops a tier-1 Kitten into a random empty cell, `canMerge` checks
the pair (same tier, both occupied, below the max tier), and `mergeCats`
produces tier+1 in the target cell and empties the source. The UI never
mutates the board directly — `useGame.tapCell` translates taps into
selection state and delegates legal merges to `doMerge` in `state.ts`,
which also handles the coin payout, energy refund, Mandala progress, and
discovery bookkeeping in one pure state transition.

**Where game state lives.** Exactly one place: the `useGame` hook's
`useState<GameState>`. Every change flows through the pure functions in
`src/game/state.ts` (`doSpawn`, `doMerge`, `doServe`, `refillOrders`,
`tickEnergy`), which take a state and return a new one. Side effects —
AsyncStorage writes, timers, user-facing messages — live in the hook, never
in the game core.

## 🔑 Key decisions

- **Pure functional game core.** All rules (merging, orders, economy,
  Mandala, energy, save validation) are plain TypeScript functions with no
  React imports. That makes the whole game testable in Node with Vitest —
  no renderer, no mocks of the framework — and keeps the RN layer a thin
  shell over logic that could move to another front end unchanged.
- **No state-management library.** With a single screen flow and one
  well-defined state object, `useState` + pure action functions give the
  same unidirectional data flow as a reducer store without the dependency.
  Actions return an `ActionResult` (`ok`, the changed board index for
  animations, Mandala-completion flag) so the UI can react without the
  core knowing about the UI.
- **Injectable randomness.** Spawning and order generation accept an
  `rng: () => number` parameter (defaulting to `Math.random`), so tests
  run fully deterministically.
- **Defensive persistence.** Saves are versioned (`version: 1`) JSON.
  Loading validates the whole shape and *sanitises* what it can (unknown
  tier numbers on the board become empty cells, invalid discoveries are
  dropped) and rejects anything structurally wrong, falling back to a
  fresh game instead of crashing on a corrupt or future save.
- **Platform-split analytics.** `@vercel/analytics` is web-only, so the
  component is split by Metro's platform extensions:
  `VercelAnalytics.web.tsx` renders the real `<Analytics />`, while the
  native `VercelAnalytics.tsx` is a no-op. The web-only package therefore
  never enters a native bundle, and native builds carry zero analytics code.
- **Energy as the pacing mechanic.** Spawning costs energy, merging
  refunds it, and it regenerates on a timer derived from a stored
  timestamp (`lastEnergyAt`), so regen is computed correctly across app
  restarts rather than depending on a live timer.

## ▶️ Run it locally

```bash
npm install   # .npmrc sets legacy-peer-deps=true, which this project needs
npx expo start
```

- Scan the QR code with **Expo Go** to play on your phone.
- Press **w** in the Expo CLI for the web preview, **a** for Android, **i** for iOS.

| Script | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` / `npm run ios` / `npm run web` | Start for one platform |
| `npm test` | Run the game-logic test suite (Vitest) |
| `npm run typecheck` | `tsc --noEmit` under strict mode |

## ✅ Testing

**42 tests, all passing**, across two files in `src/game/` — run with
`npm test` (Vitest). Typecheck: `npm run typecheck` passes with
`strict: true` and zero errors.

Coverage is deliberately aimed at the rules a reviewer would probe:

- **Merge rules** — same-tier requirement, tier+1 result, max-tier cap,
  the full 1→10 chain, and a 16-Kitten board collapsing into a single
  tier-5 cat in exactly 15 merges; illegal pairs (same cell, out of
  bounds, empty cells) are rejected and inputs are never mutated.
- **Orders** — generation only ever requests tiers 2–7, rewards follow the
  documented formula (`10 + 2 × tier coin value`, 2 stars from tier 6),
  serving removes only the first matching cat, pays out, and fails
  cleanly for unknown orders or missing cats.
- **Economy invariants** — spawn/merge energy costs and refunds, energy
  regen timing and caps, and a 300-step scripted play session asserting
  after every action that coins and energy stay in range and lifetime
  earnings never decrease.
- **Mandala** — one segment per merge, completion bonus and palette
  rotation/wrap-around.
- **Persistence** — full round-trip, rejection of corrupt/wrong-version/
  wrong-shape saves, and sanitisation of invalid tier values.

## 📱 Store readiness

**Not published.** Nothing has been submitted to any store, and
publishing requires the developer's own accounts:

- **Apple Developer Program:** $99/year — needed for the App Store.
- **Google Play Console:** $25 one-time — needed for Google Play.
- New personal Google Play accounts must run a **closed test with at
  least 12 testers for 14 days** before applying for production access.

What is already configured:

- `app.json` — bundle ID / package `com.sravanthipanga.catcafemerge` on
  both platforms, portrait orientation, app icons and splash assets.
- `eas.json` — EAS Build profiles for development (dev client, internal),
  preview (internal), and production. `submit.production` is an empty
  placeholder: no store credentials or service-account keys are
  configured yet, so `eas submit` cannot run until those accounts exist.

Once the accounts exist, the intended build path is:

```bash
npx eas-cli@latest build -p all --profile production
```

## 🔮 Future ideas

- Sound effects and gentle café background music 🎵 (not in v1)
- Drag-to-merge as an alternative to tap-tap
- Daily quests and seasonal Mandala palettes
