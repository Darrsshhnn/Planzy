/** Instant placeholder while a screen's data streams in (used by loading.tsx). */
export function ScreenSkeleton({ variant = "list" }: { variant?: "list" | "chat" }) {
  const bar = "rounded-[10px] bg-ink/8 animate-pulse";
  return (
    <div className="absolute inset-0 px-5 pt-4" aria-busy="true" aria-label="Loading">
      <div className="flex items-center gap-3">
        <span className={`h-8 w-8 rounded-full ${bar}`} />
        <span className={`h-5 w-40 ${bar}`} />
      </div>
      {variant === "chat" ? (
        <>
          <div className={`mt-4 h-[52px] ${bar}`} />
          <div className="mt-6 space-y-4">
            <div className={`h-10 w-2/3 ${bar}`} />
            <div className={`ml-auto h-10 w-1/2 ${bar}`} />
            <div className={`h-10 w-3/5 ${bar}`} />
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-3">
          <div className={`h-[140px] ${bar}`} />
          <div className={`h-[70px] ${bar}`} />
          <div className={`h-[70px] ${bar}`} />
        </div>
      )}
    </div>
  );
}
