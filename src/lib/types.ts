export interface Tag {
  id: string;
  name: string;
  group: string;
}

export interface MangaListItem {
  id: string;
  title: string;
  cover: string;
  description?: string;
  tags: Tag[];
  status?: string;
  contentRating?: string;
  rating?: number;
  authors?: string[];
  year?: number;
  chapters?: number;
}

export interface MangaDetailData {
  id: string;
  title: string;
  altTitles: string[];
  description: string;
  tags: Tag[];
  status: string;
  contentRating: string;
  year: number | null;
  rating: number;
  authors: string[];
  artists: string[];
  cover: string;
  type: string;
}

export interface ChapterItem {
  id: string;
  chapter: string;
  volume: string | null;
  title: string;
  pages: number;
  translatedLanguage: string;
  publishAt: string;
}

export interface ChapterListResponse {
  chapters: ChapterItem[];
  mangaId?: string;
  error?: boolean;
}

export interface ChapterPagesResponse {
  pages: string[];
  chapterId: string;
}

export interface ApiListResponse<T> {
  count: number;
  total?: number;
  offset?: number;
  data: T[];
}
