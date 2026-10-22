"use client";

import { Heart } from "lucide-react";
import { planActions, usePlan } from "@/store/plan-store";

export function FavouriteButton({ placeId, className = "" }: { placeId: string; className?: string }) {
  const { favourites } = usePlan();
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
      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition active:scale-90 ${active ? "bg-brand text-white" : "bg-cream/95 text-brand"} ${className}`}
    >
      <Heart size={20} />
    </button>
  );
}
