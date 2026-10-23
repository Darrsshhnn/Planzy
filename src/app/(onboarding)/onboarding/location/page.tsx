"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthButton, AuthShell } from "@/components/auth/auth-shell";
import { LocationPicker } from "@/components/auth/location-picker";
import { saveProfile, useProfile } from "@/store/account-store";

/** After sign-up / Google sign-in: pick the area you usually head out from. */
export default function LocationSetupPage() {
  const router = useRouter();
  const profile = useProfile();
  const [location, setLocation] = useState(profile.location);
  const [error, setError] = useState("");

  const done = () => {
    if (!location) return setError("Pick your area to continue");
    saveProfile({ ...profile, location });
    router.replace("/");
  };

  return (
    <AuthShell
      title="Where do you usually head out from?"
      subtitle={`Hi ${profile.name.split(" ")[0]}! We'll suggest places near you. You can change this later in Profile.`}
      step={[5, 5]}
    >
      <LocationPicker
        value={location}
        onChange={(v) => {
          setLocation(v);
          setError("");
        }}
        error={error}
      />
      <AuthButton type="button" className="mt-8" onClick={done}>
        Let&apos;s go
      </AuthButton>
    </AuthShell>
  );
}
