"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { planActions } from "@/store/plan-store";

/** The + tab: starts a fresh plan and goes straight to picking friends. */
export default function NewPlanPage() {
  const router = useRouter();
  useEffect(() => {
    planActions.start("new");
    router.replace("/plan/friends");
  }, [router]);
  return null;
}
