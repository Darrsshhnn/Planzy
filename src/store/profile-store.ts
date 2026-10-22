"use client";

/**
 * The signed-in user's editable profile, persisted to localStorage.
 * Kept separate from the plan so resetting a plan never wipes it.
 * With a backend, `saveProfile` becomes a PATCH /me call.
 */
import { useSyncExternalStore } from "react";
import { getMe, setMeOverride } from "@/lib/api/data";
import type { Profile, SocialId } from "@/lib/types";
import { refreshPlanSubscribers } from "@/store/plan-store";

const STORAGE_KEY = "planzy:profile:v1";
const base = getMe();

export const defaultProfile: Profile = {
  name: base.name,
  location: base.city,
  avatar: base.avatar,
  socials: { instagram: "darshan.explores" },
};

let profile: Profile = defaultProfile;
let loaded = false;
const listeners = new Set<() => void>();

function apply(next: Profile) {
  profile = next;
  setMeOverride({ name: next.name, avatar: next.avatar, city: next.location });
}

function read(): Profile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultProfile, ...JSON.parse(raw) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  apply(read());
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    apply(read());
    listeners.forEach((l) => l());
    refreshPlanSubscribers();
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  ensureLoaded();
  return profile;
}

export function useProfile(): Profile {
  return useSyncExternalStore(subscribe, getSnapshot, () => defaultProfile);
}

export function saveProfile(next: Profile) {
  ensureLoaded();
  apply(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep the change in memory for this session.
  }
  listeners.forEach((l) => l());
  refreshPlanSubscribers();
}

// Apply any saved profile as soon as this module loads on the client,
// so names in chat and booking screens are right on first render.
ensureLoaded();

export const SOCIALS: {
  id: SocialId;
  label: string;
  placeholder: string;
  hint: string;
  url: (value: string) => string;
}[] = [
  { id: "instagram", label: "Instagram", placeholder: "username", hint: "@username", url: (v) => `https://instagram.com/${v}` },
  { id: "whatsapp", label: "WhatsApp", placeholder: "10-digit mobile number", hint: "+91", url: (v) => `https://wa.me/91${v}` },
  { id: "snapchat", label: "Snapchat", placeholder: "username", hint: "@username", url: (v) => `https://snapchat.com/add/${v}` },
  { id: "facebook", label: "Facebook", placeholder: "profile name", hint: "facebook.com/", url: (v) => `https://facebook.com/${v}` },
];

/** Normalises what the user typed; returns null when it isn't valid. */
export function cleanSocial(id: SocialId, raw: string): string | null {
  const v = raw.trim();
  if (!v) return "";
  if (id === "whatsapp") {
    const digits = v.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
    return /^[6-9]\d{9}$/.test(digits) ? digits : null;
  }
  const handle = v
    .replace(/^https?:\/\/(www\.)?[^/]+\/(add\/)?/i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
  return /^[A-Za-z0-9._-]{1,30}$/.test(handle) ? handle : null;
}

/** Shows a connected value the way the network displays it. */
export function displaySocial(id: SocialId, value: string) {
  if (id === "whatsapp") return `+91 ${value.slice(0, 5)} ${value.slice(5)}`;
  return id === "facebook" ? `facebook.com/${value}` : `@${value}`;
}
