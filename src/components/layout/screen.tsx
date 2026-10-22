import type { ReactNode } from "react";

/**
 * One scrollable screen. Pages stay mounted (hidden) between navigations,
 * so each keeps its own scroll position. `overlay` renders above the
 * scroll area, for sheets, fixed composers and the sticky footer.
 * `withFooter` leaves room so the last content can scroll above a StickyFooter.
 */
export function Screen({
  children,
  overlay,
  padded = true,
  withFooter,
  className = "",
}: {
  children: ReactNode;
  overlay?: ReactNode;
  padded?: boolean;
  withFooter?: boolean;
  className?: string;
}) {
  return (
    <div className="absolute inset-0">
      <main
        className={`no-scrollbar h-full overflow-y-auto scroll-smooth ${withFooter ? "pb-[200px]" : "pb-[120px]"} ${padded ? "px-5" : ""} ${className}`}
      >
        {children}
      </main>
      {overlay}
    </div>
  );
}
