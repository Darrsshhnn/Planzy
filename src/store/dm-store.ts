"use client";

/**
 * One-to-one chats with friends, persisted to localStorage. Replies are mocked;
 * a backend would deliver them over a realtime channel.
 */
import { useSyncExternalStore } from "react";
import { replyLine, REPLY_DELAY_MS } from "@/lib/api/chat";
import { hash } from "@/lib/format";

export interface DirectMessage {
  id: string;
  from: "me" | "them";
  text: string;
  at: number;
}

type Threads = Record<string, DirectMessage[]>;

const STORAGE_KEY = "planzy:dm:v1";
const HOUR = 60 * 60 * 1000;

function seed(): Threads {
  const now = Date.now();
  return {
    vrushti: [
      { id: "d1", from: "them", text: "Did you see the new PPT night in Thaltej?", at: now - 26 * HOUR },
      { id: "d2", from: "me", text: "Yes! We should go this week", at: now - 25 * HOUR },
      { id: "d3", from: "them", text: "Make a plan and add me 😄", at: now - 25 * HOUR + 60_000 },
    ],
    dev: [
      { id: "d4", from: "them", text: "Box cricket on Sunday?", at: now - 3 * HOUR },
      { id: "d5", from: "me", text: "Count me in", at: now - 2 * HOUR },
    ],
  };
}

const EMPTY: DirectMessage[] = [];
let threads: Threads = {};
let loaded = false;
const listeners = new Set<() => void>();

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    threads = raw ? JSON.parse(raw) : seed();
  } catch {
    threads = seed();
  }
}

function save(next: Threads) {
  threads = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // keep in memory
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useThreads(): Threads {
  return useSyncExternalStore(
    subscribe,
    () => {
      ensureLoaded();
      return threads;
    },
    () => ({}),
  );
}

export function useThread(friendId: string): DirectMessage[] {
  return useThreads()[friendId] ?? EMPTY;
}

export function sendDirect(friendId: string, text: string) {
  const body = text.trim();
  if (!body) return;
  ensureLoaded();
  const add = (msg: DirectMessage) => save({ ...threads, [friendId]: [...(threads[friendId] ?? []), msg] });
  add({ id: `d${Date.now().toString(36)}`, from: "me", text: body, at: Date.now() });
  setTimeout(() => {
    add({ id: `d${Date.now().toString(36)}r`, from: "them", text: replyLine(hash(body + friendId)), at: Date.now() });
  }, REPLY_DELAY_MS);
}
