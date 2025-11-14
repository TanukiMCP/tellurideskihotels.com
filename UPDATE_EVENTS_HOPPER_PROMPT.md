# Telluride Events Hopper Update Prompt

## Overview
The Events Hopper is a dynamic widget on the landing page that automatically displays the next 4 upcoming Telluride events. Past events are automatically filtered out based on the current date.

## Location
- **File**: `src/components/info/EventsWidget.tsx`
- **Array**: `TELLURIDE_EVENTS`
- **Widget**: Displays on homepage in "Plan Your Visit" section

## How It Works
1. Events are stored in the `TELLURIDE_EVENTS` array
2. Widget automatically filters events where `date >= today`
3. Sorts by date ascending
4. Displays the next 4 upcoming events
5. Links to official Telluride events calendar for full list

## Update Instructions

### Step 1: Get Current Events
Navigate to the official Telluride events page:
```
https://www.telluride.com/festivals-events/events/
```

Use browser tools to capture the current events list (showing 88+ events).

### Step 2: Update the Hopper
Add new events to the `TELLURIDE_EVENTS` array in `src/components/info/EventsWidget.tsx`.

**Event Format:**
```typescript
{
  id: 'unique-number',
  name: 'Event Name',
  date: 'YYYY-MM-DD',
  type: 'festival' | 'concert' | 'sports' | 'art' | 'community',
  description: 'Brief description (keep under 100 characters)'
}
```

### Step 3: Event Selection Strategy
- Include a mix of near-term events (next 1-3 months)
- Include major annual festivals (Bluegrass, Blues & Brews, etc.)
- Include winter season events (ski opening, holiday celebrations)
- Include community events (Turkey Trot, Noel Night, etc.)
- Aim for 15-20 events total in the hopper

### Step 4: Commit Changes
After updating the events array:
```bash
git add -A
git commit -m "Update events hopper with current Telluride events - [Month Year]"
git push
```

## Event Types
- `festival` - Major festivals, holiday celebrations
- `concert` - Music performances, shows
- `sports` - Ski events, races, outdoor activities
- `art` - Theater, film screenings, art shows
- `community` - Local gatherings, free events

## Notes
- Past events are automatically removed from display (no manual cleanup needed)
- Widget always shows exactly 4 events (or fewer if less than 4 upcoming)
- Update the "Last updated" comment in the file when making changes
- Keep descriptions concise and engaging
- Dates must be in YYYY-MM-DD format for proper sorting

