"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthButton, AuthShell } from "@/components/auth/auth-shell";
import { WelcomeIntro } from "@/components/brand/app-intro";
import { CATEGORY_ICON, PlaceImage } from "@/components/place/place-image";
import { Chip } from "@/components/ui/chip";
import { CATEGORIES, getPlaces } from "@/lib/api/data";
import { TIME_SLOTS } from "@/lib/time";
import type { Category, TimeSlot } from "@/lib/types";
import { finishOnboarding, useProfile } from "@/store/account-store";

const BLURB: Record<Category, string> = {
  Food: "Cafés, thalis, late-night bites",
  Sports: "Turf cricket, pickleball, pool",
  Arcade: "Bowling, VR, gaming zones",
  Fair: "Melas, fun rides, night markets",
  Museum: "Heritage, art and history",
  Hangout: "Lakes, parks, chill spots",
};

const BUDGETS = [300, 500, 800, 1000];

/** One photo per category, from the best-rated place in it. */
function coverFor(category: Category) {
  return getPlaces()
    .filter((p) => p.category === category)
    .sort((a, b) => Number(!!b.image) - Number(!!a.image) || b.rating - a.rating)[0];
}

/**
 * Last sign-up step: what do you like doing? Home then shows places picked
 * for these instead of Recents (a new user has none yet).
 */
export default function InterestsPage() {
  const router = useRouter();
  const profile = useProfile();
  const [categories, setCategories] = useState<Category[]>(profile.preferences.categories);
  const [budget, setBudget] = useState(profile.preferences.budget);
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(profile.preferences.timeSlot);
  const [error, setError] = useState("");
  const [opening, setOpening] = useState(false);

  const toggle = (c: Category) => {
    setError("");
    setCategories((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]));
  };

  const done = () => {
    if (categories.length === 0) return setError("Pick at least one thing you enjoy");
    finishOnboarding({ ...profile.preferences, categories, budget, timeSlot });
    setOpening(true);
  };

  if (opening) {
    return <WelcomeIntro onDone={() => router.replace("/")} message="Finding places you'll love…" />;
  }

  return (
    <AuthShell
      title="What do you enjoy doing?"
      subtitle="Pick a few. We'll suggest places you might like on your Home screen."
      step={[6, 6]}
    >
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICON[c];
          const cover = coverFor(c);
          const on = categories.includes(c);
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggle(c)}
              aria-pressed={on}
              className={`card-dark relative overflow-hidden text-left transition active:scale-[0.98] ${on ? "border-brand! ring-2 ring-brand" : ""}`}
            >
              {cover && <PlaceImage place={cover} className="h-[72px] w-full" sizes="200px" />}
              <span className="block px-2.5 pb-2.5 pt-2 text-white">
                <span className="flex items-center gap-1.5 text-[14px] font-semibold">
                  <Icon size={15} className="text-brand" /> {c}
                </span>
                <span className="mt-0.5 block text-[10px] leading-[13px] text-white/75">{BLURB[c]}</span>
              </span>
              {on && (
                <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-brand text-white">
                  <Check size={14} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <h3 className="mt-6 text-[15px] font-semibold">Usual budget per person</h3>
      <div className="mt-2 flex gap-1.5">
        {BUDGETS.map((b) => (
          <Chip key={b} selected={budget === b} onClick={() => setBudget(b)} className="flex-1 !px-0 !text-[13px]">
            ₹{b}
            {b === 1000 ? "+" : ""}
          </Chip>
        ))}
      </div>

      <h3 className="mt-5 text-[15px] font-semibold">When do you usually go out?</h3>
      <div className="mt-2 flex gap-1.5">
        {TIME_SLOTS.map((t) => (
          <Chip key={t} selected={timeSlot === t} onClick={() => setTimeSlot(t)} className="flex-1 !px-0 !text-[12px]">
            {t}
          </Chip>
        ))}
      </div>

      {error && <p className="mt-4 text-center text-[12px] text-red-600">{error}</p>}
      <AuthButton type="button" className="mt-7" onClick={done}>
        {categories.length ? `Show my places (${categories.length})` : "Show my places"}
      </AuthButton>
    </AuthShell>
  );
}
