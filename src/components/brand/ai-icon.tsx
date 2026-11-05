import type { SVGProps } from "react";

/**
 * Planzy AI mark: a map pin with a spark inside, drawn as a single path
 * (one vector) in the same line style as the rest of the app's icons.
 */
export const AI_ICON_PATH =
  "M12 22s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12Z M12 6.2c.45 2.2 1.45 3.2 3.6 3.6-2.15.45-3.15 1.45-3.6 3.6-.45-2.15-1.45-3.15-3.6-3.6 2.15-.4 3.15-1.4 3.6-3.6Z";

export function AiIcon({ size = 24, className = "", ...rest }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...rest}
    >
      <path d={AI_ICON_PATH} />
    </svg>
  );
}
