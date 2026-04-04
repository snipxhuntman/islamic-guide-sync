import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLivePrayerTimesForDate, getNextPrayer } from "@/data/prayerTimes";

const CountdownTimer: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [nextPrayerName, setNextPrayerName] = useState("");

  useEffect(() => {
    const update = () => {
      const now0 = new Date();
      const today = `${now0.getFullYear()}-${String(now0.getMonth() + 1).padStart(2, "0")}-${String(now0.getDate()).padStart(2, "0")}`;
      const prayers = getLivePrayerTimesForDate(today);
      if (!prayers) return;

      const next = getNextPrayer(prayers);
      if (!next) {
        setNextPrayerName(t("fajr"));
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        const diff = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
        setTimeLeft({
          hours: Math.floor(diff / 3600),
          minutes: Math.floor((diff % 3600) / 60),
          seconds: diff % 60,
        });
        return;
      }

      setNextPrayerName(t(next.name));
      const [h, m] = next.time.split(":").map(Number);
      const now = new Date();
      const target = new Date(now);
      target.setHours(h, m, 0, 0);
      const diff = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
      setTimeLeft({
        hours: Math.floor(diff / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [t]);

  const totalSeconds = timeLeft.hours * 3600 + timeLeft.minutes * 60 + timeLeft.seconds;
  const maxSeconds = 12 * 3600;
  const progress = Math.min(1, totalSeconds / maxSeconds);
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
