import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import React, { useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useActivityFeed } from '../../src/api/hooks';
import { Activity } from '../../src/api/types';
import { Cover } from '../../src/components/Cover';
import { RowSkeleton } from '../../src/components/Skeleton';
import { EmptyState, Press, Pill } from '../../src/components/primitives';
import { pickTitle, relativeTime, stripHtml } from '../../src/lib/format';
import { useAuth } from '../../src/state/auth';
import { useSettings } from '../../src/state/settings';
import { useTokens } from '../../src/theme/ThemeProvider';
import { R } from '../../src/theme/tokens';
import { display, mono, sans } from '../../src/theme/type';

/** Screen 10 — the activity feed. */
export default function SocialScreen() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { viewer, guest, signedIn } = useAuth();
  const [following, setFollowing] = useState(true);

  // `isFollowing: true` needs a viewer, so the Following tab stays idle for guests.
  const feed = useActivityFeed(following, following ? signedIn : true);
  const rows = feed.data?.pages.flatMap((p) => p.Page.activities).filter((a) => !!a?.id) ?? [];

  const header = (
    <View
      style={{
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 13,
        borderBottomWidth: 1,
        borderColor: t.line,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={display(27, 700, { ls: -0.025, color: t.fg })}>Activity</Text>
        <View style={{ flexDirection: 'row', gap: 7 }}>
          <Pill label="FOLLOWING" font="mono" active={following} onPress={() => setFollowing(true)} />
          <Pill label="GLOBAL" font="mono" active={!following} onPress={() => setFollowing(false)} />
        </View>
      </View>
      {!guest ? (
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 12,
            backgroundColor: t.bg2,
            borderWidth: 1,
            borderColor: t.line,
          }}
        >
          <Cover uri={viewer?.avatar?.large} radius={R.pill} stripe={[4, 9]} bordered={false} style={{ width: 26, height: 26 }} />
          <Text style={sans(12.5, 400, { color: t.fg3 })}>Write a status…</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={rows}
        keyExtractor={(a) => String(a.id)}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 18 }}
        refreshControl={
          <RefreshControl refreshing={feed.isRefetching} onRefresh={feed.refetch} tintColor={t.fg2} />
        }
        onEndReached={() => feed.hasNextPage && feed.fetchNextPage()}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => <ActivityRow activity={item} />}
        ListEmptyComponent={
          feed.isLoading ? (
            <RowSkeleton count={5} />
          ) : following && guest ? (
            <EmptyState title="Nothing to follow yet" body="Sign in to see what the people you follow are watching." />
          ) : (
            <EmptyState title="Quiet in here" body="No activity to show right now." />
          )
        }
      />
    </View>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  const t = useTokens();
  const router = useRouter();
  const { titleLanguage } = useSettings();

  const verb = activity.status
    ? `${activity.status}${activity.progress ? ` ${activity.progress} of` : ''}`
    : 'posted';
  const title = activity.media ? pickTitle(activity.media.title, titleLanguage) : '';
  const body = stripHtml(activity.text);

  return (
    <Press
      onPress={() => activity.media && router.push(`/media/${activity.media.id}`)}
      style={{
        flexDirection: 'row',
        gap: 11,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: t.line,
      }}
    >
      <Cover
        uri={activity.user?.avatar?.medium}
        radius={R.pill}
        stripe={[4, 9]}
        bordered={false}
        style={{ width: 34, height: 34 }}
      />
      <View style={{ flex: 1, gap: 7, minWidth: 0 }}>
        <Text style={sans(12.5, 400, { lh: 1.45, color: t.fg2 })}>
          <Text style={sans(12.5, 600, { color: t.fg })}>{activity.user?.name ?? 'Someone'}</Text>
          {` ${verb} `}
          {title ? <Text style={sans(12.5, 600, { color: t.acc })}>{title}</Text> : null}
        </Text>
        {body ? (
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 11,
              backgroundColor: t.bg2,
              borderWidth: 1,
              borderColor: t.line,
            }}
          >
            <Text numberOfLines={6} style={sans(12, 400, { lh: 1.5, color: t.fg2 })}>
              {body}
            </Text>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
          <Text style={mono(9.5, 500, { color: t.fg3 })}>{relativeTime(activity.createdAt)}</Text>
          <Text style={mono(9.5, 500, { color: t.fg3 })}>♡ {activity.likeCount ?? 0}</Text>
          <Text style={mono(9.5, 500, { color: t.fg3 })}>↩ {activity.replyCount ?? 0}</Text>
        </View>
      </View>
      {activity.media ? (
        <Cover
          uri={activity.media.coverImage?.large}
          radius={6}
          stripe={[4, 9]}
          bordered={false}
          style={{ width: 34, height: 48 }}
        />
      ) : null}
    </Press>
  );
}
