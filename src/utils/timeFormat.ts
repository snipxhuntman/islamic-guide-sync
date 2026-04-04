// Shared time formatting utility
// Reads 12h/24h preference from localStorage, applies to all user-facing pages (not admin)

export type HourFormat = "12" | "24";

export function getHourFormat(): HourFormat {
  return (localStorage.getItem("hour-format") as HourFormat) || "24";
}

export function setHourFormat(format: HourFormat): void {
  localStorage.setItem("hour-format", format);
}

/**
 * Convert a "HH:MM" 24h string to the user's preferred format.
 * For Arabic in 12h mode, uses ص (AM) and م (PM).
 */
export function formatTime(time24: string, language: string): string {
  const format = getHourFormat();
  if (format === "24") return time24;

  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr || "00";

  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const isPM = h >= 12;

  let suffix: string;
  if (language === "ar") {
    suffix = isPM ? "م" : "ص";
  } else {
    suffix = isPM ? "PM" : "AM";
  }

  return `${hour12}:${m} ${suffix}`;
}

/**
 * Format a Date or ISO timestamp to time string in user's preferred format.
 */
export function formatTimestamp(ts: string | Date, language: string): string {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return formatTime(`${h}:${m}`, language);
}

/**
 * Replace Eastern Arabic numerals (٠-٩) with Western Arabic (0-9).
 */
export function toWesternNumerals(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}
