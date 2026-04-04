import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";

const QIBLA_BEARING = 136.5;

/** Shortest-path angular interpolation */
function lerpAngle(from: number, to: number, t: number): number {
  let diff = ((to - from + 540) % 360) - 180;
  return (from + diff * t + 360) % 360;
}

const QiblaCompass: React.FC = () => {
  const { t } = useLanguage();
  const [hasConsent, setHasConsent] = useState(false);
  const [error, setError] = useState("");

  // Raw heading from sensor, smoothed heading for display
  const rawHeading = useRef<number | null>(null);
  const smoothHeading = useRef<number>(0);
  const [displayHeading, setDisplayHeading] = useState<number | null>(null);
  const rafId = useRef<number>(0);

  const animate = useCallback(() => {
    if (rawHeading.current !== null) {
      smoothHeading.current = lerpAngle(smoothHeading.current, rawHeading.current, 0.15);
      setDisplayHeading(smoothHeading.current);
    }
    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!hasConsent) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // iOS provides webkitCompassHeading (degrees from true north, clockwise)
      const iosHeading = (e as any).webkitCompassHeading;
      if (typeof iosHeading === "number" && !isNaN(iosHeading)) {
        rawHeading.current = iosHeading;
      } else if (e.alpha !== null) {
        // Android: alpha is degrees from arbitrary north, but if absolute
        // we need to convert. For relative orientation, alpha=0 means device
        // points to the same direction as when sensor started.
        // absolute orientation event gives true north.
        rawHeading.current = (360 - e.alpha) % 360;
      }

      // Initialize smooth heading on first reading
      if (displayHeading === null && rawHeading.current !== null) {
        smoothHeading.current = rawHeading.current;
      }
    };

    const startListening = (eventName: string) => {
      window.addEventListener(eventName, handleOrientation as EventListener, true);
      rafId.current = requestAnimationFrame(animate);
    };

    // Try absolute orientation first (Android)
    if ("ondeviceorientationabsolute" in window) {
      startListening("deviceorientationabsolute");
    } else if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      // iOS permission gate
      (DeviceOrientationEvent as any)
        .requestPermission()
        .then((state: string) => {
          if (state === "granted") {
            startListening("deviceorientation");
          } else {
            setError(t("locationDenied"));
          }
        })
        .catch(() => setError(t("locationDenied")));
    } else {
      startListening("deviceorientation");
    }

    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
      window.removeEventListener("deviceorientation", handleOrientation as EventListener, true);
      cancelAnimationFrame(rafId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasConsent]);

  const heading = displayHeading;
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

        {/* Rotating compass face — no CSS transition, driven by rAF */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ transform: `rotate(${compassRotation}deg)`, willChange: "transform" }}
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

        {/* Qibla arrow — driven by rAF, no CSS transition */}
        <div
          className="absolute inset-0"
          style={{ transform: `rotate(${qiblaRotation}deg)`, willChange: "transform" }}
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
            <path
              d="M120 30 L132 110 L126 105 L126 210 L114 210 L114 105 L108 110 Z"
              fill="url(#arrowGrad)"
              filter="url(#arrowShadow)"
              opacity="0.9"
            />
            <path
              d="M120 30 L126 55 L120 48 L114 55 Z"
              fill="hsl(var(--accent))"
              opacity="1"
            />
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
