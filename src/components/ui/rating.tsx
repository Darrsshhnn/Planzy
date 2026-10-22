import { Star } from "lucide-react";

/** Orange badge over photos ("4.2 ★"). */
export function RatingBadge({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[4px] bg-brand px-1.5 py-0.5 text-[12px] font-medium text-white ${className}`}
    >
      {value.toFixed(1)}
      <Star size={13} className="fill-[#F7C028] stroke-[#F7C028]" />
    </span>
  );
}

/** Small cream pill used on Recents cards. */
export function RatingPill({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`rounded-[4px] bg-cream px-1.5 text-[10px] font-medium leading-[16px] text-ink ${className}`}>
      {value.toFixed(1)}
    </span>
  );
}

/** Plain "4.2 ★" on dark cards. */
export function RatingInline({ value, className = "" }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[15px] text-white ${className}`}>
      {value.toFixed(1)}
      <Star size={16} className="fill-[#F7C028] stroke-[#F7C028]" />
    </span>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "fill-[#F7C028] stroke-[#F7C028]" : "stroke-ink/30"}
        />
      ))}
    </span>
  );
}
