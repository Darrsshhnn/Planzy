"use client";

import { House, MessageSquare, Plus, Search, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
}

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: House, match: (p) => p === "/" || p.startsWith("/place") || p.startsWith("/history") },
  {
    href: "/chat",
    label: "Group chat",
    icon: MessageSquare,
    match: (p) => ["/chat", "/decision", "/booking", "/locked"].some((r) => p.startsWith(r)),
  },
  { href: "/plan/start", label: "Make a plan", icon: Plus, match: (p) => p.startsWith("/plan") },
  { href: "/search", label: "Search", icon: Search, match: (p) => p.startsWith("/search") },
  { href: "/profile", label: "Profile", icon: UserRound, match: (p) => p.startsWith("/profile") },
];

/** Floating, translucent tab bar from the Figma design. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="absolute bottom-[22px] left-[15px] right-[15px] z-30 flex h-[70px] items-center justify-around rounded-[22px] bg-ink/65 backdrop-blur-md"
    >
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        const isPlus = href === "/plan/start";
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-12 w-12 items-center justify-center rounded-xl transition hover:bg-white/10 ${active ? "text-brand" : "text-cream"}`}
          >
            {isPlus ? (
              <span
                className={`flex h-[23px] w-[23px] items-center justify-center rounded-[5px] border-[1.75px] ${active ? "border-brand" : "border-cream"}`}
              >
                <Plus size={16} />
              </span>
            ) : (
              <Icon size={26} />
            )}
            {active && <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-brand" />}
          </Link>
        );
      })}
    </nav>
  );
}
