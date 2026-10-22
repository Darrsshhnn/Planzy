"use client";

import { ExternalLink, Heart, MapPin, Pencil, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { PlaceListRow } from "@/components/place/place-list-row";
import { ProfilePhoto } from "@/components/profile/profile-photo";
import { SocialIcon } from "@/components/profile/social-icon";
import { AvatarStack } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getGroups, getPerson, getPlace, getRecents } from "@/lib/api/data";
import { formatDateLong, joinNames } from "@/lib/format";
import { planActions, usePlan } from "@/store/plan-store";
import { displaySocial, SOCIALS, useProfile } from "@/store/profile-store";
import { setRole, useViewer } from "@/store/viewer-store";

export default function ProfilePage() {
  const router = useRouter();
  const plan = usePlan();
  const { role } = useViewer();
  const profile = useProfile();
  const booked = plan.booking.status !== "none" ? getPlace(plan.chosenPlaceId) : undefined;

  return (
    <Screen>
      <PageHeader
        title="Profile"
        backHref="/"
        right={
          <Link
            href="/profile/edit"
            className="flex h-9 items-center gap-1.5 rounded-full border-[1.5px] border-ink bg-cream px-3.5 text-[13px] font-semibold"
          >
            <Pencil size={15} /> Edit
          </Link>
        }
      />

      <section className="flex flex-col items-center card bg-cream! px-5 pb-5 pt-6 text-center">
        <ProfilePhoto src={profile.avatar} alt={profile.name} size={96} className="border-[3px] border-white" />
        <h2 className="mt-3 font-heading text-[24px] font-bold leading-tight">{profile.name}</h2>
        <p className="mt-1 flex items-center gap-1 text-[13px] text-ink/80">
          <MapPin size={14} className="text-brand" />
          {profile.location}
        </p>
      </section>

      <section id="socials" className="mt-7 scroll-mt-4">
        <h2 className="font-heading text-[19px] font-bold">Social connections</h2>
        <p className="text-[12px] text-muted">Friends can find you and share plans faster.</p>
        <ul className="mt-3 space-y-2">
          {SOCIALS.map(({ id, label, url }) => {
            const value = profile.socials[id];
            return (
              <li key={id} className="flex items-center gap-3 card p-2.5">
                <SocialIcon id={id} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">{label}</p>
                  <p className={`truncate text-[12px] ${value ? "text-ink/80" : "text-muted"}`}>
                    {value ? displaySocial(id, value) : "Not connected"}
                  </p>
                </div>
                {value ? (
                  <a
                    href={url(value)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open ${label}`}
                    className="flex h-8 items-center gap-1 rounded-full bg-[#E3F7EA] px-3 text-[12px] font-semibold text-[#1a7f45]"
                  >
                    Connected <ExternalLink size={13} />
                  </a>
                ) : (
                  <Link
                    href="/profile/edit#socials"
                    className="flex h-8 items-center gap-1 rounded-full border border-brand px-3 text-[12px] font-semibold text-brand"
                  >
                    <Plus size={13} /> Connect
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section id="favourites" className="mt-7 scroll-mt-4">
        <h2 className="font-heading text-[19px] font-bold">Favourites</h2>
        {plan.favourites.length ? (
          <ul className="divide-y divide-ink/10">
            {plan.favourites.map((id) => {
              const p = getPlace(id);
              return p ? <PlaceListRow key={id} place={p} /> : null;
            })}
          </ul>
        ) : (
          <p className="mt-2 flex items-center gap-2 text-[13px] text-muted">
            <Heart size={16} className="text-brand" /> Tap the heart on any place to save it here.
          </p>
        )}
      </section>

      <section id="groups" className="mt-7 scroll-mt-4">
        <h2 className="font-heading text-[19px] font-bold">Groups</h2>
        <ul className="mt-2 space-y-2">
          {getGroups().map((g) => (
            <li key={g.id}>
              <button
                onClick={() => {
                  planActions.start("new", g.memberIds);
                  router.push("/plan/start");
                }}
                className="flex w-full items-center gap-3 card bg-cream! p-2.5 text-left"
              >
                <Image src={g.image} alt="" width={48} height={48} className="h-12 w-12 rounded-full border border-ink" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold">{g.name}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {joinNames(g.memberIds.map((id) => getPerson(id).name))}
                  </span>
                </span>
                <span className="text-[12px] font-semibold text-brand">Plan</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section id="history" className="mt-7 scroll-mt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-[19px] font-bold">History</h2>
          <Link href="/history" className="text-[13px] font-medium text-navy underline underline-offset-2">
            View full history
          </Link>
        </div>
        <ul className="mt-2 space-y-2">
          {booked && (
            <li>
              <Link href="/locked" className="flex items-center gap-3 card border-brand! p-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold">{booked.name}</span>
                  <span className="block text-[11px] text-muted">
                    {plan.groupName} · {formatDateLong(plan.date)} · {plan.booking.slot}
                  </span>
                </span>
                <span className="rounded-full bg-brand px-2 text-[10px] font-semibold leading-[18px] text-white">
                  Upcoming
                </span>
              </Link>
            </li>
          )}
          {getRecents().map((r) => {
            const p = getPlace(r.placeId)!;
            return (
              <li key={r.id}>
                <Link href={`/place/${p.id}`} className="flex items-center gap-3 card p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold">{r.groupName}</span>
                    <span className="block text-[11px] text-muted">{p.name}</span>
                  </span>
                  <AvatarStack ids={r.memberIds} size={24} />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-7 rounded-[12px] border border-dashed border-ink/30 p-4">
        <h2 className="text-[14px] font-semibold">Demo controls</h2>
        <p className="mt-1 text-[12px] text-muted">
          View shared screens as the group admin (pays and decides) or as a member (waits). Each browser tab keeps
          its own role, so you can open one of each side by side.
        </p>
        <div className="mt-3 flex gap-2">
          {(["admin", "member"] as const).map((r) => (
            <Button key={r} size="sm" variant={role === r ? "dark" : "outline"} onClick={() => setRole(r)}>
              <span className="capitalize">{r}</span>
            </Button>
          ))}
          <Button size="sm" variant="ghost" className="ml-auto text-brand" onClick={() => planActions.reset()}>
            Reset plan
          </Button>
        </div>
      </section>
    </Screen>
  );
}
