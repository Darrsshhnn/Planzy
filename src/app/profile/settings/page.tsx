"use client";

import { KeyRound, LogOut, RotateCcw } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { AuthField } from "@/components/auth/auth-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Toggle } from "@/components/ui/toggle";
import { changePassword, logOut, passwordProblem } from "@/store/account-store";
import { planActions } from "@/store/plan-store";
import { setRole, useViewer } from "@/store/viewer-store";

const NOTIFY_KEY = "planzy:notify";
const DEFAULT_NOTIFY: Record<string, boolean> = { invites: true, chat: true, bookings: true };
let notifyCache: Record<string, boolean> | null = null;
const notifyListeners = new Set<() => void>();

function readNotify() {
  if (!notifyCache) {
    try {
      notifyCache = JSON.parse(window.localStorage.getItem(NOTIFY_KEY) ?? "null") ?? DEFAULT_NOTIFY;
    } catch {
      notifyCache = DEFAULT_NOTIFY;
    }
  }
  return notifyCache!;
}

function writeNotify(next: Record<string, boolean>) {
  notifyCache = next;
  try {
    window.localStorage.setItem(NOTIFY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  notifyListeners.forEach((l) => l());
}

const subscribeNotify = (l: () => void) => {
  notifyListeners.add(l);
  return () => notifyListeners.delete(l);
};

export default function SettingsPage() {
  const { role } = useViewer();
  const notify = useSyncExternalStore(subscribeNotify, readNotify, () => DEFAULT_NOTIFY);
  const [pwOpen, setPwOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwDone, setPwDone] = useState(false);

  const toggleNotify = (key: string, value: boolean) => writeNotify({ ...notify, [key]: value });

  const submitPassword = async () => {
    const problem = passwordProblem(next);
    if (problem) return setPwError(problem);
    const err = await changePassword(current, next);
    if (err) return setPwError(err);
    setPwDone(true);
    setTimeout(() => {
      setPwOpen(false);
      setPwDone(false);
      setCurrent("");
      setNext("");
    }, 1200);
  };

  const rows: [string, string][] = [
    ["invites", "Group invites"],
    ["chat", "Chat messages"],
    ["bookings", "Booking updates"],
  ];

  return (
    <Screen
      overlay={
        <Sheet open={pwOpen} onClose={() => setPwOpen(false)} title="Change password">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPwError("");
              submitPassword();
            }}
          >
            <AuthField label="Current password" password value={current} onChange={(e) => setCurrent(e.target.value)} />
            <AuthField
              label="New password"
              password
              value={next}
              onChange={(e) => setNext(e.target.value)}
              hint="At least 8 characters, with a letter and a number"
              error={pwError}
            />
            <Button type="submit" block className="mt-5">
              {pwDone ? "Password changed" : "Update password"}
            </Button>
          </form>
        </Sheet>
      }
    >
      <PageHeader title="Settings" backHref="/profile" />

      <h2 className="font-heading text-[16px] font-bold">Notifications</h2>
      <div className="card mt-2 divide-y divide-ink/10">
        {rows.map(([key, label]) => (
          <div key={key} className="flex items-center justify-between px-3.5 py-2.5">
            <span className="text-[14px]">{label}</span>
            <Toggle checked={!!notify[key]} onChange={(v) => toggleNotify(key, v)} label={label} />
          </div>
        ))}
      </div>

      <h2 className="mt-6 font-heading text-[16px] font-bold">Account</h2>
      <div className="card mt-2 divide-y divide-ink/10">
        <button onClick={() => setPwOpen(true)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-[14px]">
          <KeyRound size={19} className="text-brand" /> Change password
        </button>
        <button onClick={logOut} className="flex w-full items-center gap-3 px-3.5 py-3 text-left text-[14px] text-[#b42318]">
          <LogOut size={19} /> Log out
        </button>
      </div>

      <h2 className="mt-6 font-heading text-[16px] font-bold">Demo controls</h2>
      <div className="card mt-2 p-3.5">
        <p className="text-[12px] text-muted">
          In your own groups, preview a member&apos;s view (members wait for the admin to decide and book). Each browser
          tab keeps its own choice.
        </p>
        <div className="mt-3 flex gap-2">
          {(["admin", "member"] as const).map((r) => (
            <Button key={r} size="sm" variant={role === r ? "dark" : "outline"} onClick={() => setRole(r)}>
              <span className="capitalize">{r}</span>
            </Button>
          ))}
          <Button size="sm" variant="ghost" className="ml-auto text-brand" onClick={() => planActions.reset()}>
            <RotateCcw size={14} /> Reset sample chats
          </Button>
        </div>
      </div>
    </Screen>
  );
}
