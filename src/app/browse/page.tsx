"use client";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MangaCard } from "@/components/manga/MangaCard";
import { MangaGridSkeleton } from "@/components/shared/MangaCardSkeleton";
import { PageTransition, StaggerGrid, StaggerItem } from "@/components/shared/AnimatedContainer";
import type { ApiListResponse, MangaListItem } from "@/lib/types";

const GENRES = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"];

type SortOption = "trending" | "latest" | "rating" | "az";

export default function BrowsePage() {
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("trending");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { data: featured, isLoading: fl } = useQuery<ApiListResponse<MangaListItem>>({
    queryKey: ["featured"],
    queryFn: () => fetch("/api/manga/featured").then(r => r.json()),
  });
  const { data: trending, isLoading: tl } = useQuery<ApiListResponse<MangaListItem>>({
    queryKey: ["trending"],
    queryFn: () => fetch("/api/manga/trending").then(r => r.json()),
  });

  const allManga = useMemo(() => {
    const items: { title: string; id: string; cover: string; tags?: { name: string }[]; rating?: number; chapters?: number }[] = [];
    featured?.data?.forEach(m => items.push({ title: m.title, id: m.id, cover: m.cover, tags: m.tags, rating: m.rating }));
    trending?.data?.forEach(m => {
      if (!items.find(x => x.id === m.id)) {
        items.push({ title: m.title, id: m.id, cover: m.cover, tags: m.tags, rating: m.rating });
      }
    });
    return items;
  }, [featured, trending]);

  const filtered = useMemo(() => {
    let list = [...allManga];
    if (selectedGenre) {
      list = list.filter(m => m.tags?.some(t => t.name.toLowerCase().includes(selectedGenre.toLowerCase())));
    }
    switch (sort) {
      case "rating": list.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "az": list.sort((a, b) => a.title.localeCompare(b.title)); break;
    }
    return list;
  }, [allManga, selectedGenre, sort]);

  const isLoading = fl || tl;

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-6 md:py-8 pb-24 md:pb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Browse</h1>

        {/* Genre picker – horizontal scroll on mobile, compact badges */}
        <div className="flex gap-1.5 md:gap-2 mb-4 md:mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          <Badge
            variant={selectedGenre === null ? "default" : "secondary"}
            className="cursor-pointer px-2 py-0.5 md:px-3 md:py-1.5 text-[11px] md:text-sm shrink-0"
            onClick={() => setSelectedGenre(null)}
          >
            All
          </Badge>
          {GENRES.map(g => (
            <Badge
              key={g}
              variant={selectedGenre === g ? "default" : "secondary"}
              className="cursor-pointer px-2 py-0.5 md:px-3 md:py-1.5 text-[11px] md:text-sm whitespace-nowrap shrink-0"
              onClick={() => setSelectedGenre(selectedGenre === g ? null : g)}
            >
              {g}
            </Badge>
          ))}
        </div>

        {/* Sort bar – compact on mobile */}
        <div className="flex items-center gap-1 md:gap-2 mb-4 md:mb-6">
          {(["trending", "latest", "rating", "az"] as SortOption[]).map(s => (
            <Button key={s} variant={sort === s ? "secondary" : "ghost"} size="sm" className="text-xs md:text-sm h-8 px-2 md:px-3" onClick={() => setSort(s)}>
              {s === "az" ? "A-Z" : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
          <div className="ml-auto hidden sm:flex gap-1">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("grid")}><LayoutGrid className="w-4 h-4" /></Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}><List className="w-4 h-4" /></Button>
          </div>
        </div>

        {isLoading ? (
          <MangaGridSkeleton count={15} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold mb-2">No manga found</h2>
            <p className="text-muted-foreground">Try a different genre filter</p>
          </div>
        ) : (
          <StaggerGrid className={viewMode === "grid" ? "grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
            {filtered.map(m => (
              <StaggerItem key={m.id}>
                <MangaCard manga={m} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}
      </div>
    </PageTransition>
  );
}
