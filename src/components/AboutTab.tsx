import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GameState } from '../game/state';
import { CAT_TIERS } from '../game/tiers';

interface Props {
  state: GameState;
  onReset: () => void;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

/** Stats, how-to-play, publishing facts, and the reset button. */
export default function AboutTab({ state, onReset }: Props) {
  const [confirming, setConfirming] = useState(false);
  const highest = state.highestTier > 0 ? CAT_TIERS[state.highestTier - 1] : null;

  return (
    <View>
      <Text style={styles.heading}>☕ About Cat Café Merge</Text>

      <Text style={styles.sectionTitle}>📊 Your café stats</Text>
      <View style={styles.card}>
        <StatRow label="🪙 Coins" value={String(state.coins)} />
        <StatRow label="⭐ Stars" value={String(state.stars)} />
        <StatRow label="🔀 Total merges" value={String(state.totalMerges)} />
        <StatRow label="🍰 Orders served" value={String(state.totalServed)} />
        <StatRow label="🌸 Mandalas completed" value={String(state.mandalasCompleted)} />
        <StatRow
          label="🏆 Highest cat"
          value={highest ? `${highest.emoji} ${highest.name} (Tier ${highest.tier})` : 'None yet'}
        />
        <StatRow label="💰 Lifetime coins earned" value={String(state.totalCoinsEarned)} />
      </View>

      <Text style={styles.sectionTitle}>🎮 How to play</Text>
      <View style={styles.card}>
        <Text style={styles.body}>
          • Tap <Text style={styles.bold}>“New Kitten”</Text> to welcome a Kitten to the café (costs 1 ⚡).{'\n'}
          • Tap a cat, then tap another cat of the <Text style={styles.bold}>same tier</Text>, to merge them into the next tier.{'\n'}
          • Every merge earns coins, refunds 1 ⚡, and lights a petal of the Mandala.{'\n'}
          • Serve customer orders (they ask for Tier 2–7 cats) to earn coins and stars.{'\n'}
          • Complete all 24 Mandala petals for +250 🪙 and +1 ⭐ — then a new Mandala begins!{'\n'}
          • Energy refills by 1 every 30 seconds, up to 20.{'\n'}
          • There are 10 cat tiers to discover, all the way to the Legendary Golden Neko 🌟.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>📱 Publishing</Text>
      <View style={styles.card}>
        <Text style={styles.body}>
          Cat Café Merge is free to download. Publishing it to the stores needs the
          developer&apos;s own accounts: the Apple Developer Program is $99 per membership
          year, and a Google Play Console account is a one-time $25 registration — $124
          for the first year on both stores, then $99/year. Nothing has been submitted
          to any store yet. (Sound effects are planned as a future update! 🎵)
        </Text>
      </View>

      <Text style={styles.sectionTitle}>⚙️ Settings</Text>
      {confirming ? (
        <View style={styles.confirmRow}>
          <Pressable
            style={[styles.button, styles.buttonDanger]}
            onPress={() => {
              setConfirming(false);
              onReset();
            }}
          >
            <Text style={styles.buttonText}>Yes, start over 🗑️</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.buttonCancel]} onPress={() => setConfirming(false)}>
            <Text style={styles.buttonCancelText}>Keep my café</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={[styles.button, styles.buttonDanger]} onPress={() => setConfirming(true)}>
          <Text style={styles.buttonText}>Reset all progress</Text>
        </Pressable>
      )}
      <Text style={styles.version}>Cat Café Merge v1.0.0 · Made with 🐱 and ☕</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', color: '#4A3226' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#6B4226', marginTop: 18, marginBottom: 8 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F0DCC8',
    padding: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0E2D0',
  },
  statLabel: { fontSize: 14, color: '#6B4A30' },
  statValue: { fontSize: 14, fontWeight: '800', color: '#4A3226' },
  body: { fontSize: 13.5, color: '#6B4A30', lineHeight: 20 },
  bold: { fontWeight: '800', color: '#4A3226' },
  confirmRow: { flexDirection: 'row', gap: 10 },
  button: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11 },
  buttonDanger: { backgroundColor: '#D64545' },
  buttonCancel: { backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E0CDB4' },
  buttonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  buttonCancelText: { color: '#6B4A30', fontWeight: '800', fontSize: 14 },
  version: { marginTop: 18, textAlign: 'center', fontSize: 12, color: '#B99B78' },
});
