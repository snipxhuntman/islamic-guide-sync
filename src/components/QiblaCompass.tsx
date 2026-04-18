import React, { useRef, useState, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Compass, AlertTriangle, RefreshCw } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { useCompass } from "@/hooks/useCompass";
import type { AccuracyLevel } from "@/utils/headingFilter";

/* ── Static SVG parts — built once ───────────────────────────────────── */

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

/* ── Haptics — Capacitor native first, Vibration API fallback ────────── */

async function hapticLight() {
  try { await Haptics.impact({ style: ImpactStyle.Light }); }
  catch { navigator.vibrate?.(15); }
}
async function hapticMedium() {
  try { await Haptics.impact({ style: ImpactStyle.Medium }); }
  catch { navigator.vibrate?.(40); }
}

/* ── Accuracy badge ──────────────────────────────────────────────────── */

const accuracyStyles: Record<AccuracyLevel, string> = {
  high: "bg-primary/15 text-primary border-primary/30",
  medium: "bg-accent/15 text-accent border-accent/30",
  low: "bg-destructive/15 text-destructive border-destructive/30",
};

const AccuracyBadge: React.FC<{ level: AccuracyLevel }> = ({ level }) => {
  const { t } = useLanguage();
  const label =
    level === "high" ? t("accuracyHigh") : level === "medium" ? t("accuracyMedium") : t("accuracyLow");
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${accuracyStyles[level]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${
        level === "high" ? "bg-primary" : level === "medium" ? "bg-accent" : "bg-destructive"
      }`} />
      {t("accuracy")}: {label}
    </span>
  );
};

/* ── Main component ──────────────────────────────────────────────────── */

const QiblaCompass: React.FC = () => {
  const { t } = useLanguage();
  const [hasConsent, setHasConsent] = useState(false);
  const [error, setError] = useState("");

  const compassFaceRef = useRef<SVGSVGElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);
  const bearingTextRef = useRef<HTMLElement>(null);
  const cardinalRefs = useRef<(SVGTextElement | null)[]>([]);
  const interRefs = useRef<(SVGTextElement | null)[]>([]);

  const handleError = useCallback((key: string) => setError(t(key)), [t]);

  const state = useCompass({
    enabled: hasConsent && !error,
    compassFaceRef,
    arrowRef,
    bearingTextRef,
    cardinalRefs,
    interRefs,
    onLockedHaptic: hapticMedium,
    onTickHaptic: hapticLight,
    onError: handleError,
  });

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
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold text-foreground">{t("qiblaDirection")}</h3>
        <AccuracyBadge level={state.accuracy} />
      </div>

      <div className="relative w-60 h-60">
        <StaticRing />

        <svg
          ref={compassFaceRef}
          className="absolute inset-0 w-full h-full transition-transform duration-100 ease-out"
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

      {/* Bearing + true-north label */}
      <p className="text-xs text-muted-foreground text-center">
        {t("trueNorth")} · <span ref={bearingTextRef}>{state.qibla.toFixed(1)}°</span>
      </p>

      {/* Status hints — surfaced when relevant only */}
      {state.needsCalibration && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 w-full">
          <RefreshCw className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-xs text-destructive leading-snug">{t("calibrateHint")}</p>
        </div>
      )}
      {!state.needsCalibration && state.interference && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-accent/10 border border-accent/30 w-full">
          <AlertTriangle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
          <p className="text-xs text-accent leading-snug">{t("interferenceWarning")}</p>
        </div>
      )}
      {!state.needsCalibration && !state.interference && state.accuracy !== "high" && (
        <p className="text-xs text-muted-foreground italic">{t("holdStill")}</p>
      )}
    </div>
  );
};

export default QiblaCompass;
