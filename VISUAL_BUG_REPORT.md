# Visual Bug Report - Hotel Grid Widgets & Blog Layout

## Date: 2025-01-XX
## Page: https://tellurideskihotels.com/blog/hotel-reviews/telluride-hotels-accommodation-guide/

---

## Bug #1: Rating Badge Positioning Issue

### Description
The rating badge (green overlay with score like "9.0", "9.2", "10.0") is positioned such that it appears half inside and half outside the image border. The badge should be fully nested within the image boundaries with proper padding from the top-right corner.

### Affected Components
- All hotel cards in grid widgets throughout the blog post
- Components: `HotelCard.tsx`

### Current Implementation
- Badge positioned with `absolute top-3 right-3` (12px padding)
- Located in image container with `overflow-hidden`
- Badge appears to overlap the card border

### Expected Behavior
- Badge should be fully contained within the image bounds
- Proper padding (16px recommended) from top-right corner
- No overlap with card borders

### Location in Code
`src/components/lodging/HotelCard.tsx` line 108

---

## Bug #2: Excessive Sidebar Padding

### Description
There is unnecessarily large padding/gap between the blog post body content and the sidebar widgets (Table of Contents, Newsletter Signup, Popular Articles). The sidebar appears too far from the main content, creating excessive white space.

### Affected Components
- Blog post layout
- Sidebar widgets (TableOfContents, Newsletter, Popular Articles)

### Current Implementation
- Grid layout: `grid gap-8 lg:grid-cols-[1fr_280px]`
- Gap of `gap-8` = 32px (2rem) between columns
- Main content: `max-w-[720px]`
- Sidebar: `280px` width

### Expected Behavior
- Reduced gap between main content and sidebar (16-24px recommended)
- Sidebar should feel more integrated with content
- Better visual balance

### Location in Code
`src/layouts/BlogLayout.astro` line 111

---

## Screenshots Captured
1. `hotel_grid_widget_1.png` - Top Downtown Boutique Hotels section
2. `hotel_grid_widget_2.png` - Family-Friendly Condo-Hotels section
3. `hotel_grid_widget_3.png` - Budget-Friendly Downtown Properties section
4. `hotel_grid_widget_4.png` - Browse All Telluride Properties section

---

## Proposed Fixes

### Fix #1: Rating Badge Positioning
- Change `top-3 right-3` to `top-4 right-4` (increase padding from 12px to 16px)
- Ensure badge is fully contained within image bounds
- Verify badge doesn't overlap card borders

### Fix #2: Sidebar Padding
- Reduce grid gap from `gap-8` (32px) to `gap-6` (24px) or `gap-4` (16px)
- Test visual balance and adjust as needed

---

## Priority
- High - Both issues affect visual polish and user experience

