export interface ClassItem {
  id: string;
  title: string;
  titleEn: string;
  titleAr: string;
  day: string;
  description: string;
  descriptionEn: string;
  descriptionAr: string;
  isCancelled: boolean;
  timingMode: "auto" | "manual";
  autoOffset?: number; // minutes after Maghrib (0-90), default 20
  manualStart?: string;
  manualEnd?: string;
  linksMode?: "auto" | "manual"; // auto = use default URLs, manual = custom per class
  defaultLinks?: {
    youtube?: string;
    instagram?: string;
    telegram?: string;
    facebook?: string;
    tiktok?: string;
  };
  links: {
    youtube?: string;
    instagram?: string;
    telegram?: string;
    facebook?: string;
    tiktok?: string;
  };
  linksVisible?: {
    youtube?: boolean;
    instagram?: boolean;
    telegram?: boolean;
    facebook?: boolean;
    tiktok?: boolean;
  };
}

export function getLiveClasses(): ClassItem[] {
  try {
    const raw = localStorage.getItem("admin-classes");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0)
        return parsed.map((c: ClassItem) => ({ ...c, timingMode: c.timingMode ?? "auto" }));
    }
  } catch {}
  return classesData;
}

export const classesData: ClassItem[] = [
  {
    id: "1",
    title: "Tafsir-Unterricht",
    titleEn: "Tafsir Class",
    titleAr: "درس التفسير",
    day: "monday",
    description: "Erklärung des Quran",
    descriptionEn: "Quran explanation",
    descriptionAr: "شرح القرآن الكريم",
    isCancelled: false,
    timingMode: "auto",
    links: {
      youtube: "https://youtube.com",
      instagram: "https://instagram.com",
      telegram: "https://t.me",
      facebook: "https://facebook.com",
      tiktok: "https://tiktok.com",
    },
  },
  {
    id: "2",
    title: "Fiqh-Unterricht",
    titleEn: "Fiqh Class",
    titleAr: "درس الفقه",
    day: "tuesday",
    description: "Islamisches Recht",
    descriptionEn: "Islamic jurisprudence",
    descriptionAr: "الفقه الإسلامي",
    isCancelled: false,
    timingMode: "auto",
    links: {
      youtube: "https://youtube.com",
      instagram: "https://instagram.com",
      telegram: "https://t.me",
      facebook: "https://facebook.com",
      tiktok: "https://tiktok.com",
    },
  },
  {
    id: "3",
    title: "Arabisch für Anfänger",
    titleEn: "Arabic for Beginners",
    titleAr: "العربية للمبتدئين",
    day: "wednesday",
    description: "Arabischkurs Stufe 1",
    descriptionEn: "Arabic course level 1",
    descriptionAr: "دورة اللغة العربية - المستوى الأول",
    isCancelled: true,
    timingMode: "auto",
    links: {
      youtube: "https://youtube.com",
      instagram: "https://instagram.com",
      telegram: "https://t.me",
      facebook: "https://facebook.com",
      tiktok: "https://tiktok.com",
    },
  },
  {
    id: "4",
    title: "Sira-Unterricht",
    titleEn: "Sira Class",
    titleAr: "درس السيرة",
    day: "thursday",
    description: "Leben des Propheten ﷺ",
    descriptionEn: "Life of the Prophet ﷺ",
    descriptionAr: "سيرة النبي ﷺ",
    isCancelled: false,
    timingMode: "auto",
    links: {
      youtube: "https://youtube.com",
      instagram: "https://instagram.com",
      telegram: "https://t.me",
      facebook: "https://facebook.com",
      tiktok: "https://tiktok.com",
    },
  },
  {
    id: "5",
    title: "Aqida-Unterricht",
    titleEn: "Aqida Class",
    titleAr: "درس العقيدة",
    day: "friday",
    description: "Glaubenslehre",
    descriptionEn: "Islamic creed",
    descriptionAr: "أصول العقيدة",
    isCancelled: false,
    timingMode: "auto",
    links: {
      youtube: "https://youtube.com",
      instagram: "https://instagram.com",
      telegram: "https://t.me",
      facebook: "https://facebook.com",
      tiktok: "https://tiktok.com",
    },
  },
];
