import { useEffect, useState } from 'react';

/**
 * Airing countdowns tick live from `nextAiringEpisode.timeUntilAiring`.
 * Ticks once a minute — the chip never shows seconds.
 */
export function useCountdown(timeUntilAiring: number | null | undefined) {
  const [remaining, setRemaining] = useState(timeUntilAiring ?? 0);

  useEffect(() => {
    if (timeUntilAiring == null) return;
    setRemaining(timeUntilAiring);
    const startedAt = Date.now();
    const id = setInterval(() => {
      setRemaining(Math.max(0, timeUntilAiring - Math.floor((Date.now() - startedAt) / 1000)));
    }, 60_000);
    return () => clearInterval(id);
  }, [timeUntilAiring]);

  return remaining;
}
