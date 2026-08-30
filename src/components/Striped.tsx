import React, { useId } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { useTokens } from '../theme/ThemeProvider';

/**
 * The design's placeholder fill:
 * `bg3 + repeating-linear-gradient(45deg, stripe 0 5px, transparent 5px 11px)`.
 * Drawn as a 45°-rotated SVG pattern so it tiles at any size.
 */
export function Striped({
  thickness = 5,
  period = 11,
  style,
}: {
  thickness?: number;
  period?: number;
  style?: ViewStyle;
}) {
  const t = useTokens();
  // Pattern ids share one namespace per rendering surface, so each instance gets its own.
  // React's ids carry colons, which are not valid inside a `url(#...)` reference.
  const id = `stripe${useId().replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: t.bg3 }, style]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern
            id={id}
            width={period}
            height={period}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <Rect x="0" y="0" width={thickness} height={period} fill={t.stripe} />
          </Pattern>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
