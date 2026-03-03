"use client";
import { useQuery } from "@tanstack/react-query";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MangaCard } from "@/components/manga/MangaCard";
import { LazyImage } from "@/components/shared/LazyImage";
import { MangaGridSkeleton } from "@/components/shared/MangaCardSkeleton";
import { PageTransition, StaggerGrid, StaggerItem } from "@/components/shared/AnimatedContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { proxyUrl } from "@/lib/utils";
import type { ApiListResponse, MangaListItem } from "@/lib/types";

function HeroCarousel({ data }: { data: MangaListItem[] }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  // Memoize all proxy URLs up-front so we don't recompute on every render
  const imageUrls = useMemo(() => data.map((m) => proxyUrl(m.cover)), [data]);

  const next = useCallback(() => setCurrent((c) => (c + 1) % data.length), [data.length]);

  useEffect(() => {
    if (paused || data.length <= 1) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [paused, next, data.length]);

  // Prefetch ALL carousel images into the browser cache on mount
  useEffect(() => {
    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [imageUrls]);

  const manga = data[current];
  if (!manga) return null;

  return (
    <div
      className="relative w-full h-[60vh] md:h-[70vh] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Hidden prefetch: keep next & prev images loaded in DOM for instant swap */}
      <div aria-hidden="true" className="hidden">
        {data.map((m, i) =>
          i !== current ? (
            <img key={m.id} src={imageUrls[i]} alt="" />
          ) : null
        )}
      </div>

      <motion.div
        key={manga.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0"
      >
        <LazyImage
          src={imageUrls[current]}
          alt={manga.title}
          fill
          className="w-full h-full"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
        <motion.div
          key={manga.id + "-info"}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: "spring", damping: 25 }}
          className="max-w-2xl space-y-4"
        >
          <div className="flex gap-2 flex-wrap">
            {manga.tags?.slice(0, 3).map((t) => (
              <Badge key={t.name} variant="secondary" className="bg-white/10 backdrop-blur-sm border-0 text-white">
                {t.name}
              </Badge>
            ))}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{manga.title}</h1>
          <p className="text-muted-foreground line-clamp-2 md:line-clamp-3 text-sm md:text-base max-w-xl">
            {manga.description}
          </p>
          <div className="flex gap-3">
            <Link href={`/manga/${manga.id}`}>
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                <BookOpen className="w-4 h-4" />
                Read Now
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-4 right-6 md:right-12 flex gap-1.5">
        {data.slice(0, 8).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${i === current ? "w-8 bg-primary" : "w-1.5 bg-white/40"
              }`}
          />
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
      {href && (
        <Link href={href}>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-foreground">
            See All <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}

function TrendingSection({ data }: { data: MangaListItem[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="container mx-auto px-4 py-8">
      <SectionHeader title="Trending Now" href="/browse" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ type: "spring", damping: 25 }}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {data.map((m) => (
            <div key={m.id} className="min-w-[160px] md:min-w-[180px] snap-start">
              <MangaCard
                manga={{ title: m.title, id: m.id, cover: m.cover, rating: m.rating }}
                variant="trending"
              />
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function FeaturedGrid({ data }: { data: MangaListItem[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="container mx-auto px-4 py-8">
      <SectionHeader title="Featured" href="/browse" />
      {isInView && (
        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {data.map((m) => (
            <StaggerItem key={m.id}>
              <MangaCard
                manga={{ title: m.title, id: m.id, cover: m.cover, tags: m.tags }}
                variant="featured"
              />
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}
    </section>
  );
}

export default function HomePage() {
  const { data: featured, isLoading: fl } = useQuery<ApiListResponse<MangaListItem>>({
    queryKey: ["featured"],
    queryFn: () => fetch("/api/manga/featured").then((r) => r.json()),
  });

  const { data: trending, isLoading: tl } = useQuery<ApiListResponse<MangaListItem>>({
    queryKey: ["trending"],
    queryFn: () => fetch("/api/manga/trending").then((r) => r.json()),
  });

  return (
    <PageTransition>
      {fl ? (
        <div className="w-full h-[60vh] md:h-[70vh] flex items-end p-6 md:p-12">
          <div className="space-y-4 max-w-2xl">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-12 w-36" />
          </div>
        </div>
      ) : featured?.data ? (
        <HeroCarousel data={featured.data.slice(0, 8)} />
      ) : null}

      {tl ? (
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-40 mb-6" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="min-w-[160px]">
                <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </div>
            ))}
          </div>
        </div>
      ) : trending?.data ? (
        <TrendingSection data={trending.data} />
      ) : null}

      {fl ? (
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <MangaGridSkeleton count={10} />
        </div>
      ) : featured?.data ? (
        <FeaturedGrid data={featured.data} />
      ) : null}
    </PageTransition>
  );
}
