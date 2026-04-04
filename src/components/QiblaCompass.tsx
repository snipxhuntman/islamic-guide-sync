import React, { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

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
  const compassRotation = heading !== null ? -heading : 0;

  if (!hasConsent) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-2xl border border-border">
        <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center">
          <Compass className="w-8 h-8 text-accent" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-1">{t("qiblaDirection")}</h3>
          <p className="text-sm text-muted-foreground">{t("qiblaDesc")}</p>
        </div>
        <Button onClick={() => setHasConsent(true)} className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-6">
          {t("allowLocation")}
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-2 p-6 bg-card rounded-2xl border border-border">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-card rounded-2xl border border-border">
      <h3 className="text-lg font-semibold text-foreground">{t("qiblaDirection")}</h3>
      <div className="relative w-60 h-60">
        {/* Outer decorative ring */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 240">
          <defs>
            <linearGradient id="compassRing" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
          </defs>
          <circle cx="120" cy="120" r="116" fill="none" stroke="url(#compassRing)" strokeWidth="3" />
          <circle cx="120" cy="120" r="108" fill="none" stroke="hsl(var(--border))" strokeWidth="1" />
        </svg>

        {/* Rotating compass face */}
        <svg
          className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${compassRotation}deg)` }}
          viewBox="0 0 240 240"
        >
          {/* Degree ticks */}
          {Array.from({ length: 72 }, (_, i) => {
            const angle = i * 5;
            const rad = (angle - 90) * (Math.PI / 180);
            const isMajor = angle % 90 === 0;
            const isMedium = angle % 30 === 0;
            const innerR = isMajor ? 85 : isMedium ? 90 : 95;
            return (
              <line
                key={i}
                x1={120 + innerR * Math.cos(rad)}
                y1={120 + innerR * Math.sin(rad)}
                x2={120 + 105 * Math.cos(rad)}
                y2={120 + 105 * Math.sin(rad)}
                stroke={isMajor ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground) / 0.4)"}
                strokeWidth={isMajor ? 2.5 : isMedium ? 1.5 : 0.8}
              />
            );
          })}

          {/* Cardinal directions */}
          {[
            { label: "N", angle: 0, color: "hsl(0, 70%, 50%)" },
            { label: "E", angle: 90, color: "hsl(var(--foreground))" },
            { label: "S", angle: 180, color: "hsl(var(--foreground))" },
            { label: "W", angle: 270, color: "hsl(var(--foreground))" },
          ].map(({ label, angle, color }) => {
            const rad = (angle - 90) * (Math.PI / 180);
            const x = 120 + 74 * Math.cos(rad);
            const y = 120 + 74 * Math.sin(rad);
            return (
              <g key={label}>
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={color}
                  fontSize="14"
                  fontWeight="700"
                  style={{ transform: `rotate(${heading ?? 0}deg)`, transformOrigin: `${x}px ${y}px` }}
                >
                  {label}
                </text>
              </g>
            );
          })}

          {/* Intercardinal directions */}
          {[
            { label: "NE", angle: 45 },
            { label: "SE", angle: 135 },
            { label: "SW", angle: 225 },
            { label: "NW", angle: 315 },
          ].map(({ label, angle }) => {
            const rad = (angle - 90) * (Math.PI / 180);
            const x = 120 + 74 * Math.cos(rad);
            const y = 120 + 74 * Math.sin(rad);
            return (
              <text
                key={label}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="hsl(var(--muted-foreground))"
                fontSize="9"
                fontWeight="500"
                style={{ transform: `rotate(${heading ?? 0}deg)`, transformOrigin: `${x}px ${y}px` }}
              >
                {label}
              </text>
            );
          })}
        </svg>

        {/* Qibla arrow — fixed pointing toward Makkah */}
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{ transform: `rotate(${qiblaRotation}deg)` }}
        >
          <svg className="w-full h-full" viewBox="0 0 240 240">
            <defs>
              <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--accent))" />
                <stop offset="100%" stopColor="hsl(38, 75%, 45%)" />
              </linearGradient>
              <filter id="arrowShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="hsl(var(--accent))" floodOpacity="0.4" />
              </filter>
            </defs>
            {/* Main arrow */}
            <path
              d="M120 30 L132 110 L126 105 L126 210 L114 210 L114 105 L108 110 Z"
              fill="url(#arrowGrad)"
              filter="url(#arrowShadow)"
              opacity="0.9"
            />
            {/* Arrow tip decoration */}
            <path
              d="M120 30 L126 55 L120 48 L114 55 Z"
              fill="hsl(var(--accent))"
              opacity="1"
            />
            {/* Kaaba icon at tip */}
            <rect x="115" y="35" width="10" height="10" rx="1" fill="hsl(var(--accent-foreground))" opacity="0.7" />
          </svg>
        </div>

        {/* Center hub */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-mosque-gold-dark shadow-lg border-2 border-card" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("qiblaDesc")} · {QIBLA_BEARING}°</p>
    </div>
  );
};

export default QiblaCompass;
