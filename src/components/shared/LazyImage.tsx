"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";

interface LazyImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function LazyImage({ src, alt, fill, width, height, className, priority }: LazyImageProps) {
  // Check if the image is already cached by the browser on mount
  const [loaded, setLoaded] = useState(() => {
    if (typeof window === "undefined") return false;
    const img = new window.Image();
    img.src = src;
    return img.complete && img.naturalWidth > 0;
  });
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <ImageOff className="w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!loaded && <div className="absolute inset-0 animate-shimmer" />}
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={cn("transition-opacity duration-150", loaded ? "opacity-100" : "opacity-0", fill && "object-cover")}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        priority={priority}
        unoptimized
      />
    </div>
  );
}

