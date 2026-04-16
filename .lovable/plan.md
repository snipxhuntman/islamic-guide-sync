

## Plan: CSV-Based Hijri Date Mapping

### Overview
Replace the algorithmic Hijri date calculation with admin-provided Hijri dates from the CSV file. Each row in the CSV will include a `hijri` column (e.g., `1 Ramadan 1447`), and the app will use this mapping everywhere Hijri dates are displayed.

### Changes

**1. Update `PrayerDay` interface** (`src/data/prayerTimes.ts`)
- Add optional `hijri` field (string, e.g. `"1 Ramadan 1447"`) to the `PrayerDay` interface

**2. Update CSV parser** (`src/pages/admin/AdminPrayerTimes.tsx`)
- Add `hijri` to the required CSV columns
- Map the `hijri` column into `PrayerDay` objects
- Update sample CSV to include the `hijri` column
- Remove the Hijri Calendar Correction card (no longer needed since admin controls dates directly)

**3. Update `formatHijriDate` to use CSV data** (`src/utils/hijri.ts`)
- New function `getHijriFromData(dateStr: string): string | null` that looks up the Hijri date from the uploaded prayer times data for a given Gregorian date
- Modify `formatHijriDate` to first check CSV data; fall back to algorithmic calculation only if no CSV entry exists
- Support Arabic month name substitution when `lang === "ar"` by parsing the stored Hijri string

**4. Update all consumer pages** (`src/pages/PrayerTimes.tsx`, `src/pages/Index.tsx`)
- Pass the date string to the updated `formatHijriDate` so it can look up CSV data — minimal change since the function signature stays the same

**5. Update admin table display** (`src/pages/admin/AdminPrayerTimes.tsx`)
- Add `Hijri` column to the preview table

**6. Update sample CSV format**
```
date,hijri,fajr,shuruk,dhuhr,asr,maghrib,isha
2026-04-04,6 Shawwal 1448,04:30,06:10,13:15,16:45,20:15,22:00
2026-04-05,7 Shawwal 1448,04:28,06:08,13:15,16:46,20:16,22:01
```

### Technical Notes
- The Hijri correction offset feature in admin will be removed since the CSV is now the source of truth
- The algorithmic `toHijri` / `jdToHijri` functions remain as fallback for dates not covered by CSV
- Month length (29 or 30 days) is implicitly handled — the admin simply lists the correct Hijri date for each Gregorian date

