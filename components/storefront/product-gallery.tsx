"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import type { ProductImage } from "@/lib/types";

interface ProductGalleryProps {
  images: ProductImage[];
  videoUrl?: string | null;
}

export function ProductGallery({ images, videoUrl }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  // Build a unified list of media items: images first, then video
  type MediaItem =
    | { kind: "image"; image: ProductImage; index: number }
    | { kind: "video"; url: string };

  const mediaItems: MediaItem[] = [
    ...sorted.map((img, i) => ({ kind: "image" as const, image: img, index: i })),
    ...(videoUrl ? [{ kind: "video" as const, url: videoUrl }] : []),
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = mediaItems[selectedIndex];

  if (mediaItems.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-muted text-muted-foreground">
        No images
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main viewer */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
        {selected?.kind === "image" && (
          <Image
            src={selected.image.url}
            alt={selected.image.alt_text || "Product image"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        )}
        {selected?.kind === "video" && (
          <video
            src={selected.url}
            controls
            className="h-full w-full object-contain"
            playsInline
          >
            Your browser does not support the video tag.
          </video>
        )}
      </div>

      {/* Thumbnails */}
      {mediaItems.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {mediaItems.map((item, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                i === selectedIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              }`}
            >
              {item.kind === "image" ? (
                <Image
                  src={item.image.url}
                  alt={item.image.alt_text || ""}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-black/70">
                  <Play className="h-5 w-5 fill-white text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
