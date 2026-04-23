

## Show tomorrow's Fajr after Isha

**What changes**

After Isha prayer time has passed today, the homepage's prayer-times grid will:
- Highlight Fajr using **tomorrow's** Fajr time (instead of today's Fajr time, which is already in the past)
- Show a small "tomorrow" label under the time so it's clear this is the upcoming day

The "Upcoming" badge above the tile remains the same. All other prayer tiles continue to show today's times.

The countdown timer below already correctly counts down to tomorrow's Fajr after Isha, so no changes there.

**Visual layout of the Fajr tile (after Isha only)**

```text
┌─────────────────┐
│   [UPCOMING]    │
│      Fajr       │
│      04:30      │
│    tomorrow     │   ← new small label
└─────────────────┘
```

**Technical details**

1. `src/pages/Index.tsx` — `HomePrayerTimes`:
   - Detect "after Isha" state: `getNextPrayer(prayers)` returns `null` when all of today's prayers have passed.
   - When in this state, fetch tomorrow's prayer times via `getLivePrayerTimesForDate(tomorrowStr)` and override the Fajr time displayed in the highlighted tile with tomorrow's Fajr.
   - Render a small `tomorrow` label under the time for the Fajr tile only when this override is active.
   - Keep the existing 30-second tick so the transition happens automatically when Isha rolls over.

2. `src/i18n/translations.ts` — add a `tomorrow` key:
   - EN: "tomorrow"
   - DE: "morgen"
   - AR: "غداً"

3. Edge cases:
   - If tomorrow's prayer times aren't available (end of uploaded calendar), fall back to today's Fajr time without the "tomorrow" label.
   - Numeric formatting continues to use the existing `formatTime` helper (respects 12h/24h setting and Arabic Western numerals).

