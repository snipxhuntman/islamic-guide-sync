import React, { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Banner from "@/components/Banner";
import QiblaCompass from "@/components/QiblaCompass";
import { formatHijriDate, formatGregorianDate } from "@/utils/hijri";
import { getLivePrayerTimesForDate, getCurrentPrayer, prayerKeys, PrayerName } from "@/data/prayerTimes";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatTime } from "@/utils/timeFormat";
import { getIqamaSettings, computeIqama } from "@/stores/dataStore";

const PrayerTimes: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const [dayOffset, setDayOffset] = useState(0);

  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [dayOffset]);

  const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
  const prayers = getLivePrayerTimesForDate(dateStr);
  const isToday = dayOffset === 0;
  const currentPrayer = isToday && prayers ? getCurrentPrayer(prayers) : null;
  const iqamaSettings = getIqamaSettings();

  const getPrayerTime = (key: PrayerName) => {
    if (!prayers) return { time: "--:--", iqama: "--:--" };
    const time = prayers[key];
    const setting = iqamaSettings[key];
    const iqama = key === "shuruk" ? "-" : setting ? computeIqama(time, setting) : "-";
    return { time, iqama };
  };

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col min-h-screen max-w-app mx-auto pb-20">
      <div className="px-4 pt-4">
        <Banner />
      </div>

      {/* Date navigator */}
      <div className="flex items-center justify-between px-4 mt-4">
        <button
          onClick={() => setDayOffset((o) => Math.max(0, o - 1))}
          disabled={dayOffset === 0}
          className="p-2 rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
        >
          <PrevIcon className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {isToday ? t("today") : formatGregorianDate(selectedDate, language)}
          </p>
          <p className="text-xs text-accent">{formatHijriDate(selectedDate, language)}</p>
        </div>
        <button
          onClick={() => setDayOffset((o) => o + 1)}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <NextIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Prayer table */}
      <div className="px-4 mt-4">
        <div className="rounded-xl overflow-hidden border border-border bg-card">
          {/* Header */}
          <div className="grid grid-cols-3 bg-primary text-primary-foreground text-sm font-semibold">
            <div className="px-4 py-3">{t("prayer")}</div>
            <div className="px-4 py-3 text-center">{isToday ? t("time") : t("time")}</div>
            <div className="px-4 py-3 text-center">{t("iqama")}</div>
          </div>
          {/* Rows */}
          {prayerKeys.map((key) => {
            const { time, iqama } = getPrayerTime(key);
            const isActive = currentPrayer === key;
            return (
              <div
                key={key}
                className={`grid grid-cols-3 text-sm border-t border-border transition-colors ${
                  isActive
                    ? "bg-accent/20 font-semibold"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className={`px-4 py-3 ${isActive ? "text-accent-foreground" : "text-foreground"}`}>
                  {t(key)}
                </div>
                <div className={`px-4 py-3 text-center tabular-nums ${isActive ? "text-accent-foreground" : "text-muted-foreground"}`}>
                  {formatTime(time, language)}
                </div>
                <div className={`px-4 py-3 text-center tabular-nums ${isActive ? "text-accent-foreground" : "text-muted-foreground"}`}>
                  {iqama === "-" ? "-" : formatTime(iqama, language)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Qibla Compass */}
      <div className="mt-8 px-4">
        <QiblaCompass />
      </div>
    </div>
  );
};

export default PrayerTimes;
