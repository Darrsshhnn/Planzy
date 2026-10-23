import { LOGO_DOT, LOGO_LETTERS, LOGO_RATIO, LOGO_VIEWBOX } from "./logo-paths";

/**
 * The Planzy wordmark. `tone="dark"`: ink letters + orange dot (on white).
 * `tone="light"`: cream letters + cream dot with a dark highlight (on orange).
 * `animate` plays the intro: the "p" pin drops in, letters rise one by one,
 * then the dot pops.
 */
export function Logo({
  tone = "dark",
  width = 220,
  animate = false,
  className = "",
}: {
  tone?: "dark" | "light";
  width?: number;
  animate?: boolean;
  className?: string;
}) {
  const ink = tone === "dark" ? "#242A2F" : "#FEF1E8";
  const dot = tone === "dark" ? "#E5701B" : "#FEF1E8";
  const shine = tone === "dark" ? "#FFFFFF" : "#242A2F";
  const { cx, cy, r } = LOGO_DOT;
  // Small highlight arc on the dot, top-right.
  const arc = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `${(cx + r * 0.62 * Math.cos(a)).toFixed(1)} ${(cy + r * 0.62 * Math.sin(a)).toFixed(1)}`;
  };

  return (
    <svg
      viewBox={LOGO_VIEWBOX}
      width={width}
      height={Math.round(width / LOGO_RATIO)}
      role="img"
      aria-label="Planzy"
      className={`overflow-visible ${className}`}
    >
      {LOGO_LETTERS.map((l, i) => (
        <path
          key={l.id}
          d={l.d}
          fill={ink}
          fillRule="evenodd"
          className={animate ? (l.id === "p" ? "logo-pin" : "logo-letter") : undefined}
          style={animate ? { animationDelay: l.id === "p" ? "0ms" : `${220 + i * 90}ms` } : undefined}
        />
      ))}
      <g className={animate ? "logo-dot" : undefined} style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={r} fill={dot} />
        <path
          d={`M${arc(-110)} A${r * 0.62} ${r * 0.62} 0 0 1 ${arc(-20)}`}
          fill="none"
          stroke={shine}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={tone === "dark" ? 0.85 : 1}
        />
      </g>
    </svg>
  );
}
