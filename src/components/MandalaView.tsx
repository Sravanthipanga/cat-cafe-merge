import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import {
  getPalette,
  MANDALA_SEGMENTS,
  MandalaState,
  segmentColor,
} from '../game/mandala';

interface Props {
  mandala: MandalaState;
  size?: number;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, rOuter: number, rInner: number, start: number, end: number) {
  const o1 = polar(cx, cy, rOuter, start);
  const o2 = polar(cx, cy, rOuter, end);
  const i2 = polar(cx, cy, rInner, end);
  const i1 = polar(cx, cy, rInner, start);
  const large = end - start > 180 ? 1 : 0;
  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

/** The 24-segment Merge Mandala, drawn with react-native-svg. */
export default function MandalaView({ mandala, size = 168 }: Props) {
  const palette = getPalette(mandala.paletteIndex);
  const paths = useMemo(() => {
    const c = size / 2;
    const rOuter = size / 2 - 4;
    const rInner = rOuter * 0.58;
    const step = 360 / MANDALA_SEGMENTS;
    return Array.from({ length: MANDALA_SEGMENTS }, (_, i) =>
      wedgePath(c, c, rOuter, rInner, i * step + 0.8, (i + 1) * step - 0.8),
    );
  }, [size]);

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          {paths.map((d, i) => (
            <Path
              key={i}
              d={d}
              fill={i < mandala.lit ? segmentColor(mandala, i) : '#F3E6DA'}
              stroke="#FFF7ED"
              strokeWidth={1}
            />
          ))}
          <Circle cx={size / 2} cy={size / 2} r={(size / 2 - 4) * 0.5} fill="#FFF3E0" stroke="#E8C39E" strokeWidth={2} />
        </Svg>
        <View style={styles.centerEmoji} pointerEvents="none">
          <Text style={styles.centerEmojiText}>🐱</Text>
        </View>
      </View>
      <Text style={styles.caption}>
        🌸 {palette.name} Mandala — {mandala.lit}/{MANDALA_SEGMENTS} petals
      </Text>
      <Text style={styles.hint}>Complete it for +250 🪙 +1 ⭐</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  centerEmoji: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerEmojiText: { fontSize: 40 },
  caption: { marginTop: 6, fontSize: 14, fontWeight: '700', color: '#6B4226' },
  hint: { fontSize: 12, color: '#A9805D' },
});
