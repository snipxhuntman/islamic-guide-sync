export type ScheduleType = "always" | "recurring" | "once";
export type RecurringInterval = "daily" | "weekly" | "biweekly" | "monthly";

export interface BroadcastSchedule {
  type: ScheduleType;
  recurringInterval?: RecurringInterval;
  startDate?: string; // YYYY-MM-DD (used for "once")
  endDate?: string;   // YYYY-MM-DD (used for "once")
  startHour?: string; // HH:MM
  endHour?: string;   // HH:MM
  dayOfWeek?: number; // 0=Sunday..6=Saturday (for weekly/biweekly)
  endDayOfWeek?: number; // 0=Sunday..6=Saturday (for weekly/biweekly)
  dayOfMonth?: number; // 1-31 (for monthly)
}

export interface Broadcast {
  id: string;
  text: string;
  textEn?: string;
  textAr?: string;
  imageUrl?: string;
  imageSize?: "small" | "medium" | "large" | "full";
  link?: string;
  schedule?: BroadcastSchedule;
  active: boolean;
}

function isBroadcastVisible(b: Broadcast): boolean {
  if (!b.active) return false;
  if (!b.schedule || b.schedule.type === "always") return true;

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const { startDate, endDate, startHour, endHour } = b.schedule;

  // Check date range
  if (startDate && today < startDate) return false;
  if (endDate && today > endDate) return false;

  // Check time window
  const startMin = startHour ? parseTimeToMinutes(startHour) : 0;
  const endMin = endHour ? parseTimeToMinutes(endHour) : 24 * 60 - 1;

  // On start date, only show from startHour onward
  if (startDate && today === startDate && currentMinutes < startMin) return false;
  // On end date, only show until endHour
  if (endDate && today === endDate && currentMinutes > endMin) return false;

  if (b.schedule.type === "once") return true;

  // Recurring: check if today matches the interval pattern
  if (b.schedule.type === "recurring" && startDate) {
    const start = new Date(startDate + "T00:00:00");
    const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    switch (b.schedule.recurringInterval) {
      case "daily":
        return true;
      case "weekly":
        return diffDays % 7 === 0;
      case "biweekly":
        return diffDays % 14 === 0;
      case "monthly": {
        // Same day of month
        return now.getDate() === start.getDate();
      }
      default:
        return true;
    }
  }

  return true;
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function getLiveBroadcasts(): Broadcast[] {
  try {
    const raw = localStorage.getItem("admin-broadcasts");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(isBroadcastVisible);
    }
  } catch {}
  return broadcastsData.filter(isBroadcastVisible);
}

export function getAllBroadcasts(): Broadcast[] {
  try {
    const raw = localStorage.getItem("admin-broadcasts");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return broadcastsData;
}

export const broadcastsData: Broadcast[] = [
  {
    id: "1",
    text: "Freitagsgebet findet um 13:30 Uhr statt.",
    textEn: "Friday prayer is at 1:30 PM.",
    textAr: "صلاة الجمعة في الساعة 1:30 ظهراً.",
    active: true,
  },
  {
    id: "2",
    text: "Ramadan Mubarak! Möge Allah eure Gebete annehmen.",
    textEn: "Ramadan Mubarak! May Allah accept your prayers.",
    textAr: "رمضان مبارك! تقبل الله صيامكم وقيامكم.",
    active: true,
  },
  {
    id: "3",
    text: "Spendenaktion für die Moschee-Renovierung.",
    textEn: "Fundraising for mosque renovation.",
    textAr: "حملة تبرعات لتجديد المسجد.",
    active: true,
  },
];
