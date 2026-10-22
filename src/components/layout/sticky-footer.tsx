import type { ReactNode } from "react";

/**
 * Main action pinned above the bottom navigation. Content scrolling underneath
 * is frosted: the blur is strongest at the button and fades out upwards.
 * Render it in a Screen's `overlay`, and give the Screen `withFooter`.
 */
export function StickyFooter({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-[106px] pt-10">
      <div
        aria-hidden
        className="absolute inset-0 bg-white/55 backdrop-blur-md [mask-image:linear-gradient(to_top,black_70%,transparent)]"
      />
      <div className="pointer-events-auto relative">{children}</div>
    </div>
  );
}
