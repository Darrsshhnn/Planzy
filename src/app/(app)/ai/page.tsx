"use client";

import { ArrowDownWideNarrow, Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocationPicker } from "@/components/auth/location-picker";
import { AiIcon } from "@/components/brand/ai-icon";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { StickyFooter } from "@/components/layout/sticky-footer";
import { PlaceRowCard } from "@/components/place/place-cards";
import { CATEGORY_ICON } from "@/components/place/place-image";
import { Button } from "@/components/ui/button";
import { FieldBox, PlanCard } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { RangeField } from "@/components/ui/range-field";
import { suggestLocally, type AiQuery, type AiResult } from "@/lib/ai/suggest";
import { CATEGORIES, getPlace } from "@/lib/api/data";
import type { Category } from "@/lib/types";
import { useProfile } from "@/store/account-store";
import { planActions } from "@/store/plan-store";

/**
 * Planzy AI: pick where you're starting from, what kind of place, your budget
 * and how far you'll go. It suggests places that fit, listed closest first,
 * with a reason for each. Pick one to start a plan with friends.
 */
export default function PlanzyAiPage() {
  const router = useRouter();
  const profile = useProfile();
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  // Until the person changes them, the filters follow their profile.
  const from = location || profile.location || "Ahmedabad, Ahmedabad";
  const perHead = budget ?? profile.preferences.budget;
  const maxKm = distance ?? Math.max(profile.preferences.distance, 10);
  const types = categories ?? profile.preferences.categories;

  const ask = async () => {
    const query: AiQuery = { prompt: "", location: from, budget: perHead, distance: maxKm, categories: types };
    setBusy(true);
    setPicked(null);
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

  const plan = () => {
    if (!picked) return;
    planActions.start("popular", [], picked);
    router.push("/plan/friends");
  };

  return (
    <Screen
      withFooter={!!result}
      overlay={
        result && (
          <StickyFooter>
            <Button block disabled={!picked} onClick={plan}>
              {picked ? `Plan ${getPlace(picked)?.name} with friends` : "Pick a place to plan it"}
            </Button>
          </StickyFooter>
        )
      }
    >
      <PageHeader title="Planzy AI" backHref="/" />

      <section className="reveal card-dark relative flex items-center gap-4 overflow-hidden p-5 text-white">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand/30 blur-2xl" />
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] bg-brand">
          <AiIcon size={30} />
        </span>
        <div className="relative min-w-0">
          <p className="font-heading text-[19px] font-bold">Find the right place</p>
          <p className="mt-1 text-[12px] leading-[18px] text-white/75">
            Set where you&apos;re starting, your budget and how far you&apos;ll go. We&apos;ll pick places for you.
          </p>
        </div>
      </section>

      <PlanCard className="mt-6 space-y-6 !pb-6 !pt-5">
        <div>
          <h3 className="text-[15px] font-semibold">Starting from</h3>
          <div className="mt-2.5">
            <LocationPicker value={from} onChange={setLocation} />
          </div>
        </div>
        <div>
          <h3 className="text-[15px] font-semibold">
            Type <span className="text-[12px] font-normal text-muted">(any if none)</span>
          </h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
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
        </div>
        <div>
          <h3 className="text-[15px] font-semibold">Budget / person</h3>
          <FieldBox className="mt-2.5">
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
        </div>
        <div>
          <h3 className="text-[15px] font-semibold">How far you&apos;ll go</h3>
          <FieldBox className="mt-2.5">
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
        </div>
        <Button block onClick={ask} disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Finding places…
            </>
          ) : (
            <>
              <AiIcon size={18} /> {result ? "Suggest again" : "Suggest places"}
            </>
          )}
        </Button>
      </PlanCard>

      {result && (
        <section className="mt-9" aria-live="polite">
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
                {result.source === "claude" ? "Picked by Claude" : "Planzy matcher"}
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setPicked(null);
                  }}
                  className="ml-auto inline-flex items-center gap-0.5 text-navy underline underline-offset-2"
                >
                  <RotateCcw size={11} /> Clear
                </button>
              </p>
            </div>
          </div>
          <ol className="mt-5 space-y-6">
            {result.suggestions.map((s, i) => {
              const place = getPlace(s.placeId);
              if (!place) return null;
              return (
                <li key={s.placeId}>
                  <p className="mb-2 flex items-center gap-2 px-1 text-[12px] font-semibold text-ink/70">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-cream">
                      {i + 1}
                    </span>
                    {s.km} km away
                  </p>
                  <PlaceRowCard
                    place={place}
                    match={s.match}
                    km={s.km}
                    selected={picked === s.placeId}
                    onSelect={() => setPicked((p) => (p === s.placeId ? null : s.placeId))}
                  />
                  <p className="mt-2 flex gap-2 px-1 text-[12px] leading-[17px] text-ink/75">
                    <AiIcon size={14} className="mt-px shrink-0 text-brand" />
                    {s.reason}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </Screen>
  );
}
