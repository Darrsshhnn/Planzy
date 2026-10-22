"use client";

import { Bell, Heart } from "lucide-react";
import Link from "next/link";
import { ProfilePhoto } from "@/components/profile/profile-photo";
import { useProfile } from "@/store/profile-store";

/** Home header: tapping the photo or name opens the profile. */
export function HomeHeader() {
  const profile = useProfile();
  return (
    <header className="flex items-center gap-3 px-5 pb-[14px] pt-6 md:pt-5">
      <Link href="/profile" aria-label="Open your profile" className="flex min-w-0 flex-1 items-center gap-3">
        <ProfilePhoto src={profile.avatar} alt={profile.name} size={60} />
        <div className="min-w-0">
          <p className="truncate font-heading text-[22px] font-bold leading-tight">{profile.name}</p>
          <p className="truncate font-heading text-[14px] font-bold">{profile.location}</p>
        </div>
      </Link>
      <Link
        href="/profile#favourites"
        aria-label="Favourites"
        className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-ink text-brand"
      >
        <Heart size={24} />
      </Link>
      <Link
        href="/chat"
        aria-label="Group updates"
        className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-ink text-brand"
      >
        <Bell size={24} />
      </Link>
    </header>
  );
}
