import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { SeasonInfo, currentSeason } from '../lib/format';
import { useListCache } from '../state/listCache';
import { gqlRequest } from './client';
import {
  ACTIVITY_FEED,
  DISCOVER,
  GENRE_COLLECTION,
  MEDIA_DETAIL,
  MEDIA_LIST_COLLECTION,
  NOTIFICATIONS,
  SEARCH,
  SEARCH_CHARACTERS,
  SEARCH_STAFF,
  SEARCH_STUDIOS,
  SEASONAL,
  USER_PROFILE,
} from './queries';
import {
  Activity,
  AniNotification,
  Media,
  MediaListEntry,
  MediaType,
  PageInfo,
  Viewer,
} from './types';

type PageResult<T> = { pageInfo: PageInfo } & T;

/** Seeds the list cache whenever a query brings back `mediaListEntry` data. */
function useIngest(media: (Media | null | undefined)[] | undefined) {
  const { ingestMedia } = useListCache();
  useEffect(() => {
    if (media?.length) ingestMedia(media);
  }, [media, ingestMedia]);
}

export function useDiscover(season: SeasonInfo = currentSeason()) {
  const query = useQuery({
    queryKey: ['discover', season.season, season.year],
    queryFn: () =>
      gqlRequest<{
        trending: { media: Media[] };
        popular: { media: Media[] };
        seasonal: { media: Media[] };
        topRated: { media: Media[] };
      }>(DISCOVER, { season: season.season, seasonYear: season.year }),
    staleTime: 5 * 60 * 1000,
  });

  useIngest([
    ...(query.data?.trending.media ?? []),
    ...(query.data?.seasonal.media ?? []),
    ...(query.data?.popular.media ?? []),
  ]);

  return query;
}

export type SearchParams = {
  search: string;
  type: MediaType;
  genres: string[];
  year: number | null;
  sort: string;
  isAdult: boolean;
};

export function useMediaSearch(params: SearchParams, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: ['search', params],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      gqlRequest<{ Page: PageResult<{ media: Media[] }> }>(
        SEARCH,
        {
          page: pageParam,
          search: params.search || undefined,
          type: params.type,
          genres: params.genres.length ? params.genres : undefined,
          seasonYear: params.year ?? undefined,
          sort: [params.sort],
          isAdult: params.isAdult ? undefined : false,
        },
        { signal }
      ),
    getNextPageParam: (last) => (last.Page.pageInfo.hasNextPage ? last.Page.pageInfo.currentPage + 1 : undefined),
  });

  const media = query.data?.pages.flatMap((p) => p.Page.media) ?? [];
  useIngest(media);
  return { ...query, media };
}

export function useCharacterSearch(search: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['search-characters', search],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      gqlRequest<{
        Page: PageResult<{
          characters: {
            id: number;
            name: { full: string; native: string | null };
            image: { large: string | null; medium: string | null } | null;
            favourites: number;
            media: { nodes: { id: number; title: { romaji: string | null; english: string | null; native: string | null } }[] };
          }[];
        }>;
      }>(SEARCH_CHARACTERS, { page: pageParam, search }, { signal }),
    getNextPageParam: (last) => (last.Page.pageInfo.hasNextPage ? last.Page.pageInfo.currentPage + 1 : undefined),
  });
}

export function useStaffSearch(search: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['search-staff', search],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      gqlRequest<{
        Page: PageResult<{
          staff: {
            id: number;
            name: { full: string; native: string | null };
            image: { large: string | null; medium: string | null } | null;
            favourites: number;
            primaryOccupations: string[] | null;
          }[];
        }>;
      }>(SEARCH_STAFF, { page: pageParam, search }, { signal }),
    getNextPageParam: (last) => (last.Page.pageInfo.hasNextPage ? last.Page.pageInfo.currentPage + 1 : undefined),
  });
}

export function useStudioSearch(search: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['search-studios', search],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      gqlRequest<{
        Page: PageResult<{
          studios: {
            id: number;
            name: string;
            favourites: number;
            media: { nodes: Media[] };
          }[];
        }>;
      }>(SEARCH_STUDIOS, { page: pageParam, search }, { signal }),
    getNextPageParam: (last) => (last.Page.pageInfo.hasNextPage ? last.Page.pageInfo.currentPage + 1 : undefined),
  });
}

export function useMediaDetail(id: number) {
  const query = useQuery({
    queryKey: ['media', id],
    queryFn: () => gqlRequest<{ Media: Media }>(MEDIA_DETAIL, { id }),
    enabled: Number.isFinite(id),
    staleTime: 10 * 60 * 1000,
  });

  useIngest(query.data?.Media ? [query.data.Media] : undefined);
  return query;
}

export function useSeasonal(season: SeasonInfo, formats: string[] | null) {
  const query = useInfiniteQuery({
    queryKey: ['seasonal', season.season, season.year, formats],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      gqlRequest<{ Page: PageResult<{ media: Media[] }> }>(
        SEASONAL,
        { season: season.season, seasonYear: season.year, page: pageParam, formats: formats?.length ? formats : undefined },
        { signal }
      ),
    getNextPageParam: (last) => (last.Page.pageInfo.hasNextPage ? last.Page.pageInfo.currentPage + 1 : undefined),
    staleTime: 5 * 60 * 1000,
  });

  const media = query.data?.pages.flatMap((p) => p.Page.media) ?? [];
  useIngest(media);
  return { ...query, media };
}

export type ListGroup = { name: string; status: string | null; isCustomList: boolean; entries: MediaListEntry[] };

export function useListCollection(userId: number | undefined, type: MediaType) {
  const { ingestEntries } = useListCache();
  const query = useQuery({
    queryKey: ['list-collection', userId, type],
    enabled: !!userId,
    queryFn: () =>
      gqlRequest<{ MediaListCollection: { lists: ListGroup[] } }>(MEDIA_LIST_COLLECTION, { userId, type }),
    staleTime: 60 * 1000,
  });

  const lists = query.data?.MediaListCollection.lists ?? [];
  useEffect(() => {
    const all = lists.flatMap((l) => l.entries);
    if (all.length) ingestEntries(all);
    // `lists` is a fresh array each render; the query data identity is the real signal.
  }, [query.data, ingestEntries]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...query, lists };
}

export function useUserProfile(userId: number | undefined) {
  return useQuery({
    queryKey: ['user', userId],
    enabled: !!userId,
    queryFn: () =>
      gqlRequest<{
        User: Viewer;
        Following: { pageInfo: { total: number } };
        Followers: { pageInfo: { total: number } };
      }>(USER_PROFILE, { id: userId }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActivityFeed(isFollowing: boolean, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['activity', isFollowing],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      gqlRequest<{ Page: PageResult<{ activities: Activity[] }> }>(
        ACTIVITY_FEED,
        { page: pageParam, isFollowing },
        { signal }
      ),
    getNextPageParam: (last) => (last.Page.pageInfo.hasNextPage ? last.Page.pageInfo.currentPage + 1 : undefined),
  });
}

export function useNotifications(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    enabled,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      gqlRequest<{ Page: PageResult<{ notifications: AniNotification[] }> }>(
        NOTIFICATIONS,
        { page: pageParam, resetCount: pageParam === 1 },
        { signal }
      ),
    getNextPageParam: (last) => (last.Page.pageInfo.hasNextPage ? last.Page.pageInfo.currentPage + 1 : undefined),
  });
}

export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: () => gqlRequest<{ GenreCollection: string[] }>(GENRE_COLLECTION),
    staleTime: 24 * 60 * 60 * 1000,
  });
}
