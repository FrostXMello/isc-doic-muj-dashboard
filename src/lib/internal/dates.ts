const DAY_MS = 86_400_000;

/** Office time zone. "Today" for status derivation is the calendar day in Jaipur. */
export const OFFICE_TIME_ZONE = "Asia/Kolkata";

/** Agreements ending within this many days are flagged for renewal. */
export const EXPIRY_WARNING_DAYS = 90;

/** Opportunities with a deadline within this many days are flagged as closing soon. */
export const DEADLINE_WARNING_DAYS = 14;

function dayValue(iso: string) {
  return Date.parse(`${iso}T00:00:00Z`);
}

export function todayISO(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: OFFICE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Whole days from `from` to `to`. Positive when `to` is later. */
export function daysBetween(from: string, to: string) {
  return Math.round((dayValue(to) - dayValue(from)) / DAY_MS);
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(iso: string | null | undefined, fallback = "Not recorded") {
  if (!iso) return fallback;
  return dateFormatter.format(new Date(dayValue(iso)));
}

export function formatDateRange(start: string | null, end: string | null) {
  if (!start && !end) return "Not recorded";
  if (start && (!end || end === start)) return formatDate(start);
  if (!start) return `Until ${formatDate(end)}`;
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatRelativeDays(days: number) {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  if (days === -1) return "yesterday";
  const abs = Math.abs(days);
  const unit = abs >= 60 ? `${Math.round(abs / 30)} months` : `${abs} days`;
  return days > 0 ? `in ${unit}` : `${unit} ago`;
}
