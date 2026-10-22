export function rupees(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** ["Darshan", "Karan", "Dev"] -> "Darshan, Karan & Dev" */
export function joinNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/** "2025-01-01" -> "01/01/2025" */
export function formatDateShort(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** "2025-01-01" -> "Wed, 1 Jan 2025" */
export function formatDateLong(iso: string) {
  if (!iso) return "Date not set";
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatClock(ts: number) {
  return new Date(ts).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

/** Small deterministic hash so mock behaviour is stable between renders. */
export function hash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function mapsUrl(name: string, address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${address}`)}`;
}
