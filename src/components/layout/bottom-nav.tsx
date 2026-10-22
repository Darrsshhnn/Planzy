"use client";

import { House, MessageSquare, Plus, Search, UserRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { useNotifications } from "@/store/plan-store";

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (path: string) => boolean;
}

const TABS: Tab[] = [
  {
    href: "/",
    label: "Home",
    icon: House,
    match: (p) => p === "/" || p.startsWith("/place") || p.startsWith("/history") || p.startsWith("/notifications"),
  },
  {
    href: "/chat",
    label: "Chats",
    icon: MessageSquare,
    match: (p) => ["/chat", "/decision", "/booking", "/locked"].some((r) => p.startsWith(r)),
  },
  { href: "/plan/new", label: "Make a plan", icon: Plus, match: (p) => p.startsWith("/plan") },
  { href: "/search", label: "Search", icon: Search, match: (p) => p.startsWith("/search") || p.startsWith("/map") },
  { href: "/profile", label: "Profile", icon: UserRound, match: (p) => p.startsWith("/profile") },
];

/**
 * Floating tab bar with a liquid indicator. Two cream blobs ride in tab-wide
 * slots moved with GPU transforms; the small one trails with a soft overshoot
 * and an SVG "goo" filter melts them into one stretching drop.
 * Idle icons are light cream outlines; the selected one is filled orange.
 */
export function BottomNav() {
  const pathname = usePathname();
  const active = Math.max(0, TABS.findIndex((t) => t.match(pathname)));
  const invites = useNotifications().filter((n) => n.kind === "invite" && !n.read).length;
  const slot = (duration: number, easing: string): CSSProperties => ({
    width: `${100 / TABS.length}%`,
    transform: `translateX(${active * 100}%)`,
    transition: `transform ${duration}ms ${easing}`,
  });

  return (
    <nav
      aria-label="Main"
      className="absolute bottom-[22px] left-[15px] right-[15px] z-30 h-[70px] rounded-[22px] bg-ink/75 backdrop-blur-md"
    >
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="planzy-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>
      <div className="pointer-events-none absolute inset-0" style={{ filter: "url(#planzy-goo)" }} aria-hidden>
        <span
          className="absolute inset-y-0 left-0 flex items-center justify-center will-change-transform"
          style={slot(320, "cubic-bezier(0.4, 0, 0.2, 1)")}
        >
          <span className="h-12 w-12 rounded-full bg-cream" />
        </span>
        <span
          className="absolute inset-y-0 left-0 flex items-center justify-center will-change-transform"
          style={slot(440, "cubic-bezier(0.34, 1.3, 0.64, 1)")}
        >
          <span className="h-9 w-9 rounded-full bg-cream" />
        </span>
      </div>
      <div className="relative flex h-full items-center">
        {TABS.map(({ href, label, icon: Icon }, i) => {
          const on = i === active;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={on ? "page" : undefined}
              className="relative flex h-full flex-1 items-center justify-center"
            >
              {href === "/plan/new" ? (
                <span
                  className={`flex h-[24px] w-[24px] items-center justify-center rounded-[6px] border-[1.75px] transition-colors duration-200 ${
                    on ? "border-brand bg-brand text-cream" : "border-cream text-cream"
                  }`}
                >
                  <Plus size={16} />
                </span>
              ) : (
                <Icon
                  size={24}
                  className={`transition-[color,fill] duration-200 ${on ? "fill-brand text-brand" : "fill-transparent text-cream"}`}
                />
              )}
              {href === "/chat" && invites > 0 && (
                <span className="absolute right-[calc(50%-17px)] top-[16px] h-2.5 w-2.5 rounded-full border-2 border-ink bg-brand" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
