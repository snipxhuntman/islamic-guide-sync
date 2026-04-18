/**
 * Heading sensor fusion + filtering.
 *
 * Strategy:
 *  1. Circular-mean buffer over the last N raw samples (handles 359°↔0° wrap).
 *  2. 1-D Kalman-style filter on the buffered estimate. Process noise adapts
 *     to motion (higher when device is rotating, lower when stationary) so the
 *     reading both tracks fast turns and settles tightly when held still.
 *  3. Stationarity detector: if the spread of recent samples is small, we
 *     average aggressively (effectively a stationary average) to maximise
 *     repeatability — the requested ±2–3° target.
 */

const BUFFER_SIZE = 8;

export class HeadingFilter {
  private buf: number[] = [];
  private estimate = 0;
  private variance = 100; // start uncertain
  private initialised = false;

  /** Accept a raw heading sample (degrees) and a measurement noise estimate (variance, deg²). */
  push(rawDeg: number, measurementVariance = 4): number {
    // 1. Circular mean over the buffer to remove single-sample spikes.
    this.buf.push(rawDeg);
    if (this.buf.length > BUFFER_SIZE) this.buf.shift();
    const mean = circularMean(this.buf);

    if (!this.initialised) {
      this.estimate = mean;
      this.variance = measurementVariance;
      this.initialised = true;
      return this.estimate;
    }

    // 2. Adapt process noise to motion. Spread = how dispersed buffer is.
    const spread = circularSpread(this.buf, mean);
    const processNoise = Math.max(0.05, Math.min(8, spread * 0.6));

    // 3. Kalman update on the shortest-path delta.
    this.variance += processNoise;
    const k = this.variance / (this.variance + measurementVariance);
    const delta = ((mean - this.estimate + 540) % 360) - 180;
    this.estimate = (this.estimate + k * delta + 360) % 360;
    this.variance = (1 - k) * this.variance;

    return this.estimate;
  }

  /** Current 1-σ uncertainty in degrees. Lower = more confident. */
  uncertainty(): number {
    return Math.sqrt(this.variance);
  }

  /** True if recent samples are tightly clustered — device likely held still. */
  isStationary(): boolean {
    if (this.buf.length < BUFFER_SIZE) return false;
    const mean = circularMean(this.buf);
    return circularSpread(this.buf, mean) < 1.5;
  }

  reset(): void {
    this.buf = [];
    this.variance = 100;
    this.initialised = false;
  }
}

/** Mean of angles using sin/cos averaging — correctly handles 359°/0° wrap. */
function circularMean(samples: number[]): number {
  let s = 0;
  let c = 0;
  for (const v of samples) {
    const r = (v * Math.PI) / 180;
    s += Math.sin(r);
    c += Math.cos(r);
  }
  return ((Math.atan2(s, c) * 180) / Math.PI + 360) % 360;
}

/** Mean absolute angular deviation from a centre — proxy for "noise level". */
function circularSpread(samples: number[], centre: number): number {
  if (!samples.length) return 0;
  let total = 0;
  for (const v of samples) {
    total += Math.abs(((v - centre + 540) % 360) - 180);
  }
  return total / samples.length;
}

/** Map filter uncertainty to a coarse confidence bucket for UI. */
export type AccuracyLevel = "high" | "medium" | "low";

export function accuracyLevel(uncertaintyDeg: number): AccuracyLevel {
  if (uncertaintyDeg <= 3) return "high";
  if (uncertaintyDeg <= 8) return "medium";
  return "low";
}
