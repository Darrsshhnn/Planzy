"use client";

/**
 * Accounts on this device: profile + mock sign-up / log-in / Google sign-in,
 * persisted to localStorage. Any number of people can have an account; one is
 * signed in at a time. Passwords are stored only as a SHA-256 hash. With a
 * backend, these functions become calls to an auth service; screens only use
 * the exports below.
 */
import { useSyncExternalStore } from "react";
import { getMe, setMeOverride } from "@/lib/api/data";
import type { Profile } from "@/lib/types";

const STORAGE_KEY = "planzy:accounts:v2";
const LEGACY_KEY = "planzy:account:v1";
const DEMO_OTP = "1234";

interface Account {
  id: string;
  provider: "password" | "google";
  profile: Profile;
  /** Empty for Google accounts that never set a password. */
  passwordHash: string;
}

interface Store {
  accounts: Account[];
  currentId: string | null;
}

/** What screens read: the signed-in account (if any). */
export interface AccountState {
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

const EMPTY_STORE: Store = { accounts: [], currentId: null };
let store: Store = EMPTY_STORE;
let snapshot: AccountState = { account: null, loggedIn: false };
let loaded = false;
const listeners = new Set<() => void>();
const profileListeners = new Set<() => void>();

/** Plan screens re-render when the profile changes (names in chats etc.). */
export function onProfileChange(fn: () => void) {
  profileListeners.add(fn);
  return () => profileListeners.delete(fn);
}

function current(): Account | null {
  return store.accounts.find((a) => a.id === store.currentId) ?? null;
}

function refresh() {
  const account = current();
  snapshot = { account, loggedIn: !!account };
  const p = account?.profile ?? defaultProfile;
  setMeOverride({ name: p.name, avatar: p.avatar, city: p.location });
}

function emit() {
  refresh();
  listeners.forEach((l) => l());
  profileListeners.forEach((l) => l());
}

function read(): Store {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Store;
      parsed.accounts = parsed.accounts.map((a) => ({ ...a, profile: { ...defaultProfile, ...a.profile } }));
      return parsed;
    }
    // One-time move from the single-account version.
    const legacy = window.localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as { account: { profile: Profile; passwordHash: string } | null; loggedIn: boolean };
      if (old.account) {
        const id = "acc-legacy";
        return {
          accounts: [{ id, provider: "password", profile: { ...defaultProfile, ...old.account.profile }, passwordHash: old.account.passwordHash }],
          currentId: old.loggedIn ? id : null,
        };
      }
    }
  } catch {
    // fall through
  }
  return EMPTY_STORE;
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  store = read();
  refresh();
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    store = read();
    emit();
  });
}

function write(next: Store): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return false;
  }
  store = next;
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
      return snapshot;
    },
    () => null,
  );
}

export function useProfile(): Profile {
  const auth = useAuth();
  return auth?.account?.profile ?? defaultProfile;
}

/** Signed in, but hasn't picked an area yet (new sign-ups and Google accounts). */
export function needsLocation(auth: AccountState | null) {
  return !!auth?.account && !auth.account.profile.location;
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

function newId() {
  return `acc-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function findBy(identifier: string) {
  const id = identifier.trim().toLowerCase();
  const phone = cleanPhone(id);
  return store.accounts.find(
    (a) => (phone !== null && phone === a.profile.phone) || (!!a.profile.email && id === a.profile.email),
  );
}

/** Returns an error message, or "" on success. Location is picked on the next screen. */
export async function signUp(input: { name: string; phone: string; password: string; email: string }) {
  ensureLoaded();
  const email = input.email.trim().toLowerCase();
  if (findBy(input.phone) || findBy(email)) return "An account with this number or email already exists. Log in instead.";
  const account: Account = {
    id: newId(),
    provider: "password",
    profile: { ...defaultProfile, avatar: "", location: "", name: input.name.trim(), phone: input.phone, email },
    passwordHash: await hash(input.password),
  };
  return write({ accounts: [...store.accounts, account], currentId: account.id })
    ? ""
    : "Couldn't save your account on this device. Check storage settings.";
}

/** Returns an error message, or "" on success. */
export async function logIn(identifier: string, password: string) {
  ensureLoaded();
  const account = findBy(identifier);
  if (!account) return "No account found with that number or email";
  if (!account.passwordHash) return "This account uses Google. Tap Continue with Google.";
  if ((await hash(password)) !== account.passwordHash) return "Wrong password";
  write({ ...store, currentId: account.id });
  return "";
}

/** Google sign-in: logs in the matching account, or creates one. */
export function signInWithGoogle(user: { name: string; email: string; picture?: string }) {
  ensureLoaded();
  const email = user.email.trim().toLowerCase();
  const existing = store.accounts.find((a) => a.profile.email === email);
  if (existing) return write({ ...store, currentId: existing.id });
  const account: Account = {
    id: newId(),
    provider: "google",
    profile: { ...defaultProfile, location: "", name: user.name.trim() || email.split("@")[0], email, avatar: user.picture ?? "" },
    passwordHash: "",
  };
  return write({ accounts: [...store.accounts, account], currentId: account.id });
}

export function logOut() {
  ensureLoaded();
  write({ ...store, currentId: null });
}

/** Forgot password, step 1: is there an account for this number/email? */
export function hasAccount(identifier: string) {
  ensureLoaded();
  return !!findBy(identifier);
}

/** Mock OTP: the code is always 1234 in this demo. */
export function checkOtp(code: string) {
  return code.trim() === DEMO_OTP;
}
export const DEMO_OTP_HINT = DEMO_OTP;

export async function resetPassword(identifier: string, password: string) {
  ensureLoaded();
  const account = findBy(identifier);
  if (!account) return false;
  const passwordHash = await hash(password);
  return write({ ...store, accounts: store.accounts.map((a) => (a.id === account.id ? { ...a, passwordHash } : a)) });
}

export async function changePassword(currentPw: string, next: string) {
  ensureLoaded();
  const account = current();
  if (!account) return "Not signed in";
  if (account.passwordHash && (await hash(currentPw)) !== account.passwordHash) return "Current password is wrong";
  const passwordHash = await hash(next);
  write({ ...store, accounts: store.accounts.map((a) => (a.id === account.id ? { ...a, passwordHash } : a)) });
  return "";
}

export function saveProfile(next: Profile) {
  ensureLoaded();
  const account = current();
  if (!account) return false;
  return write({ ...store, accounts: store.accounts.map((a) => (a.id === account.id ? { ...a, profile: next } : a)) });
}

// Apply a saved profile as soon as this module loads in the browser.
ensureLoaded();
