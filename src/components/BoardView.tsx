import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Board, BOARD_COLS } from '../game/board';
import { getTier } from '../game/tiers';

interface CellProps {
  tier: number | null;
  selected: boolean;
  popKey: number;
  onPress: () => void;
}

function CatCell({ tier, selected, popKey, onPress }: CellProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevTier = useRef<number | null>(tier);

  // Pop whenever the cat in this cell changes (spawn / merge result),
  // and give the fresh merge result an extra-big pop.
  useEffect(() => {
    if (tier !== null && tier !== prevTier.current) {
      scale.setValue(popKey > 0 ? 1.5 : 1.25);
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 90,
        useNativeDriver: true,
      }).start();
    }
    prevTier.current = tier;
  }, [tier, popKey, scale]);

  const def = tier !== null ? getTier(tier) : null;

  return (
    <View style={styles.cellOuter}>
      <Pressable
        onPress={onPress}
        style={[
          styles.cell,
          { backgroundColor: def ? def.color : '#FBF1E8' },
          selected && styles.cellSelected,
        ]}
        accessibilityLabel={def ? `${def.name}, tier ${def.tier}` : 'Empty café seat'}
      >
        <Animated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          {def ? (
            <>
              <Text style={styles.emoji}>{def.emoji}</Text>
              <Text style={styles.name} numberOfLines={1}>
                {def.name}
              </Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeText}>Lv {def.tier}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.emptyIcon}>🍽️</Text>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}

interface BoardProps {
  board: Board;
  selectedIndex: number | null;
  lastMerge: { index: number; count: number } | null;
  onTapCell: (index: number) => void;
}

/** The 5x4 café board. Tap one cat, then an identical cat, to merge. */
export default function BoardView({ board, selectedIndex, lastMerge, onTapCell }: BoardProps) {
  return (
    <View style={styles.board}>
      {board.map((tier, i) => (
        <CatCell
          key={i}
          tier={tier}
          selected={selectedIndex === i}
          popKey={lastMerge && lastMerge.index === i ? lastMerge.count : 0}
          onPress={() => onTapCell(i)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
  },
  cellOuter: {
    width: `${100 / BOARD_COLS}%`,
    aspectRatio: 1,
    padding: 3,
  },
  cell: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(163, 110, 61, 0.15)',
    padding: 2,
  },
  cellSelected: {
    borderColor: '#E8A020',
    borderWidth: 3,
    shadowColor: '#E8A020',
    shadowOpacity: 0.45,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  emoji: { fontSize: 30 },
  name: { fontSize: 8.5, fontWeight: '700', color: '#5B3A24', marginTop: 1 },
  tierBadge: {
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 0.5,
  },
  tierBadgeText: { fontSize: 8, fontWeight: '800', color: '#8C5A2B' },
  emptyIcon: { fontSize: 18, opacity: 0.35 },
});
