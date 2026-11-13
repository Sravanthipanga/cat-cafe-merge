import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AboutTab from './src/components/AboutTab';
import BoardView from './src/components/BoardView';
import CollectionTab from './src/components/CollectionTab';
import MandalaView from './src/components/MandalaView';
import OrdersBar from './src/components/OrdersBar';
import { MAX_ENERGY } from './src/game/state';
import { useGame } from './src/hooks/useGame';

type Tab = 'play' | 'collection' | 'about';

function ResourceChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>
        {label} <Text style={styles.chipValue}>{value}</Text>
      </Text>
    </View>
  );
}

export default function App() {
  const game = useGame();
  const [tab, setTab] = useState<Tab>('play');
  const { state } = game;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>🐱 Cat Café Merge ☕</Text>
        {state && (
          <View style={styles.chips}>
            <ResourceChip label="🪙" value={String(state.coins)} />
            <ResourceChip label="⭐" value={String(state.stars)} />
            <ResourceChip label="⚡" value={`${state.energy}/${MAX_ENERGY}`} />
          </View>
        )}
      </View>

      {!game.loaded || !state ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#B5651D" />
          <Text style={styles.loadingText}>Opening the café…</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            {tab === 'play' && (
              <View style={styles.playWrap}>
                <View style={styles.mandalaCard}>
                  <MandalaView mandala={state.mandala} />
                </View>

                {game.message && (
                  <View style={styles.messageBanner}>
                    <Text style={styles.messageText}>{game.message}</Text>
                  </View>
                )}

                <Text style={styles.sectionLabel}>🧾 Customer orders</Text>
                <OrdersBar orders={state.orders} board={state.board} onServe={game.serve} />

                <Text style={styles.sectionLabel}>🏠 The café board</Text>
                <BoardView
                  board={state.board}
                  selectedIndex={game.selectedIndex}
                  lastMerge={game.lastMerge}
                  onTapCell={game.tapCell}
                />
                <Text style={styles.boardHint}>
                  {game.selectedIndex !== null
                    ? 'Now tap another cat of the same tier to merge! ✨'
                    : 'Tap a cat to select it, then tap its twin to merge.'}
                </Text>

                <Pressable
                  onPress={game.spawn}
                  disabled={state.energy < 1 || state.board.every((c) => c !== null)}
                  style={({ pressed }) => [
                    styles.spawnButton,
                    (state.energy < 1 || state.board.every((c) => c !== null)) &&
                      styles.spawnButtonDisabled,
                    pressed && styles.spawnButtonPressed,
                  ]}
                  accessibilityLabel="Welcome a new kitten to the café"
                >
                  <Text style={styles.spawnButtonText}>🐾 New Kitten · 1 ⚡</Text>
                </Pressable>
              </View>
            )}

            {tab === 'collection' && <CollectionTab discovered={state.discovered} />}
            {tab === 'about' && <AboutTab state={state} onReset={game.reset} />}
          </ScrollView>

          <View style={styles.tabBar}>
            <TabButton emoji="🎮" label="Play" active={tab === 'play'} onPress={() => setTab('play')} />
            <TabButton
              emoji="📖"
              label="Cats"
              active={tab === 'collection'}
              onPress={() => setTab('collection')}
            />
            <TabButton emoji="☕" label="About" active={tab === 'about'} onPress={() => setTab('about')} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

function TabButton({
  emoji,
  label,
  active,
  onPress,
}: {
  emoji: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
      accessibilityLabel={`${label} tab`}
    >
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF7ED' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '900', color: '#6B3F1D' },
  chips: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F0DCC8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipText: { fontSize: 14 },
  chipValue: { fontWeight: '800', color: '#4A3226' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: '#A9805D', fontSize: 15 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 20,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  playWrap: { alignItems: 'stretch' },
  mandalaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#F0DCC8',
    paddingVertical: 12,
    alignItems: 'center',
  },
  messageBanner: {
    marginTop: 10,
    backgroundColor: '#FFE9A8',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'center',
  },
  messageText: { fontSize: 13, fontWeight: '700', color: '#7A5200', textAlign: 'center' },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#6B4226',
    marginTop: 16,
    marginBottom: 8,
  },
  boardHint: { textAlign: 'center', fontSize: 12.5, color: '#A9805D', marginTop: 8 },
  spawnButton: {
    marginTop: 12,
    backgroundColor: '#B5651D',
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#B5651D',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  spawnButtonDisabled: { backgroundColor: '#D8C3A5', shadowOpacity: 0, elevation: 0 },
  spawnButtonPressed: { opacity: 0.85 },
  spawnButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1.5,
    borderTopColor: '#F0DCC8',
    backgroundColor: '#FFFBF5',
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 14,
  },
  tabButtonActive: { backgroundColor: '#FBE3C5' },
  tabEmoji: { fontSize: 20 },
  tabLabel: { fontSize: 12, fontWeight: '700', color: '#A9805D' },
  tabLabelActive: { color: '#6B3F1D' },
});
