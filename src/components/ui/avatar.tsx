import Image from "next/image";
import { getPerson } from "@/lib/api/data";
import { hash } from "@/lib/format";

const FALLBACK_COLORS = ["#E5701B", "#19486E", "#7B6CF6", "#2F8F6B", "#C2417A"];

export function Avatar({
  personId,
  size = 40,
  ring = "ink",
  className = "",
}: {
  personId: string;
  size?: number;
  ring?: "ink" | "white" | "none";
  className?: string;
}) {
  const person = getPerson(personId);
  const ringClass = ring === "ink" ? "border border-ink" : ring === "white" ? "border-2 border-white" : "";
  const style = { width: size, height: size };

  if (!person.avatar) {
    return (
      <span
        style={{ ...style, background: FALLBACK_COLORS[hash(person.id) % FALLBACK_COLORS.length], fontSize: size * 0.4 }}
        className={`inline-flex aspect-square max-w-none shrink-0 items-center justify-center rounded-full font-semibold text-white ${ringClass} ${className}`}
        aria-label={person.name}
      >
        {person.name.charAt(0)}
      </span>
    );
  }
  return (
    <Image
      src={person.avatar}
      alt={person.name}
      width={size}
      height={size}
      style={style}
      className={`aspect-square max-w-none shrink-0 rounded-full object-cover ${ringClass} ${className}`}
    />
  );
}

export function AvatarStack({
  ids,
  size = 32,
  max = 4,
  ring = "ink",
}: {
  ids: string[];
  size?: number;
  max?: number;
  ring?: "ink" | "white";
}) {
  const shown = ids.slice(0, max);
  const extra = ids.length - shown.length;
  return (
    <div className="flex items-center">
      {shown.map((id, i) => (
        <span key={id} className="inline-flex" style={{ marginLeft: i ? -size * 0.3 : 0 }}>
          <Avatar personId={id} size={size} ring={ring} />
        </span>
      ))}
      {extra > 0 && (
        <span
          style={{ width: size, height: size, fontSize: size * 0.36, marginLeft: -size * 0.3 }}
          className="inline-flex shrink-0 items-center justify-center rounded-full border border-ink bg-cream font-semibold text-ink"
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

/** The little orange/white member dots on Recents cards. */
export function MemberDots({ count }: { count: number }) {
  return (
    <div className="flex">
      {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
        <span
          key={i}
          className={`h-[14px] w-[14px] rounded-full border-2 border-ink ${i % 2 ? "bg-white" : "bg-brand"} ${i ? "-ml-1" : ""}`}
        />
      ))}
    </div>
  );
}
