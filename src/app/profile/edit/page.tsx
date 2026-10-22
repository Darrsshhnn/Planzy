"use client";

import { Camera, Mail, MapPin, Phone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { ProfilePhoto } from "@/components/profile/profile-photo";
import { Button } from "@/components/ui/button";
import { FieldBox, PlanCard } from "@/components/ui/card";
import { getAreas } from "@/lib/geo";
import { toAvatarDataUrl } from "@/lib/image";
import type { Profile } from "@/lib/types";
import { cleanPhone, isEmail, saveProfile, useProfile } from "@/store/account-store";

const noop = () => () => {};

export default function EditProfilePage() {
  const profile = useProfile();
  // Wait for the saved profile to load before seeding the form.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  if (!hydrated) {
    return (
      <Screen>
        <PageHeader title="Personal details" backHref="/profile" />
      </Screen>
    );
  }
  return <EditForm key={JSON.stringify(profile)} initial={profile} />;
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="mt-4 block">
      <span className="text-[14px] font-semibold">{label}</span>
      <FieldBox className="mt-1.5 flex h-[46px] items-center gap-2 px-4">{children}</FieldBox>
      {error && <span className="mt-1 block text-[12px] text-red-600">{error}</span>}
    </label>
  );
}

function EditForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial.name);
  const [age, setAge] = useState(initial.age ? String(initial.age) : "");
  const [location, setLocation] = useState(initial.location);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [avatar, setAvatar] = useState(initial.avatar);
  const [photoError, setPhotoError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const ageNum = Number(age);
  const errors = {
    name: name.trim().length < 2 ? "Enter at least 2 characters" : "",
    age: age && (!Number.isInteger(ageNum) || ageNum < 13 || ageNum > 100) ? "Enter an age between 13 and 100" : "",
    location: !location.trim() ? "Enter your area or city" : "",
    phone: cleanPhone(phone) ? "" : "Enter a valid 10-digit mobile number",
    email: isEmail(email) ? "" : "Enter a valid email address",
  };
  const valid = Object.values(errors).every((e) => !e);
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : "");

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      setAvatar(await toAvatarDataUrl(file));
      setPhotoError("");
    } catch {
      setPhotoError("Couldn't read that photo, try another one");
    }
  };

  const save = () => {
    setSubmitted(true);
    if (!valid) return;
    saveProfile({
      ...initial,
      name: name.trim(),
      age: age ? ageNum : null,
      location: location.trim(),
      phone: cleanPhone(phone)!,
      email: email.trim().toLowerCase(),
      avatar,
    });
    router.push("/profile");
  };

  return (
    <Screen>
      <PageHeader title="Personal details" backHref="/profile" />

      <PlanCard>
        <div className="flex flex-col items-center">
          <div className="relative">
            <ProfilePhoto src={avatar} alt="Profile photo" size={100} className="border-[3px] border-white" />
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Change photo"
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-cream bg-brand text-white"
            >
              <Camera size={17} />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              pickPhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="mt-2 flex gap-4 text-[12px] font-semibold">
            <button onClick={() => fileRef.current?.click()} className="text-brand">
              Change photo
            </button>
            {avatar && (
              <button onClick={() => setAvatar("")} className="flex items-center gap-1 text-muted">
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
          {photoError && <p className="mt-1 text-[12px] text-red-600">{photoError}</p>}
        </div>

        <Field label="Name" error={show("name")}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            autoComplete="name"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
        </Field>
        <Field label="Age" error={show("age")}>
          <input
            value={age}
            onChange={(e) => setAge(e.target.value.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric"
            placeholder="e.g. 21"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink/35"
          />
        </Field>
        <Field label="Location" error={show("location")}>
          <MapPin size={18} className="shrink-0 text-brand" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            list="planzy-areas"
            maxLength={40}
            placeholder="Area, City"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
          <datalist id="planzy-areas">
            {getAreas().map((a) => (
              <option key={a.name} value={`${a.name}, Ahmedabad`} />
            ))}
          </datalist>
        </Field>
        <Field label="Mobile number" error={show("phone")}>
          <Phone size={18} className="shrink-0 text-brand" />
          <span className="text-[15px] text-ink/70">+91</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel-national"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
        </Field>
        <Field label="Email" error={show("email")}>
          <Mail size={18} className="shrink-0 text-brand" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
          />
        </Field>
      </PlanCard>

      <div className="mt-5 space-y-2 px-1.5">
        <Button block onClick={save}>
          Save changes
        </Button>
        <Button block variant="ghost" size="md" onClick={() => router.push("/profile")}>
          Cancel
        </Button>
      </div>
    </Screen>
  );
}
