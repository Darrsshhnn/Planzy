import type { ComponentProps } from "react";

export function Chip({
  selected,
  className = "",
  ...rest
}: { selected?: boolean } & ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[
        "h-[30px] shrink-0 rounded-full border border-ink px-4 text-[14px] transition",
        selected ? "bg-ink text-brand" : "bg-paper text-ink hover:bg-white",
        className,
      ].join(" ")}
      {...rest}
    />
  );
}
