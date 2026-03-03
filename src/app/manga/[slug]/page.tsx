"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import {
  Star, BookOpen, Heart, ChevronDown, ChevronUp,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/shared/LazyImage";
import { MangaCard } from "@/components/manga/MangaCard";
import { PageTransition, StaggerGrid, StaggerItem } from "@/components/shared/AnimatedContainer";
import { proxyUrl, cn } from "@/lib/utils";
import type { MangaDetailData, ChapterListResponse, ApiListResponse, MangaListItem } from "@/lib/types";

export default function MangaDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);

  const { data: manga, isLoading } = useQuery<MangaDetailData>({
    queryKey: ["manga", slug],
    queryFn: () => fetch(`/api/manga/${slug}`).then((r) => r.json()),
  });

  const { data: chaptersData } = useQuery<ChapterListResponse>({
    queryKey: ["chapters", slug],
    queryFn: () => fetch(`/api/manga/${slug}/chapters`).then((r) => r.json()),
  });

  const { data: related } = useQuery<ApiListResponse<MangaListItem>>({
    queryKey: ["related", manga?.tags?.[0]?.name],
    queryFn: () =>
      fetch(`/api/search?q=${encodeURIComponent(manga!.tags[0].name)}`).then((r) => r.json()),
    enabled: !!manga?.tags?.[0]?.name,
  });

  // Check if this manga is bookmarked
  const { data: libraryData } = useQuery<{ mangaSlug: string; status: string }[]>({
    queryKey: ["library"],
    queryFn: () => fetch("/api/library").then(r => r.json()),
    enabled: !!session,
  });
  const isBookmarked = libraryData?.some?.((b) => b.mangaSlug === slug) ?? false;

  const bookmarkMutation = useMutation({
    mutationFn: () =>
      fetch("/api/library", {
        method: isBookmarked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mangaSlug: slug,
          ...(isBookmarked ? {} : {
            mangaTitle: manga?.title || "",
            mangaCover: manga?.cover || "",
            status: "plan_to_read",
          }),
        }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });

  const chapters = chaptersData?.chapters || [];
  const sortedChapters = sortNewest ? [...chapters].reverse() : [...chapters];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          <Skeleton className="w-full md:w-[280px] aspect-[3/4] rounded-2xl" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-36" />
            </div>
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Manga not found</h1>
        <p className="text-muted-foreground">Could not load this manga.</p>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row gap-8 mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 25 }}
            className="w-full md:w-[280px] shrink-0 mx-auto md:mx-0"
          >
            <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
              <LazyImage
                src={proxyUrl(manga.cover)}
                alt={manga.title}
                fill
                className="w-full h-full"
                priority
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", damping: 25 }}
            className="flex-1 space-y-4"
          >
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{manga.title}</h1>
            {manga.altTitles && manga.altTitles.length > 0 && (
              <p className="text-muted-foreground">{manga.altTitles[0]}</p>
            )}

            <div className="flex items-center gap-3 flex-wrap">
              {manga.rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{manga.rating.toFixed(1)}</span>
                </div>
              )}
              {manga.type && <Badge variant="outline">{manga.type}</Badge>}
              {manga.status && <Badge variant="outline" className="capitalize">{manga.status}</Badge>}
              {manga.authors && manga.authors.length > 0 && (
                <span className="text-sm text-muted-foreground">by {manga.authors.join(", ")}</span>
              )}
              {manga.year && (
                <span className="text-sm text-muted-foreground">{manga.year}</span>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {manga.tags?.map((t) => (
                <Badge key={t.id} variant="secondary" className="rounded-full">
                  {t.name}
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              {chapters.length > 0 ? (
                <Link href={`/read/${chapters[0].id}`} className="flex-1">
                  <Button size="lg" className="gap-2 shadow-lg shadow-primary/25 w-full">
                    <BookOpen className="w-4 h-4" />
                    Start Reading
                  </Button>
                </Link>
              ) : (
                <Button size="lg" className="gap-2 flex-1" disabled>
                  <BookOpen className="w-4 h-4" />
                  No chapters yet
                </Button>
              )}
              {session && (
                <Button
                  variant={isBookmarked ? "secondary" : "outline"}
                  size="lg"
                  className="gap-2 shrink-0 px-3 md:px-6"
                  onClick={() => bookmarkMutation.mutate()}
                  disabled={bookmarkMutation.isPending}
                >
                  <Heart className={cn("w-5 h-5", isBookmarked && "fill-red-500 text-red-500")} />
                  <span className="hidden md:inline">{isBookmarked ? "In Library" : "Add to Library"}</span>
                </Button>
              )}
            </div>

            {/* Synopsis */}
            <div className="relative">
              <p
                className={cn(
                  "text-muted-foreground leading-relaxed transition-all",
                  !synopsisExpanded && "line-clamp-3"
                )}
              >
                {manga.description}
              </p>
              {manga.description && manga.description.length > 200 && (
                <>
                  {!synopsisExpanded && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 gap-1"
                    onClick={() => setSynopsisExpanded(!synopsisExpanded)}
                  >
                    {synopsisExpanded ? (
                      <>Show Less <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>Read More <ChevronDown className="w-3 h-3" /></>
                    )}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Chapters */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              Chapters {chapters.length > 0 && `(${chapters.length})`}
            </h2>
            {chapters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => setSortNewest(!sortNewest)}
              >
                <ArrowUpDown className="w-3 h-3" />
                {sortNewest ? "Newest" : "Oldest"}
              </Button>
            )}
          </div>

          {chapters.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No chapters available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No English chapters are available for this manga yet.
              </p>
            </div>
          ) : (
            <div className="glass-card divide-y divide-border/50 max-h-[500px] overflow-y-auto rounded-2xl">
              {sortedChapters.map((ch) => (
                <Link
                  key={ch.id}
                  href={`/read/${ch.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors group"
                >
                  <span className="text-sm font-medium w-20 shrink-0">Ch. {ch.chapter}</span>
                  <span className="text-sm text-muted-foreground truncate flex-1">
                    {ch.title}
                  </span>
                  {ch.pages > 0 && (
                    <span className="text-xs text-muted-foreground shrink-0">{ch.pages}p</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </motion.section>

        {/* Related */}
        {related?.data && related.data.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4">Related Manga</h2>
            <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {related.data
                .filter((m) => m.id !== slug)
                .slice(0, 5)
                .map((m) => (
                  <StaggerItem key={m.id}>
                    <MangaCard
                      manga={{
                        title: m.title,
                        id: m.id,
                        cover: m.cover,
                        tags: m.tags,
                      }}
                    />
                  </StaggerItem>
                ))}
            </StaggerGrid>
          </section>
        )}
      </div>
    </PageTransition>
  );
}
