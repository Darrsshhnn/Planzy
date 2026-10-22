export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={[
        "relative h-[34px] w-[62px] shrink-0 rounded-full border-[1.5px] border-ink transition-colors",
        checked ? "bg-brand" : "bg-paper",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-1/2 h-[24px] w-[24px] -translate-y-1/2 rounded-full transition-all",
          checked ? "left-[31px] bg-white" : "left-[4px] bg-[#a3a3a3]",
        ].join(" ")}
      />
    </button>
  );
}
