import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import React, { useMemo, useState } from 'react';
import { FlatList, Platform, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useListCollection } from '../../src/api/hooks';
import { Media, MediaListStatus, MediaType } from '../../src/api/types';
import { Cover } from '../../src/components/Cover';
import { PickerSheet } from '../../src/components/PickerSheet';
import { ProgressSheet } from '../../src/components/ProgressSheet';
import { RowSkeleton } from '../../src/components/Skeleton';
import { EmptyState, Press, Pill, ProgressBar } from '../../src/components/primitives';
import { formatScore, pickTitle } from '../../src/lib/format';
import { useAuth } from '../../src/state/auth';
import { CachedEntry, useEntry, useListCache } from '../../src/state/listCache';
import { useSettings } from '../../src/state/settings';
import { useTokens } from '../../src/theme/ThemeProvider';
import { R } from '../../src/theme/tokens';
import { display, mono, sans } from '../../src/theme/type';

const STATUS_TABS: { status: MediaListStatus; label: string }[] = [
  { status: 'CURRENT', label: 'Watching' },
  { status: 'PLANNING', label: 'Planning' },
  { status: 'COMPLETED', label: 'Completed' },
  { status: 'PAUSED', label: 'Paused' },
  { status: 'DROPPED', label: 'Dropped' },
];

const SORTS = [
  { value: 'score', label: 'Score' },
  { value: 'title', label: 'Title' },
  { value: 'progress', label: 'Progress' },
  { value: 'updated', label: 'Recently updated' },
] as const;

type SortKey = (typeof SORTS)[number]['value'];

/** Screen 4 — rows sit at ~86px, comfortably above the 44px touch minimum. */
export default function MyListScreen() {
  const t = useTokens();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { viewer, guest } = useAuth();
  const { titleLanguage, defaultListOrder } = useSettings();

  const [type, setType] = useState<MediaType>('ANIME');
  const [status, setStatus] = useState<MediaListStatus>('CURRENT');
  const [sort, setSort] = useState<SortKey>(defaultListOrder);
  const [sortOpen, setSortOpen] = useState(false);
  const [sheetMedia, setSheetMedia] = useState<Media | null>(null);

  const { lists, isLoading, refetch, isRefetching } = useListCollection(viewer?.id, type);
  const { entries } = useListCache();

  const counts = useMemo(() => {
    const map: Partial<Record<MediaListStatus, number>> = {};
    for (const l of lists) {
      if (l.isCustomList || !l.status) continue;
      map[l.status as MediaListStatus] = (map[l.status as MediaListStatus] ?? 0) + l.entries.length;
    }
    return map;
  }, [lists]);

  const rows = useMemo(() => {
    const group = lists.filter((l) => !l.isCustomList && l.status === status).flatMap((l) => l.entries);
    const media = group.map((e) => e.media).filter((m): m is Media => !!m);
    const sorted = [...media];
    sorted.sort((a, b) => {
      if (sort === 'title') return pickTitle(a.title, titleLanguage).localeCompare(pickTitle(b.title, titleLanguage));
      if (sort === 'progress') return (entries[b.id]?.progress ?? 0) - (entries[a.id]?.progress ?? 0);
      if (sort === 'updated') return b.id - a.id;
      return (entries[b.id]?.scoreRaw ?? 0) - (entries[a.id]?.scoreRaw ?? 0);
    });
    return sorted;
  }, [lists, status, sort, entries, titleLanguage]);

  if (guest) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center' }}>
        <EmptyState
          title="Your list lives on AniList"
          body="Sign in to sync your library, track episodes and score what you finish."
          action="Sign in"
          onAction={() => router.replace('/onboarding')}
        />
      </View>
    );
  }

  const android = Platform.OS === 'android';

  const header = (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={display(android ? 26 : 27, 700, { ls: -0.025, color: t.fg })}>My list</Text>
        <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
          {!android ? (
            <Press
              onPress={() => setType((p) => (p === 'ANIME' ? 'MANGA' : 'ANIME'))}
              style={{
                paddingHorizontal: 11,
                paddingVertical: 7,
                borderRadius: 9,
                backgroundColor: t.bg2,
                borderWidth: 1,
                borderColor: t.line,
              }}
            >
              <Text style={mono(10.5, 600, { color: t.fg2 })}>{type}</Text>
            </Press>
          ) : null}
          <Press
            onPress={() => setSortOpen(true)}
            style={
              android
                ? undefined
                : {
                    paddingHorizontal: 11,
                    paddingVertical: 7,
                    borderRadius: 9,
                    backgroundColor: t.bg2,
                    borderWidth: 1,
                    borderColor: t.line,
                  }
            }
            hitSlop={8}
          >
            <Text style={android ? sans(15, 500, { color: t.fg2 }) : mono(10.5, 600, { color: t.fg2 })}>⇅</Text>
          </Press>
          {android ? (
            <Press onPress={() => setType((p) => (p === 'ANIME' ? 'MANGA' : 'ANIME'))} hitSlop={8}>
              <Text style={sans(15, 500, { color: t.fg2 })}>⋮</Text>
            </Press>
          ) : null}
        </View>
      </View>

      {android ? (
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderColor: t.line }}>
          {STATUS_TABS.slice(0, 3).map((tab) => {
            const active = tab.status === status;
            return (
              <Press key={tab.status} onPress={() => setStatus(tab.status)} style={{ flex: 1, alignItems: 'center' }}>
                <Text
                  style={[
                    sans(11.5, 600, { color: active ? t.fg : t.fg3 }),
                    {
                      paddingBottom: 11,
                      borderBottomWidth: active ? 3 : 0,
                      borderColor: t.acc,
                      borderRadius: 3,
                      width: '100%',
                      textAlign: 'center',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Press>
            );
          })}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 7, paddingBottom: 12 }}
          style={{ borderBottomWidth: 1, borderColor: t.line }}
        >
          {STATUS_TABS.map((tab) => (
            <Pill
              key={tab.status}
              label={counts[tab.status] ? `${tab.label} ${counts[tab.status]}` : tab.label}
              active={status === tab.status}
              onPress={() => setStatus(tab.status)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={rows}
        keyExtractor={(m) => String(m.id)}
        ListHeaderComponent={header}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + 18,
          paddingTop: android ? 14 : 0,
          gap: android ? 10 : 0,
          paddingHorizontal: android ? 16 : 0,
        }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.fg2} />}
        renderItem={({ item }) => <ListRow media={item} onEdit={() => setSheetMedia(item)} android={android} />}
        ListEmptyComponent={
          isLoading ? (
            <RowSkeleton count={6} />
          ) : (
            <EmptyState
              title="Nothing here yet"
              body="Titles you add to this list will show up with their progress."
              action="Find something to watch"
            />
          )
        }
      />

      <PickerSheet
        visible={sortOpen}
        title="Sort by"
        options={SORTS.map((s) => ({ value: s.value, label: s.label }))}
        selected={[sort]}
        onSelect={(s) => setSort(s as SortKey)}
        onClose={() => setSortOpen(false)}
      />
      <ProgressSheet media={sheetMedia} visible={!!sheetMedia} onClose={() => setSheetMedia(null)} />
    </View>
  );
}

function ListRow({ media, onEdit, android }: { media: Media; onEdit: () => void; android: boolean }) {
  const t = useTokens();
  const router = useRouter();
  const { titleLanguage, scoreFormat } = useSettings();
  const { increment } = useListCache();
  const entry = useEntry(media.id);

  const total = media.type === 'MANGA' ? media.chapters : media.episodes;
  const progress = entry?.progress ?? 0;
  const pct = total ? Math.min(1, progress / total) : 0;
  const score = formatScore(entry?.scoreRaw, scoreFormat);
  const atEnd = total != null && progress >= total;

  const body = (
    <>
      <Cover
        uri={media.coverImage?.large}
        radius={android ? 9 : 7}
        stripe={[4, 9]}
        bordered={!android}
        style={android ? { width: 46, height: 64 } : { width: 44, height: 62 }}
      />
      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <Text numberOfLines={1} style={display(13.5, 600, { lh: 1.25, color: t.fg })}>
          {pickTitle(media.title, titleLanguage)}
        </Text>
        {android ? (
          <Text style={mono(9.5, 500, { color: t.fg2 })}>
            EP {progress} / {total ?? '?'} · ★ {score}
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
            <Text style={mono(9.5, 500, { color: t.fg2 })}>
              EP {progress} / {total ?? '?'}
            </Text>
            <Text style={mono(9.5, 500, { color: t.acc2 })}>★ {score}</Text>
          </View>
        )}
        <ProgressBar value={pct} height={3} />
      </View>
      <IncrementButton
        disabled={atEnd}
        android={android}
        onPress={() => increment(media.id, total ?? null)}
        entry={entry}
      />
    </>
  );

  return (
    <Press
      onPress={() => router.push(`/media/${media.id}`)}
      onLongPress={onEdit}
      delayLongPress={260}
      style={
        android
          ? {
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
              padding: 10,
              borderRadius: 16,
              backgroundColor: t.bg2,
              borderWidth: 1,
              borderColor: t.line,
            }
          : {
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderColor: t.line,
            }
      }
    >
      {body}
    </Press>
  );
}

function IncrementButton({
  onPress,
  android,
  disabled,
  entry,
}: {
  onPress: () => void;
  android: boolean;
  disabled: boolean;
  entry: CachedEntry | undefined;
}) {
  const t = useTokens();
  if (!entry) return null;

  return (
    <Press
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityLabel="Increase progress by one"
      style={
        android
          ? {
              width: 40,
              height: 40,
              borderRadius: R.pill,
              backgroundColor: t.acc,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? 0.4 : 1,
            }
          : {
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: t.bg2,
              borderWidth: 1,
              borderColor: t.acc,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: disabled ? 0.4 : 1,
            }
      }
    >
      <Text style={mono(12, 600, { color: android ? t.onAcc : t.acc })}>+1</Text>
    </Press>
  );
}
