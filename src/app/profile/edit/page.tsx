"use client";

import { Camera, MapPin, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { ProfilePhoto } from "@/components/profile/profile-photo";
import { SocialIcon } from "@/components/profile/social-icon";
import { Button } from "@/components/ui/button";
import { FieldBox, PlanCard } from "@/components/ui/card";
import { toAvatarDataUrl } from "@/lib/image";
import type { Profile, SocialId } from "@/lib/types";
import { cleanSocial, defaultProfile, saveProfile, SOCIALS, useProfile } from "@/store/profile-store";

const AREAS = [
  "Thaltej, Ahmedabad",
  "Bodakdev, Ahmedabad",
  "Satellite, Ahmedabad",
  "Vastrapur, Ahmedabad",
  "Navrangpura, Ahmedabad",
  "Gota, Ahmedabad",
  "Maninagar, Ahmedabad",
  "Paldi, Ahmedabad",
  "Prahlad Nagar, Ahmedabad",
  "Ahmedabad, Gujarat",
];

const noop = () => () => {};

export default function EditProfilePage() {
  const profile = useProfile();
  // Wait for the saved profile to load before seeding the form.
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  if (!hydrated) {
    return (
      <Screen>
        <PageHeader title="Edit Profile" backHref="/profile" />
      </Screen>
    );
  }
  return <EditForm key={JSON.stringify(profile)} initial={profile} />;
}

function EditForm({ initial }: { initial: Profile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial.name);
  const [location, setLocation] = useState(initial.location);
  const [avatar, setAvatar] = useState(initial.avatar);
  const [socials, setSocials] = useState<Record<SocialId, string>>({
    instagram: initial.socials.instagram ?? "",
    whatsapp: initial.socials.whatsapp ?? "",
    snapchat: initial.socials.snapchat ?? "",
    facebook: initial.socials.facebook ?? "",
  });
  const [photoError, setPhotoError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const nameError = name.trim().length < 2 ? "Enter at least 2 characters" : "";
  const locationError = !location.trim() ? "Enter your area or city" : "";
  const socialErrors = Object.fromEntries(
    SOCIALS.map(({ id }) => [
      id,
      cleanSocial(id, socials[id]) === null
        ? id === "whatsapp"
          ? "Enter a valid 10-digit Indian mobile number"
          : "Use letters, numbers, dots or underscores"
        : "",
    ]),
  ) as Record<SocialId, string>;
  const valid = !nameError && !locationError && Object.values(socialErrors).every((e) => !e);

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setPhotoError("Please choose an image file");
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
    const cleaned: Profile["socials"] = {};
    for (const { id } of SOCIALS) {
      const v = cleanSocial(id, socials[id]);
      if (v) cleaned[id] = v;
    }
    saveProfile({ name: name.trim(), location: location.trim(), avatar, socials: cleaned });
    router.push("/profile");
  };

  const showError = (msg: string) => submitted && msg && <p className="mt-1 text-[12px] text-red-600">{msg}</p>;

  return (
    <Screen>
      <PageHeader title="Edit Profile" backHref="/profile" />

      <PlanCard>
        <div className="flex flex-col items-center">
          <div className="relative">
            <ProfilePhoto src={avatar} alt="Profile photo" size={104} className="border-[3px] border-white" />
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
            {avatar !== defaultProfile.avatar && (
              <button onClick={() => setAvatar(defaultProfile.avatar)} className="flex items-center gap-1 text-muted">
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
          {photoError && <p className="mt-1 text-[12px] text-red-600">{photoError}</p>}
        </div>

        <label className="mt-5 block">
          <span className="font-heading text-[17px] font-bold">Name</span>
          <FieldBox className="mt-2 flex h-[46px] items-center px-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              autoComplete="name"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none"
            />
          </FieldBox>
          {showError(nameError)}
        </label>

        <label className="mt-4 block">
          <span className="font-heading text-[17px] font-bold">Location</span>
          <FieldBox className="mt-2 flex h-[46px] items-center gap-2 px-4">
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
              {AREAS.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </FieldBox>
          {showError(locationError)}
        </label>

        <div id="socials" className="mt-6 scroll-mt-4">
          <h2 className="font-heading text-[17px] font-bold">Social connections</h2>
          <p className="text-[12px] text-muted">Leave a field empty to disconnect it.</p>
          <div className="mt-3 space-y-3">
            {SOCIALS.map(({ id, label, placeholder, hint }) => (
              <div key={id}>
                <FieldBox className="flex items-center gap-3 py-2 pl-2 pr-3">
                  <SocialIcon id={id} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-muted">
                      {label} · <span className="font-normal">{hint}</span>
                    </p>
                    <input
                      value={socials[id]}
                      onChange={(e) => setSocials((s) => ({ ...s, [id]: e.target.value }))}
                      placeholder={placeholder}
                      inputMode={id === "whatsapp" ? "tel" : "text"}
                      aria-label={label}
                      className="w-full bg-transparent text-[14px] outline-none placeholder:text-ink/35"
                    />
                  </div>
                  {socials[id].trim() && (
                    <button
                      onClick={() => setSocials((s) => ({ ...s, [id]: "" }))}
                      className="shrink-0 text-[11px] font-semibold text-muted"
                    >
                      Disconnect
                    </button>
                  )}
                </FieldBox>
                {showError(socialErrors[id])}
              </div>
            ))}
          </div>
        </div>
      </PlanCard>

      <div className="mt-5 space-y-2 px-1.5">
        <Button block onClick={save}>
          Save changes
        </Button>
        <Button
          block
          variant="ghost"
          size="md"
          onClick={() => {
            // This screen stays mounted between visits, so drop unsaved edits.
            setName(initial.name);
            setLocation(initial.location);
            setAvatar(initial.avatar);
            setSocials({
              instagram: initial.socials.instagram ?? "",
              whatsapp: initial.socials.whatsapp ?? "",
              snapchat: initial.socials.snapchat ?? "",
              facebook: initial.socials.facebook ?? "",
            });
            setSubmitted(false);
            router.push("/profile");
          }}
        >
          Cancel
        </Button>
      </div>
    </Screen>
  );
}
