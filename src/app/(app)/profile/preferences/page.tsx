"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { FieldBox, PlanCard } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { RangeField } from "@/components/ui/range-field";
import { CATEGORIES } from "@/lib/api/data";
import { TIME_SLOTS } from "@/lib/time";
import type { Profile } from "@/lib/types";
import { saveProfile, useProfile } from "@/store/account-store";

const noop = () => () => {};

/** Your default categories, budget, distance and timing for new plans and invites. */
export default function PreferencesSettingsPage() {
  const profile = useProfile();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  if (!hydrated) return null;
  return <Form key={JSON.stringify(profile.preferences)} profile={profile} />;
}

function Form({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [prefs, setPrefs] = useState(profile.preferences);
  const [saved, setSaved] = useState(false);
  const update = (patch: Partial<Profile["preferences"]>) => {
    setPrefs((p) => ({ ...p, ...patch }));
    setSaved(false);
  };

  return (
    <Screen>
      <PageHeader title="Preferences" backHref="/profile" />
      <p className="-mt-1 mb-3 text-[12px] text-muted">
        Used as your starting point when you make a plan or accept an invite.
      </p>
      <PlanCard>
        <h3 className="text-[15px] font-semibold">Favourite categories</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              selected={prefs.categories.includes(c)}
              onClick={() =>
                update({
                  categories: prefs.categories.includes(c)
                    ? prefs.categories.filter((x) => x !== c)
                    : [...prefs.categories, c],
                })
              }
            >
              {c}
            </Chip>
          ))}
        </div>
        <h3 className="mt-5 text-[15px] font-semibold">Budget / person</h3>
        <FieldBox className="mt-2">
          <RangeField
            label="Budget per person"
            value={prefs.budget}
            min={100}
            max={1000}
            step={50}
            marks={["₹500", "₹1000"]}
            format={(v) => `₹${v}`}
            onChange={(budget) => update({ budget })}
          />
        </FieldBox>
        <h3 className="mt-5 text-[15px] font-semibold">Distance</h3>
        <FieldBox className="mt-2">
          <RangeField
            label="Maximum distance"
            value={prefs.distance}
            min={2}
            max={25}
            step={1}
            marks={["10 km", "25 km"]}
            format={(v) => `${v} km`}
            tone="navy"
            onChange={(distance) => update({ distance })}
          />
        </FieldBox>
        <h3 className="mt-5 text-[15px] font-semibold">Usual timing</h3>
        <div className="mt-2 flex gap-1.5">
          {TIME_SLOTS.map((t) => (
            <Chip
              key={t}
              selected={prefs.timeSlot === t}
              onClick={() => update({ timeSlot: t })}
              className="!h-[36px] flex-1 !px-0 !text-[12px]"
            >
              {t}
            </Chip>
          ))}
        </div>
      </PlanCard>
      <div className="mt-5 px-1.5">
        <Button
          block
          onClick={() => {
            saveProfile({ ...profile, preferences: prefs });
            setSaved(true);
            setTimeout(() => router.push("/profile"), 600);
          }}
        >
          {saved ? (
            <>
              <Check size={18} /> Saved
            </>
          ) : (
            "Save preferences"
          )}
        </Button>
      </div>
    </Screen>
  );
}
