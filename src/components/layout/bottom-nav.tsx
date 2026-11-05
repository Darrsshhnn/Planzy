"use client";

import {
  CircleUserRound,
  House,
  MessageSquare,
  MessageSquareText,
  Plus,
  Search,
  UserRound,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { planActions, useNotifications } from "@/store/plan-store";

/** Selected Search: the lens gets a glint line inside, like the other selected icons. */
function SearchSelected(props: LucideProps) {
  const { size = 24, className = "", ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide ${className}`}
      aria-hidden
      {...rest}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" fill="none" />
      <path d="M7.5 10a3.5 3.5 0 0 1 3-3" fill="none" />
    </svg>
  );
}

interface Tab {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Outline with inside detail lines, shown when the tab is selected. */
  activeIcon: LucideIcon | typeof SearchSelected;
  match: (path: string) => boolean;
}

const TABS: Tab[] = [
  {
    href: "/",
    label: "Home",
    icon: House,
    activeIcon: House,
    match: (p) => p === "/" || p.startsWith("/place") || p.startsWith("/history") || p.startsWith("/notifications"),
  },
  {
    href: "/chat",
    label: "Chats",
    icon: MessageSquare,
    activeIcon: MessageSquareText,
    match: (p) => ["/chat", "/decision", "/booking", "/locked"].some((r) => p.startsWith(r)),
  },
  { href: "/plan/friends", label: "Make a plan", icon: Plus, activeIcon: Plus, match: (p) => p.startsWith("/plan") },
  {
    href: "/search",
    label: "Search",
    icon: Search,
    activeIcon: SearchSelected,
    match: (p) => p.startsWith("/search") || p.startsWith("/map") || p.startsWith("/ai"),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserRound,
    activeIcon: CircleUserRound,
    match: (p) => p.startsWith("/profile"),
  },
];

/**
 * Floating tab bar with a liquid indicator. Two cream blobs ride in tab-wide
 * slots moved with GPU transforms; the small one trails with a soft overshoot
 * and an SVG "goo" filter melts them into one stretching drop.
 * Idle icons are light cream outlines; the selected one turns orange with a
 * light tint and line detail inside (door, chat lines, lens glint, face ring).
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
          <span className="h-12 w-12 rounded-[18px] bg-cream" />
        </span>
        <span
          className="absolute inset-y-0 left-0 flex items-center justify-center will-change-transform"
          style={slot(440, "cubic-bezier(0.34, 1.3, 0.64, 1)")}
        >
          <span className="h-9 w-9 rounded-[14px] bg-cream" />
        </span>
      </div>
      <div className="relative flex h-full items-center">
        {TABS.map(({ href, label, icon, activeIcon }, i) => {
          const on = i === active;
          const Icon = on ? activeIcon : icon;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={on ? "page" : undefined}
              // Make a plan: start the draft on tap and go straight to friends (no redirect hop).
              onClick={href === "/plan/friends" ? () => planActions.start("new") : undefined}
              className="relative flex h-full flex-1 items-center justify-center"
            >
              {href === "/plan/friends" ? (
                <span
                  className={`flex h-[24px] w-[24px] items-center justify-center rounded-[6px] border-[1.75px] transition-colors duration-200 ${
                    on ? "border-brand bg-brand/20 text-brand" : "border-cream text-cream"
                  }`}
                >
                  <Plus size={16} />
                </span>
              ) : (
                <Icon
                  size={24}
                  className={`transition-[color,fill] duration-200 ${on ? "fill-brand/20 text-brand" : "fill-transparent text-cream"}`}
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
