import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Linking, Platform, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMediaDetail } from '../../src/api/hooks';
import { Media, MediaListStatus } from '../../src/api/types';
import { ScoreHistogram, StackedBar } from '../../src/components/Charts';
import { Cover } from '../../src/components/Cover';
import { PosterRail } from '../../src/components/PosterCard';
import { ProgressSheet } from '../../src/components/ProgressSheet';
import { Shimmer } from '../../src/components/Skeleton';
import { Card, EmptyState, Press, ProgressBar, SectionLabel } from '../../src/components/primitives';
import {
  compact,
  countdown,
  dateRange,
  formatLabel,
  mediaMeta,
  pickTitle,
  statusLabel,
  stripHtml,
} from '../../src/lib/format';
import { useCountdown } from '../../src/lib/useCountdown';
import { useAuth } from '../../src/state/auth';
import { useEntry, useListCache } from '../../src/state/listCache';
import { useSettings } from '../../src/state/settings';
import { useTokens } from '../../src/theme/ThemeProvider';
import { R } from '../../src/theme/tokens';
import { display, mono, sans } from '../../src/theme/type';

const TABS = ['Overview', 'Characters', 'Staff', 'Stats'] as const;
type Tab = (typeof TABS)[number];

const STATUS_TEXT: Record<MediaListStatus, string> = {
  CURRENT: 'Watching',
  PLANNING: 'Planning',
  COMPLETED: 'Completed',
  PAUSED: 'Paused',
  DROPPED: 'Dropped',
  REPEATING: 'Rewatching',
};

/** Screen 3 — title detail, for anime and manga. */
export default function MediaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const mediaId = Number(id);
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { titleLanguage } = useSettings();
  const { guest } = useAuth();

  const [tab, setTab] = useState<Tab>('Overview');
  const [expanded, setExpanded] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data, isLoading, isError } = useMediaDetail(mediaId);
  const media = data?.Media;
  const android = Platform.OS === 'android';

  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: 'center' }}>
        <EmptyState title="Could not load this title" body="AniList did not answer. Try again in a moment." action="Go back" onAction={() => router.back()} />
      </View>
    );
  }

  if (isLoading || !media) {
    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <Shimmer style={{ height: android ? 196 : 210 }} radius={0} />
        <View style={{ padding: 16, gap: 12 }}>
          <Shimmer style={{ height: 24, width: '70%' }} radius={6} />
          <Shimmer style={{ height: 14, width: '40%' }} radius={6} />
          <Shimmer style={{ height: 64 }} radius={12} />
        </View>
      </View>
    );
  }

  const isManga = media.type === 'MANGA';
  const total = isManga ? media.chapters : media.episodes;
  const mainStudio = media.studios?.edges.find((e) => e.isMain)?.node.name;
  const producers = media.studios?.edges.filter((e) => !e.isMain).map((e) => e.node.name) ?? [];
  const allTimeRank = media.rankings?.find((r) => r.allTime && r.type === 'RATED');

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}>
        <View style={{ height: android ? 196 : 210 }}>
          <Cover uri={media.bannerImage} radius={0} stripe={[7, 15]} bordered={false} style={{ height: android ? 196 : 210 }} />
          <LinearGradient
            colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.25)', t.bg]}
            locations={[0, android ? 0.25 : 0.4, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <GlassButton
            label={android ? '←' : '‹'}
            style={{ position: 'absolute', top: insets.top + 6, left: android ? 14 : 16 }}
            size={android ? 34 : 32}
            onPress={() => router.back()}
          />
          {android ? (
            <View style={{ position: 'absolute', top: insets.top + 6, right: 14, flexDirection: 'row', gap: 10 }}>
              <GlassButton label="♡" size={34} onPress={() => setSheetOpen(true)} />
              <GlassButton label="⋮" size={34} onPress={() => setSheetOpen(true)} />
            </View>
          ) : null}
        </View>

        {android ? (
          <AndroidHero media={media} onTrack={() => setSheetOpen(true)} guest={guest} />
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: 16, marginTop: -52 }}>
              <Cover
                uri={media.coverImage?.extraLarge}
                radius={12}
                style={{
                  width: 96,
                  height: 140,
                  shadowColor: '#000',
                  shadowOpacity: 0.35,
                  shadowRadius: 28,
                  shadowOffset: { width: 0, height: 12 },
                  elevation: 8,
                }}
              />
              <View style={{ flex: 1, gap: 8, paddingTop: 56 }}>
                <Text style={display(21, 700, { lh: 1.08, ls: -0.025, color: t.fg })}>
                  {pickTitle(media.title, titleLanguage)}
                </Text>
                {media.title.native ? (
                  <Text style={mono(11, 400, { color: t.fg2 })}>{media.title.native}</Text>
                ) : null}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 7, flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 14 }}>
              {[
                `${formatLabel(media.format)}${total ? ` · ${total} ${isManga ? 'CH' : 'EP'}` : ''}`,
                mainStudio,
                statusLabel(media.status),
              ]
                .filter((x): x is string => !!x)
                .map((chip) => (
                  <View
                    key={chip}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 7,
                      backgroundColor: t.bg2,
                      borderWidth: 1,
                      borderColor: t.line,
                    }}
                  >
                    <Text style={mono(10, 500, { upper: true, color: t.fg2 })}>{chip}</Text>
                  </View>
                ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 9, paddingHorizontal: 16, paddingTop: 14 }}>
              <DetailStat value={media.averageScore ? String(media.averageScore) : '—'} label="AVG SCORE" accent />
              <DetailStat value={allTimeRank ? `#${allTimeRank.rank}` : '—'} label="ALL TIME" />
              <DetailStat value={compact(media.popularity)} label="MEMBERS" />
            </View>

            {!guest ? <TrackingCard media={media} onOpen={() => setSheetOpen(true)} /> : null}
          </>
        )}

        <View
          style={{
            flexDirection: 'row',
            gap: android ? 20 : 22,
            paddingHorizontal: 16,
            paddingTop: android ? 6 : 20,
            borderBottomWidth: 1,
            borderColor: t.line,
          }}
        >
          {TABS.map((name) => {
            const active = tab === name;
            return (
              <Press key={name} onPress={() => setTab(name)}>
                <Text
                  style={[
                    sans(12.5, 600, { color: active ? t.fg : t.fg3 }),
                    {
                      paddingBottom: android ? 10 : 9,
                      borderBottomWidth: active ? (android ? 3 : 2) : 0,
                      borderColor: t.acc,
                      borderRadius: android ? 3 : 0,
                    },
                  ]}
                >
                  {name}
                </Text>
              </Press>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 22, gap: 16 }}>
          {tab === 'Overview' ? (
            <OverviewTab media={media} expanded={expanded} onExpand={() => setExpanded(true)} producers={producers} mainStudio={mainStudio} />
          ) : tab === 'Characters' ? (
            <PeopleGrid
              people={(media.characters?.edges ?? []).map((e) => ({
                id: e.node.id,
                name: e.node.name.full,
                meta: e.role,
                image: e.node.image?.medium ?? null,
              }))}
              empty="No characters listed for this title."
            />
          ) : tab === 'Staff' ? (
            <PeopleGrid
              people={(media.staff?.edges ?? []).map((e) => ({
                id: e.node.id,
                name: e.node.name.full,
                meta: e.role,
                image: e.node.image?.medium ?? null,
              }))}
              empty="No staff listed for this title."
            />
          ) : (
            <StatsTab media={media} />
          )}
        </View>
      </ScrollView>

      <ProgressSheet media={media} visible={sheetOpen} onClose={() => setSheetOpen(false)} />
    </View>
  );
}

function GlassButton({
  label,
  onPress,
  size = 32,
  style,
}: {
  label: string;
  onPress: () => void;
  size?: number;
  style?: object;
}) {
  return (
    <Press
      onPress={onPress}
      accessibilityLabel={label === '‹' || label === '←' ? 'Back' : label}
      style={[
        {
          width: size,
          height: size,
          borderRadius: R.pill,
          backgroundColor: 'rgba(0,0,0,0.45)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={sans(size >= 34 ? 17 : 16, 600, { color: '#fff' })}>{label}</Text>
    </Press>
  );
}

function DetailStat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  const t = useTokens();
  return (
    <Card style={{ flex: 1, alignItems: 'center', gap: 4 }} padding={11} radius={12}>
      <Text style={display(19, 700, { color: accent ? t.acc : t.fg })}>{value}</Text>
      <Text style={mono(8.5, 500, { ls: 0.08, color: t.fg3 })}>{label}</Text>
    </Card>
  );
}

/** Section 5 — the accent-filled tracking card carrying the primary +1 action. */
function TrackingCard({ media, onOpen }: { media: Media; onOpen: () => void }) {
  const t = useTokens();
  const entry = useEntry(media.id);
  const { increment, save } = useListCache();

  const total = media.type === 'MANGA' ? media.chapters : media.episodes;
  const progress = entry?.progress ?? 0;
  const pct = total ? Math.min(1, progress / total) : 0;
  const atEnd = total != null && progress >= total;

  if (!entry) {
    return (
      <Press
        onPress={() => save(media.id, { status: 'PLANNING', progress: 0 })}
        style={{
          marginHorizontal: 16,
          marginTop: 16,
          height: 46,
          borderRadius: 14,
          backgroundColor: t.acc,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <Text style={sans(17, 400, { color: t.onAcc })}>+</Text>
        <Text style={sans(14, 600, { color: t.onAcc })}>Add to list</Text>
      </Press>
    );
  }

  return (
    <Press
      onPress={onOpen}
      style={{
        marginHorizontal: 16,
        marginTop: 16,
        padding: 13,
        borderRadius: 14,
        backgroundColor: t.acc,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <View style={{ flex: 1, gap: 5 }}>
        <Text style={[mono(10, 600, { ls: 0.1, upper: true, color: t.onAcc }), { opacity: 0.72 }]}>
          {STATUS_TEXT[entry.status ?? 'CURRENT']}
        </Text>
        <Text style={display(16, 700, { color: t.onAcc })}>
          {media.type === 'MANGA' ? 'CH' : 'EP'} {progress} / {total ?? '?'}
        </Text>
        <ProgressBar value={pct} height={3} track="rgba(0,0,0,0.22)" fill={t.onAcc} />
      </View>
      <Press
        onPress={() => increment(media.id, total ?? null)}
        disabled={atEnd}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: 'rgba(0,0,0,0.18)',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: atEnd ? 0.5 : 1,
        }}
        accessibilityLabel="Increase progress by one"
      >
        <Text style={mono(15, 600, { color: t.onAcc })}>+1</Text>
      </Press>
    </Press>
  );
}

/** The Material 3 hero: poster beside the title, then a filled action row and three stat cards. */
function AndroidHero({ media, onTrack, guest }: { media: Media; onTrack: () => void; guest: boolean }) {
  const t = useTokens();
  const { titleLanguage } = useSettings();
  const entry = useEntry(media.id);
  const remaining = useCountdown(media.nextAiringEpisode?.timeUntilAiring);
  const mainStudio = media.studios?.edges.find((e) => e.isMain)?.node.name;

  return (
    <View style={{ gap: 12, paddingHorizontal: 16, marginTop: -34 }}>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-end' }}>
        <Cover uri={media.coverImage?.extraLarge} radius={14} style={{ width: 92, height: 132 }} />
        <View style={{ flex: 1, gap: 7, minWidth: 0 }}>
          <Text style={display(20, 700, { lh: 1.1, ls: -0.025, color: t.fg })}>
            {pickTitle(media.title, titleLanguage)}
          </Text>
          <Text numberOfLines={1} style={mono(10, 500, { ls: 0.06, upper: true, color: t.fg2 })}>
            {[mediaMeta(media), mainStudio].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>

      {!guest ? (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Press
            onPress={onTrack}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 14,
              backgroundColor: t.acc,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {!entry ? <Text style={sans(17, 400, { color: t.onAcc })}>+</Text> : null}
            <Text style={sans(14, 600, { color: t.onAcc })}>{entry ? 'Edit entry' : 'Add to list'}</Text>
          </Press>
          <Press
            onPress={onTrack}
            style={{
              width: 52,
              height: 46,
              borderRadius: 14,
              backgroundColor: t.bg2,
              borderWidth: 1,
              borderColor: t.line,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityLabel="List options"
          >
            <Text style={sans(15, 500, { color: t.fg2 })}>▤</Text>
          </Press>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 9 }}>
        <AndroidStat value={media.averageScore ? String(media.averageScore) : '—'} label="SCORE" accent />
        <AndroidStat
          value={media.nextAiringEpisode ? `EP ${media.nextAiringEpisode.episode}` : statusLabel(media.status)}
          label={media.nextAiringEpisode ? `IN ${countdown(remaining)}` : 'STATUS'}
        />
        <AndroidStat value={compact(media.popularity)} label="MEMBERS" />
      </View>
    </View>
  );
}

function AndroidStat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  const t = useTokens();
  return (
    <Card style={{ flex: 1, gap: 4 }} padding={12} radius={14}>
      <Text numberOfLines={1} style={display(18, 700, { color: accent ? t.acc : t.fg })}>
        {value}
      </Text>
      <Text numberOfLines={1} style={mono(8.5, 500, { ls: 0.08, upper: true, color: t.fg3 })}>
        {label}
      </Text>
    </Card>
  );
}

function OverviewTab({
  media,
  expanded,
  onExpand,
  producers,
  mainStudio,
}: {
  media: Media;
  expanded: boolean;
  onExpand: () => void;
  producers: string[];
  mainStudio?: string;
}) {
  const t = useTokens();
  const { titleLanguage } = useSettings();
  const isManga = media.type === 'MANGA';
  const synopsis = stripHtml(media.description);

  const characters = media.characters?.edges ?? [];
  const tags = (media.tags ?? []).filter((tag) => !tag.isMediaSpoiler).slice(0, 12);
  const relations = media.relations?.edges ?? [];
  const recs = (media.recommendations?.nodes ?? []).map((n) => n.mediaRecommendation).filter((m): m is Media => !!m);
  const links = media.externalLinks ?? [];

  // Manga swaps in publication fields; anime keeps the broadcast ones.
  const rows: { k: string; v: string }[] = isManga
    ? [
        { k: 'Format', v: formatLabel(media.format) },
        { k: 'Chapters', v: media.chapters ? String(media.chapters) : '—' },
        { k: 'Volumes', v: media.volumes ? String(media.volumes) : '—' },
        { k: 'Publishing status', v: statusLabel(media.status) },
        { k: 'Published', v: dateRange(media.startDate, media.endDate) },
        { k: 'Source', v: statusLabel(media.source) },
        { k: 'Serialization', v: mainStudio ?? '—' },
        { k: 'Popularity', v: `#${media.popularity ?? '—'} · ${compact(media.popularity)} members` },
        { k: 'Favourites', v: compact(media.favourites) },
        { k: 'Mean score', v: media.meanScore ? `${media.meanScore}%` : '—' },
        { k: 'Average score', v: media.averageScore ? `${media.averageScore}%` : '—' },
        { k: 'Romaji', v: media.title.romaji ?? '—' },
        { k: 'English', v: media.title.english ?? '—' },
        { k: 'Synonyms', v: (media.synonyms ?? []).join(', ') || '—' },
      ]
    : [
        { k: 'Format', v: formatLabel(media.format) },
        {
          k: 'Episodes · Duration',
          v: `${media.episodes ?? '—'}${media.duration ? ` · ${media.duration} min` : ''}`,
        },
        { k: 'Status', v: statusLabel(media.status) },
        { k: 'Aired', v: dateRange(media.startDate, media.endDate) },
        {
          k: 'Season',
          v: media.season ? `${statusLabel(media.season)} ${media.seasonYear ?? ''}`.trim() : '—',
        },
        { k: 'Source', v: statusLabel(media.source) },
        { k: 'Studio', v: mainStudio ?? '—' },
        { k: 'Producers', v: producers.slice(0, 3).join(', ') || '—' },
        { k: 'Popularity', v: `${compact(media.popularity)} members` },
        { k: 'Favourites', v: compact(media.favourites) },
        { k: 'Mean score', v: media.meanScore ? `${media.meanScore}%` : '—' },
        { k: 'Average score', v: media.averageScore ? `${media.averageScore}%` : '—' },
        { k: 'Romaji', v: media.title.romaji ?? '—' },
        { k: 'English', v: media.title.english ?? '—' },
        { k: 'Synonyms', v: (media.synonyms ?? []).join(', ') || '—' },
      ];

  return (
    <>
      {synopsis ? (
        <Text numberOfLines={expanded ? undefined : 3} style={sans(12.5, 400, { lh: 1.55, color: t.fg2 })}>
          {synopsis}
          {!expanded ? (
            <Text onPress={onExpand} style={sans(12.5, 600, { color: t.acc })}>
              {'  More'}
            </Text>
          ) : null}
        </Text>
      ) : null}

      {characters.length ? (
        <View style={{ gap: 9 }}>
          <SectionLabel>Characters</SectionLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
            {characters.map((c) => (
              <View key={c.node.id} style={{ width: 56, alignItems: 'center', gap: 6 }}>
                <Cover
                  uri={c.node.image?.medium}
                  radius={R.pill}
                  stripe={[4, 9]}
                  style={{ width: 56, height: 56 }}
                />
                <Text numberOfLines={2} style={[sans(9.5, 500, { lh: 1.2, color: t.fg2 }), { textAlign: 'center' }]}>
                  {c.node.name.full}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {tags.length ? (
        <View style={{ gap: 9 }}>
          <SectionLabel>Tags</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {tags.map((tag) => (
              <View
                key={tag.name}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 9,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: t.bg2,
                  borderWidth: 1,
                  borderColor: t.line,
                }}
              >
                <Text style={sans(11, 500, { color: t.fg })}>{tag.name}</Text>
                <Text style={mono(9, 500, { color: t.acc })}>{tag.rank}%</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={{ gap: 9 }}>
        <SectionLabel>Details</SectionLabel>
        <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: t.line }}>
          {rows.map((row, i) => (
            <View
              key={row.k}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                gap: 16,
                alignItems: 'baseline',
                paddingHorizontal: 13,
                paddingVertical: 10,
                backgroundColor: t.bg2,
                borderBottomWidth: i === rows.length - 1 ? 0 : 1,
                borderColor: t.line,
              }}
            >
              <Text style={mono(10.5, 500, { lh: 1.3, ls: 0.04, upper: true, color: t.fg3 })}>{row.k}</Text>
              <Text style={[sans(11.5, 500, { lh: 1.35, color: t.fg }), { flex: 1, textAlign: 'right' }]}>{row.v}</Text>
            </View>
          ))}
        </View>
      </View>

      {relations.length ? (
        <View style={{ gap: 9 }}>
          <SectionLabel>Relations</SectionLabel>
          <View style={{ gap: 8 }}>
            {relations.slice(0, 8).map((rel) => (
              <RelationRow key={`${rel.relationType}-${rel.node.id}`} relation={rel} />
            ))}
          </View>
        </View>
      ) : null}

      {recs.length ? (
        <View style={{ gap: 9, marginHorizontal: -16 }}>
          <SectionLabel style={{ paddingHorizontal: 16 }}>
            {Platform.OS === 'android' ? 'Recommended next' : 'Recommendations'}
          </SectionLabel>
          <PosterRail data={recs} itemWidth={Platform.OS === 'android' ? 104 : 100} />
        </View>
      ) : null}

      {links.length ? (
        <View style={{ gap: 9 }}>
          <SectionLabel>Watch &amp; links</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
            {links.map((link) => (
              <Press
                key={link.id}
                onPress={() =>
                  WebBrowser.openBrowserAsync(link.url).catch(() => Linking.openURL(link.url).catch(() => {}))
                }
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: R.pill,
                  backgroundColor: t.bg2,
                  borderWidth: 1,
                  borderColor: t.line,
                }}
              >
                <Text style={sans(11, 500, { color: t.fg2 })}>{link.site} ↗</Text>
              </Press>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}

function RelationRow({
  relation,
}: {
  relation: { relationType: string; node: { id: number; title: Media['title']; coverImage: Media['coverImage']; format: Media['format']; status: string | null; episodes: number | null; chapters: number | null } };
}) {
  const t = useTokens();
  const router = useRouter();
  const { titleLanguage } = useSettings();
  const node = relation.node;
  const count = node.episodes ? `${node.episodes} EP` : node.chapters ? `${node.chapters} CH` : null;

  return (
    <Press
      onPress={() => router.push(`/media/${node.id}`)}
      style={{
        flexDirection: 'row',
        gap: 11,
        alignItems: 'center',
        padding: 9,
        borderRadius: 13,
        backgroundColor: t.bg2,
        borderWidth: 1,
        borderColor: t.line,
      }}
    >
      <Cover uri={node.coverImage?.large} radius={7} stripe={[4, 9]} bordered={false} style={{ width: 38, height: 54 }} />
      <View style={{ flex: 1, gap: 5, minWidth: 0 }}>
        <Text style={mono(8.5, 500, { ls: 0.12, upper: true, color: t.acc })}>{statusLabel(relation.relationType)}</Text>
        <Text numberOfLines={1} style={display(13, 600, { lh: 1.2, color: t.fg })}>
          {pickTitle(node.title, titleLanguage)}
        </Text>
        <Text numberOfLines={1} style={mono(9, 500, { ls: 0.05, upper: true, color: t.fg3 })}>
          {[formatLabel(node.format), count, statusLabel(node.status)].filter(Boolean).join(' · ')}
        </Text>
      </View>
    </Press>
  );
}

function StatsTab({ media }: { media: Media }) {
  const t = useTokens();
  const scores = media.stats?.scoreDistribution ?? [];
  const statuses = media.stats?.statusDistribution ?? [];
  const rankings = media.rankings ?? [];

  const totalVotes = scores.reduce((sum, s) => sum + s.amount, 0);

  const STATUS_ORDER: { key: string; label: string; color: keyof typeof t }[] = [
    { key: 'COMPLETED', label: 'Completed', color: 'acc' },
    { key: 'CURRENT', label: 'Watching', color: 'acc2' },
    { key: 'PLANNING', label: 'Planning', color: 'fg2' },
    { key: 'PAUSED', label: 'Paused', color: 'fg3' },
    { key: 'DROPPED', label: 'Dropped', color: 'bg3' },
  ];

  if (!scores.length && !statuses.length && !rankings.length) {
    return <EmptyState title="No statistics yet" body="AniList has not published distributions for this title." />;
  }

  return (
    <>
      {scores.length ? (
        <ScoreHistogram
          title="Score distribution"
          caption={`${compact(totalVotes)} VOTES`}
          buckets={scores.map((s) => ({ label: String(s.score), value: s.amount }))}
        />
      ) : null}

      {statuses.length ? (
        <StackedBar
          title="Status distribution"
          segments={STATUS_ORDER.map((s) => ({
            label: s.label,
            value: statuses.find((x) => x.status === s.key)?.amount ?? 0,
            color: t[s.color] as string,
          }))}
        />
      ) : null}

      {rankings.length ? (
        <View style={{ gap: 9 }}>
          <SectionLabel>Rankings</SectionLabel>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {rankings.slice(0, 4).map((r) => (
              <Card
                key={r.id}
                style={{ width: '48.5%', flexDirection: 'row', alignItems: 'center', gap: 9 }}
                padding={11}
                radius={12}
              >
                <Text style={display(15, 700, { color: t.acc2 })}>#{r.rank}</Text>
                <Text style={[sans(10, 500, { lh: 1.3, color: t.fg2 }), { flex: 1 }]}>
                  {r.context}
                  {r.year ? ` ${r.year}` : ''}
                </Text>
              </Card>
            ))}
          </View>
        </View>
      ) : null}
    </>
  );
}

function PeopleGrid({
  people,
  empty,
}: {
  people: { id: number; name: string; meta: string; image: string | null }[];
  empty: string;
}) {
  const t = useTokens();
  if (!people.length) return <EmptyState title="Nothing listed" body={empty} />;

  return (
    <View style={{ gap: 10 }}>
      {people.map((p) => (
        <View key={p.id} style={{ flexDirection: 'row', gap: 11, alignItems: 'center' }}>
          <Cover uri={p.image} radius={R.pill} stripe={[4, 9]} style={{ width: 44, height: 44 }} />
          <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
            <Text numberOfLines={1} style={sans(12.5, 600, { color: t.fg })}>
              {p.name}
            </Text>
            <Text numberOfLines={1} style={mono(9, 500, { ls: 0.06, upper: true, color: t.fg3 })}>
              {p.meta}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
