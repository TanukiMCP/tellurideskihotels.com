# Telluride Events Hopper Update Prompt

## Objective
Update the Events Hopper in `src/components/info/EventsWidget.tsx` with current upcoming events from the official Telluride events calendar.

## How the System Works
- The Events Hopper displays the next 4 upcoming events on the landing page
- Events are automatically filtered by date - past events disappear automatically
- Each event links directly to its detail page on the official Telluride site
- The widget is located in the "Plan Your Visit" section alongside Gondola and Air Quality widgets

## Update Process

### 1. Get Current Events from Official Site
**CRITICAL:** Always use browser tools to navigate to the official Telluride events calendar:
```
https://www.telluride.com/festivals-events/events/
```

Use `mcp_cursor-browser-extension_browser_navigate` and `mcp_cursor-browser-extension_browser_snapshot` to view the actual page content.

### 2. Extract REAL Event URLs
**DO NOT make up or guess URLs.** Extract the exact URLs from the page:
- Look for "See Details" links in the browser snapshot
- URLs are in the format: `/event/[event-slug]/`
- Full URL: `https://www.telluride.com/event/[event-slug]/`
- Verify each URL exists on the actual page before adding it

### 3. Update the Events Array
Edit `src/components/info/EventsWidget.tsx` and update the `TELLURIDE_EVENTS` array.

**Each event object MUST include ALL fields:**
- `id`: Unique identifier (string, sequential numbers)
- `name`: Event name exactly as shown on official site (string)
- `date`: Event date in YYYY-MM-DD format (string)
- `type`: One of: 'festival' | 'concert' | 'sports' | 'art' | 'community'
- `description`: Brief description from official site (string, ~80-100 chars)
- `url`: **VERIFIED** full URL to event detail page (string)

### 4. Quality Control Checklist
Before committing, verify:
- ✅ Every event has a `url` field
- ✅ All URLs are real and extracted from the official site (not made up)
- ✅ Event names match the official site exactly
- ✅ Dates are in correct YYYY-MM-DD format
- ✅ Descriptions are concise and accurate
- ✅ Include 50-80 events to ensure long-term coverage
- ✅ Mix of event types (festivals, concerts, sports, art, community)
- ✅ Include both near-term and future major festivals
- ✅ Update the "Last updated" comment at the top of the array

### 5. Verify No Broken Links
**IMPORTANT:** Do not create broken links. Every URL must be verified from the actual page source.

### 6. Commit and Push
After updating and verifying all URLs, always commit and push changes:
```bash
git add -A && git commit -m "Update events hopper with current Telluride events" && git push
```

**NEVER commit without verifying all URLs are real and extracted from the official site.**

## Example Event Entry
```typescript
{
  id: '1',
  name: 'Telluride Bluegrass Festival',
  date: '2026-06-18',
  type: 'concert',
  description: 'Annual pilgrimage for Festivarians to celebrate bluegrass in the mountains',
  url: 'https://www.telluride.com/event/telluride-bluegrass-festival/',
}
```

## File Location
`src/components/info/EventsWidget.tsx` - Update the `TELLURIDE_EVENTS` constant array.

