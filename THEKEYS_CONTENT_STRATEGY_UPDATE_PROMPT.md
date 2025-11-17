# Content Strategy Update Prompt for TheKeys.com

## Your Mission

Review TheKeys.com's current content strategy and update it to match the conversion-focused, group planning approach we successfully implemented for TellurideSkiHotels.com. This involves:

1. **Reviewing existing content schedule and master prompt**
2. **Pivoting to high-intent, conversion-focused group planning articles**
3. **Building interactive planning tools/widgets for Florida Keys travel**
4. **Updating the content schedule with conversion-focused articles**
5. **Updating the master article generation prompt with tool usage instructions**

---

## Context: What We Did for TellurideSkiHotels.com

We successfully pivoted from generic travel content to **high-intent, conversion-focused group planning guides** that:

- Target specific group types and sizes (families, friends, couples, solo, corporate, events)
- Include interactive cost breakdown calculators per person
- Provide smart planning tips for expensive destinations
- Integrate interactive UI widgets for calculations and itinerary building
- Link directly to LiteAPI listings for real-time booking
- Include Viator affiliate widgets for activities
- Focus on conversion through engagement (longer time on site, interactive tools, clear CTAs)

**Key Results:**
- 20 conversion-focused articles created (Days 6, 14-32)
- 8 interactive planning tools built and integrated
- Content schedule restructured to prioritize group planning
- Master prompt updated with comprehensive tool usage instructions

---

## Your Tasks

### Task 1: Review Current State

**Review these files (if they exist):**
- `CONTENT_PUBLISHING_SCHEDULE.md` (or similar)
- `MASTER_ARTICLE_GENERATION_PROMPT.md` (or similar)
- `SEO_KEYWORDS_MASTERLIST.md` (or similar)
- Any existing planning/component directories

**Understand:**
- Current content categories and article types
- Existing article generation workflow
- Current SEO keyword strategy
- What group planning content already exists (if any)

### Task 2: Build Interactive Planning Tools

**Create 8 planning tools adapted for Florida Keys travel:**

1. **GroupCostCalculator** - Calculate total trip cost and cost per person for Florida Keys trips (accommodations, activities, dining, transportation)
2. **HotelSplitCalculator** - Compare cost per person for hotels vs vacation rentals/condos for groups
3. **BudgetToItineraryPlanner** - Allocate budget across lodging, activities, dining, and suggest hotels/itineraries
4. **SeasonComparison** - Compare costs, crowds, and conditions between peak season (winter) vs off-season (summer) in the Keys
5. **GroupTypeRecommender** - Quiz-style recommender for families, couples, friends, solo, corporate trips to the Keys
6. **CostPerPersonRanking** - Live table of accommodations ranked by cost per person (adjustable group size/nights)
7. **EventPlanningTimeline** - Timeline and checklist for events (weddings, birthdays, corporate retreats, memorials) in the Keys
8. **LodgingComparisonMatrix** - Side-by-side comparison table for multiple accommodations (price, location, amenities, reviews)

**Key Adaptations for Florida Keys:**
- Replace "ski" terminology with Keys-specific activities (snorkeling, fishing, diving, boating)
- Adapt for Keys geography (Key Largo, Islamorada, Marathon, Big Pine Key, Key West)
- Consider Keys-specific factors (hurricane season, peak winter season, summer off-season)
- Include Keys-specific activities (reef tours, sunset cruises, fishing charters, water sports)
- Account for Keys-specific costs (boat rentals, fishing licenses, activity tours vs lift tickets)

**Technical Requirements:**
- Build in `src/components/planning/` directory
- Use existing UI components (Card, Button, Input) from `src/components/ui/`
- Integrate with LiteAPI for real-time accommodation pricing (similar to Telluride)
- Export all components from `src/components/planning/index.ts`
- Follow existing design patterns - NO gradients, clean professional styling
- NO placeholders, NO mock data, NO hardcoded values - real implementations only

### Task 3: Update Content Schedule

**Restructure `CONTENT_PUBLISHING_SCHEDULE.md` to include:**

1. **Conversion-Focused Group Planning Articles** (similar to Days 14-30 in Telluride schedule):
   - Florida Keys Family Vacation: Complete Planning Guide & Cost Breakdown
   - Florida Keys Friends Trip: Group Planning & Cost Splitting Guide
   - Florida Keys Bachelor/Bachelorette Party: Ultimate Planning Guide
   - Florida Keys Couples Retreat: Romantic Getaway Planner
   - Florida Keys Multi-Family Trip: Large Group Planning Guide
   - Florida Keys Solo Travel: Complete Independent Traveler's Guide
   - Florida Keys Girls Weekend: Ultimate Girlfriend Getaway Guide
   - Florida Keys Corporate Retreat: Team Building & Lodging Guide
   - Florida Keys 50th Birthday Celebration: Lodging & Activities
   - Florida Keys Memorial/Celebration of Life Trip Planning Guide
   - Florida Keys Wedding Party Lodging: Where to House Your Guests
   - Florida Keys Trip Cost Calculator: Budget by Group Size
   - 4-Day Florida Keys Itinerary: Cost Breakdown for 2/4/6/8 People
   - Florida Keys: Peak Season vs Off-Season Cost Comparison
   - Splitting Costs in the Keys: Condos vs Hotels for Groups
   - Top 10 Florida Keys Hotels by Value: Price per Person Analysis
   - Best Florida Keys Hotels for Groups: Ranked by Amenities & Space

2. **Affordable Family Trip Articles** (at least 1-3):
   - Affordable Family Trip to the Florida Keys: Budget Lodging & Free Activities Guide
   - Florida Keys Free Activities: Fun Things to Do Without Spending Money
   - Budget-Friendly Florida Keys Family Vacation: Complete Cost-Saving Guide

3. **Each article entry should include:**
   - Keyword research from SEO masterlist
   - Word count target
   - Category and tags
   - **Tools Required:** field listing specific interactive widgets
   - **Focus:** brief description of conversion goals

**Strategic Notes:**
- Add a "🎯 NEW CONVERSION-FOCUSED STRATEGY" section at the top explaining the pivot
- Mark existing published articles appropriately
- Identify "next up" articles clearly
- Ensure affordable family content is included (not replaced)

### Task 4: Update Master Article Generation Prompt

**Update `MASTER_ARTICLE_GENERATION_PROMPT.md` to include:**

1. **New Section: "Interactive Planning Tools System"**
   - Detailed documentation for all 8 tools
   - Component syntax and props for each tool
   - What each tool does and when to use it
   - Mandatory placement rules (tools must appear in relevant articles)
   - Tool selection guidelines for different article types
   - Integration with ArticleBookingWidget components

2. **Updated Article Generation Workflow:**
   - Step 1: Research & Keyword Analysis
   - Step 2: Outline with Tool Placement
   - Step 3: Write Content with Embedded Tools
   - Step 4: SEO Optimization
   - Step 5: Add Conversion Elements (ArticleBookingWidget components)
   - Step 6: Format & Frontmatter

3. **Tool Usage Examples:**
   - Show correct syntax for embedding tools in Markdown
   - Provide examples of tool placement within article flow
   - Explain how tools integrate with ArticleBookingWidget CTAs

**Key Adaptations:**
- Replace Telluride-specific examples with Florida Keys examples
- Adapt tool descriptions for Keys context (accommodations, activities, geography)
- Update brand voice to match Keys travel (tropical, relaxed, water-focused vs mountain/ski)

### Task 5: Review SEO Keywords Masterlist

**Review `SEO_KEYWORDS_MASTERLIST.md` (or create if missing) to identify:**
- High-value keywords for group travel planning
- Keywords for different group types (family, friends, couples, etc.)
- Event-based keywords (weddings, birthdays, corporate retreats)
- Cost/budget-focused keywords
- Affordable family travel keywords
- Free activities keywords

**Ensure keywords align with new conversion-focused strategy.**

---

## Implementation Standards

**Follow these strict standards (same as Telluride project):**

1. **NO DOCUMENTATION FILES** - Focus on implementation, not docs
2. **NO PLACEHOLDERS** - Real implementations only
3. **NO MOCK DATA** - Use real API integrations (LiteAPI)
4. **NO HARDCODED VALUES** - Dynamic, data-driven implementations
5. **NO FLUFF** - Sharp, clean, modern, correct code
6. **PROFESSIONAL PROGRAMMING** - Follow existing design patterns
7. **NO GRADIENTS** - Clean, professional styling (user preference)

**Design Patterns:**
- Use existing UI components from `src/components/ui/`
- Follow existing component structure from Telluride planning tools
- Integrate with LiteAPI using existing patterns from `src/lib/liteapi/`
- Match existing code style and architecture

---

## Florida Keys Specific Adaptations

**Key Differences from Telluride:**

1. **Geography:** Multiple islands (Key Largo, Islamorada, Marathon, Big Pine Key, Key West) vs single mountain town
2. **Activities:** Water-based (snorkeling, diving, fishing, boating) vs snow-based (skiing, snowboarding)
3. **Seasons:** Peak winter season (Dec-Mar) vs off-season summer (hurricane season considerations)
4. **Accommodations:** Beachfront hotels, waterfront condos, vacation rentals vs ski-in/ski-out properties
5. **Cost Factors:** Boat rentals, fishing licenses, activity tours vs lift tickets and equipment
6. **Group Types:** Similar (families, friends, couples, solo, corporate, events) but with Keys-specific activities

**Tool Adaptations Needed:**
- Replace "ski" terminology with Keys activities
- Adapt cost categories (no lift tickets, add activity tours)
- Consider Keys geography in location filters
- Include Keys-specific factors (hurricane season, peak winter, summer off-season)
- Adapt for water-based activities vs mountain activities

---

## Expected Deliverables

1. ✅ **8 Interactive Planning Tools** built in `src/components/planning/`
2. ✅ **Updated CONTENT_PUBLISHING_SCHEDULE.md** with conversion-focused articles
3. ✅ **Updated MASTER_ARTICLE_GENERATION_PROMPT.md** with tool documentation
4. ✅ **All tools exported** from `src/components/planning/index.ts`
5. ✅ **No linter errors** - clean, production-ready code
6. ✅ **SEO keywords reviewed** and aligned with strategy

---

## Success Criteria

- Tools are fully functional (not placeholders)
- Tools integrate with LiteAPI for real pricing data
- Content schedule includes 15-20 conversion-focused group planning articles
- Master prompt includes comprehensive tool usage instructions
- Affordable family trip content is included (not replaced)
- All code follows existing design patterns
- No gradients used in UI components
- Code is clean, professional, and production-ready

---

## Getting Started

1. **First:** Review existing files to understand current state
2. **Second:** Build the 8 planning tools (start with GroupCostCalculator as it's foundational)
3. **Third:** Update content schedule with new conversion-focused articles
4. **Fourth:** Update master prompt with tool documentation
5. **Fifth:** Test tools, fix any issues, ensure clean builds

**Work systematically and ensure each tool is complete before moving to the next.**

---

## Questions to Answer During Implementation

- What are the current content categories in TheKeys.com?
- What group planning content already exists?
- What are the high-value keywords for Keys group travel?
- How do Keys accommodations differ from Telluride (beachfront, waterfront, etc.)?
- What are Keys-specific cost factors (boat rentals, fishing licenses, etc.)?
- How do Keys seasons differ (peak winter vs off-season summer)?
- What Keys-specific activities should tools account for?

**Answer these through codebase exploration and then adapt the Telluride strategy accordingly.**

---

## Final Notes

This is a **strategic pivot** to conversion-focused content, not a complete overhaul. Preserve existing successful content while adding the new group planning focus. The goal is to **increase user engagement, time on site, and ultimately drive direct bookings** through interactive planning guides that help groups plan and book their Florida Keys vacations.

**Remember:** The Keys context is different (tropical, water-based, multiple islands) but the strategy is the same: **help groups plan trips with interactive tools that drive conversions.**

