import { FuzzyDate, Media, MediaTitle, ScoreFormat } from '../api/types';
import { TitleLanguage } from '../state/settings';

export function pickTitle(title: MediaTitle | undefined | null, lang: TitleLanguage): string {
  if (!title) return 'Untitled';
  const order: Record<TitleLanguage, (string | null)[]> = {
    romaji: [title.romaji, title.english, title.native],
    english: [title.english, title.romaji, title.native],
    native: [title.native, title.romaji, title.english],
  };
  return order[lang].find(Boolean) ?? 'Untitled';
}

const FORMAT_LABEL: Record<string, string> = {
  TV: 'TV',
  TV_SHORT: 'TV Short',
  MOVIE: 'Movie',
  SPECIAL: 'Special',
  OVA: 'OVA',
  ONA: 'ONA',
  MUSIC: 'Music',
  MANGA: 'Manga',
  NOVEL: 'Light Novel',
  ONE_SHOT: 'One Shot',
};

export const formatLabel = (f: string | null | undefined) => (f ? FORMAT_LABEL[f] ?? f : '—');

/** The `TV · 28 EP` line under a poster. */
export function mediaMeta(media: Media | null | undefined): string {
  if (!media) return '';
  const parts = [formatLabel(media.format)];
  if (media.type === 'MANGA') {
    if (media.chapters) parts.push(`${media.chapters} CH`);
  } else if (media.episodes) {
    parts.push(`${media.episodes} EP`);
  }
  if (media.seasonYear) parts.push(String(media.seasonYear));
  return parts.join(' · ');
}

export function statusLabel(status: string | null | undefined): string {
  if (!status) return '—';
  return status
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

/** AniList stores scoreRaw 0–100; render it in the format the user chose. */
export function formatScore(scoreRaw: number | null | undefined, format: ScoreFormat): string {
  if (!scoreRaw) return '—';
  switch (format) {
    case 'POINT_100':
      return String(Math.round(scoreRaw));
    case 'POINT_10':
      return String(Math.round(scoreRaw / 10));
    case 'POINT_5':
      return String(Math.round(scoreRaw / 20));
    case 'POINT_3':
      return ['—', '🙁', '😐', '🙂'][Math.max(1, Math.min(3, Math.round(scoreRaw / 33)))];
    case 'POINT_10_DECIMAL':
    default:
      return (Math.round(scoreRaw) / 10).toFixed(1);
  }
}

export function scoreMax(format: ScoreFormat): number {
  switch (format) {
    case 'POINT_100':
      return 100;
    case 'POINT_10':
    case 'POINT_10_DECIMAL':
      return 10;
    case 'POINT_5':
      return 5;
    case 'POINT_3':
      return 3;
    default:
      return 10;
  }
}

/** 47600 -> 47.6K */
export function compact(n: number | null | undefined): string {
  if (n == null) return '—';
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

/** `2D 14H` — the airing countdown chip; ticks live from timeUntilAiring. */
export function countdown(seconds: number): string {
  if (seconds <= 0) return 'NOW';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return h > 0 ? `${d}D ${h}H` : `${d}D`;
  if (h > 0) return m > 0 ? `${h}H ${m}M` : `${h}H`;
  return `${m}M`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fuzzyDate(date: FuzzyDate | null | undefined): string {
  if (!date?.year) return '—';
  if (!date.month) return String(date.year);
  const month = MONTHS[date.month - 1] ?? '';
  return date.day ? `${month} ${date.day} ${date.year}` : `${month} ${date.year}`;
}

export function dateRange(start: FuzzyDate | null | undefined, end: FuzzyDate | null | undefined) {
  const from = fuzzyDate(start);
  if (!end?.year) return from === '—' ? '—' : `${from} → ?`;
  return `${from} → ${fuzzyDate(end)}`;
}

/** `14 MIN`, `3 H`, `2 D` — the mono timestamps on activity and notification rows. */
export function relativeTime(unixSeconds: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000 - unixSeconds));
  if (diff < 60) return 'NOW';
  if (diff < 3600) return `${Math.floor(diff / 60)} MIN`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} H`;
  if (diff < 172800) return 'YESTERDAY';
  if (diff < 2592000) return `${Math.floor(diff / 86400)} D`;
  return `${Math.floor(diff / 2592000)} MO`;
}

/** AniList descriptions carry a little HTML even with asHtml: false. */
export function stripHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export type SeasonInfo = { season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL'; year: number };

export function currentSeason(date = new Date()): SeasonInfo {
  const m = date.getMonth();
  const year = date.getFullYear();
  if (m <= 1) return { season: 'WINTER', year };
  if (m <= 4) return { season: 'SPRING', year };
  if (m <= 7) return { season: 'SUMMER', year };
  if (m <= 10) return { season: 'FALL', year };
  return { season: 'WINTER', year: year + 1 };
}

const SEASON_ORDER: SeasonInfo['season'][] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

export function stepSeason(info: SeasonInfo, delta: 1 | -1): SeasonInfo {
  const idx = SEASON_ORDER.indexOf(info.season) + delta;
  if (idx < 0) return { season: 'FALL', year: info.year - 1 };
  if (idx > 3) return { season: 'WINTER', year: info.year + 1 };
  return { season: SEASON_ORDER[idx], year: info.year };
}

export const seasonName = (s: SeasonInfo) =>
  `${s.season.charAt(0)}${s.season.slice(1).toLowerCase()} ${s.year}`;
