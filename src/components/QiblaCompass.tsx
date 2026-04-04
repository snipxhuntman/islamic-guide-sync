import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Compass, Navigation } from "lucide-react";

// Leipzig to Makkah bearing ~136.5°
const QIBLA_BEARING = 136.5;

const QiblaCompass: React.FC = () => {
  const { t } = useLanguage();
  const [hasConsent, setHasConsent] = useState(false);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasConsent) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.alpha !== null) {
        setHeading(e.alpha);
      }
    };

    // Try requesting permission on iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((state: string) => {
          if (state === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          } else {
            setError(t("locationDenied"));
          }
        })
        .catch(() => setError(t("locationDenied")));
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, [hasConsent, t]);

  const qiblaRotation = heading !== null ? QIBLA_BEARING - heading : QIBLA_BEARING;

  if (!hasConsent) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        <Compass className="w-12 h-12 text-accent" />
        <p className="text-sm text-muted-foreground text-center">{t("qiblaDesc")}</p>
        <Button onClick={() => setHasConsent(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
          {t("allowLocation")}
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 p-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <h3 className="text-lg font-semibold text-foreground">{t("qiblaDirection")}</h3>
      <div className="relative w-52 h-52">
        {/* Compass ring */}
        <svg
          className="w-full h-full transition-transform duration-300"
          style={{ transform: `rotate(${heading !== null ? -heading : 0}deg)` }}
          viewBox="0 0 200 200"
        >
          <circle cx="100" cy="100" r="95" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
          <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(var(--muted))" strokeWidth="1" />
          {/* Cardinal directions */}
          {["N", "E", "S", "W"].map((dir, i) => {
            const angle = i * 90;
            const rad = (angle - 90) * (Math.PI / 180);
            const x = 100 + 75 * Math.cos(rad);
            const y = 100 + 75 * Math.sin(rad);
            return (
              <text
                key={dir}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-xs font-bold"
                fill={dir === "N" ? "hsl(var(--destructive))" : "hsl(var(--foreground))"}
                style={{ transform: `rotate(${heading ?? 0}deg)`, transformOrigin: `${x}px ${y}px` }}
              >
                {dir}
              </text>
            );
          })}
          {/* Tick marks */}
          {Array.from({ length: 36 }, (_, i) => {
            const angle = i * 10;
            const rad = (angle - 90) * (Math.PI / 180);
            const r1 = i % 9 === 0 ? 88 : 92;
            return (
              <line
                key={i}
                x1={100 + r1 * Math.cos(rad)}
                y1={100 + r1 * Math.sin(rad)}
                x2={100 + 95 * Math.cos(rad)}
                y2={100 + 95 * Math.sin(rad)}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={i % 9 === 0 ? 2 : 1}
              />
            );
          })}
        </svg>
        {/* Qibla needle */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
          style={{ transform: `rotate(${qiblaRotation}deg)` }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <Navigation className="w-10 h-10 text-accent -mt-16" style={{ transform: "rotate(0deg)" }} />
          </div>
        </div>
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-accent shadow-md" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("qiblaDesc")} ({QIBLA_BEARING}°)</p>
    </div>
  );
};

export default QiblaCompass;
