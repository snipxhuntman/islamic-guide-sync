// Simple Hijri date conversion using the Umm al-Qura approximation
import { toWesternNumerals } from "@/utils/timeFormat";

export function getHijriCorrection(): number {
  try {
    const v = localStorage.getItem("hijri-correction");
    return v ? parseInt(v, 10) || 0 : 0;
  } catch { return 0; }
}

export function setHijriCorrection(days: number): void {
  localStorage.setItem("hijri-correction", String(days));
}

export function toHijri(date: Date): { year: number; month: number; day: number; monthName: string } {
  const correction = getHijriCorrection();
  const adjusted = new Date(date);
  adjusted.setDate(adjusted.getDate() + correction);
  const jd = gregorianToJD(adjusted.getFullYear(), adjusted.getMonth() + 1, adjusted.getDate());
  const hijri = jdToHijri(jd);
  return { ...hijri, monthName: hijriMonthNames[hijri.month - 1] };
}

const hijriMonthNames = [
  "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
  "Jumada al-Ula", "Jumada al-Thani", "Rajab", "Sha'ban",
  "Ramadan", "Shawwal", "Dhul Qi'dah", "Dhul Hijjah",
];

export const hijriMonthNamesAr = [
  "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
  "جمادى الأولى", "جمادى الثانية", "رجب", "شعبان",
  "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
];

function gregorianToJD(year: number, month: number, day: number): number {
  if (month <= 2) { year--; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function jdToHijri(jd: number): { year: number; month: number; day: number } {
  const jd1 = Math.floor(jd) + 0.5;
  const year = Math.floor((30 * (jd1 - 1948439.5) + 10646) / 10631);
  const month = Math.min(12, Math.ceil((jd1 - (29 + hijriToJD(year, 1, 1))) / 29.5) + 1);
  const day = Math.floor(jd1 - hijriToJD(year, month, 1)) + 1;
  return { year, month, day };
}

function hijriToJD(year: number, month: number, day: number): number {
  return Math.floor((11 * year + 3) / 30) + 354 * year + 30 * month - Math.floor((month - 1) / 2) + day + 1948440 - 385;
}

export function formatHijriDate(date: Date, lang: string): string {
  const h = toHijri(date);
  const monthName = lang === "ar" ? hijriMonthNamesAr[h.month - 1] : h.monthName;
  return `${h.day} ${monthName} ${h.year}`;
}

export function formatGregorianDate(date: Date, lang: string): string {
  const localeMap: Record<string, string> = { de: "de-DE", en: "en-US", ar: "ar-SA" };
  const formatted = date.toLocaleDateString(localeMap[lang] || "de-DE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  return lang === "ar" ? toWesternNumerals(formatted) : formatted;
}
