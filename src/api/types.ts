export type MediaType = 'ANIME' | 'MANGA';

export type MediaFormat =
  | 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC'
  | 'MANGA' | 'NOVEL' | 'ONE_SHOT';

export type MediaListStatus =
  | 'CURRENT' | 'PLANNING' | 'COMPLETED' | 'DROPPED' | 'PAUSED' | 'REPEATING';

export type MediaSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

export type FuzzyDate = { year: number | null; month: number | null; day: number | null };

export type MediaTitle = {
  romaji: string | null;
  english: string | null;
  native: string | null;
};

export type CoverImage = {
  extraLarge: string | null;
  large: string | null;
  color: string | null;
};

export type NextAiringEpisode = {
  episode: number;
  timeUntilAiring: number;
  airingAt: number;
};

export type Media = {
  id: number;
  type: MediaType;
  title: MediaTitle;
  coverImage: CoverImage | null;
  bannerImage: string | null;
  format: MediaFormat | null;
  status: string | null;
  episodes: number | null;
  chapters: number | null;
  volumes: number | null;
  duration: number | null;
  averageScore: number | null;
  meanScore: number | null;
  popularity: number | null;
  favourites: number | null;
  genres: string[] | null;
  season: MediaSeason | null;
  seasonYear: number | null;
  startDate: FuzzyDate | null;
  endDate: FuzzyDate | null;
  description: string | null;
  source: string | null;
  synonyms: string[] | null;
  isAdult: boolean | null;
  nextAiringEpisode: NextAiringEpisode | null;
  mediaListEntry: MediaListEntry | null;
  studios?: { edges: { isMain: boolean; node: { id: number; name: string } }[] };
  tags?: { name: string; rank: number; isMediaSpoiler: boolean }[];
  stats?: {
    scoreDistribution: { score: number; amount: number }[] | null;
    statusDistribution: { status: MediaListStatus; amount: number }[] | null;
  } | null;
  rankings?: { id: number; rank: number; type: string; context: string; year: number | null; allTime: boolean }[];
  relations?: { edges: { relationType: string; node: RelatedMedia }[] };
  recommendations?: { nodes: { mediaRecommendation: Media | null }[] };
  characters?: { edges: { role: string; node: { id: number; name: { full: string }; image: { medium: string | null } | null } }[] };
  staff?: { edges: { role: string; node: { id: number; name: { full: string }; image: { medium: string | null } | null } }[] };
  externalLinks?: { id: number; site: string; url: string; type: string | null }[];
  trailer?: { id: string; site: string; thumbnail: string | null } | null;
};

export type RelatedMedia = Pick<
  Media,
  'id' | 'type' | 'title' | 'coverImage' | 'format' | 'status' | 'episodes' | 'chapters'
>;

export type MediaListEntry = {
  id: number;
  status: MediaListStatus | null;
  score: number | null;
  progress: number | null;
  progressVolumes: number | null;
  repeat: number | null;
  private: boolean | null;
  notes: string | null;
  startedAt: FuzzyDate | null;
  completedAt: FuzzyDate | null;
  media?: Media;
};

export type ScoreFormat =
  | 'POINT_100' | 'POINT_10_DECIMAL' | 'POINT_10' | 'POINT_5' | 'POINT_3';

export type Viewer = {
  id: number;
  name: string;
  about: string | null;
  avatar: { large: string | null } | null;
  bannerImage: string | null;
  createdAt: number | null;
  options: { titleLanguage: string | null; displayAdultContent: boolean | null } | null;
  mediaListOptions: { scoreFormat: ScoreFormat | null } | null;
  statistics?: UserStatistics;
  favourites?: { anime: { nodes: Media[] }; manga: { nodes: Media[] } };
  unreadNotificationCount?: number;
};

export type UserStatistics = {
  anime: {
    count: number;
    episodesWatched: number;
    minutesWatched: number;
    meanScore: number;
    genres: { genre: string; count: number }[];
    formats: { format: string; count: number }[];
    scores: { score: number; count: number }[];
  };
  manga: {
    count: number;
    chaptersRead: number;
    volumesRead: number;
    meanScore: number;
  };
};

export type PageInfo = {
  total: number | null;
  currentPage: number;
  lastPage: number | null;
  hasNextPage: boolean;
  perPage: number;
};

export type Activity = {
  id: number;
  type: string;
  status: string | null;
  progress: string | null;
  text: string | null;
  likeCount: number;
  replyCount: number;
  createdAt: number;
  user: { id: number; name: string; avatar: { medium: string | null } | null } | null;
  media: Pick<Media, 'id' | 'title' | 'coverImage' | 'type'> | null;
};

export type AniNotification = {
  id: number;
  type: string;
  createdAt: number;
  /** Airing */
  episode?: number;
  contexts?: string[];
  media?: Pick<Media, 'id' | 'title' | 'coverImage'> | null;
  /** Social / forum */
  context?: string;
  user?: { id: number; name: string; avatar: { medium: string | null } | null } | null;
  thread?: { id: number; title: string } | null;
};
