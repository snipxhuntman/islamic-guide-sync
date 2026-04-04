
# Al-Rahman Mosque Prayer App

A mobile-first, multi-language (EN/DE/AR) prayer app inspired by the PDF wireframes and the leipziger-moschee.de design. Uses local JSON data and localStorage — no backend. Admin panel deferred to later.

## Design System
- **Colors**: Dark teal/green (`#0d4a42`, `#1a6b5a`) as primary, golden amber (`#e8a838`, `#f5b731`) as accent — matching the mosque website
- **Typography**: Clean sans-serif, Arabic font support (Noto Sans Arabic)
- **Layout**: Mobile-first (max-width ~430px centered), bottom tab navigation with 5 tabs
- **RTL support**: Full RTL layout when Arabic is selected, including flipped toggle switches

## Bottom Navigation (5 tabs)
Home (🏠) · Prayer Times (🕐) · Messages (💬) · Classes (📋) · Settings (⚙️)

---

## Page 1: Homepage
- **Banner**: "Alrahman Moschee" — click to flip (CSS 3D flip) revealing two icons: website link + Google Maps link
- **Dual calendar display**: Hijri date + Gregorian date at top
- **Countdown timer**: Circular/semi-circular dial showing HH:MM:SS until next prayer, with prayer name label (e.g. "Zeit bis Dhuhr")
- **Message carousel**: Small auto-sliding cards showing broadcast messages with dot indicators
- **Social icons**: 5 icons (YouTube, Instagram, Facebook, Telegram, TikTok) with hyperlinks, visible after scrolling down

## Page 2: Prayer Times (Gebetszeiten)
- **Flipping banner** (same as homepage)
- **Date navigator**: Left/right arrows to change day; shows both Hijri and Gregorian dates; "Zeit" label visible only for today
- **Prayer table**: 6 rows (Fajr, Shuruk, Dhuhr, Asr, Maghrib, Isha) with 3 columns: Prayer name, Time, Iqama
- **Current prayer highlighting**: Golden/amber highlight on current prayer row — only shown for today's date
- **No past dates**: Cannot navigate before today
- **Qibla compass** (below prayer table after scroll):
  - "Allow Location" button shown first — GPS only requested after user consent
  - Full rotating compass UI with needle pointing from Leipzig toward Makkah (~136.5° bearing)
  - No raw location data saved

## Page 3: Messages (Nachrichten)
- **Telegram-style layout**: Date headers on top, message bubbles with timestamps
- **Single announcer** — one-way broadcast, no reply/reactions
- **Sample messages preloaded** from JSON

## Page 4: Classes (Unterrichte)
- **Class cards**: Each card shows topic name, time (Maghrib+20 – Isha), day, and date
- **Social media icons** per class (YouTube, Instagram, Facebook, Telegram, TikTok) with hyperlinks
- **Cancelled classes**: Strikethrough title, red "Heute kein Unterricht" label, distinct background
- **Notification badge** for cancellations

## Page 5: Settings (Einstellungen)
- **Language selector**: German / English / Arabic — selecting Arabic switches entire UI to RTL and flips toggle directions
- **Notification settings** (UI toggles, stored in localStorage):
  - Master toggle: all notifications on/off
  - Prayer notifications toggle + ringtone picker (Adhan 1, Adhan 2, Ring)
  - Individual alert time selectors per prayer (minutes before adhan) including Shuruk
  - Broadcast notifications toggle
  - Event notifications toggle
- **Website link**: Opens leipziger-moschee.de
- **Privacy Policy**: Separate sub-page with privacy text

## Data & i18n
- Prayer times stored as JSON (sample CSV-like data for ~30 days)
- Hijri conversion via a lightweight JS library (hijri-converter logic)
- All UI strings in a translations object keyed by `en`, `de`, `ar`
- Language preference persisted in localStorage

## Key Interactions
- CSS 3D flip animation on banners across pages
- Smooth countdown timer updating every second
- Date navigation with arrow buttons (forward/back, clamped to today minimum)
- Auto-sliding message carousel with dots
- Qibla compass with device orientation API (with permission gate)
