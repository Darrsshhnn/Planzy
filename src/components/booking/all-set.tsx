"use client";

import { Check } from "lucide-react";
import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

const DOTS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  return {
    x: Math.round(Math.cos(angle) * 130),
    y: Math.round(Math.sin(angle) * 130),
    size: 8 + (i % 3) * 4,
    color: ["#FEF1E8", "#242A2F", "#FFFFFF"][i % 3],
    delay: 0.35 + (i % 4) * 0.04,
  };
});

/**
 * Full-screen "You're all set!" moment shown once per booking, before the
 * Locked In screen: the tick draws in, a ring and confetti burst out, then it
 * fades away. Keyed by the booking reference so it doesn't replay.
 */
export function AllSetOverlay({ bookingRef, title, subtitle }: { bookingRef: string; title: string; subtitle: string }) {
  const [phase, setPhase] = useState<"play" | "leave" | "done">("done");

  useLayoutEffect(() => {
    if (!bookingRef) return;
    const key = `planzy:all-set:${bookingRef}`;
    const seen = () => {
      try {
        return window.localStorage.getItem(key) === "1";
      } catch {
        return false;
      }
    };
    if (seen()) return;
    const markSeen = () => {
      try {
        window.localStorage.setItem(key, "1");
      } catch {
        // storage blocked: it may play again next time
      }
    };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = [
      setTimeout(() => setPhase("play"), 0),
      setTimeout(() => {
        markSeen();
        setPhase("leave");
      }, reduce ? 1100 : 2300),
      setTimeout(() => setPhase("done"), reduce ? 1400 : 2700),
    ];
    return () => timers.forEach(clearTimeout);
  }, [bookingRef]);

  if (phase === "done") return null;
  const target = document.getElementById("planzy-screen") ?? document.body;
  return createPortal(
    <div
      role="status"
      aria-live="assertive"
      className={`absolute inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden bg-brand px-8 text-center text-white transition-opacity duration-400 ${phase === "leave" ? "opacity-0" : ""}`}
    >
      <div className="relative flex h-[150px] w-[150px] items-center justify-center">
        <span className="all-set-ring absolute inset-0 rounded-full border-4 border-cream" />
        {DOTS.map((d, i) => (
          <span
            key={i}
            className="all-set-dot absolute left-1/2 top-1/2 rounded-full"
            style={
              {
                width: d.size,
                height: d.size,
                marginLeft: -d.size / 2,
                marginTop: -d.size / 2,
                background: d.color,
                animationDelay: `${d.delay}s`,
                "--x": `${d.x}px`,
                "--y": `${d.y}px`,
              } as React.CSSProperties
            }
          />
        ))}
        <span className="all-set-badge relative flex h-[110px] w-[110px] items-center justify-center rounded-full bg-cream text-brand shadow-[0_6px_0_#242a2f]">
          <Check size={60} strokeWidth={3} className="all-set-check" />
        </span>
      </div>
      <h2 className="all-set-text mt-10 font-heading text-[30px] font-bold leading-tight" style={{ animationDelay: "0.45s" }}>
        You&apos;re all set!
      </h2>
      <p className="all-set-text mt-2 text-[15px] text-cream" style={{ animationDelay: "0.6s" }}>
        {title}
      </p>
      <p className="all-set-text mt-1 text-[13px] text-cream/80" style={{ animationDelay: "0.7s" }}>
        {subtitle}
      </p>
    </div>,
    target,
  );
}
