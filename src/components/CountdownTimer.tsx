import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLivePrayerTimesForDate, getNextPrayer, prayerKeys } from "@/data/prayerTimes";

const CountdownTimer: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [nextPrayerName, setNextPrayerName] = useState("");
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    const toMin = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const update = () => {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const prayers = getLivePrayerTimesForDate(todayStr);
      if (!prayers) return;

      const next = getNextPrayer(prayers);

      if (!next) {
        // After Isha → countdown to tomorrow's Fajr
        setNextPrayerName(t("fajr"));
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
        const tomorrowPrayers = getLivePrayerTimesForDate(tomorrowStr);
        if (tomorrowPrayers) {
          const [fH, fM] = tomorrowPrayers.fajr.split(":").map(Number);
          const fajrTarget = new Date(tomorrow);
          fajrTarget.setHours(fH, fM, 0, 0);
          const diff = Math.max(0, Math.floor((fajrTarget.getTime() - now.getTime()) / 1000));

          // Total span: Isha → tomorrow Fajr
          const ishaMin = toMin(prayers.isha);
          const fajrTomorrowMin = toMin(tomorrowPrayers.fajr);
          const totalSpan = (24 * 60 - ishaMin + fajrTomorrowMin) * 60;

          setTimeLeft({
            hours: Math.floor(diff / 3600),
            minutes: Math.floor((diff % 3600) / 60),
            seconds: diff % 60,
          });
          setProgress(totalSpan > 0 ? Math.min(1, diff / totalSpan) : 0);
        }
        return;
      }

      setNextPrayerName(t(next.name));
      const [h, m] = next.time.split(":").map(Number);
      const target = new Date(now);
      target.setHours(h, m, 0, 0);
      const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));

      // Compute span from previous prayer to this next prayer
      const orderedKeys = ["fajr", "shuruk", "dhuhr", "asr", "maghrib", "isha"] as const;
      const nextIdx = orderedKeys.indexOf(next.name);
      let totalSpan: number;
      if (nextIdx === 0) {
        // Before Fajr: span from yesterday's Isha to today's Fajr
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
        const yesterdayPrayers = getLivePrayerTimesForDate(yesterdayStr);
        const prevIshaMin = yesterdayPrayers ? toMin(yesterdayPrayers.isha) : toMin(prayers.isha);
        const fajrMin = toMin(prayers.fajr);
        totalSpan = (24 * 60 - prevIshaMin + fajrMin) * 60;
      } else {
        const prevKey = orderedKeys[nextIdx - 1];
        const prevMin = toMin(prayers[prevKey]);
        const nextMin = toMin(next.time);
        totalSpan = (nextMin - prevMin) * 60;
      }

      setTimeLeft({
        hours: Math.floor(diff / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
      });
      setProgress(totalSpan > 0 ? Math.min(1, diff / totalSpan) : 0);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [t]);

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference * (1 - progress);

  // For Arabic, reverse the order: seconds | minutes | hours (RTL reading)
  const timeParts = [
    { value: timeLeft.hours, label: t("hours") },
    { value: timeLeft.minutes, label: t("minutes") },
    { value: timeLeft.seconds, label: t("seconds") },
  ];
  const displayParts = timeParts;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground font-medium">
        {t("timeUntil")} {nextPrayerName}
      </p>
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <circle
            cx="80" cy="80" r="70"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" dir="ltr">
          <span className="text-2xl font-bold text-foreground tabular-nums">
            {String(timeLeft.hours).padStart(2, "0")}:
            {String(timeLeft.minutes).padStart(2, "0")}:
            {String(timeLeft.seconds).padStart(2, "0")}
          </span>
          <div className="flex gap-3 text-[10px] text-muted-foreground mt-1">
            {displayParts.map((p, i) => (
              <span key={i}>{p.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
