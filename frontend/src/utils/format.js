const idr = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

/** 185000 -> "Rp 185.000" */
export const rupiah = (n) => idr.format(n ?? 0);

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "-";

/** "2026-11-20" (a calendar date, no time zone) -> "Jumat, 20 November 2026" */
export const formatDeliveryDate = (ymd) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

/** Calendar date (UTC, same calendar the API validates against) `offsetDays` from today, as YYYY-MM-DD. */
export const dateInputValue = (offsetDays = 0) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

/** "2026-11-20" -> "20 Nov" (for chart labels) */
export const shortDay = (ymd) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString("id-ID", { day: "numeric", month: "short", timeZone: "UTC" });

/** 2500000 -> "2,5jt", 48000 -> "48rb" (short labels for charts) */
export const compactRupiah = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}jt` : n >= 1000 ? `${Math.round(n / 1000)}rb` : String(n);
