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
  de: `<h2>Datenschutzerklärung</h2>
<p>Informationen zum Umgang mit Ihren Daten</p>

<h3>Verantwortliche Stelle</h3>
<p>Im Sinne der Datenschutzgesetze, insbesondere der EU-Datenschutzgrundverordnung (DSGVO)</p>
<p><strong>IGS-AM e. V.</strong><br>Rackwitzer Strasse 24<br>04347 Leipzig</p>
<p><strong>Vertreten durch:</strong><br>Imam Hassan Dabbagh (Vorstandsvorsitzender)</p>

<h3>Ihre Betroffenenrechte</h3>
<p>Unter den angegebenen Kontaktdaten können Sie jederzeit folgende Rechte ausüben:</p>
<ul>
<li>Auskunft über Ihre bei uns gespeicherten Daten und deren Verarbeitung</li>
<li>Berichtigung unrichtiger personenbezogener Daten</li>
<li>Löschung Ihrer bei uns gespeicherten Daten</li>
<li>Einschränkung der Datenverarbeitung, sofern wir Ihre Daten aufgrund gesetzlicher Pflichten noch nicht löschen dürfen</li>
<li>Widerspruch gegen die Verarbeitung Ihrer Daten bei uns</li>
<li>Datenübertragbarkeit, sofern Sie in die Datenverarbeitung eingewilligt haben</li>
</ul>
<p><strong>Hinweis:</strong> Sofern Sie uns eine Einwilligung erteilt haben, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen.</p>

<h3>Zwecke der Datenverarbeitung</h3>
<p>Wir verarbeiten Ihre personenbezogenen Daten nur zu den in dieser Datenschutzerklärung genannten Zwecken. Eine Übermittlung Ihrer persönlichen Daten an Dritte zu anderen als den genannten Zwecken findet nicht statt.</p>
<p>Wir geben Ihre persönlichen Daten nur an Dritte weiter, wenn:</p>
<ul>
<li>Sie Ihre ausdrückliche Einwilligung dazu erteilt haben</li>
<li>die Verarbeitung zur Abwicklung eines Vertrags mit Ihnen erforderlich ist</li>
<li>die Verarbeitung zur Erfüllung einer rechtlichen Verpflichtung erforderlich ist</li>
<li>die Verarbeitung zur Wahrung berechtigter Interessen erforderlich ist</li>
</ul>

<h3>Löschung bzw. Sperrung der Daten</h3>
<p>Wir halten uns an die Grundsätze der Datenvermeidung und Datensparsamkeit. Wir speichern Ihre personenbezogenen Daten daher nur so lange, wie dies zur Erreichung der hier genannten Zwecke erforderlich ist oder wie es die vom Gesetzgeber vorgesehenen vielfältigen Speicherfristen vorsehen. Nach Fortfall des jeweiligen Zweckes bzw. Ablauf dieser Fristen werden die entsprechenden Daten routinemäßig und entsprechend den gesetzlichen Vorschriften gesperrt oder gelöscht.</p>

<h3>Erfassung allgemeiner Informationen</h3>
<p>Wenn Sie auf unsere Website zugreifen, werden automatisch Informationen allgemeiner Natur erfasst. Diese Informationen (Server-Logfiles) beinhalten etwa die Art des Webbrowsers, das verwendete Betriebssystem, den Domainnamen Ihres Internet-Service-Providers und ähnliches.</p>
<p>Sie werden insbesondere zu folgenden Zwecken verarbeitet:</p>
<ul>
<li>Sicherstellung eines problemlosen Verbindungsaufbaus der Website</li>
<li>Sicherstellung einer reibungslosen Nutzung unserer Website</li>
<li>Auswertung der Systemsicherheit und -stabilität</li>
<li>Weitere administrative Zwecke</li>
</ul>

<h3>Cookies</h3>
<p>Wie viele andere Webseiten verwenden wir auch so genannte „Cookies". Cookies sind kleine Textdateien, die von einem Websiteserver auf Ihre Festplatte übertragen werden. Hierdurch erhalten wir automatisch bestimmte Daten wie z. B. IP-Adresse, verwendeter Browser, Betriebssystem und Ihre Verbindung zum Internet.</p>
<p>Cookies können nicht verwendet werden, um Programme zu starten oder Viren auf einen Computer zu übertragen. Anhand der in Cookies enthaltenen Informationen können wir Ihnen die Navigation erleichtern und die korrekte Anzeige unserer Webseiten ermöglichen.</p>
<p>In keinem Fall werden die von uns erfassten Daten an Dritte weitergegeben oder ohne Ihre Einwilligung eine Verknüpfung mit personenbezogenen Daten hergestellt.</p>

<h3>SSL-Verschlüsselung</h3>
<p>Um die Sicherheit Ihrer Daten bei der Übertragung zu schützen, verwenden wir dem aktuellen Stand der Technik entsprechende Verschlüsselungsverfahren (z. B. SSL) über HTTPS.</p>

<h3>Newsletter</h3>
<p>Auf Grundlage Ihrer ausdrücklich erteilten Einwilligung, übersenden wir Ihnen regelmäßig unseren Newsletter bzw. vergleichbare Informationen per E-Mail an Ihre angegebene E-Mail-Adresse.</p>
<p>Für eine wirksame Registrierung benötigen wir eine valide E-Mail-Adresse. Um zu überprüfen, dass eine Anmeldung tatsächlich durch den Inhaber einer E-Mail-Adresse erfolgt, setzen wir das „Double-opt-in"-Verfahren ein.</p>
<p>Die Einwilligung zur Speicherung Ihrer persönlichen Daten und ihrer Nutzung für den Newsletterversand können Sie jederzeit widerrufen. In jedem Newsletter findet sich dazu ein entsprechender Link.</p>

<h3>Kontaktformular</h3>
<p>Treten Sie bzgl. Fragen jeglicher Art per E-Mail oder Kontaktformular mit uns in Kontakt, erteilen Sie uns zum Zwecke der Kontaktaufnahme Ihre freiwillige Einwilligung. Hierfür ist die Angabe einer validen E-Mail-Adresse erforderlich. Diese dient der Zuordnung der Anfrage und der anschließenden Beantwortung derselben. Die Angabe weiterer Daten ist optional. Nach Erledigung der von Ihnen gestellten Anfrage werden personenbezogene Daten automatisch gelöscht.</p>

<h3>Externe Dienste</h3>
<h4>Google Webfonts</h4>
<p>Um unsere Inhalte browserübergreifend korrekt und grafisch ansprechend darzustellen, verwenden wir auf dieser Website Google Webfonts. Der Aufruf von Schriftbibliotheken löst automatisch eine Verbindung zum Betreiber der Bibliothek aus.</p>
<h4>Google Maps</h4>
<p>Diese Webseite verwendet Google Maps API, um geographische Informationen visuell darzustellen. Bei der Nutzung von Google Maps werden von Google auch Daten über die Nutzung der Kartenfunktionen durch Besucher erhoben, verarbeitet und genutzt.</p>
<h4>YouTube-Videos</h4>
<p>Auf einigen unserer Webseiten betten wir Youtube-Videos ein. Wenn Sie eine Seite mit dem YouTube-Plugin besuchen, wird eine Verbindung zu Servern von Youtube hergestellt.</p>

<h3>Fragen zum Datenschutz?</h3>
<p>Wenn Sie Fragen zum Datenschutz haben, schreiben Sie uns bitte eine E-Mail:</p>
<p><strong>Imam Hassan Dabbagh</strong> (Vorstandsvorsitzender)<br><a href="mailto:igs-am@hotmail.de">igs-am@hotmail.de</a></p>`,
  en: "This app stores your settings locally on your device. No personal data is transmitted to servers. The Qibla compass uses your location only to calculate the prayer direction and does not save any location data.",
  ar: "يحتفظ هذا التطبيق بإعداداتك محلياً على جهازك. لا يتم إرسال أي بيانات شخصية إلى الخوادم. تستخدم بوصلة القبلة موقعك فقط لحساب اتجاه الصلاة ولا تحفظ أي بيانات موقع.",
};

export function getPrivacyPolicy(): PrivacyPolicyContent {
  return load("admin-privacy-policy", defaultPrivacyPolicy);
}
export function savePrivacyPolicy(data: PrivacyPolicyContent) {
  save("admin-privacy-policy", data);
}
