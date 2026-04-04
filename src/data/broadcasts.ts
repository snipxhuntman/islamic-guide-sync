export interface Broadcast {
  id: string;
  text: string;
  textEn?: string;
  textAr?: string;
  imageUrl?: string; // base64 data URL or external URL
  active: boolean;
}

export function getLiveBroadcasts(): Broadcast[] {
  try {
    const raw = localStorage.getItem("admin-broadcasts");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((b: Broadcast) => b.active);
    }
  } catch {}
  return broadcastsData.filter((b) => b.active);
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
