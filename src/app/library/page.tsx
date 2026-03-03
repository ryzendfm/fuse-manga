"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen, Trash2, Library, LogIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/shared/LazyImage";
import { PageTransition } from "@/components/shared/AnimatedContainer";
import { READING_STATUSES, proxyUrl } from "@/lib/utils";

interface Bookmark {
  id: string;
  mangaSlug: string;
  mangaTitle: string;
  mangaCover: string;
  status: string;
  score: number | null;
  updatedAt: string;
}

const TABS = [
  { value: "all", label: "All" },
  ...READING_STATUSES,
];

export default function LibraryPage() {
  const { data: session, status: authStatus } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");

  const { data: bookmarks, isLoading } = useQuery<Bookmark[]>({
    queryKey: ["library"],
    queryFn: () => fetch("/api/library").then((r) => r.json()),
    enabled: !!session,
  });

  const deleteMutation = useMutation({
    mutationFn: (mangaSlug: string) =>
      fetch("/api/library", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mangaSlug }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["library"] }),
  });

  const filtered = useMemo(() => {
    if (!bookmarks) return [];
    if (activeTab === "all") return bookmarks;
    return bookmarks.filter((b) => b.status === activeTab);
  }, [bookmarks, activeTab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: bookmarks?.length || 0 };
    READING_STATUSES.forEach((s) => {
      c[s.value] = bookmarks?.filter((b) => b.status === s.value).length || 0;
    });
    return c;
  }, [bookmarks]);

  if (authStatus === "loading") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-10 w-full mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <PageTransition>
        <div className="container mx-auto px-4 py-20 text-center">
          <Library className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your Library</h1>
          <p className="text-muted-foreground mb-6">Sign in to save and track your manga</p>
          <Link href="/auth/login">
            <Button className="gap-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Library</h1>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {TABS.map((tab) => (
            <Button
              key={tab.value}
              variant={activeTab === tab.value ? "secondary" : "ghost"}
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
              {counts[tab.value] > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 justify-center">
                  {counts[tab.value]}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {activeTab === "all" ? "Library is empty" : `No ${TABS.find((t) => t.value === activeTab)?.label} manga`}
            </h2>
            <p className="text-muted-foreground mb-4">Start browsing to add manga to your library</p>
            <Link href="/browse">
              <Button variant="outline">Browse Manga</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((bookmark) => (
              <motion.div
                key={bookmark.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass-card p-3 flex items-center gap-4 group"
              >
                {/* Cover thumbnail */}
                {bookmark.mangaCover && (
                  <Link href={`/manga/${bookmark.mangaSlug}`} className="shrink-0">
                    <div className="w-12 h-16 rounded-lg overflow-hidden">
                      <LazyImage
                        src={proxyUrl(bookmark.mangaCover)}
                        alt={bookmark.mangaTitle || "Cover"}
                        width={48}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                )}
                <Link href={`/manga/${bookmark.mangaSlug}`} className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-primary transition-colors">
                    {bookmark.mangaTitle || bookmark.mangaSlug}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] capitalize">
                      {bookmark.status.replace(/_/g, " ")}
                    </Badge>
                    {bookmark.score && (
                      <span className="text-xs text-muted-foreground">Score: {bookmark.score}/10</span>
                    )}
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  onClick={() => deleteMutation.mutate(bookmark.mangaSlug)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
