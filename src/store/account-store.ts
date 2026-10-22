"use client";

/**
 * The user's account: profile + mock sign-up / log-in, persisted to localStorage.
 * Passwords are stored only as a SHA-256 hash. With a backend, these functions
 * become calls to an auth service; the screens only use the exports below.
 */
import { useSyncExternalStore } from "react";
import { getMe, setMeOverride } from "@/lib/api/data";
import type { Profile } from "@/lib/types";

const STORAGE_KEY = "planzy:account:v1";
const DEMO_OTP = "1234";

interface Account {
  profile: Profile;
  passwordHash: string;
}

interface AccountState {
  account: Account | null;
  loggedIn: boolean;
}

export const defaultProfile: Profile = {
  name: getMe().name,
  age: null,
  location: "Ahmedabad, Gujarat",
  avatar: getMe().avatar,
  phone: "",
  email: "",
  preferences: { categories: [], budget: 500, distance: 10, timeSlot: "Evening" },
};

const EMPTY: AccountState = { account: null, loggedIn: false };
let state: AccountState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();
const profileListeners = new Set<() => void>();

/** Plan screens re-render when the profile changes (names in chats etc.). */
export function onProfileChange(fn: () => void) {
  profileListeners.add(fn);
  return () => profileListeners.delete(fn);
}

function applyProfile() {
  const p = state.account?.profile ?? defaultProfile;
  setMeOverride({ name: p.name, avatar: p.avatar, city: p.location });
}

function emit() {
  applyProfile();
  listeners.forEach((l) => l());
  profileListeners.forEach((l) => l());
}

function read(): AccountState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as AccountState;
    if (parsed.account) parsed.account.profile = { ...defaultProfile, ...parsed.account.profile };
    return parsed;
  } catch {
    return EMPTY;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  state = read();
  applyProfile();
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    state = read();
    emit();
  });
}

function write(next: AccountState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  state = next;
  emit();
  return true;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** `null` until the browser has read storage (so screens don't flash the login). */
export function useAuth(): AccountState | null {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureLoaded();
      return state;
    },
    () => null,
  );
}

export function useProfile(): Profile {
  const auth = useAuth();
  return auth?.account?.profile ?? defaultProfile;
}

async function hash(password: string) {
  const bytes = new TextEncoder().encode(`planzy:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 10-digit Indian mobile number, or null if invalid. */
export function cleanPhone(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export function isEmail(raw: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim());
}

/** At least 8 characters with a letter and a number. */
export function passwordProblem(pw: string) {
  if (pw.length < 8) return "Use at least 8 characters";
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return "Use letters and at least one number";
  return "";
}

export async function signUp(input: {
  name: string;
  phone: string;
  password: string;
  email: string;
  location: string;
}) {
  ensureLoaded();
  const profile: Profile = {
    ...defaultProfile,
    avatar: "",
    name: input.name.trim(),
    phone: input.phone,
    email: input.email.trim().toLowerCase(),
    location: input.location,
  };
  return write({ account: { profile, passwordHash: await hash(input.password) }, loggedIn: true });
}

function matchesIdentifier(account: Account, identifier: string) {
  const id = identifier.trim().toLowerCase();
  const phone = cleanPhone(id);
  return (phone !== null && phone === account.profile.phone) || id === account.profile.email;
}

/** Returns an error message, or "" on success. */
export async function logIn(identifier: string, password: string) {
  ensureLoaded();
  const account = state.account;
  if (!account || !matchesIdentifier(account, identifier)) return "No account found with that number or email";
  if ((await hash(password)) !== account.passwordHash) return "Wrong password";
  write({ ...state, loggedIn: true });
  return "";
}

export function logOut() {
  ensureLoaded();
  write({ ...state, loggedIn: false });
}

/** Forgot password, step 1: is there an account for this number/email? */
export function hasAccount(identifier: string) {
  ensureLoaded();
  return !!state.account && matchesIdentifier(state.account, identifier);
}

/** Mock OTP: the code is always 1234 in this demo. */
export function checkOtp(code: string) {
  return code.trim() === DEMO_OTP;
}
export const DEMO_OTP_HINT = DEMO_OTP;

export async function resetPassword(identifier: string, password: string) {
  ensureLoaded();
  const account = state.account;
  if (!account || !matchesIdentifier(account, identifier)) return false;
  return write({ ...state, account: { ...account, passwordHash: await hash(password) } });
}

export async function changePassword(current: string, next: string) {
  ensureLoaded();
  const account = state.account;
  if (!account) return "Not signed in";
  if ((await hash(current)) !== account.passwordHash) return "Current password is wrong";
  write({ ...state, account: { ...account, passwordHash: await hash(next) } });
  return "";
}

export function saveProfile(next: Profile) {
  ensureLoaded();
  if (!state.account) return false;
  return write({ ...state, account: { ...state.account, profile: next } });
}

// Apply a saved profile as soon as this module loads in the browser.
ensureLoaded();
