import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "dark" | "brand" | "outline" | "cream" | "ghost";
type Size = "lg" | "md" | "sm";

const variants: Record<Variant, string> = {
  dark: "bg-ink text-white ring-2 ring-cream hover:bg-[#1b2024]",
  brand:
    "bg-gradient-to-b from-[#ef8331] to-[#d9640f] text-white border-[1.5px] border-cream/80 hover:from-[#e9782a] hover:to-[#c95e12]",
  outline: "bg-paper text-ink border-[1.5px] border-ink hover:bg-white",
  cream: "bg-cream text-ink border border-ink/15 hover:bg-[#fde6d6]",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
};

const sizes: Record<Size, string> = {
  lg: "h-[48px] px-6 text-[18px] rounded-[10px]",
  md: "h-[44px] px-5 text-[15px] rounded-[12px]",
  sm: "h-[34px] px-3.5 text-[13px] rounded-[10px]",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
  className?: string;
}

function classes({ variant = "dark", size = "lg", block, className = "" }: Omit<BaseProps, "children">) {
  return [
    "inline-flex select-none items-center justify-center gap-2 font-semibold transition active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-45",
    variants[variant],
    sizes[size],
    block ? "w-full" : "",
    className,
  ].join(" ");
}

export function Button({
  variant,
  size,
  block,
  className,
  children,
  type = "button",
  ...rest
}: BaseProps & ComponentProps<"button">) {
  return (
    <button type={type} className={classes({ variant, size, block, className })} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  block,
  className,
  children,
  ...rest
}: BaseProps & ComponentProps<typeof Link>) {
  return (
    <Link className={classes({ variant, size, block, className })} {...rest}>
      {children}
    </Link>
  );
}
