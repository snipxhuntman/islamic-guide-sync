import { useEffect, useRef, useState } from "react";
import { qiblaBearing, magneticDeclination } from "@/utils/geomagnetic";
import { HeadingFilter, accuracyLevel, type AccuracyLevel } from "@/utils/headingFilter";

export interface CompassState {
  /** Smoothed device heading (true north, 0–360°). */
  heading: number;
  /** Bearing from current GPS position toward the Kaaba (true north, 0–360°). */
  qibla: number;
  /** Filter uncertainty bucket. */
  accuracy: AccuracyLevel;
  /** Raw OS-reported sensor accuracy if available (degrees). */
  sensorAccuracy: number | null;
  /** Magnetic declination applied (degrees east of true north). */
  declination: number;
  /** True when the device is held still — readings are most reliable. */
  stationary: boolean;
  /** Heuristic flag for nearby magnetic interference. */
  interference: boolean;
  /** True when sensors look uncalibrated and the user should do a figure-8. */
  needsCalibration: boolean;
}

interface CompassRefs {
  compassFaceRef: React.RefObject<SVGSVGElement>;
  arrowRef: React.RefObject<HTMLDivElement>;
  bearingTextRef: React.RefObject<HTMLElement>;
  cardinalRefs: React.MutableRefObject<(SVGTextElement | null)[]>;
  interRefs: React.MutableRefObject<(SVGTextElement | null)[]>;
}

interface UseCompassOptions extends CompassRefs {
  enabled: boolean;
  onLockedHaptic?: () => void;
  onTickHaptic?: () => void;
  onError?: (msg: string) => void;
}

/**
 * Custom hook driving the Qibla compass.
 *
 * Sensor pipeline:
 *   raw DeviceOrientation → HeadingFilter (circular mean + Kalman) → +declination → true heading
 *
 * Note: browser DeviceOrientation reports MAGNETIC heading on most platforms.
 * iOS Safari exposes `webkitCompassHeading` (already true north on most devices,
 * but we still apply small declination correction defensively).
 * Android Chrome's `deviceorientationabsolute` is magnetic — declination
 * correction is essential for ±2–3° Qibla accuracy.
 */
export function useCompass({
  enabled,
  compassFaceRef,
  arrowRef,
  bearingTextRef,
  cardinalRefs,
  interRefs,
  onLockedHaptic,
  onTickHaptic,
  onError,
}: UseCompassOptions): CompassState {
  // Live state surfaced to React (low-frequency: status only, not every frame).
  const [state, setState] = useState<CompassState>({
    heading: 0,
    qibla: 134.09, // Leipzig fallback
    accuracy: "low",
    sensorAccuracy: null,
    declination: 0,
    stationary: false,
    interference: false,
    needsCalibration: false,
  });

  // Per-frame mutable refs — we write transforms via DOM, not React state.
  const filter = useRef(new HeadingFilter());
  const trueHeadingRef = useRef(0);
  const qiblaRef = useRef(134.09);
  const declinationRef = useRef(0);
  const isIosTrueHeading = useRef(false);
  const sensorAccuracyRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const lastLockedRef = useRef(0);
  const rafRef = useRef(0);
  const geoWatchId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // ── 1. GPS → Qibla bearing + magnetic declination ────────────────
    if ("geolocation" in navigator) {
      geoWatchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          qiblaRef.current = qiblaBearing(latitude, longitude);
          declinationRef.current = magneticDeclination(latitude, longitude);
        },
        () => {
          qiblaRef.current = 134.09;
          declinationRef.current = 0;
        },
        { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
      );
    }

    // ── 2. Device orientation → filtered true heading ────────────────
    const handleOrientation = (e: DeviceOrientationEvent) => {
      let magneticHeading: number | null = null;
      const ios = (e as DeviceOrientationEvent & { webkitCompassHeading?: number })
        .webkitCompassHeading;
      const iosAcc = (e as DeviceOrientationEvent & { webkitCompassAccuracy?: number })
        .webkitCompassAccuracy;

      if (typeof ios === "number" && !Number.isNaN(ios)) {
        // iOS already gives us heading clockwise from MAGNETIC north;
        // some iOS versions return true north when location services are on.
        magneticHeading = ios;
        isIosTrueHeading.current = true;
        // webkitCompassAccuracy: -1 = invalid, otherwise degrees.
        sensorAccuracyRef.current = typeof iosAcc === "number" && iosAcc >= 0 ? iosAcc : null;
      } else if (e.alpha !== null) {
        // Android: alpha is rotation around Z, counter-clockwise from device's reference.
        // Heading clockwise from north = (360 - alpha) % 360.
        magneticHeading = (360 - e.alpha) % 360;
        sensorAccuracyRef.current = null;
      }

      if (magneticHeading === null) return;

      // Apply declination ONLY when the source is magnetic.
      // iOS webkitCompassHeading is documented as true north when CL is active,
      // so we skip the correction there.
      const declinationCorrection = isIosTrueHeading.current ? 0 : declinationRef.current;
      const trueRaw = (magneticHeading + declinationCorrection + 360) % 360;

      // Measurement variance estimate: trust iOS reported accuracy when present.
      const measVar =
        sensorAccuracyRef.current !== null
          ? Math.max(1, sensorAccuracyRef.current ** 2)
          : 4;

      trueHeadingRef.current = filter.current.push(trueRaw, measVar);
    };

    // ── 3. Animation loop: DOM transforms + haptics ──────────────────
    const animate = () => {
      const h = trueHeadingRef.current;
      const qb = qiblaRef.current;

      if (compassFaceRef.current) {
        compassFaceRef.current.style.transform = `rotate(${-h}deg)`;
      }
      if (arrowRef.current) {
        arrowRef.current.style.transform = `rotate(${qb - h}deg)`;
      }
      const cardRot = `rotate(${h}deg)`;
      cardinalRefs.current.forEach((el) => {
        if (el) el.style.transform = cardRot;
      });
      interRefs.current.forEach((el) => {
        if (el) el.style.transform = cardRot;
      });
      if (bearingTextRef.current) {
        bearingTextRef.current.textContent = `${qb.toFixed(1)}°`;
      }

      // Haptics — only fire when filter is reasonably confident; otherwise
      // we'd buzz in response to noise.
      const uncertainty = filter.current.uncertainty();
      if (uncertainty < 10) {
        const diff = Math.abs(((qb - h + 540) % 360) - 180);
        const now = performance.now();
        if (diff <= 2) {
          if (now - lastLockedRef.current > 2000) {
            onLockedHaptic?.();
            lastLockedRef.current = now;
          }
        } else if (diff <= 20) {
          // Tighter intervals as we approach: 20° → 400ms, 3° → 100ms.
          const interval = 100 + ((diff - 2) / 18) * 300;
          if (now - lastTickRef.current > interval) {
            onTickHaptic?.();
            lastTickRef.current = now;
          }
        }
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    // ── 4. Status sampler: pushes status (accuracy, calibration, …) at 4Hz ─
    const statusTimer = window.setInterval(() => {
      const uncertainty = filter.current.uncertainty();
      const sensorAcc = sensorAccuracyRef.current;
      // Calibration heuristic: iOS reports webkitCompassAccuracy > 25° when uncalibrated;
      // otherwise we infer from filter uncertainty after enough samples.
      const needsCal =
        (sensorAcc !== null && sensorAcc > 25) || uncertainty > 15;
      // Interference heuristic: iOS reports accuracy 15–25° in metallic environments;
      // on Android we fall back to filter uncertainty being persistently medium-high.
      const interference =
        (sensorAcc !== null && sensorAcc > 15 && sensorAcc <= 25) ||
        (sensorAcc === null && uncertainty > 8 && uncertainty <= 15);

      setState({
        heading: trueHeadingRef.current,
        qibla: qiblaRef.current,
        accuracy: accuracyLevel(uncertainty),
        sensorAccuracy: sensorAcc,
        declination: declinationRef.current,
        stationary: filter.current.isStationary(),
        interference,
        needsCalibration: needsCal,
      });
    }, 250);

    // ── 5. Wire it up — handle iOS permission flow ───────────────────
    const start = (evt: string) => {
      window.addEventListener(evt, handleOrientation as EventListener, true);
      rafRef.current = requestAnimationFrame(animate);
    };

    if ("ondeviceorientationabsolute" in window) {
      start("deviceorientationabsolute");
    } else if (
      typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> })
        .requestPermission === "function"
    ) {
      (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
        .then((s) => {
          if (s === "granted") start("deviceorientation");
          else onError?.("locationDenied");
        })
        .catch(() => onError?.("locationDenied"));
    } else {
      start("deviceorientation");
    }

    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation as EventListener, true);
      window.removeEventListener("deviceorientation", handleOrientation as EventListener, true);
      cancelAnimationFrame(rafRef.current);
      clearInterval(statusTimer);
      if (geoWatchId.current !== null) {
        navigator.geolocation.clearWatch(geoWatchId.current);
      }
      filter.current.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return state;
}
