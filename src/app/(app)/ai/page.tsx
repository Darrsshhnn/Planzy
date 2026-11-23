"use client";

import { ArrowDownWideNarrow, Check, Loader2, MapPin, RotateCcw, Send, Shapes, UsersRound, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LocationPicker } from "@/components/auth/location-picker";
import { AiIcon } from "@/components/brand/ai-icon";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { StickyFooter } from "@/components/layout/sticky-footer";
import { PlaceImage, CATEGORY_ICON } from "@/components/place/place-image";
import { Button } from "@/components/ui/button";
import { FieldBox } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { GroupFaces } from "@/components/ui/group-faces";
import { RangeField } from "@/components/ui/range-field";
import { Sheet } from "@/components/ui/sheet";
import { suggestLocally, type AiQuery, type AiResult } from "@/lib/ai/suggest";
import { CATEGORIES, getGroups, getPlace } from "@/lib/api/data";
import type { Category } from "@/lib/types";
import { useIsNewUser, useProfile } from "@/store/account-store";
import { CURRENT_USER_ID, planActions, usePlans } from "@/store/plan-store";

/** One labelled step of the Scout form. */
function Step({ n, icon, title, children }: { n: number; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3.5">
      <div className="flex flex-col items-center">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-brand">
          {n}
        </span>
        <span className="mt-1.5 w-px flex-1 bg-ink/15" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 pb-6">
        <h3 className="flex items-center gap-1.5 pt-1 text-[15px] font-semibold">
          {icon}
          {title}
        </h3>
        <div className="mt-2.5">{children}</div>
      </div>
    </div>
  );
}

/**
 * Planzy Scout: pick where you're starting from, what kind of place, your
 * budget and how far you'll go. Scout suggests places, closest first, with a
 * reason each. Select one or more, then plan them with friends or send them
 * to a group you already have.
 */
export default function ScoutPage() {
  const router = useRouter();
  const profile = useProfile();
  const { plans } = usePlans();
  const isNew = useIsNewUser();
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  // Until the person changes them, the filters follow their profile.
  const from = location || profile.location || "Ahmedabad, Ahmedabad";
  const perHead = budget ?? profile.preferences.budget;
  const maxKm = distance ?? Math.max(profile.preferences.distance, 10);
  const types = categories ?? profile.preferences.categories;

  // Groups still choosing a place: the picks can be added to their shortlist.
  // Every group you are in (not pending invites), newest first.
  const myGroups = plans
    .filter((p) => p.created && p.memberIds.includes(CURRENT_USER_ID) && p.invites[CURRENT_USER_ID] !== "invited")
    .sort((a, b) => b.createdAt - a.createdAt);
  const savedGroups = isNew ? [] : getGroups();

  const scout = async () => {
    const query: AiQuery = { prompt: "", location: from, budget: perHead, distance: maxKm, categories: types };
    setBusy(true);
    setPicked([]);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });
      if (!res.ok) throw new Error("failed");
      setResult((await res.json()) as AiResult);
    } catch {
      // Offline or server down: the same engine runs in the browser.
      setResult(suggestLocally(query));
    } finally {
      setBusy(false);
    }
  };

  const toggle = (id: string) => setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const planWithFriends = () => newPlanWith();

  const pickedCategories = () =>
    [...new Set(picked.map((id) => getPlace(id)?.category).filter(Boolean))] as Category[];

  /** New plan with all picked places shortlisted; next step is adding friends. */
  const newPlanWith = (memberIds: string[] = [], name = "") => {
    if (!picked.length) return;
    planActions.start("popular", memberIds, picked[0]);
    planActions.setShortlist(picked);
    planActions.setCategories(pickedCategories());
    if (name) planActions.setGroupName(name);
    setSending(false);
    router.push("/plan/friends");
  };

  /**
   * Adds the picked places to a group. A group still choosing gets them on its
   * shortlist (voting reopens if you had closed it). A group that has already
   * booked or been out starts its next plan with the same people instead.
   */
  const addToGroup = (planId: string) => {
    const g = plans.find((p) => p.id === planId);
    if (!g) return;
    if (g.locked || g.archived) {
      newPlanWith(g.memberIds, g.groupName);
      return;
    }
    planActions.select(planId);
    if (g.decided && g.adminId === CURRENT_USER_ID) planActions.reopenVoting();
    picked.forEach((id) => planActions.addPlaceFromChat(id));
    setSending(false);
    router.push(`/chat/${planId}`);
  };

  const n = picked.length;
  const placesText = `${n} place${n === 1 ? "" : "s"}`;
  const targets = [
    ...myGroups.map((g) => {
      const done = g.archived;
      const booked = !done && g.locked;
      return {
        key: g.id,
        name: g.groupName,
        memberIds: g.memberIds,
        tag: done ? "Past" : booked ? "Booked" : g.decided ? "Deciding" : "Voting",
        tagClass: done ? "bg-ink/10 text-ink/70" : booked ? "bg-[#E3F7EA] text-[#1a7f45]" : "bg-cream text-ink",
        hint:
          done || booked
            ? `Starts their next plan with these ${placesText}`
            : g.decided && g.adminId === CURRENT_USER_ID
              ? `Reopens voting and adds ${placesText}`
              : `Adds ${placesText} to the shortlist`,
        go: () => addToGroup(g.id),
      };
    }),
    ...savedGroups.map((g) => ({
      key: `saved-${g.id}`,
      name: g.name,
      memberIds: [CURRENT_USER_ID, ...g.memberIds],
      tag: "Saved",
      tagClass: "bg-navy/10 text-navy",
      hint: `New plan with this group and ${placesText}`,
      go: () => newPlanWith(g.memberIds, g.name),
    })),
  ];

  return (
    <Screen
      withFooter={!!result}
      overlay={
        <>
          {result && (
            <StickyFooter>
              {picked.length === 0 ? (
                <p className="rounded-[14px] bg-ink/85 px-4 py-3 text-center text-[13px] font-medium text-cream">
                  Tap places to select them, one or more
                </p>
              ) : (
                <div className="flex gap-2">
                  <Button block onClick={planWithFriends} className="flex-1 whitespace-nowrap !px-3 !text-[15px]">
                    <UsersRound size={17} /> New plan ({picked.length})
                  </Button>
                  <Button
                    block
                    variant="outline"
                    onClick={() => setSending(true)}
                    className="flex-1 whitespace-nowrap !bg-white !px-3 !text-[15px]"
                  >
                    <Send size={16} /> Add to group
                  </Button>
                </div>
              )}
            </StickyFooter>
          )}
          <Sheet open={sending} onClose={() => setSending(false)} title="Add to a group">
            <p className="-mt-1 text-[12px] text-muted">
              {picked.length} place{picked.length === 1 ? "" : "s"} selected. Pick any group you&apos;re in.
            </p>
            {targets.length ? (
              <ul className="mt-3 divide-y divide-ink/10">
                {targets.map((t) => (
                  <li key={t.key}>
                    <button onClick={t.go} className="flex w-full items-center gap-3 py-3 text-left">
                      <GroupFaces ids={t.memberIds} size={44} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[15px] font-semibold">{t.name}</span>
                          <span className={`shrink-0 rounded-full px-2 text-[10px] font-semibold leading-[18px] ${t.tagClass}`}>
                            {t.tag}
                          </span>
                        </span>
                        <span className="block truncate text-[12px] text-muted">{t.hint}</span>
                      </span>
                      <Send size={17} className="shrink-0 text-brand" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-4 rounded-[14px] bg-cream p-4 text-center">
                <p className="text-[14px] font-semibold">You&apos;re not in any group yet</p>
                <p className="mt-1 text-[12px] text-muted">Start a new plan with these places instead.</p>
                <Button block className="mt-4" onClick={planWithFriends}>
                  <UsersRound size={18} /> New plan
                </Button>
              </div>
            )}
          </Sheet>
        </>
      }
    >
      <PageHeader title="Scout" backHref="/" />

      <section className="reveal scout-ring flex items-center gap-4 p-5 text-white">
        <span className="scout-glow relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand">
          <AiIcon size={30} />
        </span>
        <div className="relative min-w-0">
          <p className="flex items-center gap-2 font-heading text-[20px] font-bold">
            Planzy Scout
            <span className="rounded-full bg-cream px-1.5 text-[9px] font-bold uppercase tracking-wider text-ink">AI</span>
          </p>
          <p className="mt-1 text-[12px] leading-[18px] text-white/70">
            Four quick answers and Scout finds the spots, closest first.
          </p>
        </div>
      </section>

      <section className="mt-7 px-1">
        <Step n={1} icon={<MapPin size={15} className="text-brand" />} title="Starting from">
          <LocationPicker value={from} onChange={setLocation} />
        </Step>
        <Step n={2} icon={<Shapes size={15} className="text-brand" />} title="What kind of place">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICON[c];
              const on = types.includes(c);
              return (
                <Chip
                  key={c}
                  selected={on}
                  onClick={() => setCategories(on ? types.filter((x) => x !== c) : [...types, c])}
                  className="inline-flex !h-[34px] items-center gap-1.5"
                >
                  <Icon size={14} /> {c}
                </Chip>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-muted">None picked = anything</p>
        </Step>
        <Step n={3} icon={<Wallet size={15} className="text-brand" />} title="Budget per person">
          <FieldBox>
            <RangeField
              label="Budget per person"
              value={perHead}
              min={100}
              max={2000}
              step={50}
              marks={["₹1000", "₹2000"]}
              format={(v) => `₹${v}`}
              onChange={setBudget}
            />
          </FieldBox>
        </Step>
        <Step n={4} icon={<ArrowDownWideNarrow size={15} className="text-brand" />} title="How far you'll go">
          <FieldBox>
            <RangeField
              label="Maximum distance"
              value={maxKm}
              min={2}
              max={30}
              step={1}
              marks={["15 km", "30 km"]}
              format={(v) => `${v} km`}
              tone="navy"
              onChange={setDistance}
            />
          </FieldBox>
        </Step>
      </section>

      <button
        onClick={scout}
        disabled={busy}
        className="scout-cta flex h-[54px] w-full items-center justify-center gap-2 rounded-[14px] text-[17px] font-semibold text-white transition active:translate-y-[2px] disabled:opacity-80"
      >
        {busy ? <Loader2 size={20} className="animate-spin" /> : <AiIcon size={20} />}
        {busy ? "Scouting…" : result ? "Scout again" : "Scout places"}
      </button>

      {result && (
        <section className="mt-10" aria-live="polite">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-brand">
              <AiIcon size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="rounded-[14px] rounded-tl-[4px] bg-cream px-3.5 py-2.5 text-[13px] leading-[19px]">
                {result.summary}
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
                <ArrowDownWideNarrow size={12} /> Closest first
                <span aria-hidden>·</span>
                {picked.length ? `${picked.length} selected` : "Select one or more"}
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setPicked([]);
                  }}
                  className="ml-auto inline-flex items-center gap-0.5 text-navy underline underline-offset-2"
                >
                  <RotateCcw size={11} /> Clear
                </button>
              </p>
            </div>
          </div>

          <ol className="mt-5 space-y-4">
            {result.suggestions.map((s, i) => {
              const place = getPlace(s.placeId);
              if (!place) return null;
              const on = picked.includes(s.placeId);
              return (
                <li key={s.placeId}>
                  <button
                    type="button"
                    onClick={() => toggle(s.placeId)}
                    aria-pressed={on}
                    className={`reveal card relative flex w-full gap-3.5 overflow-hidden p-0! text-left transition ${on ? "border-brand! ring-2 ring-brand" : ""}`}
                  >
                    <span className="relative h-[124px] w-[112px] shrink-0">
                      <PlaceImage place={place} className="h-full w-full" sizes="120px" />
                      <span className="absolute left-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-ink/85 px-1.5 text-[11px] font-bold text-cream">
                        {i + 1}
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col py-3 pr-3">
                      <span className="flex items-start justify-between gap-2">
                        <span className="line-clamp-2 font-heading text-[16px] font-bold leading-tight">{place.name}</span>
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${on ? "border-brand bg-brand text-white" : "border-ink/30 bg-white"}`}
                        >
                          {on && <Check size={14} strokeWidth={3} />}
                        </span>
                      </span>
                      <span className="mt-1 text-[12px] text-ink/70">
                        {s.km} km away · {place.area}
                      </span>
                      <span className="mt-auto flex items-start gap-1.5 pt-2 text-[11px] leading-[15px] text-ink/75">
                        <AiIcon size={13} className="mt-px shrink-0 text-brand" />
                        <span className="line-clamp-2">{s.reason}</span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </Screen>
  );
}
