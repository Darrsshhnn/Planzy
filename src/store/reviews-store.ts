"use client";

/**
 * Reviews written in the app, per place, persisted to localStorage.
 * With a backend, `addReview` becomes a POST and photos are uploaded.
 */
import { useSyncExternalStore } from "react";
import type { Review } from "@/lib/types";

const STORAGE_KEY = "planzy:reviews:v1";
type ReviewsByPlace = Record<string, Review[]>;

const EMPTY: Review[] = [];
let state: ReviewsByPlace = {};
let loaded = false;
const listeners = new Set<() => void>();

function read(): ReviewsByPlace {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = read();
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = read();
    listeners.forEach((l) => l());
  });
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useMyReviews(placeId: string): Review[] {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureLoaded();
      return state[placeId] ?? EMPTY;
    },
    () => EMPTY,
  );
}

/** Returns false when storage is full (usually too many photos). */
export function addReview(placeId: string, review: Review): boolean {
  ensureLoaded();
  const next = { ...state, [placeId]: [review, ...(state[placeId] ?? [])] };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  state = next;
  listeners.forEach((l) => l());
  return true;
}
