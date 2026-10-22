import { Coffee, FerrisWheel, Gamepad2, Landmark, Trophy, UtensilsCrossed, type LucideIcon } from "lucide-react";
import Image from "next/image";
import type { Category, Place } from "@/lib/types";

export const CATEGORY_ICON: Record<Category, LucideIcon> = {
  Food: UtensilsCrossed,
  Sports: Trophy,
  Arcade: Gamepad2,
  Fair: FerrisWheel,
  Museum: Landmark,
  Hangout: Coffee,
};

const CATEGORY_GRADIENT: Record<Category, string> = {
  Food: "from-[#f6a66c] to-[#c95e12]",
  Sports: "from-[#3f7a4f] to-[#1f3d2a]",
  Arcade: "from-[#5b4fd6] to-[#19486e]",
  Fair: "from-[#f0a33a] to-[#c2417a]",
  Museum: "from-[#8a6a4a] to-[#3b2f26]",
  Hangout: "from-[#19486e] to-[#242a2f]",
};

/** Place photo, or a category-tinted placeholder when no photo exists yet. */
export function PlaceImage({
  place,
  sizes = "400px",
  className = "",
  priority,
}: {
  place: Place;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  if (place.image) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image src={place.image} alt={place.name} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  const Icon = CATEGORY_ICON[place.category];
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-gradient-to-br ${CATEGORY_GRADIENT[place.category]} ${className}`}
      role="img"
      aria-label={place.name}
    >
      <Icon className="h-1/3 max-h-16 w-1/3 max-w-16 text-white/85" />
      <span className="absolute -bottom-6 -right-4 h-24 w-24 rounded-full bg-white/10" />
      <span className="absolute -left-6 -top-8 h-20 w-20 rounded-full bg-white/10" />
    </div>
  );
}
