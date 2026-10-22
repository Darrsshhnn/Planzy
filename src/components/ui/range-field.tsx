import type { CSSProperties } from "react";

export function RangeField({
  label,
  value,
  min,
  max,
  step,
  marks,
  format,
  tone = "brand",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** Middle and right labels under the track; the left one is the live value. */
  marks: [string, string];
  format: (v: number) => string;
  tone?: "brand" | "navy";
  onChange: (v: number) => void;
}) {
  const knob: CSSProperties =
    tone === "navy"
      ? ({ "--knob": "#19486E", "--knob-ring": "#3f6f97" } as CSSProperties)
      : ({ "--knob": "#E5701B", "--knob-ring": "#f6a66c" } as CSSProperties);
  return (
    <div className="px-3 pb-2 pt-3">
      <input
        type="range"
        aria-label={label}
        className="planzy-range"
        style={knob}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="mt-1.5 flex items-baseline justify-between">
        <span className="min-w-[72px] text-[16px] font-semibold text-ink">{format(value)}</span>
        <span className={`text-[13px] text-ink ${marks[0] === format(value) ? "invisible" : ""}`}>{marks[0]}</span>
        <span className="min-w-[72px] text-right text-[13px] text-ink">{marks[1]}</span>
      </div>
    </div>
  );
}
