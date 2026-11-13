# 🐱 Cat Café Merge ☕

A cozy merge game for iOS, Android, and the web — built with **Expo / React Native + TypeScript** from a single codebase.

Welcome kittens to your café, merge two cats of the same tier into a rarer cat, serve customer orders, and light up the Merge Mandala — all the way to the **Legendary Golden Neko** 🌟.

Live preview: https://cat-cafe-merge.vercel.app/

## 🎮 How to play

- Tap **“New Kitten”** to welcome a Kitten to the café board (costs 1 ⚡ energy).
- **Tap a cat, then tap another cat of the same tier** to merge them into the next tier.
- Every merge earns **coins**, refunds **1 ⚡**, and lights the next petal of the **Mandala**.
- **Serve customer orders** — customers ask for Tier 2–7 cats — to earn coins and ⭐ stars. Served orders are replaced by a new customer after a few seconds.
- Complete all **24 Mandala petals** for **+250 🪙 and +1 ⭐**, then a fresh Mandala begins in a brand-new colour palette.
- Energy refills by 1 every 30 seconds, up to 20.
- There are **10 cat tiers** to discover: Kitten → Mochi → Biscuit → Latte → Captain Whiskers → Ninja Neko → Wizard Whiskers → Disco Diva → Royal Rajah → Legendary Golden Neko.
- Your progress (board, coins, stars, orders, Mandala, collection, stats) is saved automatically on the device.

## 🛠️ Run it locally

```bash
npm install
npx expo start
```

- Press **w** in the Expo CLI to open the web preview, **a** for Android, **i** for iOS.
- Scan the QR code with **Expo Go** to play on your phone.

Other commands:

```bash
npm test          # run the game-logic test suite (Vitest)
npm run typecheck # TypeScript check
npx expo export --platform web   # produce the static web build in dist/
```

## 📁 Project structure

- `App.tsx` — screens and tab navigation (Play / Cats / About)
- `src/game/` — pure TypeScript game logic (no React imports): `tiers.ts`, `board.ts`, `orders.ts`, `mandala.ts`, `state.ts`, plus tests
- `src/components/` — `BoardView`, `OrdersBar`, `MandalaView`, `CollectionTab`, `AboutTab`
- `src/hooks/useGame.ts` — game state, AsyncStorage persistence, energy ticking

## 📱 Publishing to the stores

**The game is free to download.** Nothing has been submitted to any store yet.

Publishing needs the developer's own accounts:

- **Apple Developer Program:** $99 per membership year (renews annually) — needed to publish on the App Store.
- **Google Play Console:** a one-time $25 registration fee — needed to publish on Google Play.
- **First year on both stores: $124**, then $99/year after that.
- New personal Google Play accounts must run a **closed test with at least 12 testers for 14 days** before they can apply for production access.

Once those accounts exist, the build path is **EAS Build**:

```bash
npx eas-cli@latest build -p all --profile production
```

The bundle IDs are already configured in `app.json` (`com.sravanthipanga.catcafemerge` on both platforms), and the build profiles live in `eas.json` (development / preview / production).

## 🔮 Future ideas

- Sound effects and gentle café background music 🎵 (not in v1)
- Drag-to-merge as an alternative to tap-tap
- Daily quests and seasonal Mandala palettes
