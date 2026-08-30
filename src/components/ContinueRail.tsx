import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Media } from '../api/types';
import { pickTitle } from '../lib/format';
import { useEntry } from '../state/listCache';
import { useSettings } from '../state/settings';
import { useTokens } from '../theme/ThemeProvider';
import { display, mono } from '../theme/type';
import { Cover } from './Cover';
import { Press } from './primitives';

/**
 * Continue watching — 150px cards reading progress straight from the list cache,
 * so a +1 anywhere in the app moves these bars without a refetch.
 */
export function ContinueRail({ media, onLongPress }: { media: Media[]; onLongPress?: (m: Media) => void }) {
  if (!media.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 2 }}
    >
      {media.map((m) => (
        <ContinueCard key={m.id} media={m} onLongPress={onLongPress} />
      ))}
    </ScrollView>
  );
}

function ContinueCard({ media, onLongPress }: { media: Media; onLongPress?: (m: Media) => void }) {
  const t = useTokens();
  const router = useRouter();
  const { titleLanguage } = useSettings();
  const entry = useEntry(media.id);

  const total = media.episodes ?? null;
  const watched = entry?.progress ?? 0;
  const pct = total ? Math.min(1, watched / total) : 0;

  return (
    <Press
      onPress={() => router.push(`/media/${media.id}`)}
      onLongPress={() => onLongPress?.(media)}
      style={{
        width: 150,
        flexGrow: 0,
        flexShrink: 0,
        flexDirection: 'row',
        gap: 9,
        alignItems: 'center',
        padding: 8,
        borderRadius: 12,
        backgroundColor: t.bg2,
        borderWidth: 1,
        borderColor: t.line,
      }}
    >
      <Cover
        uri={media.coverImage?.large}
        radius={6}
        stripe={[4, 9]}
        bordered={false}
        style={{ width: 32, height: 44 }}
      />
      <View style={{ gap: 5, flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={display(11, 600, { lh: 1.25, color: t.fg })}>
          {pickTitle(media.title, titleLanguage)}
        </Text>
        <Text style={mono(9, 500, { color: t.acc })}>
          EP {watched + 1}
          {total ? ` of ${total}` : ''}
        </Text>
        <View style={{ height: 2, borderRadius: 2, backgroundColor: t.bg3 }}>
          <View style={{ height: '100%', borderRadius: 2, backgroundColor: t.acc, width: `${pct * 100}%` }} />
        </View>
      </View>
    </Press>
  );
}
