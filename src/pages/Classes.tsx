import React, { useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLiveClasses } from "@/data/classes";
import { getLivePrayerTimesForDate } from "@/data/prayerTimes";
import { AlertTriangle } from "lucide-react";
import { formatTime } from "@/utils/timeFormat";
import { markCancellationsSeen } from "@/utils/notifications";
import { useContentVersion } from "@/hooks/useContentVersion";

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const DAY_INDEX: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function getNextDateForDay(dayName: string, endTime: string | null): Date {
  const target = DAY_INDEX[dayName] ?? 1;
  const now = new Date();
  const current = now.getDay();
  let diff = (target - current + 7) % 7;

  // If today is class day, check if the class has already ended
  if (diff === 0 && endTime) {
    const [h, m] = endTime.split(":").map(Number);
    if (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)) {
      diff = 7; // class finished today, show next week
    }
  }

  const next = new Date(now);
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + diff);
  return next;
}

function formatClassDate(date: Date, language: string): string {
  const localeMap: Record<string, string> = { de: "de-DE", en: "en-US", ar: "ar-SA" };
  const locale = localeMap[language] || "de-DE";
  const weekday = date.toLocaleDateString(locale, { weekday: "long" });
  // Always use western numerals
  const day = date.getDate();
  const month = date.toLocaleDateString(locale, { month: "long" });
  const year = date.getFullYear();
  return `${weekday}, ${day}. ${month} ${year}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const Classes: React.FC = () => {
  const { t, language } = useLanguage();
  const classesVer = useContentVersion("classes");
  useContentVersion("prayer_times");
  const classes = useMemo(() => getLiveClasses(), [classesVer]);

  useEffect(() => {
    markCancellationsSeen();
  }, []);

  const getTitle = (c: typeof classes[0]) => {
    if (language === "en") return c.titleEn;
    if (language === "ar") return c.titleAr;
    return c.title;
  };

  const getDesc = (c: typeof classes[0]) => {
    if (language === "en") return c.descriptionEn;
    if (language === "ar") return c.descriptionAr;
    return c.description;
  };

  const socialIcons = [
    { key: "youtube", icon: "M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5S0 8.7 0 11v2c0 2.3.5 4.5.5 4.5a3 3 0 0 0 2.1 2.1c1.9.4 9.4.4 9.4.4s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1s.5-2.2.5-4.5v-2c0-2.3-.5-4.5-.5-4.5zM9.5 15.5v-7l6.3 3.5-6.3 3.5z" },
    { key: "instagram", icon: "M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2a3.9 3.9 0 0 1-.9 1.4 3.9 3.9 0 0 1-1.4.9c-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zM12 0C8.7 0 8.3 0 7 .1 5.7.1 4.8.3 4 .6a5.9 5.9 0 0 0-2.1 1.3A5.9 5.9 0 0 0 .6 4C.3 4.8.1 5.7.1 7 0 8.3 0 8.7 0 12s0 3.7.1 5c.1 1.3.2 2.2.5 3a5.9 5.9 0 0 0 1.3 2.1 5.9 5.9 0 0 0 2.1 1.3c.8.3 1.7.5 3 .5 1.3.1 1.7.1 5 .1s3.7 0 5-.1c1.3-.1 2.2-.2 3-.5a5.9 5.9 0 0 0 2.1-1.3 5.9 5.9 0 0 0 1.3-2.1c.3-.8.5-1.7.5-3 .1-1.3.1-1.7.1-5s0-3.7-.1-5c-.1-1.3-.2-2.2-.5-3a5.9 5.9 0 0 0-1.3-2.1A5.9 5.9 0 0 0 20 .6c-.8-.3-1.7-.5-3-.5C15.7 0 15.3 0 12 0zm0 5.8a6.2 6.2 0 1 0 0 12.4 6.2 6.2 0 0 0 0-12.4zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.8a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z" },
    { key: "facebook", icon: "M24 12c0-6.6-5.4-12-12-12S0 5.4 0 12c0 6 4.4 11 10.1 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.7.2 2.7.2v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4C19.6 23 24 18 24 12z" },
    { key: "telegram", icon: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 8.2l-1.8 8.5c-.1.6-.5.7-1 .5l-2.8-2.1-1.3 1.3c-.2.2-.3.3-.6.3l.2-2.8 5.1-4.6c.2-.2 0-.3-.3-.1l-6.3 4-2.7-.8c-.6-.2-.6-.6.1-.8l10.5-4c.5-.2.9.1.8.8z" },
    { key: "tiktok", icon: "M12.5 0h3.4c.3 2.3 1.7 4.2 3.7 5v3.4c-1.3-.1-2.5-.5-3.6-1.1v5a6.3 6.3 0 1 1-5.4-6.2v3.5a2.9 2.9 0 1 0 2 2.7V0z" },
  ];

  return (
    <div className="flex flex-col min-h-screen max-w-app mx-auto pb-20">
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold text-foreground">{t("classes")}</h1>
      </div>

      <div className="flex-1 px-4 mt-4 space-y-3">
        {classes.map((cls) => {
          const isManual = cls.timingMode === "manual" && cls.manualStart && cls.manualEnd;

          // Compute end time first to determine if class has passed today
          let tempEnd: string | null = null;
          if (isManual) {
            tempEnd = cls.manualEnd!;
          } else {
            // Rough estimate: isha time for today
            const todayStr = toDateStr(new Date());
            const todayPrayers = getLivePrayerTimesForDate(todayStr);
            tempEnd = todayPrayers?.isha ?? null;
          }

          const nextDate = getNextDateForDay(cls.day, tempEnd);
          const nextDateStr = toDateStr(nextDate);
          const prayers = getLivePrayerTimesForDate(nextDateStr);

          let displayStart: string | null;
          let displayEnd: string | null;

          if (isManual) {
            displayStart = cls.manualStart!;
            displayEnd = cls.manualEnd!;
          } else {
            displayStart = prayers ? addMinutesToTime(prayers.maghrib, cls.autoOffset ?? 20) : null;
            displayEnd = prayers?.isha ?? null;
          }

          return (
          <div
            key={cls.id}
            className={`rounded-xl border p-4 transition-colors ${
              cls.isCancelled
                ? "border-destructive/50 bg-destructive/5"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3
                  className={`font-semibold text-foreground ${
                    cls.isCancelled ? "line-through opacity-60" : ""
                  }`}
                >
                  {getTitle(cls)}
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">{getDesc(cls)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatClassDate(nextDate, language)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("classTime")}:{" "}
                  {displayStart && displayEnd
                    ? `${formatTime(displayStart, language)} – ${formatTime(displayEnd, language)}`
                    : `${t("maghrib")}+20 – ${t("isha")}`}
                </p>
              </div>
              {cls.isCancelled && (
                <div className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-1 rounded-md shrink-0">
                  <AlertTriangle className="w-3 h-3" />
                  <span className="text-[10px] font-medium">{t("cancelled")}</span>
                </div>
              )}
            </div>

            {/* Social links */}
            <div className="flex gap-2 mt-3">
              {socialIcons.map(
                ({ key, icon }) =>
                  cls.links[key as keyof typeof cls.links] &&
                  (cls.linksVisible?.[key as keyof typeof cls.links] !== false) && (
                    <a
                      key={key}
                      href={cls.links[key as keyof typeof cls.links]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                        <path d={icon} />
                      </svg>
                    </a>
                  )
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
};

export default Classes;
