export type ContentType = 'movie' | 'series' | 'anime';
export type CatalogTitle = {
  id: string;
  slug: string;
  type: ContentType;
  title: string;
  originalTitle?: string;
  synopsis: string;
  shortSynopsis: string;
  releaseDate?: string;
  runtimeMinutes?: number;
  ageRating?: string;
  originalLanguage?: string;
  countryCodes: string[];
  posterPath?: string;
  backdropPath?: string;
  status: 'announced' | 'ongoing' | 'completed' | 'cancelled';
  genres: string[];
};

export type CatalogEpisode = {
  id: string;
  episodeNumber: number;
  title: string;
  synopsis?: string;
  runtimeSeconds?: number;
  thumbnailPath?: string;
};
export type CatalogSeason = {
  id: string;
  seasonNumber: number;
  name: string;
  episodes: CatalogEpisode[];
};
export type CatalogCredit = {
  id: string;
  name: string;
  photoPath?: string;
  department: string;
  role: string;
  characterName?: string;
};
export type TitleDetails = CatalogTitle & {
  seasons: CatalogSeason[];
  credits: CatalogCredit[];
  studios: string[];
};

export type CatalogSort = 'newest' | 'oldest' | 'title-asc' | 'title-desc';

export type CatalogPage = {
  items: CatalogTitle[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
