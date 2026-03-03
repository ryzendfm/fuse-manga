/* eslint-disable @typescript-eslint/no-explicit-any */
import { Manga, Chapter, resolveArray } from "mangadex-full-api";
import { LRUCache } from "lru-cache";
import type {
    ApiListResponse,
    MangaListItem,
    MangaDetailData,
    ChapterListResponse,
    ChapterPagesResponse,
    Tag,
} from "@/lib/types";

const cache = new LRUCache<string, object>({
    max: 200,
    ttl: 1000 * 60 * 10, // 10 min
});

function extractCoverUrl(manga: Manga): string {
    try {
        const coverRel = manga.mainCover;
        if (coverRel) {
            // When includes: ['cover_art'] is used, cachedData contains the cover object
            const data = (coverRel as any).cachedData;
            const filename = data?.fileName;
            if (filename) {
                return `https://uploads.mangadex.org/covers/${manga.id}/${filename}`;
            }
        }
    } catch {
        // fallback
    }
    return "";
}

function extractTags(manga: Manga): Tag[] {
    try {
        return (manga.tags || []).map((t) => ({
            id: t.id,
            name: t.localName || "Unknown",
            group: t.group || "genre",
        }));
    } catch {
        return [];
    }
}

function mangaToListItem(manga: Manga): MangaListItem {
    const authors: string[] = [];
    try {
        if (manga.authors) {
            for (const a of manga.authors) {
                if (a.cached) {
                    const data = (a as any).cachedData;
                    authors.push(data?.name || "Unknown");
                }
            }
        }
    } catch {
        // skip
    }

    return {
        id: manga.id,
        title: manga.localTitle || "Untitled",
        cover: extractCoverUrl(manga),
        description: manga.localDescription || "",
        tags: extractTags(manga),
        status: manga.status || undefined,
        contentRating: manga.contentRating || undefined,
        authors: authors.length > 0 ? authors : undefined,
        year: manga.year || undefined,
    };
}

export async function getFeatured(): Promise<ApiListResponse<MangaListItem>> {
    const cacheKey = "featured";
    const cached = cache.get(cacheKey) as ApiListResponse<MangaListItem> | undefined;
    if (cached) return cached;

    const mangas = await Manga.search({
        order: { followedCount: "desc" },
        includes: ["cover_art", "author"],
        limit: 20,
        availableTranslatedLanguage: ["en"],
        hasAvailableChapters: true,
    });

    const result: ApiListResponse<MangaListItem> = {
        count: mangas.length,
        data: mangas.map(mangaToListItem),
    };
    cache.set(cacheKey, result);
    return result;
}

export async function getTrending(): Promise<ApiListResponse<MangaListItem>> {
    const cacheKey = "trending";
    const cached = cache.get(cacheKey) as ApiListResponse<MangaListItem> | undefined;
    if (cached) return cached;

    const mangas = await Manga.search({
        order: { rating: "desc" },
        includes: ["cover_art", "author"],
        limit: 20,
        availableTranslatedLanguage: ["en"],
        hasAvailableChapters: true,
    });

    const result: ApiListResponse<MangaListItem> = {
        count: mangas.length,
        data: mangas.map(mangaToListItem),
    };
    cache.set(cacheKey, result);
    return result;
}

export async function getManga(id: string): Promise<MangaDetailData> {
    const cacheKey = `manga-${id}`;
    const cached = cache.get(cacheKey) as MangaDetailData | undefined;
    if (cached) return cached;

    const manga = await Manga.get(id, [
        "cover_art", "author", "artist",
    ] as any);

    const authors: string[] = [];
    const artists: string[] = [];

    try {
        if (manga.authors) {
            const resolved = await resolveArray(manga.authors);
            for (const a of resolved) {
                authors.push(a.name || "Unknown");
            }
        }
    } catch {
        // skip
    }

    try {
        if (manga.artists) {
            const resolved = await resolveArray(manga.artists);
            for (const a of resolved) {
                artists.push(a.name || "Unknown");
            }
        }
    } catch {
        // skip
    }

    const result: MangaDetailData = {
        id: manga.id,
        title: manga.localTitle || "Untitled",
        altTitles: manga.altTitles
            ? manga.altTitles
                .map((obj) => Object.values(obj)[0] || "")
                .filter(Boolean)
                .slice(0, 5)
            : [],
        description: manga.localDescription || "",
        tags: extractTags(manga),
        status: manga.status || "unknown",
        contentRating: manga.contentRating || "safe",
        year: manga.year || null,
        rating: 0,
        authors,
        artists,
        cover: extractCoverUrl(manga),
        type: (manga as any).type || "manga",
    };

    cache.set(cacheKey, result);
    return result;
}

export async function searchManga(
    query: string
): Promise<ApiListResponse<MangaListItem>> {
    const cacheKey = `search-${query}`;
    const cached = cache.get(cacheKey) as ApiListResponse<MangaListItem> | undefined;
    if (cached) return cached;

    const mangas = await Manga.search({
        title: query,
        includes: ["cover_art", "author"],
        limit: 20,
        availableTranslatedLanguage: ["en"],
    });

    const result: ApiListResponse<MangaListItem> = {
        count: mangas.length,
        data: mangas.map(mangaToListItem),
    };
    cache.set(cacheKey, result);
    return result;
}

export async function getChapters(
    mangaId: string
): Promise<ChapterListResponse> {
    const cacheKey = `chapters-${mangaId}`;
    const cached = cache.get(cacheKey) as ChapterListResponse | undefined;
    if (cached) return cached;

    try {
        const manga = await Manga.get(mangaId);
        const chapters = await manga.getFeed({
            translatedLanguage: ["en"],
            order: { chapter: "asc" },
            limit: 100,
        });

        // De-duplicate by chapter number (keep first/best match)
        const seen = new Set<string>();
        const uniqueChapters = chapters.filter((ch) => {
            const num = ch.chapter || "0";
            if (seen.has(num)) return false;
            seen.add(num);
            return true;
        });

        const result: ChapterListResponse = {
            chapters: uniqueChapters.map((ch) => ({
                id: ch.id,
                chapter: ch.chapter || "0",
                volume: ch.volume || null,
                title: ch.title || `Chapter ${ch.chapter || "?"}`,
                pages: ch.pages || 0,
                translatedLanguage: ch.translatedLanguage || "en",
                publishAt: ch.publishAt
                    ? new Date(ch.publishAt).toISOString()
                    : "",
            })),
            mangaId,
        };

        cache.set(cacheKey, result);
        return result;
    } catch {
        return { chapters: [], mangaId, error: true };
    }
}

export async function getChapterPages(
    chapterId: string
): Promise<ChapterPagesResponse> {
    const cacheKey = `pages-${chapterId}`;
    const cached = cache.get(cacheKey) as ChapterPagesResponse | undefined;
    if (cached) return cached;

    const chapter = await Chapter.get(chapterId);
    const pages = await chapter.getReadablePages();

    const result: ChapterPagesResponse = {
        pages,
        chapterId,
    };
    cache.set(cacheKey, result);
    return result;
}
