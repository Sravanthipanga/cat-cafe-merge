import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CAT_TIERS } from '../game/tiers';

interface Props {
  discovered: number[];
}

/** Album of all 10 cat tiers — discovered in colour, the rest hidden. */
export default function CollectionTab({ discovered }: Props) {
  return (
    <View>
      <Text style={styles.heading}>📖 Cat Collection</Text>
      <Text style={styles.sub}>
        {discovered.length} of {CAT_TIERS.length} cats discovered. Merge on to find them all!
      </Text>
      <View style={styles.grid}>
        {CAT_TIERS.map((tier) => {
          const found = discovered.includes(tier.tier);
          return (
            <View
              key={tier.tier}
              style={[styles.card, { backgroundColor: found ? tier.color : '#EFE7DE' }]}
            >
              <Text style={styles.emoji}>{found ? tier.emoji : '❓'}</Text>
              <Text style={styles.name}>{found ? tier.name : '???'}</Text>
              <Text style={styles.tierLabel}>Tier {tier.tier}</Text>
              <Text style={styles.desc}>
                {found ? tier.description : 'Not discovered yet — keep merging!'}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', color: '#4A3226' },
  sub: { fontSize: 13.5, color: '#A9805D', marginTop: 4, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    width: '47.5%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(163, 110, 61, 0.18)',
  },
  emoji: { fontSize: 34 },
  name: { fontSize: 15, fontWeight: '800', color: '#4A3226', marginTop: 4 },
  tierLabel: { fontSize: 11, fontWeight: '700', color: '#A9805D' },
  desc: { fontSize: 12, color: '#6B4A30', marginTop: 4, lineHeight: 16 },
});
