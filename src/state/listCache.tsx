import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { gqlRequest } from '../api/client';
import { DELETE_ENTRY, SAVE_ENTRY } from '../api/queries';
import { FuzzyDate, Media, MediaListEntry, MediaListStatus } from '../api/types';
import { useToast } from '../components/Toast';

export type CachedEntry = {
  mediaId: number;
  entryId: number | null;
  status: MediaListStatus | null;
  /** Always AniList's raw 0–100 score; display formatting happens at the edge. */
  scoreRaw: number;
  progress: number;
  repeat: number;
  private: boolean;
  startedAt: FuzzyDate | null;
};

type Patch = Partial<Omit<CachedEntry, 'mediaId'>>;

type ListCacheValue = {
  entries: Record<number, CachedEntry>;
  get: (mediaId: number) => CachedEntry | undefined;
  /** Seed the cache from any query result that carried `mediaListEntry`. */
  ingestMedia: (media: (Media | null | undefined)[]) => void;
  ingestEntries: (entries: MediaListEntry[]) => void;
  save: (mediaId: number, patch: Patch) => Promise<boolean>;
  increment: (mediaId: number, total: number | null) => Promise<boolean>;
  remove: (mediaId: number) => Promise<boolean>;
};

const ListCacheContext = createContext<ListCacheValue | null>(null);

function fromEntry(mediaId: number, e: MediaListEntry): CachedEntry {
  return {
    mediaId,
    entryId: e.id ?? null,
    status: e.status ?? null,
    scoreRaw: e.score ?? 0,
    progress: e.progress ?? 0,
    repeat: e.repeat ?? 0,
    private: !!e.private,
    startedAt: e.startedAt ?? null,
  };
}

export function ListCacheProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<Record<number, CachedEntry>>({});
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const toast = useToast();

  const ingestMedia = useCallback((media: (Media | null | undefined)[]) => {
    setEntries((prev) => {
      let next = prev;
      for (const m of media) {
        if (!m?.id || !m.mediaListEntry) continue;
        // A local optimistic value is newer than whatever the server sent with this page.
        if (next[m.id]) continue;
        if (next === prev) next = { ...prev };
        next[m.id] = fromEntry(m.id, m.mediaListEntry);
      }
      return next;
    });
  }, []);

  const ingestEntries = useCallback((list: MediaListEntry[]) => {
    setEntries((prev) => {
      const next = { ...prev };
      for (const e of list) {
        const mediaId = e.media?.id;
        if (!mediaId) continue;
        next[mediaId] = fromEntry(mediaId, e);
      }
      return next;
    });
  }, []);

  const write = useCallback((mediaId: number, value: CachedEntry | null) => {
    setEntries((prev) => {
      const next = { ...prev };
      if (value) next[mediaId] = value;
      else delete next[mediaId];
      return next;
    });
  }, []);

  const save = useCallback(
    async (mediaId: number, patch: Patch) => {
      const before = entriesRef.current[mediaId] ?? null;
      const optimistic: CachedEntry = {
        mediaId,
        entryId: before?.entryId ?? null,
        status: before?.status ?? 'CURRENT',
        scoreRaw: before?.scoreRaw ?? 0,
        progress: before?.progress ?? 0,
        repeat: before?.repeat ?? 0,
        private: before?.private ?? false,
        startedAt: before?.startedAt ?? null,
        ...patch,
      };
      write(mediaId, optimistic);

      try {
        const data = await gqlRequest<{ SaveMediaListEntry: MediaListEntry }>(SAVE_ENTRY, {
          mediaId,
          status: optimistic.status,
          progress: optimistic.progress,
          scoreRaw: optimistic.scoreRaw,
          private: optimistic.private,
          repeat: optimistic.repeat,
          startedAt: optimistic.startedAt ?? undefined,
        });
        write(mediaId, fromEntry(mediaId, data.SaveMediaListEntry));
        return true;
      } catch (err) {
        write(mediaId, before);
        toast.show(err instanceof Error ? err.message : 'Could not save to AniList.', 'error');
        return false;
      }
    },
    [write, toast]
  );

  const increment = useCallback(
    async (mediaId: number, total: number | null) => {
      const current = entriesRef.current[mediaId];
      const next = (current?.progress ?? 0) + 1;
      if (total != null && next > total) return false;

      const reachedEnd = total != null && next === total;
      const ok = await save(mediaId, {
        progress: next,
        status: reachedEnd ? 'COMPLETED' : current?.status ?? 'CURRENT',
      });
      if (ok && reachedEnd) toast.show('Marked completed.', 'info');
      return ok;
    },
    [save, toast]
  );

  const remove = useCallback(
    async (mediaId: number) => {
      const before = entriesRef.current[mediaId];
      if (!before?.entryId) {
        write(mediaId, null);
        return true;
      }
      write(mediaId, null);
      try {
        await gqlRequest(DELETE_ENTRY, { id: before.entryId });
        return true;
      } catch (err) {
        write(mediaId, before);
        toast.show(err instanceof Error ? err.message : 'Could not delete the entry.', 'error');
        return false;
      }
    },
    [write, toast]
  );

  const get = useCallback((mediaId: number) => entriesRef.current[mediaId], []);

  const value = useMemo<ListCacheValue>(
    () => ({ entries, get, ingestMedia, ingestEntries, save, increment, remove }),
    [entries, get, ingestMedia, ingestEntries, save, increment, remove]
  );

  return <ListCacheContext.Provider value={value}>{children}</ListCacheContext.Provider>;
}

export function useListCache() {
  const ctx = useContext(ListCacheContext);
  if (!ctx) throw new Error('useListCache must be used inside ListCacheProvider');
  return ctx;
}

/** Subscribes a single row/card to just its own entry. */
export function useEntry(mediaId: number | undefined) {
  const { entries } = useListCache();
  return mediaId ? entries[mediaId] : undefined;
}
