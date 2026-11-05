"use client";

import { Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LocationPicker } from "@/components/auth/location-picker";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { StickyFooter } from "@/components/layout/sticky-footer";
import { PlaceRowCard } from "@/components/place/place-cards";
import { Button } from "@/components/ui/button";
import { FieldBox, PlanCard } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { RangeField } from "@/components/ui/range-field";
import { suggestLocally, type AiQuery, type AiResult } from "@/lib/ai/suggest";
import { CATEGORIES, getPlace } from "@/lib/api/data";
import type { Category } from "@/lib/types";
import { useProfile } from "@/store/account-store";
import { planActions } from "@/store/plan-store";

const EXAMPLES = [
  "Box cricket for 8 of us under ₹300 near Bopal",
  "Chill café for 4 friends this evening",
  "Something fun on Sunday under ₹600",
  "Museum or heritage walk in the morning",
];

/**
 * Planzy AI: describe the outing in your own words, set where you're starting
 * from and your budget, and get places picked for you with a reason each.
 * Pick one to start a plan with friends straight away.
 */
export default function PlanzyAiPage() {
  const router = useRouter();
  const profile = useProfile();
  const [prompt, setPrompt] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AiResult | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  // Until the person changes them, the fields follow their profile.
  const from = location || profile.location || "Ahmedabad, Ahmedabad";
  const perHead = budget ?? profile.preferences.budget;

  const ask = async (text = prompt) => {
    const query: AiQuery = { prompt: text.trim(), location: from, budget: perHead, categories };
    if (!query.prompt && categories.length === 0) return setError("Tell us what you're in the mood for, or pick a category");
    setError("");
    setBusy(true);
    setPicked(null);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(query),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "failed");
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

      <section className="reveal card-dark relative overflow-hidden p-4 text-white">
        <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-brand/30 blur-2xl" />
        <p className="flex items-center gap-2 font-heading text-[18px] font-bold">
          <Sparkles size={20} className="text-brand" /> Where do you want to go?
        </p>
        <p className="mt-1 text-[12px] leading-[17px] text-white/75">
          Say it like you&apos;d text a friend: what you feel like, how many of you, your budget and when.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
          className="mt-3 flex items-end gap-2"
        >
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask();
              }
            }}
            rows={2}
            maxLength={500}
            placeholder="e.g. Turf cricket for 8 under ₹300 near Bopal"
            aria-label="Describe your outing"
            className="min-h-[52px] flex-1 resize-none rounded-[12px] border border-cream/40 bg-white px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink/45 focus:border-brand"
          />
          <button
            type="submit"
            disabled={busy}
            aria-label="Ask Planzy AI"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[12px] bg-brand text-white shadow-[0_3px_0_#c95e12] transition active:translate-y-[2px] active:shadow-none disabled:opacity-60"
          >
            {busy ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setPrompt(ex);
                ask(ex);
              }}
              className="shrink-0 rounded-full border border-cream/40 px-3 py-1 text-[11px] text-cream hover:bg-white/10"
            >
              {ex}
            </button>
          ))}
        </div>
      </section>

      <PlanCard className="mt-4">
        <h3 className="text-[15px] font-semibold">Starting from</h3>
        <div className="mt-2">
          <LocationPicker value={from} onChange={setLocation} />
        </div>
        <h3 className="mt-4 text-[15px] font-semibold">Budget / person</h3>
        <FieldBox className="mt-2">
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
        <h3 className="mt-4 text-[15px] font-semibold">
          Type <span className="text-[12px] font-normal text-muted">(optional)</span>
        </h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              selected={categories.includes(c)}
              onClick={() => setCategories((l) => (l.includes(c) ? l.filter((x) => x !== c) : [...l, c]))}
            >
              {c}
            </Chip>
          ))}
        </div>
        {error && <p className="mt-3 text-[12px] text-red-600">{error}</p>}
        <Button block className="mt-4" onClick={() => ask()} disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Finding places…
            </>
          ) : (
            <>
              <Sparkles size={18} /> {result ? "Ask again" : "Suggest places"}
            </>
          )}
        </Button>
      </PlanCard>

      {result && (
        <section className="mt-6" aria-live="polite">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-brand">
              <Sparkles size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="rounded-[14px] rounded-tl-[4px] bg-cream px-3 py-2 text-[13px] leading-[18px]">{result.summary}</p>
              <p className="mt-1 flex items-center gap-2 text-[10px] text-muted">
                {result.source === "claude" ? "Picked by Claude" : "Picked by Planzy's built-in matcher"}
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setPicked(null);
                  }}
                  className="inline-flex items-center gap-0.5 text-navy underline underline-offset-2"
                >
                  <RotateCcw size={10} /> Clear
                </button>
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {result.suggestions.map((s) => {
              const place = getPlace(s.placeId);
              if (!place) return null;
              return (
                <div key={s.placeId}>
                  <PlaceRowCard
                    place={place}
                    match={s.match}
                    selected={picked === s.placeId}
                    onSelect={() => setPicked((p) => (p === s.placeId ? null : s.placeId))}
                  />
                  <p className="mt-1.5 flex gap-1.5 px-1 text-[12px] leading-[16px] text-ink/80">
                    <Sparkles size={13} className="mt-px shrink-0 text-brand" />
                    {s.reason}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </Screen>
  );
}
