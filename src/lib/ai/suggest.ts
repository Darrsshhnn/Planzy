/**
 * Planzy AI: turns "cricket for 8 under ₹300 near Bopal" into ranked places.
 * The parsing and scoring here run anywhere (browser or server). They are the
 * offline engine, and they also give each Claude pick its match score and
 * check its place ids.
 */
import { getPlaces } from "@/lib/api/data";
import { AHMEDABAD, findArea, getAreas, kmBetween } from "@/lib/geo";
import { isOpenDuring } from "@/lib/time";
import type { Category, Place, TimeSlot } from "@/lib/types";

export interface AiQuery {
  /** What the person typed, in their own words. */
  prompt: string;
  /** "Area, City" they're heading out from. */
  location: string;
  /** Budget per person in rupees (the slider); the prompt can override it. */
  budget: number;
  /** Optional category filter chips. */
  categories: Category[];
}

export interface AiUnderstood {
  categories: Category[];
  budget: number;
  area: string;
  people: number | null;
  timeSlot: TimeSlot | null;
  keywords: string[];
}

export interface AiSuggestion {
  placeId: string;
  reason: string;
  match: number;
  km: number;
}

export interface AiResult {
  summary: string;
  suggestions: AiSuggestion[];
  understood: AiUnderstood;
  /** "claude" when Claude ranked the places, "local" for the built-in engine. */
  source: "claude" | "local";
}

const CATEGORY_WORDS: Record<Category, string[]> = {
  Sports: ["sport", "cricket", "turf", "football", "box cricket", "pickleball", "pool", "snooker", "badminton", "play", "match", "game of"],
  Food: ["food", "eat", "dinner", "lunch", "breakfast", "cafe", "café", "coffee", "thali", "pizza", "restaurant", "street food", "dessert", "brunch", "hungry"],
  Arcade: ["arcade", "bowling", "vr", "gaming", "games", "go kart", "karting", "trampoline", "escape"],
  Fair: ["fair", "mela", "ride", "rides", "carnival", "night market", "festival"],
  Museum: ["museum", "art", "history", "heritage", "gallery", "culture", "exhibition"],
  Hangout: ["hangout", "chill", "lake", "park", "sunset", "walk", "relax", "sit", "riverfront", "picnic"],
};

const SLOT_WORDS: Record<TimeSlot, string[]> = {
  Morning: ["morning", "sunrise", "breakfast", "early"],
  Afternoon: ["afternoon", "lunch", "noon"],
  Evening: ["evening", "sunset", "after work", "after college"],
  Night: ["night", "late", "midnight", "dinner"],
};

const has = (text: string, word: string) => new RegExp(`(^|[^a-z])${word}([^a-z]|$)`, "i").test(text);

/** Reads categories, budget, group size, time and area out of free text. */
export function understand(q: AiQuery): AiUnderstood {
  const text = q.prompt.toLowerCase();
  const categories = (Object.keys(CATEGORY_WORDS) as Category[]).filter((c) =>
    CATEGORY_WORDS[c].some((w) => has(text, w)),
  );
  for (const c of q.categories) if (!categories.includes(c)) categories.push(c);

  const money = text.match(/(?:₹|rs\.?|inr|under|below|within|budget(?: of)?|upto|up to)\s*(\d{2,5})/i) ?? text.match(/(\d{2,5})\s*(?:₹|rs|rupees|\/-)/i);
  const budget = money ? Number(money[1]) : q.budget;

  const group = text.match(/(\d{1,2})\s*(?:people|friends|of us|persons|members|guys|pax|players)/i);
  const people = group ? Number(group[1]) : null;

  const timeSlot = (Object.keys(SLOT_WORDS) as TimeSlot[]).find((s) => SLOT_WORDS[s].some((w) => has(text, w))) ?? null;

  // An area named in the prompt wins over the picker.
  const named = getAreas()
    .filter((a) => has(text, a.name.toLowerCase()))
    .sort((a, b) => b.name.length - a.name.length)[0];
  const area = named ? `${named.name}, ${named.city}` : q.location;

  const placeWords = new Set(getPlaces().flatMap((p) => p.tags.map((t) => t.toLowerCase())));
  const keywords = [...placeWords].filter((t) => t.length > 2 && has(text, t));

  return { categories, budget, area, people, timeSlot, keywords };
}

function origin(area: string) {
  return findArea(area.split(",")[0]) ?? AHMEDABAD;
}

/** Distance from the person's area, rounded to 0.1 km. */
export function kmFrom(area: string, place: Place) {
  return Math.round(kmBetween(origin(area), place) * 10) / 10;
}

/** 0-100 fit: category 35, budget 25, distance 20, timing 10, keywords 10. */
export function fit(place: Place, u: AiUnderstood) {
  const category = u.categories.length === 0 ? 24 : u.categories.includes(place.category) ? 35 : 5;
  const price = place.hourly && u.people ? Math.ceil(place.hourly.rate / u.people) : place.pricePerPerson;
  const ratio = price / Math.max(u.budget, 1);
  const budget = ratio <= 1 ? 25 - 6 * ratio : Math.max(0, 19 - (ratio - 1) * 30);
  const km = kmFrom(u.area, place);
  const distance = Math.max(0, 20 - km * 1.1);
  const timing = !u.timeSlot || isOpenDuring(place, u.timeSlot) ? 10 : 2;
  const words = place.tags.map((t) => t.toLowerCase());
  const keyword = u.keywords.length === 0 ? 6 : u.keywords.some((k) => words.includes(k)) ? 10 : 2;
  return Math.max(1, Math.min(99, Math.round(category + budget + distance + timing + keyword)));
}

function reasonFor(place: Place, u: AiUnderstood) {
  const bits: string[] = [];
  const km = kmFrom(u.area, place);
  if (u.categories.includes(place.category)) bits.push(`${place.category.toLowerCase()} pick`);
  if (place.hourly && u.people) {
    bits.push(`₹${Math.ceil(place.hourly.rate / u.people)} each for ${u.people} (₹${place.hourly.rate}/hr per ${place.hourly.unit})`);
  } else if (place.pricePerPerson <= u.budget) bits.push(`about ₹${place.pricePerPerson} a head, inside your ₹${u.budget}`);
  else bits.push(`about ₹${place.pricePerPerson} a head, a little over budget`);
  bits.push(`${km} km from ${u.area.split(",")[0]}`);
  if (u.timeSlot && isOpenDuring(place, u.timeSlot)) bits.push(`open in the ${u.timeSlot.toLowerCase()}`);
  if (place.rating >= 4.5) bits.push(`rated ${place.rating}`);
  const text = bits.join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

export function describe(u: AiUnderstood) {
  const parts = [
    u.categories.length ? u.categories.join(" / ").toLowerCase() : "anything fun",
    `around ₹${u.budget} each`,
    `near ${u.area.split(",")[0]}`,
  ];
  if (u.people) parts.push(`for ${u.people}`);
  if (u.timeSlot) parts.push(`in the ${u.timeSlot.toLowerCase()}`);
  return parts.join(", ");
}

/** The built-in engine: same inputs, no network. */
export function suggestLocally(q: AiQuery, limit = 4): AiResult {
  const u = understand(q);
  const suggestions = getPlaces()
    .map((p) => ({ placeId: p.id, reason: reasonFor(p, u), match: fit(p, u), km: kmFrom(u.area, p) }))
    .sort((a, b) => b.match - a.match)
    .slice(0, limit);
  return {
    summary: `Here's what fits ${describe(u)}.`,
    suggestions,
    understood: u,
    source: "local",
  };
}

/** Compact catalogue for the model: one line per place. */
export function catalogue() {
  return getPlaces().map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    area: p.area,
    price_per_person_inr: p.pricePerPerson,
    hourly: p.hourly ? `₹${p.hourly.rate}/hr per ${p.hourly.unit}` : null,
    rating: p.rating,
    open: `${p.open}-${p.close}`,
    closed_on: p.closedOn ?? null,
    best_time: p.bestTime,
    tags: p.tags,
    lat: p.lat,
    lng: p.lng,
  }));
}
