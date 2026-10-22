"use client";

import { Heart } from "lucide-react";
import { planActions, useFavourites } from "@/store/plan-store";

export function FavouriteButton({ placeId, className = "" }: { placeId: string; className?: string }) {
  const favourites = useFavourites();
  const active = favourites.includes(placeId);
  return (
    <button
      type="button"
      aria-label={active ? "Remove from favourites" : "Add to favourites"}
      aria-pressed={active}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        planActions.toggleFavourite(placeId);
      }}
      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition active:scale-90 bg-cream/95 text-brand ${className}`}
    >
      <Heart size={20} className={`transition-[fill] duration-200 ${active ? "fill-brand" : "fill-transparent"}`} />
    </button>
  );
}
