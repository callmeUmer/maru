import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import React, { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { useUserProfile } from '../../src/api/hooks';
import { Media } from '../../src/api/types';
import { BarList, ScoreHistogram } from '../../src/components/Charts';
import { Cover } from '../../src/components/Cover';
import { GearIcon } from '../../src/components/Icons';
import { PosterRail } from '../../src/components/PosterCard';
import { Shimmer } from '../../src/components/Skeleton';
import { Card, EmptyState, Press, SectionLabel } from '../../src/components/primitives';
import { compact, formatLabel } from '../../src/lib/format';
import { useAuth } from '../../src/state/auth';
import { useTokens } from '../../src/theme/ThemeProvider';
import { R } from '../../src/theme/tokens';
import { display, mono, sans } from '../../src/theme/type';

const TABS = ['Stats', 'Activity', 'Favourites', 'Social'] as const;
type Tab = (typeof TABS)[number];

/** Screen 7 — profile and statistics. */
export default function ProfileScreen() {
  const t = useTokens();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { viewer, guest } = useAuth();
  const [tab, setTab] = useState<Tab>('Stats');

  const { data, isLoading, refetch, isRefetching } = useUserProfile(viewer?.id);
  const user = data?.User;
  const anime = user?.statistics?.anime;
  const manga = user?.statistics?.manga;

  if (guest) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center' }}>
        <EmptyState
          title="Browsing as a guest"
          body="Sign in with AniList to see your statistics, favourites and activity."
          action="Sign in"
          onAction={() => router.replace('/onboarding')}
        />
      </View>
    );
  }

  const joined = user?.createdAt ? new Date(user.createdAt * 1000).getFullYear() : null;
  const favourites = (user?.favourites?.anime.nodes ?? []) as Media[];

  const stats = [
    { v: compact(anime?.count), k: 'Anime completed' },
    { v: anime ? (anime.minutesWatched / 1440).toFixed(1) : '—', k: 'Days watched' },
    { v: anime?.meanScore ? String(Math.round(anime.meanScore)) : '—', k: 'Mean score' },
    { v: compact(manga?.chaptersRead), k: 'Manga chapters' },
    { v: compact(anime?.episodesWatched), k: 'Episodes watched' },
    { v: compact(data?.Followers.pageInfo.total), k: 'Followers' },
  ];

  const milestones = [
    { v: compact(anime?.count), k: 'Titles completed' },
    { v: compact(anime?.episodesWatched), k: 'Episodes watched' },
    { v: anime ? (anime.minutesWatched / 1440).toFixed(1) : '—', k: 'Days of runtime' },
    { v: compact(manga?.count), k: 'Manga completed' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={t.fg2} />}
    >
      <View style={{ height: 132 }}>
        <Cover uri={user?.bannerImage} radius={0} stripe={[7, 15]} bordered={false} style={{ height: 132 }} />
        <LinearGradient
          colors={['transparent', t.bg]}
          locations={[0.3, 1]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 132 }}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-end', paddingHorizontal: 16, marginTop: -38 }}>
        <Cover
          uri={user?.avatar?.large}
          radius={R.avatar}
          stripe={[4, 9]}
          bordered={false}
          style={{ width: 76, height: 76, borderWidth: 2, borderColor: t.bg }}
        />
        <View style={{ flex: 1, gap: 4, paddingBottom: 4, minWidth: 0 }}>
          <Text numberOfLines={1} style={display(20, 700, { ls: -0.02, color: t.fg })}>
            {user?.name ?? viewer?.name ?? '—'}
          </Text>
          <Text style={mono(9.5, 500, { ls: 0.06, upper: true, color: t.fg2 })}>
            {joined ? `Joined ${joined}` : 'AniList member'}
          </Text>
        </View>
        <Press
          onPress={() => router.push('/settings')}
          style={{
            width: 34,
            height: 34,
            borderRadius: 11,
            backgroundColor: t.bg2,
            borderWidth: 1,
            borderColor: t.line,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 4,
          }}
          accessibilityLabel="Settings"
        >
          <GearIcon color={t.fg2} />
        </Press>
      </View>

      <View style={{ gap: 13, paddingHorizontal: 16, paddingTop: 14 }}>
        {user?.about ? (
          <Text style={sans(12.5, 400, { lh: 1.55, color: t.fg2 })} numberOfLines={4}>
            {user.about.replace(/<[^>]+>/g, '').trim()}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 9 }}>
          <CountCard value={compact(data?.Followers.pageInfo.total)} label="FOLLOWERS" />
          <CountCard value={compact(data?.Following.pageInfo.total)} label="FOLLOWING" />
          <CountCard value={compact(manga?.count)} label="MANGA" />
        </View>

        <View style={{ flexDirection: 'row', gap: 20, borderBottomWidth: 1, borderColor: t.line }}>
          {TABS.map((name) => {
            const active = tab === name;
            return (
              <Press key={name} onPress={() => setTab(name)}>
                <Text
                  style={[
                    sans(12, 600, { color: active ? t.fg : t.fg3 }),
                    { paddingBottom: 10, borderBottomWidth: active ? 2 : 0, borderColor: t.acc },
                  ]}
                >
                  {name}
                </Text>
              </Press>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <View style={{ gap: 9, padding: 16 }}>
          {[0, 1, 2].map((i) => (
            <Shimmer key={i} style={{ height: 64 }} radius={13} />
          ))}
        </View>
      ) : tab === 'Stats' ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingHorizontal: 16, paddingTop: 18 }}>
            {stats.map((s) => (
              <Card key={s.k} style={{ width: '31.5%', gap: 5 }} padding={12} radius={13}>
                <Text style={display(20, 700, { ls: -0.02, color: t.fg })}>{s.v}</Text>
                <Text style={mono(8.5, 500, { lh: 1.2, ls: 0.08, upper: true, color: t.fg3 })}>{s.k}</Text>
              </Card>
            ))}
          </View>

          {anime?.genres?.length ? (
            <View style={{ gap: 11, paddingHorizontal: 16, paddingTop: 22 }}>
              <SectionLabel>Genre overview</SectionLabel>
              <BarList rows={anime.genres.slice(0, 5).map((g) => ({ label: g.genre, value: g.count }))} />
            </View>
          ) : null}

          {favourites.length ? (
            <View style={{ gap: 11, paddingTop: 22 }}>
              <SectionLabel style={{ paddingHorizontal: 16 }}>Favourites</SectionLabel>
              <PosterRail data={favourites} itemWidth={96} />
            </View>
          ) : null}

          <View style={{ gap: 11, paddingHorizontal: 16, paddingTop: 22 }}>
            <SectionLabel>Milestones</SectionLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {milestones.map((m) => (
                <Card key={m.k} style={{ width: '48.5%', gap: 5 }} padding={12} radius={13}>
                  <Text style={display(17, 700, { ls: -0.02, color: t.acc })}>{m.v}</Text>
                  <Text style={mono(9, 500, { lh: 1.2, ls: 0.06, upper: true, color: t.fg3 })}>{m.k}</Text>
                </Card>
              ))}
            </View>
          </View>

          {anime?.formats?.length ? (
            <View style={{ gap: 11, paddingHorizontal: 16, paddingTop: 22 }}>
              <SectionLabel>Format breakdown</SectionLabel>
              <BarList
                accent="acc2"
                rows={anime.formats.slice(0, 5).map((f) => ({ label: formatLabel(f.format), value: f.count }))}
              />
            </View>
          ) : null}

          {anime?.scores?.length ? (
            <View style={{ paddingHorizontal: 16, paddingTop: 22 }}>
              <ScoreHistogram
                bare
                height={64}
                title="Your score spread"
                caption={anime.meanScore ? `MEAN ${Math.round(anime.meanScore)}` : undefined}
                buckets={anime.scores.map((s) => ({ label: String(s.score), value: s.count }))}
              />
            </View>
          ) : null}
        </>
      ) : tab === 'Favourites' ? (
        favourites.length ? (
          <View style={{ paddingTop: 18 }}>
            <PosterRail data={favourites} itemWidth={96} />
          </View>
        ) : (
          <EmptyState title="No favourites yet" body="Titles you favourite on AniList show up here." />
        )
      ) : (
        <EmptyState
          title={tab === 'Activity' ? 'Your activity' : 'Your people'}
          body={
            tab === 'Activity'
              ? 'Everything you post and track appears in the Social tab.'
              : 'Followers and following live on your AniList profile.'
          }
          action="Open Social"
          onAction={() => router.push('/social')}
        />
      )}
    </ScrollView>
  );
}

function CountCard({ value, label }: { value: string; label: string }) {
  const t = useTokens();
  return (
    <Card style={{ flex: 1, gap: 3 }} padding={11} radius={11}>
      <Text style={display(14, 700, { color: t.fg })}>{value}</Text>
      <Text style={mono(8.5, 500, { ls: 0.08, color: t.fg3 })}>{label}</Text>
    </Card>
  );
}
