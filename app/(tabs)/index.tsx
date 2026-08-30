import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import React, { useState } from 'react';
import { Platform, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDiscover } from '../../src/api/hooks';
import { Media } from '../../src/api/types';
import { ContinueRail } from '../../src/components/ContinueRail';
import { Cover } from '../../src/components/Cover';
import { BellIcon, MagnifierIcon } from '../../src/components/Icons';
import { PosterCard, PosterRail, badgeFor } from '../../src/components/PosterCard';
import { ProgressSheet } from '../../src/components/ProgressSheet';
import { RailSkeleton } from '../../src/components/Skeleton';
import { Press, Pill, SectionHead, SectionLabel } from '../../src/components/primitives';
import { compact, currentSeason, pickTitle, seasonName } from '../../src/lib/format';
import { useContinueWatching } from '../../src/lib/useContinueWatching';
import { useAuth } from '../../src/state/auth';
import { useListCache } from '../../src/state/listCache';
import { useSettings } from '../../src/state/settings';
import { useTokens } from '../../src/theme/ThemeProvider';
import { R } from '../../src/theme/tokens';
import { display, mono, sans } from '../../src/theme/type';

/**
 * Discover. iOS runs direction 1a (editorial: one spotlight, curated rails);
 * Android runs the Material 3 poster wall with a pill search field and a Track FAB.
 */
export default function DiscoverScreen() {
  const season = currentSeason();
  const { data, isLoading, refetch, isRefetching } = useDiscover(season);
  const { media: continueMedia } = useContinueWatching();
  const { guest } = useAuth();
  const [sheetMedia, setSheetMedia] = useState<Media | null>(null);

  const shared = {
    season,
    data,
    isLoading,
    refetch,
    isRefetching,
    continueMedia: guest ? [] : continueMedia,
    onLongPressMedia: guest ? undefined : setSheetMedia,
  };

  return (
    <>
      {Platform.OS === 'android' ? <DiscoverAndroid {...shared} /> : <DiscoverEditorial {...shared} />}
      <ProgressSheet media={sheetMedia} visible={!!sheetMedia} onClose={() => setSheetMedia(null)} />
    </>
  );
}

type ViewProps = {
  season: ReturnType<typeof currentSeason>;
  data: ReturnType<typeof useDiscover>['data'];
  isLoading: boolean;
  refetch: () => void;
  isRefetching: boolean;
  continueMedia: Media[];
  onLongPressMedia?: (m: Media) => void;
};

function DiscoverEditorial({ season, data, isLoading, refetch, isRefetching, continueMedia, onLongPressMedia }: ViewProps) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { titleLanguage } = useSettings();
  const { viewer, guest } = useAuth();

  const trending = data?.trending.media ?? [];
  const spotlight = trending[0];
  const recs = data?.topRated.media ?? [];

  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: tabBarHeight + 18 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.fg2} />}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 14,
        }}
      >
        <View style={{ gap: 5 }}>
          <Text style={mono(9.5, 500, { ls: 0.14, upper: true, color: t.acc })}>{today.replace(',', ' ·')}</Text>
          <Text style={display(27, 700, { ls: -0.025, color: t.fg })}>Discover</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          <Press
            onPress={() => router.push('/notifications')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              backgroundColor: t.bg2,
              borderWidth: 1,
              borderColor: t.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="Notifications"
          >
            <BellIcon color={t.fg2} dot={viewer?.unreadNotificationCount ? t.acc2 : undefined} />
          </Press>
          <Press onPress={() => router.push('/profile')} accessibilityLabel="Profile">
            <Cover
              uri={viewer?.avatar?.large}
              radius={R.pill}
              stripe={[4, 9]}
              style={{ width: 32, height: 32 }}
            />
          </Press>
        </View>
      </View>

      {spotlight ? (
        <View style={{ paddingHorizontal: 16 }}>
          <Press onPress={() => router.push(`/media/${spotlight.id}`)}>
            <Cover
              uri={spotlight.coverImage?.extraLarge}
              radius={18}
              stripe={[6, 13]}
              style={{ width: '100%', aspectRatio: 4 / 5, justifyContent: 'flex-end' }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.82)']}
                locations={[0.25, 0.55, 1]}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <View
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: t.acc,
                }}
              >
                <Text style={mono(9, 600, { ls: 0.1, upper: true, color: t.onAcc })}>Spotlight</Text>
              </View>

              <View style={{ gap: 11, padding: 16 }}>
                <Text style={[display(25, 700, { lh: 1.05, ls: -0.03, color: '#fff' }), { maxWidth: '88%' }]}>
                  {pickTitle(spotlight.title, titleLanguage)}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    spotlight.averageScore ? `${spotlight.averageScore}% · ${compact(spotlight.popularity)}` : null,
                    ...(spotlight.genres ?? []).slice(0, 2),
                  ]
                    .filter((x): x is string => !!x)
                    .map((label) => (
                      <View
                        key={label}
                        style={{
                          paddingHorizontal: 9,
                          paddingVertical: 4,
                          borderRadius: R.pill,
                          backgroundColor: 'rgba(255,255,255,0.16)',
                        }}
                      >
                        <Text style={mono(10, 500, { color: '#fff' })}>{label}</Text>
                      </View>
                    ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 9 }}>
                  {/* Guests keep the hero's second action; only the tracking half is hidden. */}
                  {!guest ? <AddToListButton media={spotlight} onOpen={() => onLongPressMedia?.(spotlight)} /> : null}
                  <Press
                    onPress={() => router.push(`/media/${spotlight.id}`)}
                    style={{
                      width: guest ? undefined : 96,
                      flex: guest ? 1 : undefined,
                      height: 40,
                      borderRadius: 11,
                      backgroundColor: 'rgba(255,255,255,0.18)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={sans(13, 600, { color: '#fff' })}>Details</Text>
                  </Press>
                </View>
              </View>
            </Cover>
          </Press>
        </View>
      ) : null}

      {continueMedia.length ? (
        <View style={{ gap: 9, paddingTop: 22 }}>
          <SectionLabel style={{ paddingHorizontal: 16 }}>Continue watching</SectionLabel>
          <ContinueRail media={continueMedia} onLongPress={onLongPressMedia} />
        </View>
      ) : null}

      <View style={{ gap: 12, paddingTop: 22 }}>
        <SectionHead title="Trending now" action="See all" onAction={() => router.push('/search')} />
        {isLoading ? <RailSkeleton /> : <PosterRail data={trending} itemWidth={112} badges={(m) => badgeFor(m, season)} />}
      </View>

      <View style={{ gap: 12, paddingTop: 22 }}>
        <View style={{ gap: 3, paddingHorizontal: 16 }}>
          <SectionLabel>Highest rated</SectionLabel>
          <Text style={display(16, 700, { ls: -0.015, color: t.fg })}>Worth your next slot</Text>
        </View>
        {isLoading ? <RailSkeleton /> : <PosterRail data={recs} itemWidth={112} />}
      </View>

      <View style={{ gap: 12, paddingTop: 22 }}>
        <SectionHead title={seasonName(season)} action="Seasonal" onAction={() => router.push('/seasonal')} />
        {isLoading ? (
          <RailSkeleton />
        ) : (
          <PosterRail data={data?.seasonal.media ?? []} itemWidth={112} badges={(m) => badgeFor(m, season)} />
        )}
      </View>
    </ScrollView>
  );
}

function AddToListButton({ media, onOpen }: { media: Media; onOpen: () => void }) {
  const t = useTokens();
  const { entries, save } = useListCache();
  const tracked = !!entries[media.id];

  return (
    <Press
      onPress={() => (tracked ? onOpen() : save(media.id, { status: 'PLANNING', progress: 0 }))}
      style={{
        flex: 1,
        height: 40,
        borderRadius: 11,
        backgroundColor: t.acc,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 7,
      }}
    >
      {!tracked ? <Text style={sans(16, 400, { color: t.onAcc })}>+</Text> : null}
      <Text style={sans(13, 600, { color: t.onAcc })}>{tracked ? 'Edit entry' : 'Add to list'}</Text>
    </Press>
  );
}

const ANDROID_FILTERS = ['Anime', 'Manga', 'This season', 'Top 100'] as const;

function DiscoverAndroid({ season, data, isLoading, refetch, isRefetching, continueMedia, onLongPressMedia }: ViewProps) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { viewer } = useAuth();
  const { posterColumns } = useSettings();
  const [filter, setFilter] = useState<(typeof ANDROID_FILTERS)[number]>('Anime');

  // Grid gutters are 11px, so each column takes an equal share of what is left.
  const columnWidth = `${(100 - (posterColumns - 1) * 3.5) / posterColumns}%` as const;

  const wall =
    filter === 'This season'
      ? data?.seasonal.media ?? []
      : filter === 'Top 100'
        ? data?.topRated.media ?? []
        : data?.trending.media ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: tabBarHeight + 18 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.fg2} />}
      >
        <View style={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 12, gap: 13 }}>
          <Press
            onPress={() => router.push('/search')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 11,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: R.pill,
              backgroundColor: t.bg2,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <MagnifierIcon color={t.fg2} />
            <Text style={[sans(13, 400, { color: t.fg3 }), { flex: 1 }]}>Search anime, manga, people</Text>
            <Cover uri={viewer?.avatar?.large} radius={R.pill} stripe={[4, 9]} bordered={false} style={{ width: 24, height: 24 }} />
          </Press>

          <Text style={[display(26, 700, { ls: -0.025, color: t.fg }), { paddingTop: 4 }]}>
            {filter === 'This season' ? seasonName(season) : filter === 'Top 100' ? 'Top rated' : 'Trending'}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
            {ANDROID_FILTERS.map((f) => (
              <Pill key={f} label={f} active={filter === f} onPress={() => setFilter(f)} radius={10} />
            ))}
          </ScrollView>
        </View>

        {continueMedia.length ? (
          <View style={{ gap: 9, paddingBottom: 8 }}>
            <SectionLabel style={{ paddingHorizontal: 16 }}>Continue watching</SectionLabel>
            <ContinueRail media={continueMedia} onLongPress={onLongPressMedia} />
          </View>
        ) : null}

        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            columnGap: 11,
            rowGap: 14,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 18,
          }}
        >
          {isLoading
            ? null
            : wall.map((m) => (
                <View key={m.id} style={{ width: columnWidth }}>
                  <PosterCard media={m} badge={badgeFor(m, season)} />
                </View>
              ))}
        </View>
      </ScrollView>

      <Press
        onPress={() => router.push('/list')}
        style={{
          position: 'absolute',
          right: 16,
          bottom: tabBarHeight + 12,
          height: 52,
          paddingHorizontal: 19,
          borderRadius: 17,
          backgroundColor: t.acc2,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 9,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
        accessibilityLabel="Track"
      >
        <Text style={sans(19, 400, { color: t.onAcc })}>+</Text>
        <Text style={sans(14, 600, { color: t.onAcc })}>Track</Text>
      </Press>
    </View>
  );
}
