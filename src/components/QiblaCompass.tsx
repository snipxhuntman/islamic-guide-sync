import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";

// Makkah coordinates (Kaaba)
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

/** Calculate Qibla bearing from user's GPS position using the forward azimuth formula */
function calculateQiblaBearing(lat: number, lng: number): number {
  const φ1 = (lat * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δλ = ((KAABA_LNG - lng) * Math.PI) / 180;
  const x = Math.sin(Δλ);
  const y = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);
  let bearing = (Math.atan2(x, y) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/** Shortest-path angular lerp */
function lerpAngle(from: number, to: number, t: number): number {
  let diff = ((to - from + 540) % 360) - 180;
  return (from + diff * t + 360) % 360;
}

/** Signed shortest angular difference (-180 to 180) */
function angleDiff(a: number, b: number): number {
  let d = ((b - a + 540) % 360) - 180;
  return d;
}

/** Haptic helpers — Capacitor native first, Vibration API fallback */
async function hapticLight() {
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    navigator.vibrate?.(15);
  }
}

async function hapticMedium() {
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    navigator.vibrate?.(40);
  }
}

/* Static SVG parts — memoised once */
const ticks = Array.from({ length: 72 }, (_, i) => {
  const angle = i * 5;
  const rad = (angle - 90) * (Math.PI / 180);
  const isMajor = angle % 90 === 0;
  const isMedium = angle % 30 === 0;
  const innerR = isMajor ? 85 : isMedium ? 90 : 95;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  return (
    <line
      key={i}
      x1={120 + innerR * cos} y1={120 + innerR * sin}
      x2={120 + 105 * cos} y2={120 + 105 * sin}
      stroke={isMajor ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground) / 0.4)"}
      strokeWidth={isMajor ? 2.5 : isMedium ? 1.5 : 0.8}
    />
  );
});

const cardinals = [
  { label: "N", angle: 0, color: "hsl(0, 70%, 50%)" },
  { label: "E", angle: 90, color: "hsl(var(--foreground))" },
  { label: "S", angle: 180, color: "hsl(var(--foreground))" },
  { label: "W", angle: 270, color: "hsl(var(--foreground))" },
];
const intercardinals = [
  { label: "NE", angle: 45 }, { label: "SE", angle: 135 },
  { label: "SW", angle: 225 }, { label: "NW", angle: 315 },
];

const StaticRing = React.memo(() => (
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
));
StaticRing.displayName = "StaticRing";

const ArrowSvg = React.memo(() => (
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
    <path d="M120 30 L132 110 L126 105 L126 210 L114 210 L114 105 L108 110 Z" fill="url(#arrowGrad)" filter="url(#arrowShadow)" opacity="0.9" />
    <path d="M120 30 L126 55 L120 48 L114 55 Z" fill="hsl(var(--accent))" />
    <rect x="115" y="35" width="10" height="10" rx="1" fill="hsl(var(--accent-foreground))" opacity="0.7" />
  </svg>
));
ArrowSvg.displayName = "ArrowSvg";

const QiblaCompass: React.FC = () => {
  const { t } = useLanguage();
  const [hasConsent, setHasConsent] = useState(false);
  const [error, setError] = useState("");

  // Direct DOM refs
  const compassFaceRef = useRef<SVGSVGElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const bearingTextRef = useRef<HTMLParagraphElement>(null);
  const cardinalRefs = useRef<(SVGTextElement | null)[]>([]);
  const interRefs = useRef<(SVGTextElement | null)[]>([]);

  const rawHeading = useRef<number>(0);
  const smoothH = useRef<number>(0);
  const hasReading = useRef(false);
  const rafId = useRef(0);
  const qiblaBearing = useRef<number>(136.5); // fallback for Leipzig
  const lastHapticTime = useRef(0);
  const lastLockedVibTime = useRef(0);
  const geoWatchId = useRef<number | null>(null);

  // Heading sensor buffer for averaging (reduces noise)
  const headingBuffer = useRef<number[]>([]);
  const BUFFER_SIZE = 5;

  /** Push a new heading sample and return circular mean */
  const pushHeading = useCallback((h: number) => {
    const buf = headingBuffer.current;
    buf.push(h);
    if (buf.length > BUFFER_SIZE) buf.shift();
    // Circular mean via sin/cos averaging
    let sinSum = 0, cosSum = 0;
    for (const v of buf) {
      const r = (v * Math.PI) / 180;
      sinSum += Math.sin(r);
      cosSum += Math.cos(r);
    }
    return ((Math.atan2(sinSum, cosSum) * 180) / Math.PI + 360) % 360;
  }, []);

  const animate = useCallback(() => {
    if (hasReading.current) {
      smoothH.current = lerpAngle(smoothH.current, rawHeading.current, 0.12);
      const h = smoothH.current;
      const qb = qiblaBearing.current;

      // Direct DOM writes
      if (compassFaceRef.current) {
        compassFaceRef.current.style.transform = `rotate(${-h}deg)`;
      }
      if (arrowRef.current) {
        arrowRef.current.style.transform = `rotate(${qb - h}deg)`;
      }
      cardinalRefs.current.forEach((el) => {
        if (el) el.style.transform = `rotate(${h}deg)`;
      });
      interRefs.current.forEach((el) => {
        if (el) el.style.transform = `rotate(${h}deg)`;
      });
      // Update bearing text
      if (bearingTextRef.current) {
        bearingTextRef.current.textContent = `${qb.toFixed(1)}°`;
      }

      // Haptic feedback
      const diff = Math.abs(angleDiff(h, qb));
      const now = performance.now();

      if (diff <= 2) {
        // Locked on — one stronger vibration, max once per 2s
        if (now - lastLockedVibTime.current > 2000) {
          vibrate(40);
          lastLockedVibTime.current = now;
        }
      } else if (diff <= 20) {
        // Approaching — small ticks, interval decreases as we get closer
        // At 20° → every 400ms, at 3° → every 100ms
        const interval = 100 + ((diff - 2) / 18) * 300;
        if (now - lastHapticTime.current > interval) {
          vibrate(15);
          lastHapticTime.current = now;
        }
      }
    }
    rafId.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!hasConsent) return;

    // Request high-accuracy GPS for precise Qibla bearing
    if ("geolocation" in navigator) {
      geoWatchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          qiblaBearing.current = calculateQiblaBearing(pos.coords.latitude, pos.coords.longitude);
        },
        () => { /* keep fallback bearing */ },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }

    const handleOrientation = (e: DeviceOrientationEvent) => {
      let heading: number | null = null;
      const ios = (e as any).webkitCompassHeading;
      if (typeof ios === "number" && !isNaN(ios)) {
        heading = ios;
      } else if (e.alpha !== null) {
        heading = (360 - e.alpha) % 360;
      }
      if (heading !== null) {
        rawHeading.current = pushHeading(heading);
        if (!hasReading.current) {
          smoothH.current = rawHeading.current;
          hasReading.current = true;
        }
      }
    };

    const start = (evt: string) => {
      window.addEventListener(evt, handleOrientation as EventListener, true);
      rafId.current = requestAnimationFrame(animate);
    };

    if ("ondeviceorientationabsolute" in window) {
      start("deviceorientationabsolute");
    } else if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      (DeviceOrientationEvent as any).requestPermission()
        .then((s: string) => { if (s === "granted") start("deviceorientation"); else setError(t("locationDenied")); })
        .catch(() => setError(t("locationDenied")));
    } else {
      start("deviceorientation");
    }

    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
      window.removeEventListener("deviceorientation", handleOrientation as EventListener, true);
      cancelAnimationFrame(rafId.current);
      if (geoWatchId.current !== null) {
        navigator.geolocation.clearWatch(geoWatchId.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasConsent]);

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
        <StaticRing />

        <svg
          ref={compassFaceRef}
          className="absolute inset-0 w-full h-full"
          style={{ willChange: "transform" }}
          viewBox="0 0 240 240"
        >
          {ticks}
          {cardinals.map(({ label, angle, color }, idx) => {
            const rad = (angle - 90) * (Math.PI / 180);
            const x = 120 + 74 * Math.cos(rad);
            const y = 120 + 74 * Math.sin(rad);
            return (
              <text
                key={label}
                ref={(el) => { cardinalRefs.current[idx] = el; }}
                x={x} y={y}
                textAnchor="middle" dominantBaseline="central"
                fill={color} fontSize="14" fontWeight="700"
                style={{ transformOrigin: `${x}px ${y}px`, willChange: "transform" }}
              >
                {label}
              </text>
            );
          })}
          {intercardinals.map(({ label, angle }, idx) => {
            const rad = (angle - 90) * (Math.PI / 180);
            const x = 120 + 74 * Math.cos(rad);
            const y = 120 + 74 * Math.sin(rad);
            return (
              <text
                key={label}
                ref={(el) => { interRefs.current[idx] = el; }}
                x={x} y={y}
                textAnchor="middle" dominantBaseline="central"
                fill="hsl(var(--muted-foreground))" fontSize="9" fontWeight="500"
                style={{ transformOrigin: `${x}px ${y}px`, willChange: "transform" }}
              >
                {label}
              </text>
            );
          })}
        </svg>

        <div ref={arrowRef} className="absolute inset-0" style={{ willChange: "transform" }}>
          <ArrowSvg />
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-mosque-gold-dark shadow-lg border-2 border-card" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("qiblaDesc")} · <span ref={bearingTextRef}>{qiblaBearing.current.toFixed(1)}°</span>
      </p>
    </div>
  );
};

export default QiblaCompass;
