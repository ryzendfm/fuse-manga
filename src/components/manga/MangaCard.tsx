"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Crown, Flame } from "lucide-react";
import { LazyImage } from "@/components/shared/LazyImage";
import { proxyUrl } from "@/lib/utils";

interface MangaCardProps {
  manga: { title: string; id: string; cover: string; tags?: { name: string }[]; rating?: number; chapters?: number };
  variant?: "default" | "featured" | "trending";
}

function TagChip({ name }: { name: string }) {
  const lower = name.toLowerCase();

  // Award Winning → crown icon only
  if (lower === "award winning") {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/80 backdrop-blur-sm text-white text-[9px] font-medium">
        <Crown className="w-2.5 h-2.5" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/15 backdrop-blur-sm text-white text-[9px] font-medium whitespace-nowrap">
      {name}
    </span>
  );
}

export function MangaCard({ manga }: MangaCardProps) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }}>
      <Link href={`/manga/${manga.id}`} className="group block">
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-md group-hover:shadow-xl transition-shadow">
          <LazyImage src={proxyUrl(manga.cover)} alt={manga.title} fill className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          {manga.rating && manga.rating > 0 && (
            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[10px] text-white">
              <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />{manga.rating.toFixed(1)}
            </div>
          )}
          {manga.tags && manga.tags.length > 0 && (
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-1 overflow-hidden">
              {manga.tags.slice(0, 2).map((t) => (
                <TagChip key={t.name} name={t.name} />
              ))}
            </div>
          )}
        </div>
        <div className="mt-1.5 px-0.5">
          <h3 className="font-medium text-xs md:text-sm line-clamp-2 group-hover:text-primary transition-colors">{manga.title}</h3>
          {manga.chapters !== undefined && <p className="text-[10px] text-muted-foreground mt-0.5">{manga.chapters} chapters</p>}
        </div>
      </Link>
    </motion.div>
  );
}

