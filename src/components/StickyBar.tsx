import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

/**
 * `bar` + backdrop-filter: blur(18px) + a hairline on the leading edge.
 * Android gets the same treatment through the Dimezis blur view; where the
 * platform cannot blur, the translucent `bar` token still reads correctly.
 */
export function StickyBar({
  children,
  edge = 'bottom',
  style,
}: {
  children: React.ReactNode;
  /** Which edge carries the hairline: a bottom bar rules its top, a header its bottom. */
  edge?: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
}) {
  const { theme, tokens: t } = useTheme();

  return (
    <BlurView
      intensity={40}
      tint={theme.dark ? 'dark' : 'light'}
      experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      style={[
        styles.bar,
        {
          backgroundColor: t.bar,
          borderTopWidth: edge === 'top' ? StyleSheet.hairlineWidth * 2 : 0,
          borderBottomWidth: edge === 'bottom' ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor: t.line,
        },
        style,
      ]}
    >
      <View>{children}</View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  bar: { overflow: 'hidden' },
});
