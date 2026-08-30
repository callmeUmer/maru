import { useRouter } from 'expo-router';
import { useBottomTabBarHeight } from 'expo-router/js-tabs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  useCharacterSearch,
  useGenres,
  useMediaSearch,
  useStaffSearch,
  useStudioSearch,
} from '../../src/api/hooks';
import { Media, MediaType } from '../../src/api/types';
import { Cover } from '../../src/components/Cover';
import { MagnifierIcon } from '../../src/components/Icons';
import { PickerSheet } from '../../src/components/PickerSheet';
import { RowSkeleton } from '../../src/components/Skeleton';
import { EmptyState, Press, Pill } from '../../src/components/primitives';
import { compact, mediaMeta, pickTitle } from '../../src/lib/format';
import { useSettings } from '../../src/state/settings';
import { useTokens } from '../../src/theme/ThemeProvider';
import { R } from '../../src/theme/tokens';
import { display, mono, sans } from '../../src/theme/type';

type SearchKind = 'ANIME' | 'MANGA' | 'CHARACTERS' | 'STAFF' | 'STUDIOS';

const KINDS: { value: SearchKind; label: string }[] = [
  { value: 'ANIME', label: 'Anime' },
  { value: 'MANGA', label: 'Manga' },
  { value: 'CHARACTERS', label: 'Characters' },
  { value: 'STAFF', label: 'Staff' },
  { value: 'STUDIOS', label: 'Studios' },
];

const SORTS = [
  { value: 'SEARCH_MATCH', label: 'Best match' },
  { value: 'POPULARITY_DESC', label: 'Most popular' },
  { value: 'SCORE_DESC', label: 'Highest rated' },
  { value: 'TRENDING_DESC', label: 'Trending' },
  { value: 'START_DATE_DESC', label: 'Newest' },
];

const YEARS = Array.from({ length: 40 }, (_, i) => new Date().getFullYear() + 1 - i);

/** Screen 2 — the keyboard is up most of the time, so the results list owns the scroll. */
export default function SearchScreen() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { adultContent, titleLanguage } = useSettings();
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<SearchKind>('ANIME');
  const [genres, setGenres] = useState<string[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [sort, setSort] = useState('SEARCH_MATCH');
  const [picker, setPicker] = useState<'genre' | 'year' | 'sort' | null>(null);

  // Debounce 300ms, as specified in the handoff.
  useEffect(() => {
    const id = setTimeout(() => setQuery(text.trim()), 300);
    return () => clearTimeout(id);
  }, [text]);

  const isMedia = kind === 'ANIME' || kind === 'MANGA';
  const hasCriteria = query.length > 0 || genres.length > 0 || year != null;

  const media = useMediaSearch(
    {
      search: query,
      type: (isMedia ? kind : 'ANIME') as MediaType,
      genres,
      year,
      sort: query ? sort : sort === 'SEARCH_MATCH' ? 'TRENDING_DESC' : sort,
      isAdult: adultContent,
    },
    isMedia
  );
  const characters = useCharacterSearch(query, kind === 'CHARACTERS' && query.length > 0);
  const staff = useStaffSearch(query, kind === 'STAFF' && query.length > 0);
  const studios = useStudioSearch(query, kind === 'STUDIOS' && query.length > 0);
  const { data: genreData } = useGenres();

  const genreOptions = useMemo(
    () => (genreData?.GenreCollection ?? []).map((g) => ({ value: g, label: g })),
    [genreData]
  );

  const header = (
    <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 12, gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <View
          style={{
            flex: 1,
            height: 38,
            borderRadius: R.input,
            backgroundColor: t.bg2,
            borderWidth: 1,
            borderColor: text ? t.acc : t.line,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 9,
            paddingHorizontal: 12,
          }}
        >
          <MagnifierIcon color={t.fg2} />
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder="Search"
            placeholderTextColor={t.fg3}
            selectionColor={t.acc}
            autoCorrect={false}
            returnKeyType="search"
            style={[sans(14, 500, { color: t.fg }), { flex: 1, padding: 0 }]}
          />
        </View>
        {text ? (
          <Press
            onPress={() => {
              setText('');
              Keyboard.dismiss();
            }}
            hitSlop={8}
          >
            <Text style={sans(13, 600, { color: t.acc })}>Cancel</Text>
          </Press>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>
        {KINDS.map((k) => (
          <Pill key={k.value} label={k.label} active={kind === k.value} onPress={() => setKind(k.value)} />
        ))}
      </ScrollView>

      {isMedia ? (
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Dropdown label={genres.length ? `GENRE · ${genres.length}` : 'GENRE'} onPress={() => setPicker('genre')} />
          <Dropdown label={year ? String(year) : 'YEAR'} onPress={() => setPicker('year')} />
          <Dropdown label={SORTS.find((s) => s.value === sort)?.label.toUpperCase() ?? 'SORT'} onPress={() => setPicker('sort')} />
        </View>
      ) : null}
    </View>
  );

  const listBottom = tabBarHeight + 16;

  if (!isMedia) {
    const active = kind === 'CHARACTERS' ? characters : kind === 'STAFF' ? staff : studios;
    const rows: PersonRow[] =
      kind === 'CHARACTERS'
        ? (characters.data?.pages.flatMap((p) => p.Page.characters) ?? []).map((c) => ({
            id: c.id,
            title: c.name.full,
            meta: c.media.nodes[0] ? pickTitle(c.media.nodes[0].title, titleLanguage) : `${compact(c.favourites)} FAVOURITES`,
            image: c.image?.large ?? null,
            round: true,
          }))
        : kind === 'STAFF'
          ? (staff.data?.pages.flatMap((p) => p.Page.staff) ?? []).map((s) => ({
              id: s.id,
              title: s.name.full,
              meta: (s.primaryOccupations ?? []).join(' · ').toUpperCase() || `${compact(s.favourites)} FAVOURITES`,
              image: s.image?.large ?? null,
              round: true,
            }))
          : (studios.data?.pages.flatMap((p) => p.Page.studios) ?? []).map((s) => ({
              id: s.id,
              title: s.name,
              meta: s.media.nodes
                .slice(0, 2)
                .map((m) => pickTitle(m.title, titleLanguage))
                .join(' · '),
              image: s.media.nodes[0]?.coverImage?.large ?? null,
              round: false,
            }));

    return (
      <View style={{ flex: 1, backgroundColor: t.bg }}>
        <FlatList
          data={rows}
          keyExtractor={(r) => String(r.id)}
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          contentContainerStyle={{ paddingBottom: listBottom }}
          onEndReached={() => active.hasNextPage && active.fetchNextPage()}
          onEndReachedThreshold={0.6}
          renderItem={({ item }) => <PersonRowView row={item} />}
          ListEmptyComponent={
            query ? (
              active.isLoading ? (
                <RowSkeleton count={5} />
              ) : (
                <EmptyState title="Nothing matched" body="Try a shorter query or a different type." />
              )
            ) : (
              <EmptyState title="Search AniList" body="Characters, staff and studios are searched by name." />
            )
          }
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={media.media}
        keyExtractor={(m) => String(m.id)}
        ListHeaderComponent={
          <>
            {header}
            <Text
              style={[
                mono(9.5, 500, { ls: 0.14, upper: true, color: t.fg3 }),
                { paddingHorizontal: 16, paddingBottom: 10 },
              ]}
            >
              {hasCriteria ? 'Results' : 'Suggestions'}
            </Text>
          </>
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={{ paddingBottom: listBottom }}
        onEndReached={() => media.hasNextPage && media.fetchNextPage()}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => <SuggestionRow media={item} onPress={() => router.push(`/media/${item.id}`)} />}
        ListEmptyComponent={
          media.isLoading ? <RowSkeleton count={6} /> : <EmptyState title="Nothing matched" body="Try a different title, genre or year." />
        }
      />

      <PickerSheet
        visible={picker === 'genre'}
        title="Genre"
        multi
        options={genreOptions}
        selected={genres}
        onSelect={(g) => setGenres((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]))}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        visible={picker === 'year'}
        title="Year"
        options={[{ value: 0, label: 'Any year' }, ...YEARS.map((y) => ({ value: y, label: String(y) }))]}
        selected={year ? [year] : [0]}
        onSelect={(y) => setYear(y === 0 ? null : (y as number))}
        onClose={() => setPicker(null)}
      />
      <PickerSheet
        visible={picker === 'sort'}
        title="Sort"
        options={SORTS}
        selected={[sort]}
        onSelect={(s) => setSort(s)}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

function Dropdown({ label, onPress }: { label: string; onPress: () => void }) {
  const t = useTokens();
  return (
    <Press
      onPress={onPress}
      style={{
        flex: 1,
        height: 34,
        borderRadius: 9,
        backgroundColor: t.bg2,
        borderWidth: 1,
        borderColor: t.line,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
      }}
    >
      <Text numberOfLines={1} style={[mono(11, 500, { color: t.fg2 }), { flex: 1 }]}>
        {label}
      </Text>
      <Text style={mono(11, 500, { color: t.acc })}>▾</Text>
    </Press>
  );
}

function SuggestionRow({ media, onPress }: { media: Media; onPress: () => void }) {
  const t = useTokens();
  const { titleLanguage } = useSettings();
  return (
    <Press
      onPress={onPress}
      style={{ flexDirection: 'row', gap: 11, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}
    >
      <Cover uri={media.coverImage?.large} radius={5} stripe={[4, 9]} bordered={false} style={{ width: 30, height: 42 }} />
      <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <Text numberOfLines={1} style={display(13, 600, { lh: 1.2, color: t.fg })}>
          {pickTitle(media.title, titleLanguage)}
        </Text>
        <Text numberOfLines={1} style={mono(9.5, 500, { ls: 0.05, upper: true, color: t.fg2 })}>
          {mediaMeta(media)}
        </Text>
      </View>
      <Text style={mono(11, 600, { color: t.fg3 })}>{media.averageScore ?? '—'}</Text>
    </Press>
  );
}

type PersonRow = { id: number; title: string; meta: string; image: string | null; round: boolean };

function PersonRowView({ row }: { row: PersonRow }) {
  const t = useTokens();
  return (
    <View style={{ flexDirection: 'row', gap: 11, alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
      <Cover
        uri={row.image}
        radius={row.round ? R.pill : 5}
        stripe={[4, 9]}
        bordered={false}
        style={row.round ? { width: 42, height: 42 } : { width: 30, height: 42 }}
      />
      <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
        <Text numberOfLines={1} style={display(13, 600, { lh: 1.2, color: t.fg })}>
          {row.title}
        </Text>
        <Text numberOfLines={1} style={mono(9.5, 500, { ls: 0.05, upper: true, color: t.fg2 })}>
          {row.meta}
        </Text>
      </View>
    </View>
  );
}
