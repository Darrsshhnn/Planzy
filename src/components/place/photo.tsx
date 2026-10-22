"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/** next/image that also accepts data: URLs from photos people picked. */
export function Photo({
  src,
  alt,
  sizes,
  className = "",
  priority,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={src.startsWith("data:")}
      className={`object-cover ${className}`}
    />
  );
}

export interface ViewerPhoto {
  src: string;
  caption?: string;
}

/** Full-screen photo viewer inside the phone frame; swipe or use the arrows. */
export function PhotoViewer({
  photos,
  start,
  onClose,
}: {
  photos: ViewerPhoto[];
  start: number;
  onClose: () => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);

  useEffect(() => {
    const el = track.current;
    if (el) el.scrollTo({ left: start * el.clientWidth });
  }, [start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const go = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: Math.max(0, Math.min(photos.length - 1, i)) * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-ink" role="dialog" aria-modal="true" aria-label="Photos">
      <div className="flex items-center justify-between px-4 pb-2 pt-4 text-white">
        <span className="text-[13px]">
          {index + 1} / {photos.length}
        </span>
        <button onClick={onClose} aria-label="Close photos" className="rounded-full p-2 hover:bg-white/10">
          <X size={24} />
        </button>
      </div>
      <div
        ref={track}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto"
      >
        {photos.map((p, i) => (
          <div key={i} className="relative h-full w-full shrink-0 snap-center">
            <Image
              src={p.src}
              alt={p.caption ?? `Photo ${i + 1}`}
              fill
              sizes="430px"
              unoptimized={p.src.startsWith("data:")}
              className="object-contain"
            />
          </div>
        ))}
      </div>
      <div className="flex min-h-[110px] items-start justify-between gap-3 px-4 pb-6 pt-3 text-white">
        <button
          onClick={() => go(index - 1)}
          disabled={index === 0}
          aria-label="Previous photo"
          className="rounded-full border border-white/30 p-2 disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        <p className="flex-1 text-center text-[12px] leading-[17px] text-white/80">{photos[index]?.caption}</p>
        <button
          onClick={() => go(index + 1)}
          disabled={index === photos.length - 1}
          aria-label="Next photo"
          className="rounded-full border border-white/30 p-2 disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
