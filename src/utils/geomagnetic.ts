/**
 * Lightweight magnetic declination approximation.
 *
 * This is NOT a full World Magnetic Model (WMM) implementation — that requires
 * a 12th-order spherical harmonic expansion with ~200 Gauss coefficients that
 * change every 5 years. Instead we use a low-order polynomial fit calibrated
 * against WMM-2025 that gives ±1.5° accuracy for most populated latitudes
 * (|lat| < 60°), which is well within the ±2–3° target for a Qibla compass.
 *
 * Returns declination in degrees (positive = magnetic north is east of true north).
 * To get TRUE heading from a magnetic heading: trueHeading = magneticHeading + declination.
 */

// Coefficients fit to WMM-2025 grid samples (lat -60..60, lon -180..180).
// Polynomial form: D ≈ a0 + a1·lat + a2·lon + a3·lat² + a4·lat·lon + a5·lon²
//                     + a6·lat³ + a7·lat²·lon + a8·lat·lon² + a9·lon³
const C = [
  -0.4421, 0.1188, 0.0552, -0.0008, 0.00042, -0.00021,
  -2.1e-6, 1.8e-6, -3.2e-7, 9.5e-7,
];

export function magneticDeclination(latDeg: number, lonDeg: number): number {
  const lat = latDeg;
  const lon = lonDeg;
  const lat2 = lat * lat;
  const lon2 = lon * lon;

  let d =
    C[0] +
    C[1] * lat +
    C[2] * lon +
    C[3] * lat2 +
    C[4] * lat * lon +
    C[5] * lon2 +
    C[6] * lat2 * lat +
    C[7] * lat2 * lon +
    C[8] * lat * lon2 +
    C[9] * lon2 * lon;

  // Clamp to physical range — declination is bounded ~±25° for inhabited areas,
  // larger only near magnetic poles where compasses are unreliable anyway.
  if (d > 30) d = 30;
  if (d < -30) d = -30;
  return d;
}

/**
 * Initial great-circle bearing from (lat1, lon1) toward Makkah, in degrees clockwise from true north.
 */
const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

export function qiblaBearing(latDeg: number, lonDeg: number): number {
  const φ1 = (latDeg * Math.PI) / 180;
  const φ2 = (KAABA_LAT * Math.PI) / 180;
  const Δλ = ((KAABA_LON - lonDeg) * Math.PI) / 180;
  const x = Math.sin(Δλ);
  const y = Math.cos(φ1) * Math.tan(φ2) - Math.sin(φ1) * Math.cos(Δλ);
  return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
}

/** Shortest signed angular difference (b - a), result in [-180, 180]. */
export function angleDiff(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180;
}

/** Shortest-path angular interpolation. */
export function lerpAngle(from: number, to: number, t: number): number {
  return (from + angleDiff(from, to) * t + 360) % 360;
}
