import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View, ViewStyle } from 'react-native';

import { Media } from '../api/types';
import { mediaMeta, pickTitle } from '../lib/format';
import { useEntry } from '../state/listCache';
import { useSettings } from '../state/settings';
import { useTokens } from '../theme/ThemeProvider';
import { R } from '../theme/tokens';
import { display, mono } from '../theme/type';
import { Cover } from './Cover';
import { Press } from './primitives';

/**
 * The shared poster card. Cover is `flex: none` at aspect 2/3 so it never shrinks;
 * the title keeps a fixed 32px min-height so meta lines share a baseline across a rail.
 */
export function PosterCard({
  media,
  width,
  badge,
  style,
}: {
  media: Media;
  /** 112 home/detail · 104 Android detail · 100 detail recs · 96 favourites, or undefined in a grid. */
  width?: number;
  badge?: string;
  style?: ViewStyle;
}) {
  const t = useTokens();
  const router = useRouter();
  const { titleLanguage } = useSettings();
  const entry = useEntry(media.id);

  const total = media.type === 'MANGA' ? media.chapters : media.episodes;
  const progress = entry?.progress && total ? Math.min(1, entry.progress / total) : 0;
  const score = media.averageScore ? String(media.averageScore) : null;

  return (
    <Press
      onPress={() => router.push(`/media/${media.id}`)}
      style={[{ gap: 6 }, width != null ? { width, flexGrow: 0, flexShrink: 0 } : { flex: 1 }, style]}
      accessibilityRole="button"
      accessibilityLabel={pickTitle(media.title, titleLanguage)}
    >
      <Cover uri={media.coverImage?.extraLarge ?? media.coverImage?.large} radius={R.poster} style={{ width: '100%', aspectRatio: 2 / 3 }}>
        {score ? (
          <View style={{ position: 'absolute', top: 7, right: 7, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.55)' }}>
            <Text style={mono(9.5, 600, { ls: 0.02, color: '#fff' })}>{score}</Text>
          </View>
        ) : null}
        {badge ? (
          <View style={{ position: 'absolute', top: 7, left: 7, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: t.acc }}>
            <Text style={mono(8.5, 600, { ls: 0.06, upper: true, color: t.onAcc })}>{badge}</Text>
          </View>
        ) : null}
        {progress > 0 ? (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <View style={{ height: '100%', width: `${progress * 100}%`, backgroundColor: t.acc }} />
          </View>
        ) : null}
      </Cover>
      <Text numberOfLines={2} style={[display(12.5, 600, { lh: 1.3, ls: -0.005, color: t.fg }), { minHeight: 32 }]}>
        {pickTitle(media.title, titleLanguage)}
      </Text>
      <Text numberOfLines={1} style={mono(9.5, 500, { ls: 0.05, upper: true, color: t.fg2 })}>
        {mediaMeta(media)}
      </Text>
    </Press>
  );
}

/** Badge rule from the design: "New" for this season's premieres, "Airing" while episodes are due. */
export function badgeFor(media: Media, season: { season: string; year: number }): string | undefined {
  if (media.season === season.season && media.seasonYear === season.year && (media.nextAiringEpisode?.episode ?? 99) <= 3) {
    return 'New';
  }
  if (media.nextAiringEpisode) return 'Airing';
  return undefined;
}

/** Horizontal rail: gap 11, items top-aligned, 16px end padding. */
export function PosterRail({
  data,
  itemWidth = 112,
  badges,
}: {
  data: Media[];
  itemWidth?: number;
  badges?: (m: Media) => string | undefined;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 11, paddingHorizontal: 16, alignItems: 'flex-start' }}
    >
      {data.map((m) => (
        <PosterCard key={m.id} media={m} width={itemWidth} badge={badges?.(m)} />
      ))}
    </ScrollView>
  );
}
