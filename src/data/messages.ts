export interface Message {
  id: string;
  text: string;
  textEn?: string;
  textAr?: string;
  timestamp: string; // ISO date-time
}

export function getLiveMessages(): Message[] {
  try {
    const raw = localStorage.getItem("admin-messages");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return messagesData;
}

export const messagesData: Message[] = [
  {
    id: "1",
    text: "Freitagsgebet findet um 13:30 Uhr statt. Bitte kommt pünktlich.",
    textEn: "Friday prayer is at 1:30 PM. Please arrive on time.",
    textAr: "صلاة الجمعة في الساعة 1:30 ظهراً. يرجى الحضور في الوقت المحدد.",
    timestamp: "2026-04-03T10:00:00",
  },
  {
    id: "2",
    text: "Der Arabischkurs für Anfänger beginnt nächsten Montag.",
    textEn: "The Arabic course for beginners starts next Monday.",
    textAr: "دورة اللغة العربية للمبتدئين تبدأ يوم الإثنين القادم.",
    timestamp: "2026-04-03T14:30:00",
  },
  {
    id: "3",
    text: "Ramadan Mubarak! Möge Allah eure Gebete annehmen.",
    textEn: "Ramadan Mubarak! May Allah accept your prayers.",
    textAr: "رمضان مبارك! تقبل الله صيامكم وقيامكم.",
    timestamp: "2026-04-02T08:00:00",
  },
  {
    id: "4",
    text: "Iftar-Essen heute Abend in der Moschee um 20:20 Uhr.",
    textEn: "Iftar meal tonight at the mosque at 8:20 PM.",
    textAr: "وجبة الإفطار الليلة في المسجد الساعة 8:20 مساءً.",
    timestamp: "2026-04-02T16:00:00",
  },
  {
    id: "5",
    text: "Spendenaktion für die Moschee-Renovierung. Jeder Beitrag zählt!",
    textEn: "Fundraising for mosque renovation. Every contribution counts!",
    textAr: "حملة تبرعات لتجديد المسجد. كل مساهمة مهمة!",
    timestamp: "2026-04-01T12:00:00",
  },
];
