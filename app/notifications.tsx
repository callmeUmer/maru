import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNotifications } from '../src/api/hooks';
import { AniNotification } from '../src/api/types';
import { RowSkeleton } from '../src/components/Skeleton';
import { EmptyState, Press, Pill } from '../src/components/primitives';
import { pickTitle, relativeTime } from '../src/lib/format';
import { useAuth } from '../src/state/auth';
import { useSettings } from '../src/state/settings';
import { useTokens } from '../src/theme/ThemeProvider';
import { R } from '../src/theme/tokens';
import { display, mono, sans } from '../src/theme/type';

type Filter = 'ALL' | 'AIRING' | 'SOCIAL' | 'FORUM';

const AIRING_TYPES = ['AIRING'];
const SOCIAL_TYPES = ['FOLLOWING', 'ACTIVITY_LIKE', 'ACTIVITY_REPLY', 'ACTIVITY_REPLY_LIKE', 'ACTIVITY_MENTION', 'ACTIVITY_MESSAGE'];
const FORUM_TYPES = ['THREAD_COMMENT_MENTION', 'THREAD_COMMENT_REPLY', 'THREAD_LIKE', 'THREAD_SUBSCRIBED'];

/** Screen 11 — notifications. */
export default function NotificationsScreen() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { viewer, signedIn, refreshViewer } = useAuth();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [dismissedUnread, setDismissedUnread] = useState(false);

  // AniList reports a count, not a per-row read flag: the newest N are the unread ones.
  const unreadAtOpen = useRef(viewer?.unreadNotificationCount ?? 0).current;

  const feed = useNotifications(signedIn);
  const all = feed.data?.pages.flatMap((p) => p.Page.notifications).filter((n) => !!n?.id) ?? [];

  const rows = useMemo(() => {
    if (filter === 'ALL') return all;
    const set = filter === 'AIRING' ? AIRING_TYPES : filter === 'SOCIAL' ? SOCIAL_TYPES : FORUM_TYPES;
    return all.filter((n) => set.includes(n.type));
  }, [all, filter]);

  if (!signedIn) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center' }}>
        <EmptyState
          title="No notifications for guests"
          body="Sign in with AniList to get airing alerts and replies."
          action="Go back"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const unreadCount = dismissedUnread ? 0 : unreadAtOpen;

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={rows}
        keyExtractor={(n) => String(n.id)}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={feed.isRefetching}
            onRefresh={() => {
              feed.refetch();
              void refreshViewer();
            }}
            tintColor={t.fg2}
          />
        }
        onEndReached={() => feed.hasNextPage && feed.fetchNextPage()}
        onEndReachedThreshold={0.6}
        ListHeaderComponent={
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
              <Press onPress={() => router.back()} hitSlop={10}>
                <Text style={display(27, 700, { ls: -0.025, color: t.fg })}>Notifications</Text>
              </Press>
              <Press onPress={() => setDismissedUnread(true)} hitSlop={8}>
                <Text style={mono(10.5, 600, { color: t.acc })}>MARK ALL</Text>
              </Press>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
              {(['ALL', 'AIRING', 'SOCIAL', 'FORUM'] as Filter[]).map((f) => (
                <Pill
                  key={f}
                  label={f === 'ALL' && unreadCount ? `ALL ${unreadCount}` : f}
                  font="mono"
                  fill="fg"
                  active={filter === f}
                  onPress={() => setFilter(f)}
                />
              ))}
            </ScrollView>
          </View>
        }
        renderItem={({ item, index }) => (
          <NotificationRow notification={item} unread={!dismissedUnread && filter === 'ALL' && index < unreadAtOpen} />
        )}
        ListEmptyComponent={
          feed.isLoading ? <RowSkeleton count={6} /> : <EmptyState title="All caught up" body="Nothing new since you last looked." />
        }
      />
    </View>
  );
}

function tagFor(type: string): { glyph: string; tint: 'acc' | 'acc2' | 'fg3' } {
  if (AIRING_TYPES.includes(type)) return { glyph: 'EP', tint: 'acc' };
  if (type === 'FOLLOWING') return { glyph: '+', tint: 'acc2' };
  if (type.includes('LIKE')) return { glyph: '♡', tint: 'acc2' };
  if (type.includes('REPLY') || type.includes('MENTION') || type.includes('COMMENT')) return { glyph: '↩', tint: 'acc2' };
  return { glyph: '!', tint: 'fg3' };
}

function NotificationRow({ notification, unread }: { notification: AniNotification; unread: boolean }) {
  const t = useTokens();
  const router = useRouter();
  const { titleLanguage } = useSettings();
  const { glyph, tint } = tagFor(notification.type);

  const subject = notification.media
    ? pickTitle(notification.media.title, titleLanguage)
    : notification.user?.name ?? notification.thread?.title ?? 'AniList';

  const text = notification.episode
    ? `episode ${notification.episode} aired.`
    : notification.context?.trim() || 'has an update.';

  return (
    <Press
      onPress={() => notification.media && router.push(`/media/${notification.media.id}`)}
      style={{
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderColor: t.line,
        backgroundColor: unread ? t.bg2 : 'transparent',
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: t[tint],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={mono(11, 600, { color: t.onAcc })}>{glyph}</Text>
      </View>
      <View style={{ flex: 1, gap: 5, minWidth: 0 }}>
        <Text style={sans(12.5, 400, { lh: 1.45, color: t.fg2 })}>
          <Text style={sans(12.5, 600, { color: t.fg })}>{subject}</Text> {text}
        </Text>
        <Text style={mono(9.5, 500, { color: t.fg3 })}>{relativeTime(notification.createdAt)}</Text>
      </View>
      {unread ? <View style={{ width: 7, height: 7, borderRadius: R.pill, backgroundColor: t.acc }} /> : null}
    </Press>
  );
}
