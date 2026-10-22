"use client";

/**
 * Demo-only "who am I" switch, stored per browser tab (sessionStorage).
 * Open the app in two tabs, set one to Member, and the shared plan state
 * (localStorage) shows the admin paying and the member's waiting screen live.
 * With real auth this becomes the signed-in user.
 */
import { useSyncExternalStore } from "react";
import { usePlan } from "@/store/plan-store";

export type Role = "admin" | "member";

const KEY = "planzy:role";
let role: Role | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): Role {
  if (role === null) {
    try {
      role = window.sessionStorage.getItem(KEY) === "member" ? "member" : "admin";
    } catch {
      role = "admin";
    }
  }
  return role;
}

export function setRole(next: Role) {
  role = next;
  try {
    window.sessionStorage.setItem(KEY, next);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useViewer() {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => "admin" as Role);
  const plan = usePlan();
  const memberId = plan.memberIds.find((id) => id !== plan.adminId);
  const isAdmin = current === "admin" || !memberId;
  return {
    role: isAdmin ? ("admin" as Role) : ("member" as Role),
    isAdmin,
    viewerId: isAdmin ? plan.adminId : memberId!,
  };
}
