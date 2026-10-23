"use client";

import {
  ChevronRight,
  Heart,
  History,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Settings,
  SlidersHorizontal,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { ProfilePhoto } from "@/components/profile/profile-photo";
import { getGroups } from "@/lib/api/data";
import { useProfile } from "@/store/account-store";
import { useFavourites, usePlans } from "@/store/plan-store";

/** Profile home: who you are, then one row per section; each opens its own screen. */
export default function ProfilePage() {
  const profile = useProfile();
  const favourites = useFavourites();
  const { plans } = usePlans();
  const outings = plans.filter((p) => p.archived || p.booking.status !== "none").length;

  const sections: { href: string; icon: LucideIcon; label: string; hint: string }[] = [
    { href: "/profile/edit", icon: UserRound, label: "Personal details", hint: "Photo, name, age, number, email" },
    {
      href: "/profile/preferences",
      icon: SlidersHorizontal,
      label: "Preferences",
      hint: `₹${profile.preferences.budget} · ${profile.preferences.distance} km · ${profile.preferences.timeSlot}`,
    },
    { href: "/profile/favourites", icon: Heart, label: "Favourites", hint: `${favourites.length} saved places` },
    { href: "/history", icon: History, label: "History", hint: `${outings} outings` },
    { href: "/profile/groups", icon: UsersRound, label: "Groups", hint: `${getGroups().length} saved groups` },
    { href: "/profile/settings", icon: Settings, label: "Settings", hint: "Password, notifications, log out" },
  ];

  return (
    <Screen>
      <PageHeader title="Profile" noBack />

      <section className="reveal card bg-cream! p-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <ProfilePhoto src={profile.avatar} alt={profile.name} size={76} className="border-[3px] border-white" />
            <Link
              href="/profile/edit"
              aria-label="Edit photo and details"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-cream bg-brand text-white"
            >
              <Pencil size={13} />
            </Link>
          </div>
          <div className="min-w-0">
            <h2 className="truncate font-heading text-[20px] font-bold leading-tight">{profile.name}</h2>
            <p className="mt-0.5 text-[13px] text-ink/80">{profile.age ? `${profile.age} years` : "Add your age"}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[13px] text-ink/80">
              <MapPin size={13} className="text-brand" /> {profile.location}
            </p>
          </div>
        </div>
        <div className="mt-3 grid gap-1.5 border-t border-ink/10 pt-3 text-[13px]">
          <p className="flex items-center gap-2 truncate">
            <Phone size={14} className="shrink-0 text-brand" />
            {profile.phone ? `+91 ${profile.phone.slice(0, 5)} ${profile.phone.slice(5)}` : "Add your number"}
          </p>
          <p className="flex items-center gap-2 truncate">
            <Mail size={14} className="shrink-0 text-brand" />
            {profile.email || "Add your email"}
          </p>
        </div>
      </section>

      <nav aria-label="Profile sections" className="reveal card mt-5 divide-y divide-ink/10 overflow-hidden">
        {sections.map(({ href, icon: Icon, label, hint }) => (
          <Link key={href} href={href} className="flex items-center gap-3 px-3.5 py-3 hover:bg-cream/60">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-cream">
              <Icon size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">{label}</span>
              <span className="block truncate text-[12px] text-muted">{hint}</span>
            </span>
            <ChevronRight size={20} className="text-ink/50" />
          </Link>
        ))}
      </nav>
    </Screen>
  );
}
