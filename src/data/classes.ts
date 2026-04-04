export interface ClassItem {
  id: string;
  title: string;
  titleEn: string;
  titleAr: string;
  day: string; // "monday" etc
  description: string;
  descriptionEn: string;
  descriptionAr: string;
  isCancelled: boolean;
  links: {
    youtube?: string;
    instagram?: string;
    telegram?: string;
    facebook?: string;
    tiktok?: string;
  };
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
    links: {
      youtube: "https://youtube.com",
      telegram: "https://t.me",
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
    links: {
      youtube: "https://youtube.com",
      instagram: "https://instagram.com",
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
    links: {
      telegram: "https://t.me",
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
    links: {
      youtube: "https://youtube.com",
      facebook: "https://facebook.com",
      telegram: "https://t.me",
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
    links: {
      youtube: "https://youtube.com",
      tiktok: "https://tiktok.com",
    },
  },
];
