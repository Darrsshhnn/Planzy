"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useNow } from "@/components/place/live-status";
import { formatDateLong } from "@/lib/format";
import { Button } from "./button";
import { FieldBox } from "./card";
import { Sheet } from "./sheet";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function iso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
/** Next Saturday / Sunday from today (today counts). */
function nextWeekday(from: Date, day: number) {
  return addDays(from, (day - from.getDay() + 7) % 7);
}

/**
 * Date field + Planzy-styled calendar sheet (replaces the phone's own date
 * picker so it matches the app): quick picks, a month grid, past days off.
 */
export function DatePicker({
  value,
  onChange,
  label = "Outing date",
}: {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
}) {
  const now = useNow();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date | null>(null);
  const [draft, setDraft] = useState(value);

  const today = now
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
    : null;
  const shown = month ?? (value ? new Date(`${value}T00:00:00`) : today);

  const show = () => {
    setDraft(value);
    setMonth(null);
    setOpen(true);
  };

  const quick = today
    ? [
        { label: "Today", date: today },
        { label: "Tomorrow", date: addDays(today, 1) },
        { label: "Saturday", date: nextWeekday(today, 6) },
        { label: "Sunday", date: nextWeekday(today, 0) },
      ]
    : [];

  let cells: (Date | null)[] = [];
  if (shown) {
    const first = new Date(shown.getFullYear(), shown.getMonth(), 1);
    const days = new Date(
      shown.getFullYear(),
      shown.getMonth() + 1,
      0,
    ).getDate();
    cells = [
      ...Array.from({ length: first.getDay() }, () => null),
      ...Array.from(
        { length: days },
        (_, i) => new Date(shown.getFullYear(), shown.getMonth(), i + 1),
      ),
    ];
  }
  const atCurrentMonth =
    !!today &&
    !!shown &&
    shown.getFullYear() === today.getFullYear() &&
    shown.getMonth() === today.getMonth();
  const step = (n: number) =>
    shown && setMonth(new Date(shown.getFullYear(), shown.getMonth() + n, 1));

  return (
    <>
      <FieldBox className="mt-2.5">
        <button
          type="button"
          onClick={show}
          aria-label={`${label}: ${value ? formatDateLong(value) : "not set"}`}
          className="flex h-[48px] w-full items-center gap-3 px-4 text-left"
        >
          <span
            className={`flex-1 text-[16px] font-semibold ${value ? "text-ink" : "text-ink/35"}`}
          >
            {value ? formatDateLong(value) : "Pick a date"}
          </span>
          <CalendarDays size={22} className="text-brand" />
        </button>
      </FieldBox>

      {open &&
        createPortal(
          <Sheet open onClose={() => setOpen(false)} title="Pick a date">
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {quick.map((q) => {
                const on = draft === iso(q.date);
                return (
                  <button
                    key={q.label}
                    type="button"
                    onClick={() => {
                      setDraft(iso(q.date));
                      setMonth(
                        new Date(q.date.getFullYear(), q.date.getMonth(), 1),
                      );
                    }}
                    className={`shrink-0 rounded-full border border-ink px-3.5 py-1.5 text-[13px] font-medium transition ${on ? "bg-ink text-brand" : "bg-paper"}`}
                  >
                    {q.label}
                    <span
                      className={`ml-1 text-[11px] ${on ? "text-cream/70" : "text-muted"}`}
                    >
                      {q.date.getDate()}{" "}
                      {q.date.toLocaleDateString("en-IN", { month: "short" })}
                    </span>
                  </button>
                );
              })}
            </div>

            {shown && (
              <div className="card mt-4 bg-cream! p-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => step(-1)}
                    disabled={atCurrentMonth}
                    aria-label="Previous month"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink bg-paper disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <p className="font-heading text-[17px] font-bold">
                    {shown.toLocaleDateString("en-IN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <button
                    type="button"
                    onClick={() => step(1)}
                    aria-label="Next month"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-ink bg-paper"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-7 gap-y-1.5 text-center">
                  {WEEKDAYS.map((d, i) => (
                    <span
                      key={i}
                      className="pb-1 text-[11px] font-semibold text-muted"
                    >
                      {d}
                    </span>
                  ))}
                  {cells.map((d, i) => {
                    if (!d) return <span key={`e${i}`} />;
                    const key = iso(d);
                    const past = !!today && d < today;
                    const selected = draft === key;
                    const isToday = !!today && key === iso(today);
                    const weekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <span key={key} className="flex justify-center">
                        <button
                          type="button"
                          disabled={past}
                          onClick={() => setDraft(key)}
                          aria-pressed={selected}
                          aria-label={formatDateLong(key)}
                          className={[
                            "flex h-10 w-10 items-center justify-center rounded-[12px] text-[14px] transition",
                            selected
                              ? "bg-brand font-bold text-white shadow-[0_2px_0_#242a2f]"
                              : past
                                ? "text-ink/25"
                                : isToday
                                  ? "border border-ink bg-paper font-semibold"
                                  : weekend
                                    ? "font-semibold text-brand hover:bg-paper"
                                    : "text-ink hover:bg-paper",
                          ].join(" ")}
                        >
                          {d.getDate()}
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              block
              className="mt-5"
              disabled={!draft}
              onClick={() => {
                onChange(draft);
                setOpen(false);
              }}
            >
              {draft ? `Set ${formatDateLong(draft)}` : "Pick a day"}
            </Button>
          </Sheet>,
          document.getElementById("planzy-screen") ?? document.body,
        )}
    </>
  );
}
