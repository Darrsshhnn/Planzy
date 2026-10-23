"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { INTRO_SEEN_KEY } from "./intro-script";
import { LOGO_DOT, LOGO_LETTERS, LOGO_RATIO, LOGO_VIEWBOX } from "./logo-paths";

/** The "p" starts centred in the wordmark (shifted 408 viewBox units, see .intro-move). */
const P_CENTER = "127px 170px";
const DOT_CENTER = `${LOGO_DOT.cx}px ${LOGO_DOT.cy}px`;

/**
 * The opening animation. The "p" appears alone in the centre and scans like a
 * magnifying glass, the orange location dot drops into the lens with a ping,
 * then the "p" slides into place as "lanzy" writes out.
 */
function LogoIntro({ width = 240 }: { width?: number }) {
  const { cx, cy, r } = LOGO_DOT;
  const p = LOGO_LETTERS.find((l) => l.id === "p")!;
  const rest = LOGO_LETTERS.filter((l) => l.id !== "p");
  const arc = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(cx + r * 0.62 * Math.cos(a)).toFixed(1)} ${(cy + r * 0.62 * Math.sin(a)).toFixed(1)}`;
  };
  const box: CSSProperties = { transformBox: "view-box" };

  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      width={width}
      height={Math.round(width / LOGO_RATIO)}
      role="img"
      aria-label="Planzy"
      className="overflow-visible"
    >
      {rest.map((l, i) => (
        <path
          key={l.id}
          d={l.d}
          fill="#FEF1E8"
          fillRule="evenodd"
          className="intro-letter"
          style={{ animationDelay: `${1.85 + i * 0.07}s` }}
        />
      ))}
      {/* The mark: "p" (magnifying glass) + dot (location) */}
      <g className="intro-move" style={{ ...box, transformOrigin: P_CENTER }}>
        <g className="intro-in" style={{ ...box, transformOrigin: P_CENTER }}>
          <g className="intro-scan" style={{ ...box, transformOrigin: DOT_CENTER }}>
            <path d={p.d} fill="#FEF1E8" fillRule="evenodd" />
            <circle
              className="intro-ripple"
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#FEF1E8"
              strokeWidth={6}
              style={{ ...box, transformOrigin: DOT_CENTER }}
            />
            <g className="intro-dot" style={{ ...box, transformOrigin: DOT_CENTER }}>
              <circle cx={cx} cy={cy} r={r} fill="#FEF1E8" />
              <path
                className="intro-glint"
                d={`M${arc(-110)} A${r * 0.62} ${r * 0.62} 0 0 1 ${arc(-20)}`}
                fill="none"
                stroke="#242A2F"
                strokeWidth={4}
                strokeLinecap="round"
              />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}

/**
 * Full-screen opening on the orange brand screen, once per browser session,
 * then the app continues underneath (sign-in or Home). A tiny inline script in
 * the root layout hides it immediately on later loads in the same session.
 */
export function AppIntro() {
  const [phase, setPhase] = useState<"play" | "leave" | "done">("play");

  useEffect(() => {
    let seen = false;
    try {
      seen = window.sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
      window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
    } catch {
      // storage blocked: just play it
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timers = seen
      ? [setTimeout(() => setPhase("done"), 0)]
      : [
          setTimeout(() => setPhase("leave"), reduce ? 1100 : 2750),
          setTimeout(() => setPhase("done"), reduce ? 1600 : 3250),
        ];
    return () => timers.forEach(clearTimeout);
  }, []);

  if (phase === "done") return null;
  return (
    <div
      className={`app-intro absolute inset-0 z-[60] flex items-center justify-center bg-brand transition-[opacity,transform] duration-500 ease-out ${
        phase === "leave" ? "pointer-events-none scale-105 opacity-0" : ""
      }`}
      aria-hidden={phase === "leave"}
    >
      <LogoIntro />
    </div>
  );
}
