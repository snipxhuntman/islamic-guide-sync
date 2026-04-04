import { PrayerDay } from "@/data/prayerTimes";
import { Message } from "@/data/messages";
import { ClassItem } from "@/data/classes";
import { prayerTimesData as defaultPrayerTimes } from "@/data/prayerTimes";
import { messagesData as defaultMessages } from "@/data/messages";
import { classesData as defaultClasses } from "@/data/classes";

const KEYS = {
  prayerTimes: "admin-prayer-times",
  messages: "admin-messages",
  classes: "admin-classes",
  siteLinks: "admin-site-links",
  iqamaSettings: "admin-iqama-settings",
};

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Iqama Settings
export type IqamaMode = "offset" | "fixed";

export interface IqamaSetting {
  mode: IqamaMode;
  offsetMinutes: number; // 0-90
  fixedTime: string; // HH:MM
}

export type IqamaSettings = Record<string, IqamaSetting>;

const defaultIqamaSettings: IqamaSettings = {
  fajr: { mode: "offset", offsetMinutes: 15, fixedTime: "04:45" },
  dhuhr: { mode: "offset", offsetMinutes: 15, fixedTime: "13:30" },
  asr: { mode: "offset", offsetMinutes: 15, fixedTime: "17:00" },
  maghrib: { mode: "offset", offsetMinutes: 5, fixedTime: "20:20" },
  isha: { mode: "offset", offsetMinutes: 15, fixedTime: "22:15" },
};

export function getIqamaSettings(): IqamaSettings {
  return load(KEYS.iqamaSettings, defaultIqamaSettings);
}
export function saveIqamaSettings(data: IqamaSettings) {
  save(KEYS.iqamaSettings, data);
}

export function computeIqama(prayerTime: string, setting: IqamaSetting): string {
  if (setting.mode === "fixed") return setting.fixedTime;
  const [h, m] = prayerTime.split(":").map(Number);
  const total = h * 60 + m + setting.offsetMinutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// Prayer Times
export function getPrayerTimes(): PrayerDay[] {
  return load(KEYS.prayerTimes, defaultPrayerTimes);
}
export function savePrayerTimes(data: PrayerDay[]) {
  save(KEYS.prayerTimes, data);
}

// Messages
export function getMessages(): Message[] {
  return load(KEYS.messages, defaultMessages);
}
export function saveMessages(data: Message[]) {
  save(KEYS.messages, data);
}

// Classes
export function getClasses(): ClassItem[] {
  return load(KEYS.classes, defaultClasses);
}
export function saveClasses(data: ClassItem[]) {
  save(KEYS.classes, data);
}

// Site Links
export interface SiteLinks {
  socials: {
    youtube: string;
    instagram: string;
    facebook: string;
    telegram: string;
    tiktok: string;
  };
  donation: {
    de: string;
    en: string;
    ar: string;
  };
  website: {
    de: string;
    en: string;
    ar: string;
  };
  mapsUrl: string;
}

const defaultSiteLinks: SiteLinks = {
  socials: {
    youtube: "https://youtube.com",
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    telegram: "https://t.me",
    tiktok: "https://tiktok.com",
  },
  donation: {
    de: "https://www.leipziger-moschee.de/spenden",
    en: "https://www.leipziger-moschee.de/en/spenden",
    ar: "https://www.leipziger-moschee.de/ar/spenden",
  },
  website: {
    de: "https://www.leipziger-moschee.de",
    en: "https://www.leipziger-moschee.de/en",
    ar: "https://www.leipziger-moschee.de/ar",
  },
  mapsUrl: "https://maps.google.com/?q=Alrahman+Moschee+Leipzig",
};

export function getSiteLinks(): SiteLinks {
  return load(KEYS.siteLinks, defaultSiteLinks);
}
export function saveSiteLinks(data: SiteLinks) {
  save(KEYS.siteLinks, data);
}

// Privacy Policy
export interface PrivacyPolicyContent {
  de: string;
  en: string;
  ar: string;
}

const defaultPrivacyPolicy: PrivacyPolicyContent = {
  de: "Diese App speichert Ihre Einstellungen lokal auf Ihrem Gerät. Es werden keine personenbezogenen Daten an Server übertragen. Der Qibla-Kompass nutzt Ihren Standort nur zur Berechnung der Gebetsrichtung und speichert keine Standortdaten.",
  en: "This app stores your settings locally on your device. No personal data is transmitted to servers. The Qibla compass uses your location only to calculate the prayer direction and does not save any location data.",
  ar: "يحتفظ هذا التطبيق بإعداداتك محلياً على جهازك. لا يتم إرسال أي بيانات شخصية إلى الخوادم. تستخدم بوصلة القبلة موقعك فقط لحساب اتجاه الصلاة ولا تحفظ أي بيانات موقع.",
};

export function getPrivacyPolicy(): PrivacyPolicyContent {
  return load("admin-privacy-policy", defaultPrivacyPolicy);
}
export function savePrivacyPolicy(data: PrivacyPolicyContent) {
  save("admin-privacy-policy", data);
}
