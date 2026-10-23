import Image from "next/image";
import { getPerson } from "@/lib/api/data";
import { hash } from "@/lib/format";

const COLORS = ["#E5701B", "#19486E", "#7B6CF6", "#2F8F6B", "#C2417A"];

function Face({ id, sizes }: { id: string; sizes: string }) {
  const p = getPerson(id);
  if (p.avatar) {
    return (
      <span className="relative block h-full w-full overflow-hidden">
        <Image
          src={p.avatar}
          alt=""
          fill
          sizes={sizes}
          unoptimized={p.avatar.startsWith("data:")}
          className="object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className="flex h-full w-full items-center justify-center font-heading font-bold text-white"
      style={{ background: COLORS[hash(id) % COLORS.length] }}
    >
      {p.name.charAt(0)}
    </span>
  );
}

/**
 * Group picture made of members' faces: 1 = full, 2 = halves,
 * 3 = half + two quarters, 4+ = quarters.
 */
export function GroupFaces({ ids, size = 56, className = "" }: { ids: string[]; size?: number; className?: string }) {
  const faces = ids.slice(0, 4);
  const sizes = `${size}px`;
  const n = faces.length;
  const layout =
    n <= 1 ? "grid-cols-1" : n === 2 ? "grid-cols-2" : n === 3 ? "grid-cols-2 grid-rows-2" : "grid-cols-2 grid-rows-2";
  return (
    <span
      role="img"
      aria-label={faces.map((id) => getPerson(id).name).join(", ")}
      className={`grid shrink-0 gap-px overflow-hidden rounded-full border-2 border-ink bg-ink ${layout} ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.22 }}
    >
      {faces.map((id, i) => (
        <span key={id} className={n === 3 && i === 0 ? "row-span-2" : ""}>
          <Face id={id} sizes={sizes} />
        </span>
      ))}
      {n === 0 && <span className="bg-cream" />}
    </span>
  );
}
