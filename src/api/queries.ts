/** Fields every poster, row and rail needs. Kept small — detail asks for the rest. */
export const MEDIA_CARD = `
fragment MediaCard on Media {
  id
  type
  format
  status
  episodes
  chapters
  averageScore
  popularity
  season
  seasonYear
  genres
  isAdult
  title { romaji english native }
  coverImage { extraLarge large color }
  startDate { year month day }
  nextAiringEpisode { episode timeUntilAiring airingAt }
  mediaListEntry { id status score progress private repeat }
}
`;

export const TRENDING = `
${MEDIA_CARD}
query Trending($page: Int = 1, $perPage: Int = 20, $type: MediaType = ANIME, $sort: [MediaSort] = [TRENDING_DESC]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total currentPage lastPage hasNextPage perPage }
    media(type: $type, sort: $sort, isAdult: false) { ...MediaCard }
  }
}
`;

/** The Discover screen in one round trip — AniList counts it as a single request. */
export const DISCOVER = `
${MEDIA_CARD}
query Discover($season: MediaSeason, $seasonYear: Int) {
  trending: Page(page: 1, perPage: 20) {
    media(type: ANIME, sort: [TRENDING_DESC], isAdult: false) { ...MediaCard }
  }
  popular: Page(page: 1, perPage: 20) {
    media(type: ANIME, sort: [POPULARITY_DESC], isAdult: false) { ...MediaCard }
  }
  seasonal: Page(page: 1, perPage: 20) {
    media(type: ANIME, season: $season, seasonYear: $seasonYear, sort: [POPULARITY_DESC], isAdult: false) { ...MediaCard }
  }
  topRated: Page(page: 1, perPage: 20) {
    media(type: ANIME, sort: [SCORE_DESC], isAdult: false) { ...MediaCard }
  }
}
`;

export const SEARCH = `
${MEDIA_CARD}
query Search(
  $page: Int = 1
  $perPage: Int = 20
  $search: String
  $type: MediaType = ANIME
  $genres: [String]
  $seasonYear: Int
  $sort: [MediaSort] = [SEARCH_MATCH]
  $isAdult: Boolean = false
) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total currentPage lastPage hasNextPage perPage }
    media(
      search: $search
      type: $type
      genre_in: $genres
      seasonYear: $seasonYear
      sort: $sort
      isAdult: $isAdult
    ) { ...MediaCard }
  }
}
`;

export const SEARCH_CHARACTERS = `
query SearchCharacters($page: Int = 1, $search: String) {
  Page(page: $page, perPage: 25) {
    pageInfo { hasNextPage currentPage }
    characters(search: $search, sort: [SEARCH_MATCH]) {
      id
      name { full native }
      image { large medium }
      favourites
      media(perPage: 1, sort: [POPULARITY_DESC]) { nodes { id title { romaji english native } } }
    }
  }
}
`;

export const SEARCH_STAFF = `
query SearchStaff($page: Int = 1, $search: String) {
  Page(page: $page, perPage: 25) {
    pageInfo { hasNextPage currentPage }
    staff(search: $search, sort: [SEARCH_MATCH]) {
      id
      name { full native }
      image { large medium }
      favourites
      primaryOccupations
    }
  }
}
`;

export const SEARCH_STUDIOS = `
query SearchStudios($page: Int = 1, $search: String) {
  Page(page: $page, perPage: 25) {
    pageInfo { hasNextPage currentPage }
    studios(search: $search, sort: [SEARCH_MATCH]) {
      id
      name
      favourites
      media(perPage: 3, sort: [POPULARITY_DESC]) { nodes { id title { romaji english native } coverImage { large } } }
    }
  }
}
`;

export const MEDIA_DETAIL = `
${MEDIA_CARD}
query MediaDetail($id: Int!) {
  Media(id: $id) {
    ...MediaCard
    bannerImage
    description(asHtml: false)
    duration
    volumes
    meanScore
    favourites
    source
    synonyms
    endDate { year month day }
    trailer { id site thumbnail }
    studios { edges { isMain node { id name } } }
    tags { name rank isMediaSpoiler }
    stats {
      scoreDistribution { score amount }
      statusDistribution { status amount }
    }
    rankings { id rank type context year allTime }
    relations {
      edges {
        relationType(version: 2)
        node { id type format status episodes chapters title { romaji english native } coverImage { large color } }
      }
    }
    recommendations(sort: RATING_DESC, perPage: 12) {
      nodes { mediaRecommendation { ...MediaCard } }
    }
    characters(sort: [ROLE, RELEVANCE], perPage: 12) {
      edges { role node { id name { full } image { medium } } }
    }
    staff(perPage: 10) {
      edges { role node { id name { full } image { medium } } }
    }
    externalLinks { id site url type }
  }
}
`;

export const SEASONAL = `
${MEDIA_CARD}
query Seasonal($season: MediaSeason!, $seasonYear: Int!, $page: Int = 1, $formats: [MediaFormat]) {
  Page(page: $page, perPage: 30) {
    pageInfo { hasNextPage currentPage }
    media(
      type: ANIME
      season: $season
      seasonYear: $seasonYear
      format_in: $formats
      sort: [POPULARITY_DESC]
      isAdult: false
    ) {
      ...MediaCard
      studios(isMain: true) { edges { isMain node { id name } } }
    }
  }
}
`;

export const MEDIA_LIST_COLLECTION = `
${MEDIA_CARD}
query ListCollection($userId: Int!, $type: MediaType!) {
  MediaListCollection(userId: $userId, type: $type) {
    lists {
      name
      status
      isCustomList
      entries {
        id
        status
        score
        progress
        progressVolumes
        repeat
        private
        notes
        startedAt { year month day }
        completedAt { year month day }
        media { ...MediaCard }
      }
    }
  }
}
`;

export const VIEWER = `
query Viewer {
  Viewer {
    id
    name
    about
    bannerImage
    createdAt
    unreadNotificationCount
    avatar { large }
    options { titleLanguage displayAdultContent }
    mediaListOptions { scoreFormat }
  }
}
`;

export const USER_PROFILE = `
${MEDIA_CARD}
query UserProfile($id: Int!) {
  User(id: $id) {
    id
    name
    about
    bannerImage
    createdAt
    avatar { large }
    options { titleLanguage displayAdultContent }
    mediaListOptions { scoreFormat }
    statistics {
      anime {
        count
        episodesWatched
        minutesWatched
        meanScore
        genres(sort: COUNT_DESC, limit: 8) { genre count }
        formats(sort: COUNT_DESC) { format count }
        scores(sort: MEAN_SCORE) { score count }
      }
      manga { count chaptersRead volumesRead meanScore }
    }
    favourites {
      anime(perPage: 12) { nodes { ...MediaCard } }
      manga(perPage: 12) { nodes { ...MediaCard } }
    }
  }
  Following: Page(perPage: 1) { pageInfo { total } following(userId: $id) { id } }
  Followers: Page(perPage: 1) { pageInfo { total } followers(userId: $id) { id } }
}
`;

export const SAVE_ENTRY = `
mutation SaveEntry(
  $mediaId: Int!
  $status: MediaListStatus
  $progress: Int
  $scoreRaw: Int
  $private: Boolean
  $repeat: Int
  $startedAt: FuzzyDateInput
) {
  SaveMediaListEntry(
    mediaId: $mediaId
    status: $status
    progress: $progress
    scoreRaw: $scoreRaw
    private: $private
    repeat: $repeat
    startedAt: $startedAt
  ) {
    id
    status
    score
    progress
    private
    repeat
    startedAt { year month day }
  }
}
`;

export const DELETE_ENTRY = `
mutation DeleteEntry($id: Int!) {
  DeleteMediaListEntry(id: $id) { deleted }
}
`;

export const ACTIVITY_FEED = `
query ActivityFeed($page: Int = 1, $isFollowing: Boolean) {
  Page(page: $page, perPage: 25) {
    pageInfo { hasNextPage currentPage }
    activities(isFollowing: $isFollowing, sort: ID_DESC, type_not: MESSAGE) {
      ... on ListActivity {
        id type status progress likeCount replyCount createdAt
        user { id name avatar { medium } }
        media { id type title { romaji english native } coverImage { large } }
      }
      ... on TextActivity {
        id type text likeCount replyCount createdAt
        user { id name avatar { medium } }
      }
    }
  }
}
`;

export const NOTIFICATIONS = `
query Notifications($page: Int = 1, $resetCount: Boolean = false) {
  Page(page: $page, perPage: 30) {
    pageInfo { hasNextPage currentPage }
    notifications(resetNotificationCount: $resetCount) {
      ... on AiringNotification {
        id type createdAt episode contexts
        media { id title { romaji english native } coverImage { large } }
      }
      ... on FollowingNotification {
        id type createdAt context
        user { id name avatar { medium } }
      }
      ... on ActivityLikeNotification {
        id type createdAt context
        user { id name avatar { medium } }
      }
      ... on ActivityReplyNotification {
        id type createdAt context
        user { id name avatar { medium } }
      }
      ... on ThreadCommentMentionNotification {
        id type createdAt context
        user { id name avatar { medium } }
        thread { id title }
      }
      ... on RelatedMediaAdditionNotification {
        id type createdAt context
        media { id title { romaji english native } coverImage { large } }
      }
      ... on MediaDataChangeNotification {
        id type createdAt context reason
        media { id title { romaji english native } coverImage { large } }
      }
    }
  }
}
`;

export const GENRE_COLLECTION = `
query Genres { GenreCollection }
`;
