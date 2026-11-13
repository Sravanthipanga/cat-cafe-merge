import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Board, findCatIndex } from '../game/board';
import { Order } from '../game/orders';
import { getTier } from '../game/tiers';

const CUSTOMER_EMOJIS = ['🧑‍🍳', '🐰', '🦊', '🐼', '👵', '🧕', '👦', '🐸', '🦉'];

interface Props {
  orders: (Order | null)[];
  board: Board;
  onServe: (orderId: number) => void;
}

/** The three café customer orders shown above the board. */
export default function OrdersBar({ orders, board, onServe }: Props) {
  return (
    <View style={styles.row}>
      {orders.map((order, i) => {
        if (order === null) {
          return (
            <View key={`empty-${i}`} style={[styles.card, styles.cardEmpty]}>
              <Text style={styles.customerEmoji}>☕</Text>
              <Text style={styles.emptyText}>New customer arriving…</Text>
            </View>
          );
        }
        const def = getTier(order.tier);
        const canServe = findCatIndex(board, order.tier) !== -1;
        const customer = CUSTOMER_EMOJIS[order.id % CUSTOMER_EMOJIS.length];
        return (
          <View key={order.id} style={styles.card}>
            <Text style={styles.customerEmoji}>{customer}</Text>
            <Text style={styles.wants} numberOfLines={2}>
              wants {def.emoji} {def.name}
            </Text>
            <Text style={styles.reward}>
              +{order.coinsReward} 🪙 · +{order.starsReward} ⭐
            </Text>
            <Pressable
              onPress={() => onServe(order.id)}
              disabled={!canServe}
              style={[styles.serveButton, !canServe && styles.serveButtonDisabled]}
              accessibilityLabel={`Serve ${def.name} order`}
            >
              <Text style={styles.serveButtonText}>{canServe ? 'Serve 🍰' : 'Need cat'}</Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, width: '100%', maxWidth: 430, alignSelf: 'center' },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F0DCC8',
    padding: 8,
    alignItems: 'center',
  },
  cardEmpty: { justifyContent: 'center', borderStyle: 'dashed', backgroundColor: '#FFFDF9' },
  customerEmoji: { fontSize: 22 },
  wants: { fontSize: 11.5, fontWeight: '700', color: '#4A3226', textAlign: 'center', marginTop: 2 },
  reward: { fontSize: 10.5, color: '#A9805D', marginTop: 2 },
  emptyText: { fontSize: 11, color: '#B99B78', textAlign: 'center', marginTop: 4 },
  serveButton: {
    marginTop: 6,
    backgroundColor: '#E8873A',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  serveButtonDisabled: { backgroundColor: '#E5D5C3' },
  serveButtonText: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '800' },
});
