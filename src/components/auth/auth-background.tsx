import { MapPin } from "lucide-react";
import type { CSSProperties } from "react";

const BLOBS: { className: string; style: CSSProperties }[] = [
  { className: "-left-24 -top-20 h-72 w-72 bg-brand/15", style: { "--dur": "16s" } as CSSProperties },
  { className: "-right-28 top-40 h-80 w-80 bg-cream", style: { "--dur": "19s", animationDelay: "-5s" } as CSSProperties },
  { className: "-bottom-24 left-10 h-72 w-72 bg-navy/10", style: { "--dur": "22s", animationDelay: "-9s" } as CSSProperties },
];

const PINS = [
  { left: "12%", top: "16%", size: 22, tilt: "-12deg", dur: "6s", delay: "0s" },
  { left: "82%", top: "12%", size: 18, tilt: "10deg", dur: "7s", delay: "-2s" },
  { left: "76%", top: "44%", size: 26, tilt: "-6deg", dur: "8s", delay: "-4s" },
  { left: "8%", top: "58%", size: 16, tilt: "14deg", dur: "6.5s", delay: "-1s" },
  { left: "86%", top: "80%", size: 20, tilt: "-10deg", dur: "7.5s", delay: "-3s" },
  { left: "18%", top: "88%", size: 18, tilt: "8deg", dur: "9s", delay: "-5s" },
];

/** Soft drifting blobs and floating map pins behind the sign-in forms. */
export function AuthBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {BLOBS.map((b, i) => (
        <span key={i} className={`auth-blob absolute rounded-full blur-2xl ${b.className}`} style={b.style} />
      ))}
      {PINS.map((p, i) => (
        <span
          key={i}
          className="auth-pin absolute text-brand/35"
          style={{ left: p.left, top: p.top, "--tilt": p.tilt, "--dur": p.dur, animationDelay: p.delay } as CSSProperties}
        >
          <MapPin size={p.size} />
        </span>
      ))}
    </div>
  );
}
