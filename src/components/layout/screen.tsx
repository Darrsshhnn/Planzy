import type { ReactNode } from "react";

/**
 * One scrollable screen. Pages stay mounted (hidden) between navigations,
 * so each keeps its own scroll position. `overlay` renders above the
 * scroll area, for sheets and fixed composers.
 */
export function Screen({
  children,
  overlay,
  padded = true,
  className = "",
}: {
  children: ReactNode;
  overlay?: ReactNode;
  padded?: boolean;
  className?: string;
}) {
  return (
    <div className="absolute inset-0">
      <main className={`no-scrollbar h-full overflow-y-auto pb-[120px] ${padded ? "px-5" : ""} ${className}`}>
        {children}
      </main>
      {overlay}
    </div>
  );
}
