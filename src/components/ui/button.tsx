import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "dark" | "brand" | "outline" | "cream" | "ghost";
type Size = "lg" | "md" | "sm";

/**
 * Every button shares the card language: ink outline + a solid bottom edge
 * that presses down when tapped. Dark buttons get an orange edge so it shows.
 */
const PRESS = "border-[1.5px] border-ink active:translate-y-[2px]";
const variants: Record<Variant, string> = {
  dark: `${PRESS} bg-ink text-white shadow-[0_3px_0_#E5701B] active:shadow-[0_1px_0_#E5701B] hover:bg-[#1b2024]`,
  brand: `${PRESS} bg-gradient-to-b from-[#ef8331] to-[#d9640f] text-white shadow-[0_3px_0_#242a2f] active:shadow-[0_1px_0_#242a2f] hover:from-[#e9782a] hover:to-[#c95e12]`,
  outline: `${PRESS} bg-paper text-ink shadow-[0_3px_0_#242a2f] active:shadow-[0_1px_0_#242a2f] hover:bg-white`,
  cream: `${PRESS} bg-cream text-ink shadow-[0_3px_0_#242a2f] active:shadow-[0_1px_0_#242a2f] hover:bg-[#fde6d6]`,
  ghost: "bg-transparent text-ink hover:bg-ink/5",
};

const sizes: Record<Size, string> = {
  lg: "h-[48px] px-6 text-[17px] rounded-[12px]",
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
    "inline-flex select-none items-center justify-center gap-2 font-semibold transition-[transform,box-shadow,background-color] duration-150",
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
