import { useMemo } from 'react';

import { useListCollection } from '../api/hooks';
import { Media } from '../api/types';
import { useAuth } from '../state/auth';
import { useListCache } from '../state/listCache';

/**
 * The Watching list, ordered by how recently it moved. Guests get nothing —
 * the design hides tracking affordances entirely when signed out.
 */
export function useContinueWatching(): { media: Media[]; refetch: () => void } {
  const { viewer } = useAuth();
  const { entries } = useListCache();
  const { lists, refetch } = useListCollection(viewer?.id, 'ANIME');

  const media = useMemo(() => {
    const current = lists.find((l) => l.status === 'CURRENT' && !l.isCustomList);
    const rows = (current?.entries ?? [])
      .map((e) => e.media)
      .filter((m): m is Media => !!m)
      // A title with nothing left to watch has no place in "continue".
      .filter((m) => {
        const progress = entries[m.id]?.progress ?? 0;
        const aired = m.nextAiringEpisode ? m.nextAiringEpisode.episode - 1 : m.episodes ?? 0;
        return !aired || progress < aired;
      });
    return rows.slice(0, 12);
  }, [lists, entries]);

  return { media, refetch };
}
