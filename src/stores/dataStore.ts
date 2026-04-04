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
