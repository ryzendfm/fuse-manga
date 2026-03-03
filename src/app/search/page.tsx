"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, X, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MangaCard } from "@/components/manga/MangaCard";
import { MangaGridSkeleton } from "@/components/shared/MangaCardSkeleton";
import { PageTransition, StaggerGrid, StaggerItem } from "@/components/shared/AnimatedContainer";
import { useSearchStore } from "@/lib/store";
import type { ApiListResponse, MangaListItem } from "@/lib/types";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { recentSearches, addSearch, clearSearches } = useSearchStore();

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useQuery<ApiListResponse<MangaListItem>>({
    queryKey: ["search", debouncedQuery],
    queryFn: () => fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`).then(r => r.json()),
    enabled: debouncedQuery.length > 1,
  });

  const handleSearch = (q: string) => {
    setQuery(q);
    if (q.length > 1) addSearch(q);
  };

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
            placeholder="Search manga..."
            className="pl-12 pr-12 h-14 text-lg rounded-2xl bg-card border-border/50"
          />
          {query && (
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full" onClick={() => setQuery("")}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {!debouncedQuery && recentSearches.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Recent Searches
              </h3>
              <Button variant="ghost" size="sm" onClick={clearSearches} className="text-xs">Clear</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((s) => (
                <Button key={s} variant="secondary" size="sm" className="rounded-full" onClick={() => handleSearch(s)}>{s}</Button>
              ))}
            </div>
          </motion.div>
        )}

        {!debouncedQuery && !recentSearches.length && (
          <div className="text-center py-20">
            <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Search for manga</h2>
            <p className="text-muted-foreground">Find your favorite manga by title</p>
          </div>
        )}

        {isLoading && <MangaGridSkeleton count={8} />}

        {data?.data && data.data.length > 0 && (
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {data.data.map((m) => (
              <StaggerItem key={m.id}>
                <MangaCard manga={{ title: m.title, id: m.id, cover: m.cover, tags: m.tags }} />
              </StaggerItem>
            ))}
          </StaggerGrid>
        )}

        {data?.data && data.data.length === 0 && debouncedQuery && (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold mb-2">No results found</h2>
            <p className="text-muted-foreground">No manga found for &ldquo;{debouncedQuery}&rdquo;</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
