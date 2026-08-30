import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, ViewStyle } from 'react-native';

import { R } from '../theme/tokens';
import { Striped } from './Striped';

/**
 * Loading placeholders reuse the striped fill with a slow shimmer.
 * The design calls for these instead of spinners inside grids and rails.
 */
export function Shimmer({ style, radius = R.poster }: { style?: ViewStyle; radius?: number }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return (
    <Animated.View
      style={[
        { borderRadius: radius, overflow: 'hidden', opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) },
        style,
      ]}
    >
      <Striped />
    </Animated.View>
  );
}

export function PosterSkeleton({ width }: { width?: number }) {
  return (
    <View style={[{ gap: 6 }, width != null ? { width } : { flex: 1 }]}>
      <Shimmer style={{ width: '100%', aspectRatio: 2 / 3 }} />
      <Shimmer style={{ height: 12, width: '85%' }} radius={4} />
      <Shimmer style={{ height: 8, width: '55%' }} radius={4} />
    </View>
  );
}

export function RailSkeleton({ itemWidth = 112, count = 4 }: { itemWidth?: number; count?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 11, paddingHorizontal: 16 }}>
      {Array.from({ length: count }, (_, i) => (
        <PosterSkeleton key={i} width={itemWidth} />
      ))}
    </View>
  );
}

export function RowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <View style={{ gap: 0 }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Shimmer style={{ width: 44, height: 62 }} radius={7} />
          <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
            <Shimmer style={{ height: 13, width: '70%' }} radius={4} />
            <Shimmer style={{ height: 9, width: '40%' }} radius={4} />
            <Shimmer style={{ height: 3, width: '100%' }} radius={3} />
          </View>
        </View>
      ))}
    </View>
  );
}
