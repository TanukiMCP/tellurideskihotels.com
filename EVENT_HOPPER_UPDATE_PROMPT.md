# Telluride Events Hopper Update Prompt

## Objective
Update the Events Hopper in `src/components/info/EventsWidget.tsx` with current upcoming events from the official Telluride events calendar.

## How the System Works
- The Events Hopper displays the next 4 upcoming events on the landing page
- Events are automatically filtered by date - past events disappear automatically
- Each event links directly to its detail page on the official Telluride site
- The widget is located in the "Plan Your Visit" section alongside Gondola and Air Quality widgets

## Update Process

### 1. Get Current Events
Navigate to the official Telluride events calendar:
```
https://www.telluride.com/festivals-events/events/
```

Use browser tools to view the page and extract upcoming events.

### 2. Update the Events Array
Edit `src/components/info/EventsWidget.tsx` and update the `TELLURIDE_EVENTS` array with new events.

Each event object requires:
- `id`: Unique identifier (string)
- `name`: Event name (string)
- `date`: Event date in YYYY-MM-DD format (string)
- `type`: One of: 'festival' | 'concert' | 'sports' | 'art' | 'community'
- `description`: Brief description (string, ~80-100 chars)
- `url`: Full URL to event detail page on telluride.com (string)

### 3. Event URL Format
Event URLs follow this pattern:
```
https://www.telluride.com/event/[event-slug]/
```

Extract the exact URL from the "See Details" link on each event listing.

### 4. Best Practices
- Include 10-15 events to ensure the hopper stays populated
- Mix of event types (festivals, concerts, sports, community events)
- Include both near-term events (next few weeks/months) and major annual festivals
- Update the "Last updated" comment at the top of the array
- Keep descriptions concise and engaging

### 5. Commit and Push
After updating, always commit and push changes:
```bash
git add -A && git commit -m "Update events hopper with current Telluride events" && git push
```

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

