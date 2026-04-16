

## Plan: Add AI Prompt Display Card to Admin Prayer Times

### Overview
Add a collapsible card in the Admin Prayer Times page that displays a predefined AI prompt (togglable between English and German). The admin can copy this prompt to use with an AI tool to convert a PDF prayer calendar into the required CSV format.

### Changes

**1. Update `src/pages/admin/AdminPrayerTimes.tsx`**
- Add a new `Card` component below the existing buttons and above the Iqama Settings card
- Include a language toggle (EN/DE) using a simple button group or tabs
- Display the appropriate prompt text based on the selected language
- Add a "Copy to clipboard" button that copies the prompt text and shows a toast confirmation
- The card title: "AI Prompt — PDF to CSV" (collapsible via Collapsible or Accordion)

**2. Prompt content**
- English and German prompts stored as constants within the component
- Each prompt includes the full instruction text as provided by the user

### UI Design
- Collapsed by default to keep the page clean
- When expanded: language toggle at top, prompt text in a styled `<pre>` or muted text block, copy button
- Uses existing UI components (Card, Button, Tabs or toggle)

### No other files affected
- No translation file changes needed (admin is EN/DE only, and this is static display content)

