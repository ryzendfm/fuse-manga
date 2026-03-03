"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    ArrowLeft, ChevronLeft, ChevronRight, Settings,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/shared/LazyImage";
import { Skeleton } from "@/components/ui/skeleton";
import { useReaderStore } from "@/lib/store";
import { cn, proxyUrl } from "@/lib/utils";
import type { ChapterPagesResponse, ChapterListResponse } from "@/lib/types";

export default function ReaderPage() {
    const { chapterId } = useParams<{ chapterId: string }>();
    const router = useRouter();
    const {
        mode, background, showToolbar, setShowToolbar, toggleToolbar,
    } = useReaderStore();

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const hideTimer = useRef<NodeJS.Timeout>();

    // Fetch chapter pages
    const { data: pagesData, isLoading: pagesLoading } = useQuery<ChapterPagesResponse>({
        queryKey: ["chapter-pages", chapterId],
        queryFn: () => fetch(`/api/chapter/${chapterId}/pages`).then((r) => r.json()),
    });

    // We need the manga ID to fetch the full chapter list for prev/next nav
    // First, get the chapter info to extract the manga relationship
    const { data: chapterInfo } = useQuery<{ mangaId?: string }>({
        queryKey: ["chapter-info", chapterId],
        queryFn: async () => {
            const res = await fetch(`https://api.mangadex.org/chapter/${chapterId}?includes[]=manga`);
            const json = await res.json();
            const mangaRel = json.data?.relationships?.find((r: { type: string }) => r.type === "manga");
            return { mangaId: mangaRel?.id || null };
        },
    });

    const mangaId = chapterInfo?.mangaId;

    const { data: chaptersData } = useQuery<ChapterListResponse>({
        queryKey: ["chapters", mangaId],
        queryFn: () => fetch(`/api/manga/${mangaId}/chapters`).then((r) => r.json()),
        enabled: !!mangaId,
    });

    const chapters = chaptersData?.chapters || [];
    const chapterIndex = chapters.findIndex((c) => c.id === chapterId);
    const currentChapterObj = chapterIndex >= 0 ? chapters[chapterIndex] : null;
    const prevChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : null;
    const nextChapter = chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : null;

    const pages = pagesData?.pages || [];
    const totalPages = pages.length;

    const resetHideTimer = useCallback(() => {
        setShowToolbar(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setShowToolbar(false), 3000);
    }, [setShowToolbar]);

    useEffect(() => {
        resetHideTimer();
        return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
    }, [resetHideTimer]);

    // Reset page on chapter change
    useEffect(() => {
        setCurrentPage(0);
    }, [chapterId]);

    const pageStep = mode === "double" ? 2 : 1;

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (mode === "single" || mode === "double") {
                if (e.key === "ArrowLeft") {
                    setCurrentPage((p) => Math.max(0, p - pageStep));
                } else if (e.key === "ArrowRight") {
                    setCurrentPage((p) => Math.min(totalPages - 1, p + pageStep));
                }
            }
            if (e.key === "Escape" && mangaId) {
                router.push(`/manga/${mangaId}`);
            } else if (e.key === "f" || e.key === "F") {
                document.documentElement.requestFullscreen?.();
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [mode, totalPages, mangaId, router, pageStep]);

    const bgClass =
        background === "white" ? "bg-white" :
            background === "black" ? "bg-black" : "bg-[#1a1a1a]";

    const handlePageClick = (e: React.MouseEvent) => {
        if (mode !== "single" && mode !== "double") return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const third = rect.width / 3;

        if (x < third) {
            setCurrentPage((p) => Math.max(0, p - pageStep));
        } else if (x > third * 2) {
            setCurrentPage((p) => Math.min(totalPages - 1, p + pageStep));
        } else {
            toggleToolbar();
        }
    };

    return (
        <div
            className={cn("min-h-screen flex flex-col", bgClass)}
            onMouseMove={resetHideTimer}
        >
            {/* Top toolbar */}
            <AnimatePresence>
                {showToolbar && (
                    <motion.div
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -60, opacity: 0 }}
                        transition={{ type: "spring", damping: 25 }}
                        className="fixed top-0 left-0 right-0 z-50 glass"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 px-4 h-14">
                            {mangaId ? (
                                <Link href={`/manga/${mangaId}`}>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <ArrowLeft className="w-5 h-5" />
                                    </Button>
                                </Link>
                            ) : (
                                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}>
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                    Chapter {currentChapterObj?.chapter || "?"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {currentChapterObj?.title || "Loading..."}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={() => setSettingsOpen(!settingsOpen)}
                            >
                                <Settings className="w-5 h-5" />
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content area */}
            <div className="flex-1 pt-16 pb-16" onClick={handlePageClick}>
                {pagesLoading ? (
                    <div className="flex items-center justify-center min-h-[80vh]">
                        <div className="text-center space-y-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                            <p className="text-muted-foreground">Loading chapter pages...</p>
                        </div>
                    </div>
                ) : pages.length === 0 ? (
                    <div className="flex items-center justify-center min-h-[80vh] px-4">
                        <div className="glass-card p-10 text-center max-w-lg">
                            <h2 className="text-xl font-semibold mb-2">No pages available</h2>
                            <p className="text-muted-foreground">
                                Could not load pages for this chapter. Try a different chapter.
                            </p>
                        </div>
                    </div>
                ) : mode === "longstrip" ? (
                    /* Long Strip Mode — vertical scroll */
                    <div className="max-w-3xl mx-auto space-y-1">
                        {pages.map((page, i) => (
                            <div key={i} className="w-full">
                                <LazyImage
                                    src={proxyUrl(page)}
                                    alt={`Page ${i + 1}`}
                                    width={800}
                                    height={1200}
                                    className="w-full h-auto"
                                />
                            </div>
                        ))}
                        {/* Next chapter prompt */}
                        {nextChapter && (
                            <div className="py-8 text-center">
                                <Link href={`/read/${nextChapter.id}`}>
                                    <Button size="lg" className="gap-2">
                                        Next Chapter: Ch. {nextChapter.chapter}
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                ) : mode === "double" ? (
                    /* Double Page Mode */
                    <div className="flex items-center justify-center min-h-[80vh] gap-1 px-4">
                        {pages[currentPage] && (
                            <div className="max-w-[48%]">
                                <LazyImage
                                    src={proxyUrl(pages[currentPage])}
                                    alt={`Page ${currentPage + 1}`}
                                    width={600}
                                    height={900}
                                    className="w-full h-auto max-h-[85vh] object-contain"
                                />
                            </div>
                        )}
                        {pages[currentPage + 1] && (
                            <div className="max-w-[48%]">
                                <LazyImage
                                    src={proxyUrl(pages[currentPage + 1])}
                                    alt={`Page ${currentPage + 2}`}
                                    width={600}
                                    height={900}
                                    className="w-full h-auto max-h-[85vh] object-contain"
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    /* Single Page Mode */
                    <div className="flex items-center justify-center min-h-[80vh] px-4">
                        {pages[currentPage] && (
                            <LazyImage
                                src={proxyUrl(pages[currentPage])}
                                alt={`Page ${currentPage + 1}`}
                                width={800}
                                height={1200}
                                className="max-w-full max-h-[85vh] object-contain mx-auto"
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Bottom toolbar */}
            <AnimatePresence>
                {showToolbar && (
                    <motion.div
                        initial={{ y: 60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 60, opacity: 0 }}
                        transition={{ type: "spring", damping: 25 }}
                        className="fixed bottom-0 left-0 right-0 z-50 glass"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 px-4 h-14">
                            {prevChapter ? (
                                <Link href={`/read/${prevChapter.id}`}>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <ChevronLeft className="w-5 h-5" />
                                    </Button>
                                </Link>
                            ) : (
                                <Button variant="ghost" size="icon" className="rounded-full" disabled>
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                            )}
                            <div className="flex-1 text-center text-sm text-muted-foreground">
                                {mode === "longstrip" ? (
                                    <>Chapter {currentChapterObj?.chapter || "?"}{chapters.length > 0 && ` of ${chapters.length}`}</>
                                ) : mode === "double" ? (
                                    <>Page {currentPage + 1}-{Math.min(currentPage + 2, totalPages)} / {totalPages}</>
                                ) : (
                                    <>Page {currentPage + 1} / {totalPages}</>
                                )}
                            </div>
                            {nextChapter ? (
                                <Link href={`/read/${nextChapter.id}`}>
                                    <Button variant="ghost" size="icon" className="rounded-full">
                                        <ChevronRight className="w-5 h-5" />
                                    </Button>
                                </Link>
                            ) : (
                                <Button variant="ghost" size="icon" className="rounded-full" disabled>
                                    <ChevronRight className="w-5 h-5" />
                                </Button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Settings panel */}
            <AnimatePresence>
                {settingsOpen && (
                    <motion.div
                        initial={{ x: 300, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 300, opacity: 0 }}
                        transition={{ type: "spring", damping: 25 }}
                        className="fixed top-0 right-0 bottom-0 w-80 z-50 glass-card rounded-l-2xl p-6 space-y-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Reader Settings</h3>
                            <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(false)}>
                                Close
                            </Button>
                        </div>

                        <div>
                            <label className="text-sm text-muted-foreground mb-2 block">Background</label>
                            <div className="flex gap-2">
                                {(["white", "dark", "black"] as const).map((bg) => (
                                    <Button
                                        key={bg}
                                        variant={background === bg ? "secondary" : "outline"}
                                        size="sm"
                                        onClick={() => useReaderStore.getState().setBackground(bg)}
                                        className="flex-1 capitalize"
                                    >
                                        {bg}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-muted-foreground mb-2 block">Reading Mode</label>
                            <div className="flex gap-2">
                                {(["single", "longstrip", "double"] as const).map((m) => (
                                    <Button
                                        key={m}
                                        variant={mode === m ? "secondary" : "outline"}
                                        size="sm"
                                        onClick={() => useReaderStore.getState().setMode(m)}
                                        className="flex-1 capitalize text-xs"
                                    >
                                        {m === "longstrip" ? "Long Strip" : m}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
