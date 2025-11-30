# Blog System Architecture Document
## Comprehensive Guide for Replication on TheKeys.com

---

## Table of Contents

1. [Overview](#overview)
2. [Content Strategy Foundation](#content-strategy-foundation)
3. [Technical Architecture](#technical-architecture)
4. [Component System](#component-system)
5. [API Integrations](#api-integrations)
6. [Media Library System](#media-library-system)
7. [Image Optimization System](#image-optimization-system)
8. [Interactive Planning Tools](#interactive-planning-tools)
9. [SEO & Content Structure](#seo--content-structure)
10. [Conversion Optimization](#conversion-optimization)
11. [Implementation Checklist for TheKeys.com](#implementation-checklist-for-thekeyscom)
12. [AI Agent Implementation Prompt](#ai-agent-implementation-prompt)

---

## Overview

This document provides a complete technical and strategic overview of the TellurideInsider.com blog system. The system is built on **Astro** with **React** components for interactivity, utilizing **MDX** for content authoring that allows embedding React components directly within markdown content.

### Core Technologies

- **Framework**: Astro (SSG/SSR hybrid)
- **Interactive Components**: React with TypeScript
- **Content Format**: MDX (Markdown with JSX)
- **Styling**: Tailwind CSS
- **APIs**: LiteAPI (hotels), Viator (activities), Mapbox (maps)
- **Image Sources**: LiteAPI, Viator, Unsplash, Pexels

### Key Features

1. **Rich MDX Blog Posts** - Articles with embedded interactive widgets
2. **Dynamic Hotel Grids** - Live pricing from LiteAPI
3. **Interactive Maps** - 3D terrain, trails, hotel markers
4. **Trip Planning Tools** - Budget calculators, hotel comparisons
5. **Intelligent Image Selection** - Categorized media library
6. **SEO Optimization** - Structured data, meta management
7. **Conversion-Focused CTAs** - Strategic booking prompts

---

## Content Strategy Foundation

### Brand Voice & Style

The content follows a "Knowledgeable Local Friend" voice:
- Speaks as someone who lives in the destination
- Shares insider tips and local knowledge
- Specific with details (locations, times, prices)
- Enthusiastic but honest (acknowledges drawbacks)
- Helpful and practical with actionable information
- Inclusive and welcoming to all skill levels

### Content Structure Standards

Every article follows this anatomy:

```
1. Introduction (150-200 words)
   - Hook with interesting fact/question/scenario
   - Address search intent immediately
   - Preview what reader will learn
   - Primary keyword in first 100 words

2. Quick Summary/TL;DR (for 2,500+ word articles)
   - Bullet points of key takeaways
   - Quick answer to main question
   - Jump links to sections

3. Main Content Sections (4-8 H2 sections)
   - Each covers one major subtopic
   - Start with most important info
   - Keyword-rich H2 headings
   - Images every 300-400 words

4. Practical Tips Section
   - "Pro Tips" or "Planning Tips"
   - Actionable advice bullets
   - Insider knowledge
   - Common mistakes to avoid

5. FAQ Section (Required)
   - 5-8 common questions
   - Based on "People Also Ask"
   - Concise 50-100 word answers
   - Uses FAQ accordion component

6. Conclusion (100-150 words)
   - Summarize key takeaways
   - Reinforce recommendation
   - Call-to-action

7. Related Hotels Section
   - 3-6 relevant hotel cards
   - Filtered by article topic
```

### Writing Guidelines

**Readability Standards:**
- Flesch Reading Ease: 60-70 (8th-9th grade level)
- Average sentence length: 15-20 words
- Paragraph length: 2-4 sentences
- Active voice: 80%+ of sentences

**Critical Rules:**
- Use bullet points SPARINGLY (only 3-5 items max)
- Prioritize NARRATIVE FLOW over outline format
- Write in flowing paragraphs, not PowerPoint style
- Use numbered lists ONLY for sequential steps

### Research Requirements

Every article requires pre-writing research:
1. Verify statistics from official sources
2. Check current pricing from booking sites
3. Confirm business names still exist
4. Verify festival/event dates
5. Analyze top 5 ranking competitor articles
6. Research local sentiment from community sources

---

## Technical Architecture

### File Structure

```
src/
├── content/
│   ├── config.ts              # Content collection schema
│   └── blog/
│       └── [category]/
│           └── [article].mdx  # Blog articles
├── components/
│   ├── blog/
│   │   ├── MDXComponents.ts   # Component registry
│   │   ├── HotelGrid.tsx      # Hotel listings
│   │   ├── BlogMap.tsx        # Interactive maps
│   │   ├── BlogImage.tsx      # Image component
│   │   ├── ArticleBookingWidget.tsx
│   │   ├── ActivityGrid.tsx   # Viator activities
│   │   ├── BlogEventsWidget.tsx
│   │   └── ...
│   └── planning/
│       ├── TripCalculator.tsx
│       └── HotelComparison.tsx
├── layouts/
│   └── BlogLayout.astro       # Article layout
├── pages/
│   ├── blog/
│   │   └── [category]/
│   │       └── [slug].astro   # Article pages
│   └── api/
│       ├── hotels/
│       │   ├── details.ts     # Hotel details endpoint
│       │   ├── min-rates.ts   # Minimum rates endpoint
│       │   └── search.ts      # Hotel search
│       ├── viator/
│       │   └── search.ts      # Activity search
│       └── mapbox/
│           └── directions.ts  # Route directions
├── lib/
│   ├── liteapi/
│   │   ├── client.ts          # LiteAPI client
│   │   ├── hotels.ts          # Hotel functions
│   │   ├── rates.ts           # Rate functions
│   │   └── types.ts           # TypeScript types
│   ├── viator/
│   │   ├── client.ts          # Viator client
│   │   └── types.ts           # TypeScript types
│   ├── cache.ts               # In-memory caching
│   ├── image-optimization.ts  # Image URL optimization
│   └── lift-tickets.ts        # Pricing calculations
├── data/
│   ├── hotel-price-ranges.json
│   ├── driving-routes/        # Map route data
│   └── lift-ticket-prices.json
└── styles/
    └── global.css

media-library/                 # Image library CSVs
├── hotel-rooms.csv
├── hotel-exteriors.csv
├── viator-tours-activities.csv
├── telluride-images.csv
└── ...
```

### Content Collection Schema

The blog content collection is defined in `src/content/config.ts`:

```typescript
import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),
    title: z.string().min(10).max(80),
    status: z.enum(['draft', 'scheduled', 'published']),
    category: z.enum([
      'destination-guides',
      'ski-guides',
      'hotel-reviews',
      'planning-tips',
      'seasonal-guides',
      'activity-guides',
      'dining-nightlife',
      'family-travel',
      'luxury-travel',
      'budget-travel'
    ]),
    author: z.string().default('Site Team'),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    seo: z.object({
      metaTitle: z.string().min(40).max(60),
      metaDescription: z.string().min(140).max(160),  // CRITICAL: Strict limits
      keywords: z.array(z.string()),
      canonical: z.string().url().optional(),
    }),
    featured: z.boolean().default(false),
    featuredImage: z.string(),
    featuredImageAlt: z.string(),
    excerpt: z.string().max(200),
    wordCount: z.number(),
    readingTime: z.number(),
    relatedHotels: z.array(z.string()).optional(),
    relatedArticles: z.array(z.string()).optional(),
    tags: z.array(z.string()),
    seasonalRelevance: z.array(z.enum(['winter', 'spring', 'summer', 'fall'])).optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
```

### Article Page Structure

The article page (`src/pages/blog/[category]/[slug].astro`) handles:

1. **Static Path Generation** - Generates paths for all articles
2. **Content Rendering** - Renders MDX with component injection
3. **Related Articles** - Finds related content
4. **Table of Contents** - Extracts H2/H3 headings
5. **Schema.org Markup** - Structured data for SEO

### Blog Layout Features

The layout (`src/layouts/BlogLayout.astro`) includes:

- Hero section with featured image
- Breadcrumb navigation
- Prose styling with Tailwind typography
- Tag display and links
- Newsletter CTA section
- Related articles section
- JSON-LD structured data
- **FAQ Accordion Script** - Auto-converts FAQ H3/P pairs into accordions

---

## Component System

### MDX Component Registry

All components available in MDX are exported from `src/components/blog/MDXComponents.ts`:

```typescript
export { ArticleBookingWidget } from './ArticleBookingWidget';
export { HotelGrid } from './HotelGrid';
export { BlogMap } from './BlogMap';
export { BlogImage } from './BlogImage';
export { BlogEventsWidget } from './BlogEventsWidget';
export { ActivityGrid } from './ActivityGrid';
export { TripCalculator } from '@/components/planning/TripCalculator';
export { HotelComparison } from '@/components/planning/HotelComparison';
```

### HotelGrid Component

**Purpose**: Display hotel listings with live pricing from LiteAPI

**Props**:
```typescript
interface HotelGridProps {
  /** Filter type for automatic hotel selection */
  filter?: 'ski-in-ski-out' | 'luxury' | 'budget' | 'family' | 'pet-friendly';
  /** Manually curated hotel IDs (takes precedence over filter) */
  hotelIds?: string[];
  /** Maximum number of hotels to display */
  limit?: number;
  /** Check-in date for live pricing */
  checkIn?: string;
  /** Check-out date for live pricing */
  checkOut?: string;
  /** Section title */
  title?: string;
  /** Minimum price filter */
  minPrice?: number;
  /** Maximum price filter */
  maxPrice?: number;
}
```

**Display Modes**:
- **Single (1 hotel)**: Full-width showcase with large image, detailed info
- **Double (2 hotels)**: Two-column layout
- **Triple (3+ hotels)**: Three-column grid

**Features**:
- Live rate fetching from `/api/hotels/min-rates`
- Fallback to `hotel-price-ranges.json` when live rates unavailable
- Filters out hotels without images
- Client-side price filtering
- Loading states and error handling

**Usage in MDX**:
```mdx
<HotelGrid 
  hotelIds={["lp10e4d", "lp8a1b2", "lp3c5d6"]} 
  title="Top Ski-In/Ski-Out Hotels"
/>

<HotelGrid 
  filter="luxury" 
  limit={3} 
  minPrice={300}
/>
```

### BlogMap Component

**Purpose**: Interactive Mapbox maps with hotels, trails, and routes

**Props**:
```typescript
interface BlogMapProps {
  preset?: 'resort' | 'town' | 'overview' | 'hotels' | 'trails' | 'driving-routes' | 'hiking' | 'biking';
  center?: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
  terrain?: boolean;
  showTrails?: boolean;
  showLifts?: boolean;
  hotelIds?: string[];
  markers?: Array<{ lng: number; lat: number; label: string }>;
  highlightTrails?: string[];
  focusArea?: 'gold-hill' | 'revelstoke' | 'prospect-bowl' | 'see-forever';
  routeId?: string;
}
```

**Preset Configurations**:
```typescript
const PRESETS = {
  resort: { center: [-107.8175, 37.9375], zoom: 13, terrain: true, showTrails: true },
  town: { center: [-107.8112, 37.9375], zoom: 15 },
  overview: { center: [-107.82, 37.94], zoom: 11 },
  hotels: { center: [-107.815, 37.938], zoom: 14, showTrails: false },
  trails: { center: [-107.83, 37.935], zoom: 13.5, terrain: true, showTrails: true },
  'driving-routes': { center: [-107.8, 37.9], zoom: 10 },
};
```

**Features**:
- 3D terrain visualization
- Ski trail and lift overlays
- Hotel markers with preview popups
- Driving route visualization
- Trail highlighting by difficulty
- Trail area focus zones

**Usage in MDX**:
```mdx
<BlogMap 
  preset="hotels" 
  hotelIds={["lp10e4d", "lp8a1b2"]} 
/>

<BlogMap 
  preset="trails" 
  terrain={true} 
  highlightTrails={["Telluride Trail", "Plunge"]}
  focusArea="gold-hill"
/>

<BlogMap 
  preset="driving-routes" 
  routeId="denver-to-telluride"
/>
```

### BlogImage Component

**Purpose**: Unified image display with captions, credits, and lightbox

**Props**:
```typescript
interface ImageItem {
  src: string;
  alt: string;
  caption?: string;
  photographer?: string;
  source?: 'unsplash' | 'pexels' | 'liteapi' | 'viator';
}

interface BlogImageProps {
  images: ImageItem[];
  mode?: 'single' | 'double' | 'triple' | 'gallery';
  showThumbnails?: boolean;
  autoPlay?: boolean;
  groupCaption?: string;
  aspectRatio?: 'landscape' | 'portrait' | 'square' | 'wide';
  lightbox?: boolean;
  maxHeight?: string;
}
```

**Features**:
- Multiple layout modes (single, grid, gallery)
- Automatic image optimization via `optimizeImageUrl`
- Photographer attribution
- Fullscreen lightbox
- Loading states and error handling

**Usage in MDX**:
```mdx
<BlogImage
  images={[
    {
      src: "https://images.unsplash.com/photo-xxx",
      alt: "Mountain view from hotel",
      caption: "The stunning view from the penthouse suite",
      photographer: "John Smith",
      source: "unsplash"
    }
  ]}
  mode="single"
  lightbox={true}
/>

<BlogImage
  images={[...threeImages]}
  mode="triple"
  groupCaption="Hotel amenities and facilities"
/>
```

### ArticleBookingWidget Component

**Purpose**: Contextual booking CTAs within articles

**Props**:
```typescript
interface ArticleBookingWidgetProps {
  variant?: 'compact' | 'default' | 'featured';
  hotelId?: string;
  hotelName?: string;
  location?: string;
  filter?: 'ski-in-ski-out' | 'luxury' | 'budget' | 'family';
  title?: string;
  description?: string;
  ctaText?: string;
}
```

**Variants**:
- **compact**: Small inline CTA
- **default**: Standard card with image
- **featured**: Large prominent CTA

**Link Building Logic**:
```typescript
function buildLink() {
  if (hotelId) return `/hotels/${hotelId}`;
  if (filter) return `/lodging?filter=${filter}`;
  if (location) return `/lodging?location=${location}`;
  return '/lodging';
}
```

**Usage in MDX**:
```mdx
<ArticleBookingWidget 
  variant="featured"
  hotelId="lp10e4d"
  hotelName="The Peaks Resort & Spa"
/>

<ArticleBookingWidget 
  variant="compact"
  filter="ski-in-ski-out"
  ctaText="Browse Ski-In/Ski-Out Hotels"
/>
```

### ActivityGrid Component

**Purpose**: Display Viator activities with booking links

**Props**:
```typescript
interface ActivityGridProps {
  category?: string;
  limit?: number;
  title?: string;
  maxPrice?: number;
  minPrice?: number;
}
```

**Features**:
- Fetches from `/api/viator/search`
- Single/double/triple display modes
- Price and rating display
- Duration formatting
- Category filtering

**Usage in MDX**:
```mdx
<ActivityGrid 
  category="hiking" 
  limit={3} 
  title="Top Hiking Tours"
/>
```

### BlogEventsWidget Component

**Purpose**: Display upcoming events with dates

**Props**:
```typescript
interface BlogEventsWidgetProps {
  eventIds?: string[];
  type?: 'festival' | 'concert' | 'sports' | 'art' | 'community';
  limit?: number;
  title?: string;
  upcomingOnly?: boolean;
}
```

**Features**:
- Curated event list
- Date badge display
- Type filtering
- Upcoming events filter
- External links to event pages

---

## API Integrations

### LiteAPI Client

**File**: `src/lib/liteapi/client.ts`

```typescript
const LITEAPI_BASE_URL = 'https://api.liteapi.travel/v3.0';

export async function liteAPIClient<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${LITEAPI_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'X-API-Key': import.meta.env.LITEAPI_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`LiteAPI error: ${response.status}`);
  }
  
  return response.json();
}

// Streaming client for Server-Sent Events
export async function liteAPIStreamClient(
  endpoint: string,
  options: RequestInit,
  onChunk: StreamCallback
): Promise<void> {
  // Handles SSE for streaming rates
}
```

### Hotel Search & Details

**File**: `src/lib/liteapi/hotels.ts`

**Key Functions**:

```typescript
// Search hotels by city
export async function searchHotels(params: LiteAPIHotelSearchParams): Promise<HotelSearchResponse>

// Get detailed hotel information
export async function getHotelDetails(hotelId: string): Promise<LiteAPIHotel>
```

**Property Type Detection**:
```typescript
// Maps LiteAPI hotelTypeId to friendly types
// 201=Apartment, 204=Hotel, 206=Resort, 229=Condo, 230=Cabin, 250=Lodge
function getPropertyType(hotelTypeId: number, name: string): PropertyType {
  if (hotelTypeId === 206) return 'resort';
  if (hotelTypeId === 229) return 'condo';
  // ... etc
  // Falls back to name-based detection
}
```

### Rate Fetching

**File**: `src/lib/liteapi/rates.ts`

**Key Functions**:

```typescript
// Full rate search with room details
export async function searchRates(params: LiteAPIRateSearchParams): Promise<RateSearchResponse>

// Streaming rates for large searches
export async function searchRatesStream(
  params: LiteAPIRateSearchParams,
  onRates: (rates: any[]) => void
): Promise<void>

// Minimum rates for listings/maps (faster)
export async function getMinRates(params: MinRateSearchParams): Promise<Record<string, MinRateResult>>
```

**Pricing Strategy**:
```typescript
// LiteAPI provides:
// - retailRate.total = Price customer pays (includes our margin)
// - retailRate.suggestedSellingPrice = Public OTA price (for "Compare at" messaging)
// - retailRate.initialPrice = Base price before margin

// We use retailRate.total as the selling price
// Margin is configured via LITEAPI_MARKUP_PERCENT
```

### API Routes

**Hotels Details** (`/api/hotels/details.ts`):
```typescript
export const GET: APIRoute = async ({ request }) => {
  const hotelId = url.searchParams.get('hotelId');
  
  const data = await withCache(
    `hotel-details-v2:${hotelId}`,
    7200, // 2 hour cache
    () => getHotelDetails(hotelId)
  );
  
  return new Response(JSON.stringify(data));
};
```

**Min Rates** (`/api/hotels/min-rates.ts`):
```typescript
export const GET: APIRoute = async ({ request }) => {
  const hotelIds = url.searchParams.get('hotelIds')?.split(',');
  const checkIn = url.searchParams.get('checkIn');
  const checkOut = url.searchParams.get('checkOut');
  
  const minRates = await getMinRates({ hotelIds, checkIn, checkOut, adults: 2 });
  return new Response(JSON.stringify({ data: minRates }));
};
```

### Viator Client

**File**: `src/lib/viator/client.ts`

```typescript
const VIATOR_BASE_URL = 'https://api.viator.com/partner';

export async function viatorRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${VIATOR_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'exp-api-key': import.meta.env.VIATOR_API_KEY,
      'Accept': 'application/json;version=2.0',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response.json();
}

// Search activities for destination
export async function searchTellurideActivities(options: SearchOptions) {
  return viatorRequest('/products/search', {
    method: 'POST',
    body: JSON.stringify({
      destId: TELLURIDE_DEST_ID,
      ...options,
    }),
  });
}
```

### Caching System

**File**: `src/lib/cache.ts`

```typescript
class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  get<T>(key: string): T | null
  set<T>(key: string, data: T, ttlSeconds: number): void
  has(key: string): boolean
  delete(key: string): void
}

// Helper for async operations
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== null) return cached;
  
  const data = await fetchFn();
  cache.set(key, data, ttlSeconds);
  return data;
}
```

---

## Media Library System

### Overview

The media library is a collection of CSV files categorizing image URLs by type and source. This enables intelligent image selection for articles based on content context.

### Directory Structure

```
media-library/
├── hotel-rooms.csv           # LiteAPI room images
├── hotel-exteriors.csv       # LiteAPI exterior shots
├── hotel-lobbies.csv         # LiteAPI lobby images
├── hotel-amenities.csv       # LiteAPI amenity photos
├── hotel-views.csv           # LiteAPI view images
├── hotel-spas.csv            # LiteAPI spa photos
├── viator-tours-activities.csv
├── viator-adventure-activities.csv
├── viator-hiking-activities.csv
├── viator-winter-activities.csv
├── viator-family-activities.csv
├── telluride-images.csv      # Verified destination images
├── powder-skiing.csv         # Stock skiing images
├── snowboarding.csv          # Stock snowboard images
└── hot-tubs.csv              # Stock amenity images
```

### CSV Format

```csv
url,alt,caption,photographer,source,category,keywords
https://images.unsplash.com/...,Mountain sunset view,Sunset over the peaks,John Smith,unsplash,landscape,sunset;mountains;golden-hour
```

### Population Script

**File**: `scripts/populate-media-library-csvs.mjs`

```javascript
const CSV_CATEGORIES = {
  'luxury-ski-hotels.csv': {
    queries: ['luxury ski hotel', 'mountain resort hotel'],
    perQuery: 8,
  },
  'powder-skiing.csv': {
    queries: ['skiing powder snow', 'deep powder skiing'],
    perQuery: 8,
  },
  // ...
};

// Fetches landscape-only images from Pexels
// Filters out portrait orientation
// Avoids duplicates
// Writes to CSV files
```

### Usage in Articles

When writing articles, select images from appropriate CSV categories:

```mdx
{/* For hotel room content */}
<BlogImage
  images={[
    {
      src: "from hotel-rooms.csv",
      alt: "Spacious mountain view suite",
      photographer: "...",
      source: "liteapi"
    }
  ]}
/>

{/* For skiing content */}
<BlogImage
  images={[
    {
      src: "from powder-skiing.csv",
      alt: "Skier in deep powder",
      photographer: "...",
      source: "unsplash"
    }
  ]}
/>
```

---

## Image Optimization System

### Overview

**File**: `src/lib/image-optimization.ts`

The system provides source-aware image optimization, automatically detecting and applying appropriate parameters for each image provider.

### Core Function

```typescript
export function optimizeImageUrl(
  url: string,
  options: {
    width?: number;
    quality?: number;
    source?: 'unsplash' | 'pexels' | 'liteapi' | 'viator' | 'auto';
  } = {}
): string {
  const { source = 'auto', width = 1920, quality = 90 } = options;
  
  // Auto-detect source from URL
  let detectedSource = source;
  if (source === 'auto') {
    if (url.includes('images.unsplash.com')) detectedSource = 'unsplash';
    else if (url.includes('images.pexels.com')) detectedSource = 'pexels';
    else if (url.includes('liteapi')) detectedSource = 'liteapi';
    else if (url.includes('viator')) detectedSource = 'viator';
  }
  
  switch (detectedSource) {
    case 'unsplash':
      return optimizeUnsplashUrl(url, { width, quality });
    case 'pexels':
      return optimizePexelsUrl(url, { width });
    default:
      return url; // LiteAPI/Viator return optimized URLs
  }
}
```

### Source-Specific Optimization

**Unsplash**:
```typescript
function optimizeUnsplashUrl(url: string, options: { width: number; quality: number }) {
  const urlObj = new URL(url);
  urlObj.searchParams.set('fm', 'jpg');
  urlObj.searchParams.set('q', quality.toString());
  urlObj.searchParams.set('w', width.toString());
  urlObj.searchParams.set('fit', 'max');
  return urlObj.toString();
}
```

**Pexels**:
```typescript
function optimizePexelsUrl(url: string, options: { width: number; dpr?: number }) {
  const urlObj = new URL(url);
  urlObj.searchParams.set('auto', 'compress');
  urlObj.searchParams.set('cs', 'tinysrgb');
  urlObj.searchParams.set('dpr', '2');
  urlObj.searchParams.set('w', width.toString());
  return urlObj.toString();
}
```

**LiteAPI**:
```typescript
// Prefers urlHd (HD quality) over url (standard)
export function getLiteAPIImageUrl(image: { url?: string; urlHd?: string }): string | null {
  return image.urlHd || image.url || null;
}
```

**Viator**:
```typescript
// Selects largest variant meeting minimum width
export function getViatorImageUrl(image: { variants: Variant[] }, minWidth = 1200): string | null {
  const sorted = [...image.variants].sort((a, b) => (b.width || 0) - (a.width || 0));
  const best = sorted.find(v => (v.width || 0) >= minWidth) || sorted[0];
  return best?.url || null;
}
```

### Standard Sizes

```typescript
export const ImageSizes = {
  thumbnail: { width: 400, height: 300 },
  small: { width: 800, height: 600 },
  medium: { width: 1200, height: 900 },
  large: { width: 1920, height: 1080 },
  xlarge: { width: 2560, height: 1440 },
};
```

---

## Interactive Planning Tools

### TripCalculator Component

**Purpose**: Help users estimate trip costs based on budget, dates, and party size

**Props**:
```typescript
interface TripCalculatorProps {
  nights?: number;
  guests?: number;
  budget?: number;
  title?: string;
}
```

**Features**:
- Budget slider ($1,000 - $25,000)
- Guest count (1-12)
- Date picker for check-in/out
- Category toggles (lodging, skiing, activities, dining)
- Ski season detection
- Lift ticket cost calculation
- Budget breakdown visualization
- Hotel and activity recommendations based on budget

**Key Calculations**:
```typescript
// Lift ticket calculation (when skiing enabled)
const liftTicketCalc = useMemo(() => {
  if (!tripInSkiSeason || !categories.skiing) return null;
  return calculateLiftTicketCost(checkIn, checkOut, { adults: adultSkiers, children: childSkiers }, skiDays);
}, [checkIn, checkOut, adultSkiers, childSkiers, skiDays, tripInSkiSeason, categories.skiing]);

// Budget distribution
const budgetBreakdown = useMemo(() => {
  const remainingBudget = budget - (liftTicketCalc?.totalCost || 0);
  return {
    lodging: remainingBudget * allocation.lodging,
    activities: remainingBudget * allocation.activities,
    dining: remainingBudget * allocation.dining,
    events: remainingBudget * allocation.events,
  };
}, [budget, liftTicketCalc, allocation]);
```

**Usage in MDX**:
```mdx
<TripCalculator 
  nights={4} 
  guests={2} 
  budget={5000}
  title="Plan Your Trip"
/>
```

### HotelComparison Component

**Purpose**: Side-by-side hotel comparison with pricing

**Props**:
```typescript
interface HotelComparisonProps {
  hotelIds: string[];  // 2-3 hotels
  filter?: string;
  groupSize?: number;
  title?: string;
}
```

**Features**:
- Up to 3 hotels compared
- Live rate fetching
- Cost per person calculation
- Badge system: "Top Rated", "Best Price", "Best Value"
- Amenity comparison
- Guest and date inputs

**Badge Logic**:
```typescript
function getBadges(hotel: HotelWithRates, allHotels: HotelWithRates[]) {
  const badges = [];
  
  // Top Rated - highest review score
  const maxRating = Math.max(...allHotels.map(h => h.review_score || 0));
  if (hotel.review_score === maxRating) badges.push('Top Rated');
  
  // Best Price - lowest total cost
  const minPrice = Math.min(...allHotels.map(h => h.totalCost || Infinity));
  if (hotel.totalCost === minPrice) badges.push('Best Price');
  
  // Best Value - highest combined score (rating + price efficiency)
  if (hotel.combinedScore === Math.max(...allHotels.map(h => h.combinedScore || 0))) {
    badges.push('Best Value');
  }
  
  return badges;
}
```

**Usage in MDX**:
```mdx
<HotelComparison 
  hotelIds={["lp10e4d", "lp8a1b2", "lp3c5d6"]}
  groupSize={4}
  title="Compare Top Hotels"
/>
```

### Lift Ticket Calculator

**File**: `src/lib/lift-tickets.ts`

**Purpose**: Calculate accurate lift ticket costs using real pricing data

```typescript
export interface LiftTicketCalculation {
  totalCost: number;
  breakdown: {
    adults: { count: number; days: number; costPerDay: number; total: number };
    children: { count: number; days: number; costPerDay: number; total: number };
    toddlers: { count: number; days: number; costPerDay: number; total: number };
  };
  dailyPrices: { date: string; adultPrice: number; childPrice: number }[];
  multiDayDiscount: number;
  savings: number;
}

export function calculateLiftTicketCost(
  checkIn: string,
  checkOut: string,
  skiers: { adults: number; children: number; toddlers: number },
  skiDays: number
): LiftTicketCalculation

export function isWithinSkiSeason(checkIn: string, checkOut: string): boolean

export function getPriceTier(date: string): 'value' | 'regular' | 'peak' | 'off-season'
```

---

## SEO & Content Structure

### Meta Tag Strategy

**Title Tag (H1)**:
- 50-60 characters
- Primary keyword near beginning
- Include year for freshness
- Format: "15 Best Hotels in [Destination] (2025 Guide)"

**Meta Description**:
- 140-160 characters (STRICTLY ENFORCED)
- Include primary keyword naturally
- Create urgency or curiosity
- End with CTA if space allows

**URL Slug**:
- Under 75 characters
- Hyphens (not underscores)
- Include primary keyword
- Format: `/blog/[category]/[article-slug]`

### Structured Data

The BlogLayout automatically generates JSON-LD:

```javascript
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": data.title,
  "description": data.excerpt,
  "image": data.featuredImage,
  "datePublished": data.publishDate.toISOString(),
  "dateModified": data.updatedDate?.toISOString(),
  "author": {
    "@type": "Organization",
    "name": data.author
  },
  "publisher": {
    "@type": "Organization",
    "name": "Site Name",
    "logo": { "@type": "ImageObject", "url": logoUrl }
  },
  "mainEntityOfPage": { "@type": "WebPage", "@id": fullUrl },
  "keywords": data.seo.keywords.join(", "),
  "wordCount": data.wordCount,
  "articleSection": categoryName
}
```

### FAQ Accordion System

The layout includes a script that automatically converts FAQ sections into accordions:

```javascript
// Finds H2 with "FAQ" in text
// Gets all following H3 + P pairs until next H2
// Wraps each in accordion markup
// Adds aria-expanded and animation
```

**Writing FAQ Content**:
```mdx
## Frequently Asked Questions About [Topic]

### What is the best time to visit?

The best time to visit is during [season] when [reasons]. Most visitors find [specific insight].

### How much does it cost?

Expect to spend $X-Y per night for lodging, plus $Z for activities. Budget travelers can find options starting at $A.
```

### Internal Linking Strategy

**Hub-and-Spoke Model**:
- Link from spoke articles to pillar pages
- Link from pillars to all related spokes
- Link between related spokes
- 5-10 internal links per article

**Anchor Text Rules**:
- Use descriptive, keyword-rich text
- Vary anchor text (don't repeat exact phrases)
- Never use "click here"
- First mention of topic = link opportunity

**External Links**:
- 2-4 authoritative links per article
- Official sources (.gov, .edu, tourism boards)
- Open in new tab
- Add `rel="noopener noreferrer"`

---

## Conversion Optimization

### CTA Placement Strategy

**Strategic Positions**:
1. After introduction (early engagement)
2. Mid-article (after valuable content)
3. Before FAQ (decision point)
4. After conclusion (action time)

### Widget Selection Guide

| Article Type | Primary Widget | Secondary Widget |
|--------------|----------------|------------------|
| Hotel Reviews | HotelGrid (specific hotels) | ArticleBookingWidget |
| Destination Guides | HotelGrid (filtered) | TripCalculator |
| Activity Guides | ActivityGrid | HotelGrid (nearby) |
| Planning Tips | TripCalculator | HotelComparison |
| Comparison Articles | HotelComparison | ArticleBookingWidget |

### Booking Widget Variants

**Compact** - Inline mentions:
```mdx
Looking for ski-in/ski-out access? <ArticleBookingWidget variant="compact" filter="ski-in-ski-out" />
```

**Default** - Standard CTA box:
```mdx
<ArticleBookingWidget 
  variant="default"
  title="Ready to Book?"
  description="Find the perfect hotel for your trip"
/>
```

**Featured** - Major conversion points:
```mdx
<ArticleBookingWidget 
  variant="featured"
  hotelId="lp10e4d"
  hotelName="The Peaks Resort & Spa"
  title="Our Top Pick"
/>
```

### Persuasion Techniques

1. **Social Proof**: Include review counts and ratings
2. **Scarcity**: "Limited availability during peak season"
3. **Authority**: Reference awards, rankings
4. **Reciprocity**: Provide valuable content before asking
5. **Commitment**: Start with small asks (newsletter before booking)

---

## Implementation Checklist for TheKeys.com

### Phase 1: Foundation

- [ ] Set up content collection schema in `src/content/config.ts`
- [ ] Create blog layout with prose styling
- [ ] Implement article page with static path generation
- [ ] Add JSON-LD structured data
- [ ] Create MDXComponents registry

### Phase 2: Core Components

- [ ] **HotelGrid** - Adapt for Keys destination
  - Update hotel filter types for Keys market
  - Adjust price ranges for market
  - Configure LiteAPI for Keys region
  
- [ ] **BlogImage** - Reusable as-is
  - Add Keys-specific image sources to optimization
  
- [ ] **ArticleBookingWidget** - Adapt messaging
  - Update CTAs for Keys audience
  - Configure destination links

### Phase 3: API Integration

- [ ] **LiteAPI Client** - Configure for Keys
  - Update city search parameters
  - Adjust property type mappings
  - Configure markup percentage
  
- [ ] **Viator Client** - Configure destination ID
  - Find Keys destination ID
  - Update activity categories
  
- [ ] **Caching** - Implement with appropriate TTLs

### Phase 4: Advanced Features

- [ ] **BlogMap** - Adapt for Keys geography
  - Create Keys-specific presets
  - Update center coordinates
  - Add relevant POI data
  
- [ ] **ActivityGrid** - Configure for Keys activities
  - Water sports, diving, fishing
  - Island tours
  - Key-specific categories

### Phase 5: Planning Tools (Optional)

- [ ] **TripCalculator** - Adapt calculations
  - Remove ski-specific logic
  - Add Keys-specific activities
  - Update budget categories
  
- [ ] **HotelComparison** - Reusable with config
  - Update badge criteria for Keys market

### Phase 6: Media Library

- [ ] Create media-library directory
- [ ] Define Keys-specific CSV categories
  - Beach images
  - Water activities
  - Hotel exteriors
  - Sunset/sunrise
  - Marine life
- [ ] Run population scripts for Keys content

### Widgets NOT Applicable to TheKeys.com

1. **Lift Ticket Calculator** - Ski-specific
2. **Trail Highlighting** - Ski trail focused
3. **Ski Season Detection** - Winter sport specific
4. **Snow-related image categories** - Not relevant

### New Widgets to Consider for TheKeys.com

1. **WeatherWidget** - Tropical weather display
2. **TideChart** - Fishing/water activities
3. **SunsetTimer** - Popular Keys activity
4. **DiveSiteMap** - Reef and dive locations
5. **FishingSeasonGuide** - Species by season
6. **IslandHopper** - Multi-key itineraries

---

## AI Agent Implementation Prompt

Copy everything below this line along with the entire document above and paste into the thekeys.com codebase AI assistant:

---

# AI AGENT IMPLEMENTATION PROMPT

## Context

You are an AI coding assistant working on thekeys.com, a travel website for the Florida Keys. You have been provided with a comprehensive architecture document from tellurideinsider.com, a similar travel site built on Astro with React components.

Your task is to implement an advanced blog system for thekeys.com based on the patterns documented above, while adapting them appropriately for the Florida Keys destination.

## Current State

The thekeys.com codebase has:
- Basic Astro setup
- LiteAPI integration (basic)
- Viator integration (basic)
- Mapbox integration (basic)
- Skeletal blog implementation

## Your Mission

Implement the following systems, in order of priority:

### Priority 1: Content Foundation

1. **Create/Update Content Collection Schema**
   - Adapt the schema from the document for Keys categories
   - Categories should include: destination-guides, beach-guides, hotel-reviews, planning-tips, seasonal-guides, activity-guides, dining-nightlife, family-travel, luxury-travel, budget-travel
   - Maintain strict SEO validation (140-160 char meta descriptions)

2. **Create Blog Layout**
   - Hero section with featured image
   - Breadcrumb navigation
   - Prose styling with Tailwind
   - FAQ accordion script
   - JSON-LD structured data
   - Newsletter CTA section
   - Related articles section

3. **Create Article Page**
   - Static path generation
   - MDX rendering with component injection
   - Table of contents extraction
   - Related article logic

### Priority 2: Core Components

1. **Create HotelGrid Component**
   - Adapt for Keys market
   - Filter types: beachfront, luxury, budget, family, pet-friendly, waterfront
   - Single/double/triple display modes
   - Live pricing from LiteAPI
   - Fallback price handling

2. **Create BlogImage Component**
   - Single, double, triple, gallery modes
   - Image optimization per source
   - Photographer attribution
   - Lightbox functionality

3. **Create ArticleBookingWidget Component**
   - Compact, default, featured variants
   - Dynamic link building
   - Keys-appropriate CTAs

4. **Create MDXComponents Registry**
   - Export all components for MDX use

### Priority 3: API Enhancement

1. **Enhance LiteAPI Integration**
   - Implement `/api/hotels/details` endpoint
   - Implement `/api/hotels/min-rates` endpoint
   - Add caching with appropriate TTLs
   - Configure for Keys cities (Key West, Islamorada, Marathon, Key Largo)

2. **Enhance Viator Integration**
   - Create `/api/viator/search` endpoint
   - Configure for Keys destination ID
   - Implement activity categories relevant to Keys

3. **Create Image Optimization Utility**
   - Source detection and optimization
   - Unsplash, Pexels, LiteAPI, Viator support
   - Standard size constants

### Priority 4: Maps & Activities

1. **Create BlogMap Component**
   - Keys-specific presets (keys-overview, key-west, islamorada, marathon)
   - Hotel markers with popups
   - Route visualization for Keys Highway
   - POI markers for attractions

2. **Create ActivityGrid Component**
   - Categories: diving, snorkeling, fishing, kayaking, boat-tours, sunset-cruises
   - Single/double/triple modes
   - Viator integration

### Priority 5: Planning Tools

1. **Create TripCalculator Component**
   - Adapt for Keys travel (remove ski logic)
   - Budget categories: lodging, activities, dining, transportation
   - Hotel and activity recommendations
   - Multi-key itinerary support

2. **Create HotelComparison Component**
   - Side-by-side comparison
   - Badge system for Keys criteria
   - Live rate fetching

### Priority 6: Media Library

1. **Create Media Library Structure**
   - CSV categories for Keys content
   - Beach images
   - Water activities (diving, snorkeling, fishing)
   - Hotel categories
   - Sunset/sunrise
   - Marine life
   - Key-specific landmarks

2. **Create Population Scripts**
   - Fetch from Pexels/Unsplash for Keys queries
   - Landscape-only filtering
   - Duplicate avoidance

## Implementation Guidelines

1. **Follow the Architecture Document**
   - Use the exact patterns for components, APIs, and utilities
   - Adapt only destination-specific logic

2. **Maintain Code Quality**
   - TypeScript for all new code
   - Proper error handling
   - Loading states
   - Console logging for debugging

3. **Keys-Specific Adaptations**
   - Replace ski/winter terminology with beach/water terminology
   - Update geographic coordinates
   - Adjust price ranges for Keys market
   - Use Keys-relevant categories and filters

4. **Testing**
   - Create sample blog post to test all components
   - Verify API endpoints work correctly
   - Test responsive layouts

## Files to Create/Modify

Based on the architecture document, create these files:

```
src/
├── content/
│   └── config.ts (update)
├── components/
│   └── blog/
│       ├── HotelGrid.tsx (create)
│       ├── BlogImage.tsx (create)
│       ├── BlogMap.tsx (create)
│       ├── ArticleBookingWidget.tsx (create)
│       ├── ActivityGrid.tsx (create)
│       ├── BlogEventsWidget.tsx (create)
│       └── MDXComponents.ts (create)
├── layouts/
│   └── BlogLayout.astro (create)
├── pages/
│   ├── blog/
│   │   └── [category]/
│   │       └── [slug].astro (create)
│   └── api/
│       ├── hotels/
│       │   ├── details.ts (create/update)
│       │   └── min-rates.ts (create)
│       └── viator/
│           └── search.ts (create/update)
├── lib/
│   ├── cache.ts (create)
│   └── image-optimization.ts (create)
└── data/
    └── hotel-price-ranges.json (create)
```

## Success Criteria

The implementation is complete when:

1. Blog articles can be written in MDX with embedded components
2. HotelGrid displays hotels with live pricing
3. BlogMap shows Keys geography with hotel markers
4. ArticleBookingWidget provides contextual CTAs
5. ActivityGrid displays Viator activities
6. FAQ sections auto-convert to accordions
7. SEO metadata is properly validated and rendered
8. JSON-LD structured data is generated
9. Images are optimized based on source
10. APIs are cached appropriately

Begin implementation starting with Priority 1. Ask clarifying questions if needed about Keys-specific requirements.

---

**END OF DOCUMENT**


