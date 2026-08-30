import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSeasonal } from '../src/api/hooks';
import { Media } from '../src/api/types';
import { Cover } from '../src/components/Cover';
import { RowSkeleton } from '../src/components/Skeleton';
import { EmptyState, Press } from '../src/components/primitives';
import { compact, countdown, currentSeason, pickTitle, seasonName, stepSeason } from '../src/lib/format';
import { useCountdown } from '../src/lib/useCountdown';
import { useSettings } from '../src/state/settings';
import { useTokens } from '../src/theme/ThemeProvider';
import { display, mono, sans } from '../src/theme/type';

const FORMATS = [
  { label: 'TV', value: ['TV'] },
  { label: 'LEFTOVERS', value: ['TV'] },
  { label: 'ONA', value: ['ONA'] },
  { label: 'MOVIE', value: ['MOVIE'] },
] as const;

/** Screen 6 — seasonal browse, stepped one season at a time. */
export default function SeasonalScreen() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [season, setSeason] = useState(currentSeason());
  const [format, setFormat] = useState<string>('TV');

  const active = FORMATS.find((f) => f.label === format);
  const { media, isLoading, hasNextPage, fetchNextPage } = useSeasonal(season, active ? [...active.value] : null);

  // "Leftovers" are continuing shows that started in an earlier season.
  const rows =
    format === 'LEFTOVERS'
      ? media.filter((m) => m.seasonYear !== season.year || m.season !== season.season)
      : media.filter((m) => m.season === season.season && m.seasonYear === season.year);

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={rows}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 11, paddingHorizontal: 16 }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.6}
        ListHeaderComponent={
          <View
            style={{
              marginHorizontal: -16,
              paddingTop: insets.top + 8,
              paddingHorizontal: 16,
              paddingBottom: 12,
              gap: 14,
              borderBottomWidth: 1,
              borderColor: t.line,
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Press onPress={() => setSeason((s) => stepSeason(s, -1))} hitSlop={12} accessibilityLabel="Previous season">
                <Text style={sans(18, 500, { color: t.fg3 })}>‹</Text>
              </Press>
              <View style={{ alignItems: 'center', gap: 4 }}>
                <Text style={mono(9.5, 500, { ls: 0.14, upper: true, color: t.acc })}>Season</Text>
                <Text style={display(22, 700, { ls: -0.025, color: t.fg })}>{seasonName(season)}</Text>
              </View>
              <Press onPress={() => setSeason((s) => stepSeason(s, 1))} hitSlop={12} accessibilityLabel="Next season">
                <Text style={sans(18, 500, { color: t.fg3 })}>›</Text>
              </Press>
            </View>

            <View style={{ flexDirection: 'row', gap: 7, justifyContent: 'center' }}>
              {FORMATS.map((f) => {
                const on = f.label === format;
                return (
                  <Press
                    key={f.label}
                    onPress={() => setFormat(f.label)}
                    style={{
                      paddingHorizontal: 11,
                      paddingVertical: 6,
                      borderRadius: 8,
                      backgroundColor: on ? t.fg : t.bg2,
                      borderWidth: on ? 0 : 1,
                      borderColor: t.line,
                    }}
                  >
                    <Text style={mono(10.5, 600, { color: on ? t.bg : t.fg2 })}>{f.label}</Text>
                  </Press>
                );
              })}
            </View>

            <Press onPress={() => router.back()} hitSlop={8} style={{ alignSelf: 'center' }}>
              <Text style={mono(10, 600, { ls: 0.06, upper: true, color: t.acc })}>Back to discover</Text>
            </Press>
          </View>
        }
        renderItem={({ item }) => <SeasonalCard media={item} />}
        ListEmptyComponent={
          isLoading ? <RowSkeleton count={5} /> : <EmptyState title="Nothing scheduled" body="No titles in this season match that format." />
        }
      />
    </View>
  );
}

function SeasonalCard({ media }: { media: Media }) {
  const t = useTokens();
  const router = useRouter();
  const { titleLanguage } = useSettings();
  const remaining = useCountdown(media.nextAiringEpisode?.timeUntilAiring);
  const studio = media.studios?.edges.find((e) => e.isMain)?.node.name;

  return (
    <Press
      onPress={() => router.push(`/media/${media.id}`)}
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 11,
        borderRadius: 14,
        backgroundColor: t.bg2,
        borderWidth: 1,
        borderColor: t.line,
      }}
    >
      <Cover uri={media.coverImage?.large} radius={8} stripe={[4, 9]} style={{ width: 58, height: 82 }} />
      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <Text numberOfLines={2} style={display(14, 600, { lh: 1.2, ls: -0.01, color: t.fg })}>
          {pickTitle(media.title, titleLanguage)}
        </Text>
        {studio ? (
          <Text numberOfLines={1} style={mono(9.5, 500, { ls: 0.05, upper: true, color: t.fg2 })}>
            {studio}
          </Text>
        ) : null}
        <Text numberOfLines={1} style={sans(11, 400, { lh: 1.35, color: t.fg3 })}>
          {(media.genres ?? []).slice(0, 3).join(' · ')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 2 }}>
          {media.nextAiringEpisode ? (
            <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: t.acc }}>
              <Text style={mono(9.5, 600, { color: t.onAcc })}>
                EP {media.nextAiringEpisode.episode} IN {countdown(remaining)}
              </Text>
            </View>
          ) : null}
          <Text style={mono(9.5, 500, { color: t.fg2 })}>{compact(media.popularity)} PLANNING</Text>
        </View>
      </View>
    </Press>
  );
}
