import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { useSettings } from '../state/settings';
import { useTokens } from '../theme/ThemeProvider';
import { Striped } from './Striped';

type Props = {
  /** AniList `coverImage.extraLarge` / `bannerImage` / `avatar.large`. */
  uri?: string | null;
  radius?: number;
  style?: ViewStyle | ViewStyle[];
  /** Stripe geometry — posters use 5/11, small thumbs 4/9, banners 7/15. */
  stripe?: [number, number];
  bordered?: boolean;
  children?: React.ReactNode;
};

/**
 * Every image slot in the app. Renders the striped placeholder underneath so a
 * missing or still-loading cover reads as the design's placeholder rather than a gap.
 */
export function Cover({ uri, radius = 11, style, stripe = [5, 11], bordered = true, children }: Props) {
  const t = useTokens();
  const { dataSaver } = useSettings();

  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          backgroundColor: t.bg3,
          borderWidth: bordered ? 1 : 0,
          borderColor: t.line,
        },
        style as ViewStyle,
      ]}
    >
      <Striped thickness={stripe[0]} period={stripe[1]} />
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={180}
          cachePolicy={dataSaver ? 'disk' : 'memory-disk'}
          recyclingKey={uri}
        />
      ) : null}
      {children}
    </View>
  );
}
