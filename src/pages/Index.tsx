import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Banner from "@/components/Banner";
import CountdownTimer from "@/components/CountdownTimer";
import MessageCarousel from "@/components/MessageCarousel";
import { formatHijriDate, formatGregorianDate } from "@/utils/hijri";
import { getLivePrayerTimesForDate, getNextPrayer, prayerKeys, PrayerName } from "@/data/prayerTimes";
import { formatTime } from "@/utils/timeFormat";
import { getSiteLinks } from "@/stores/dataStore";
import { Globe } from "lucide-react";

const SocialIcons = () => {
  const links = getSiteLinks();
  const socials = [
    { label: "YouTube", href: links.socials.youtube, icon: "M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5S0 8.7 0 11v2c0 2.3.5 4.5.5 4.5a3 3 0 0 0 2.1 2.1c1.9.4 9.4.4 9.4.4s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1s.5-2.2.5-4.5v-2c0-2.3-.5-4.5-.5-4.5zM9.5 15.5v-7l6.3 3.5-6.3 3.5z" },
    { label: "Instagram", href: links.socials.instagram, icon: "M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7 .1 5.7.1 4.8.3 4 .6a5.9 5.9 0 0 0-2.1 1.3A5.9 5.9 0 0 0 .6 4C.3 4.8.1 5.7.1 7 0 8.3 0 8.7 0 12s0 3.7.1 5c.1 1.3.2 2.2.5 3a5.9 5.9 0 0 0 1.3 2.1 5.9 5.9 0 0 0 2.1 1.3c.8.3 1.7.5 3 .5 1.3.1 1.7.1 5 .1s3.7 0 5-.1c1.3-.1 2.2-.2 3-.5a5.9 5.9 0 0 0 2.1-1.3 5.9 5.9 0 0 0 1.3-2.1c.3-.8.5-1.7.5-3 .1-1.3.1-1.7.1-5s0-3.7-.1-5c-.1-1.3-.2-2.2-.5-3a5.9 5.9 0 0 0-1.3-2.1A5.9 5.9 0 0 0 20 .6c-.8-.3-1.7-.5-3-.5C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" },
    { label: "Facebook", href: links.socials.facebook, icon: "M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18 24 12z" },
    { label: "Telegram", href: links.socials.telegram, icon: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 8.2l-1.8 8.5c-.1.6-.5.7-1 .5l-2.8-2.1-1.3 1.3c-.2.2-.3.3-.6.3l.2-2.8 5.1-4.6c.2-.2 0-.3-.3-.1l-6.3 4-2.7-.8c-.6-.2-.6-.6.1-.8l10.5-4c.5-.2.9.1.8.8z" },
    { label: "TikTok", href: links.socials.tiktok, icon: "M12.5 0h3.4c.3 2.3 1.7 4.2 3.7 5v3.4c-1.3-.1-2.5-.5-3.6-1.1v5a6.3 6.3 0 1 1-5.4-6.2v3.5a2.9 2.9 0 1 0 2 2.7V0z" },
  ];

  return (
    <div className="flex justify-center gap-5 py-4">
      {socials.map((s) => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-secondary transition-colors"
          aria-label={s.label}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
            <path d={s.icon} />
          </svg>
        </a>
      ))}
    </div>
  );
};

const HomePrayerTimes: React.FC = () => {
  const { t, language } = useLanguage();
  const [tick, setTick] = useState(0);

  // Re-check next prayer every 30 seconds so the highlight stays in sync
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const prayers = getLivePrayerTimesForDate(dateStr);
  const nextPrayer = prayers ? getNextPrayer(prayers) : null;
  // After Isha, highlight Fajr as the next prayer
  const highlightedPrayer = nextPrayer?.name ?? "fajr";

  if (!prayers) return null;

  const getPrayerTime = (key: PrayerName) => {
    const timeMap: Record<PrayerName, string> = {
      fajr: prayers.fajr,
      shuruk: prayers.shuruk,
      dhuhr: prayers.dhuhr,
      asr: prayers.asr,
      maghrib: prayers.maghrib,
      isha: prayers.isha,
    };
    return timeMap[key];
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {prayerKeys.map((key) => {
        const isNext = nextPrayer?.name === key;
        return (
          <div
            key={key}
            className={`flex flex-col items-center rounded-xl px-2 py-3 transition-colors relative ${
              isNext
                ? "bg-accent text-accent-foreground ring-2 ring-accent shadow-md"
                : "bg-card text-foreground"
            }`}
          >
            {isNext && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[0.625rem] font-bold uppercase px-2 py-0.5 rounded-full leading-none whitespace-nowrap">
                {t("upcoming")}
              </span>
            )}
            <span
              className={`text-[0.8125rem] leading-snug ${
                isNext ? "font-bold mt-1" : "font-medium text-muted-foreground"
              }`}
            >
              {t(key)}
            </span>
            <span
              className={`tabular-nums mt-0.5 ${
                isNext ? "text-[1.125rem] font-bold" : "text-[0.9375rem] font-semibold"
              }`}
            >
              {formatTime(getPrayerTime(key), language)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const Index: React.FC = () => {
  const { language, t } = useLanguage();
  const today = new Date();
  const links = getSiteLinks();

  const donationUrl = links.donation[language] || links.donation.de;
  const websiteUrl = links.website[language] || links.website.de;

  return (
    <div className="flex flex-col min-h-screen max-w-app mx-auto pb-20">
      <div className="px-4 pt-4">
        <Banner />
      </div>

      {/* Dual Calendar */}
      <div className="text-center mt-4 px-4">
        <p className="text-sm font-medium text-foreground">
          {formatGregorianDate(today, language)}
        </p>
        <p className="text-sm text-accent font-semibold">
          {formatHijriDate(today, language)}
        </p>
      </div>

      {/* Prayer Times Grid */}
      <div className="mt-4 px-4">
        <HomePrayerTimes />
      </div>

      {/* Countdown Timer */}
      <div className="mt-6 px-4">
        <CountdownTimer />
      </div>

      {/* Message Carousel */}
      <div className="mt-6 px-4">
        <MessageCarousel />
      </div>

      {/* Donation Bar */}
      <div className="mt-6 px-4">
        <a
          href={donationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-accent text-accent-foreground py-3 px-4 font-semibold text-[0.9375rem] hover:opacity-90 transition-opacity"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {t("donate")}
        </a>
      </div>

      {/* Website Bar */}
      <div className="mt-3 px-4">
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground py-3 px-4 font-semibold text-[0.9375rem] hover:opacity-90 transition-opacity"
        >
          <Globe className="w-5 h-5" />
          {t("website")}
        </a>
      </div>

      {/* Social Icons */}
      <div className="mt-6">
        <SocialIcons />
      </div>
    </div>
  );
};

export default Index;
