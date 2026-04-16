export interface PrayerDay {
  date: string; // YYYY-MM-DD
  fajr: string;
  shuruk: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

// Generate sample prayer times for 60 days starting from today
function generatePrayerTimes(): PrayerDay[] {
  const days: PrayerDay[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  for (let i = 0; i < 60; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    // Slightly vary times across days to simulate seasonal change
    const offset = Math.floor(i / 10);
    days.push({
      date: dateStr,
      fajr: `04:${String(30 - offset).padStart(2, "0")}`,
      shuruk: `06:${String(10 - offset).padStart(2, "0")}`,
      dhuhr: "13:15",
      asr: `16:${String(45 + offset).padStart(2, "0")}`,
      maghrib: `20:${String(15 + offset).padStart(2, "0")}`,
      isha: `22:${String(0 + offset).padStart(2, "0")}`,
    });
  }
  return days;
}

export const prayerTimesData: PrayerDay[] = generatePrayerTimes();

// Runtime getter that checks localStorage for admin-uploaded data
export function getLivePrayerTimes(): PrayerDay[] {
  try {
    const raw = localStorage.getItem("admin-prayer-times");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return prayerTimesData;
}

export function getLivePrayerTimesForDate(dateStr: string): PrayerDay | undefined {
  return getLivePrayerTimes().find((p) => p.date === dateStr);
}

export function getAvailableDateRange(): { min: string; max: string } | null {
  const times = getLivePrayerTimes();
  if (times.length === 0) return null;
  const sorted = [...times].sort((a, b) => a.date.localeCompare(b.date));
  return { min: sorted[0].date, max: sorted[sorted.length - 1].date };
}

export type PrayerName = "fajr" | "shuruk" | "dhuhr" | "asr" | "maghrib" | "isha";

export const prayerKeys: PrayerName[] = ["fajr", "shuruk", "dhuhr", "asr", "maghrib", "isha"];

export function getPrayerTimesForDate(dateStr: string): PrayerDay | undefined {
  return prayerTimesData.find((p) => p.date === dateStr);
}

export function getCurrentPrayer(prayers: PrayerDay): PrayerName | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const times: { key: PrayerName; min: number }[] = [
    { key: "fajr", min: toMin(prayers.fajr) },
    { key: "shuruk", min: toMin(prayers.shuruk) },
    { key: "dhuhr", min: toMin(prayers.dhuhr) },
    { key: "asr", min: toMin(prayers.asr) },
    { key: "maghrib", min: toMin(prayers.maghrib) },
    { key: "isha", min: toMin(prayers.isha) },
  ];

  for (let i = times.length - 1; i >= 0; i--) {
    if (currentMinutes >= times[i].min) return times[i].key;
  }
  return null;
}

export function getNextPrayer(prayers: PrayerDay): { name: PrayerName; time: string } | null {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const times: { key: PrayerName; time: string; min: number }[] = [
    { key: "fajr", time: prayers.fajr, min: toMin(prayers.fajr) },
    { key: "shuruk", time: prayers.shuruk, min: toMin(prayers.shuruk) },
    { key: "dhuhr", time: prayers.dhuhr, min: toMin(prayers.dhuhr) },
    { key: "asr", time: prayers.asr, min: toMin(prayers.asr) },
    { key: "maghrib", time: prayers.maghrib, min: toMin(prayers.maghrib) },
    { key: "isha", time: prayers.isha, min: toMin(prayers.isha) },
  ];

  for (const t of times) {
    if (currentMinutes < t.min) return { name: t.key, time: t.time };
  }
  return null; // all prayers passed
}
