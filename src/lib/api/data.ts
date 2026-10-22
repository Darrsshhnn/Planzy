/**
 * Read-only data access. Everything the UI reads about places and people
 * goes through here, so a real backend only has to replace these functions.
 */
import placesJson from "@/data/places.json";
import peopleJson from "@/data/people.json";
import creditsJson from "@/data/photo-credits.json";
import type { Category, Friend, Place, RecentOuting, SavedGroup } from "@/lib/types";

const places = placesJson as Place[];
const me = peopleJson.me as Friend & { city: string };
const friends = peopleJson.friends as Friend[];
const groups = peopleJson.groups as SavedGroup[];
const recents = peopleJson.recents as RecentOuting[];

export const CATEGORIES: Category[] = ["Food", "Sports", "Arcade", "Fair", "Museum", "Hangout"];

export function getPlaces(): Place[] {
  return places;
}

export function getPlace(id: string | null | undefined): Place | undefined {
  return places.find((p) => p.id === id);
}

export function getPopularPlaces(): Place[] {
  return places.filter((p) => p.popular);
}

export function getNearbyPlaces(): Place[] {
  return places.filter((p) => p.nearby).sort((a, b) => a.distanceKm - b.distanceKm);
}

export function getFeaturedPlaces(): Place[] {
  return ["day-n-night-turf", "vechaar-museum", "sparrk"].map((id) => getPlace(id)!);
}

export function searchPlaces(query: string, category?: Category | null): Place[] {
  const q = query.trim().toLowerCase();
  return places.filter((p) => {
    if (category && p.category !== category) return false;
    if (!q) return true;
    return [p.name, p.area, p.category, ...p.tags].some((s) => s.toLowerCase().includes(q));
  });
}

/** Edits from the profile screen, applied on top of the mock "me". */
let meOverride: Partial<Friend & { city: string }> = {};

export function setMeOverride(patch: Partial<Friend & { city: string }>) {
  meOverride = patch;
}

export function getMe() {
  return { ...me, ...meOverride };
}

export function getFriends(): Friend[] {
  return friends;
}

/** Looks up anyone in a plan, including the current user ("me"). */
export function getPerson(id: string): Friend {
  if (id === me.id) return getMe();
  return friends.find((f) => f.id === id) ?? { id, name: id, avatar: "" };
}

export function getGroups(): SavedGroup[] {
  return groups;
}

export function getRecents(): RecentOuting[] {
  return recents;
}

export interface PhotoCredit {
  title: string;
  author: string;
  license: string;
  source: string;
}

const credits = creditsJson as Record<string, PhotoCredit>;

/** Attribution for a freely licensed (Wikimedia Commons) photo, keyed by image path. */
export function getPhotoCredit(imagePath: string | undefined): PhotoCredit | undefined {
  return imagePath ? credits[imagePath] : undefined;
}

/** Spots listed this week, for "New spot every week". */
export function getNewPlaces(): Place[] {
  return places.filter((p) => p.newThisWeek);
}
