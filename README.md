# Telluride Ski Hotels

A comprehensive lodging search and content platform for Telluride, Colorado ski resorts.

## Features

- **Lodging Search & Booking**: Real-time availability and booking for places to stay through LiteAPI
- **Content Management System**: AI-driven content generation and automated publishing
- **SEO Optimization**: Comprehensive keyword strategy and on-page optimization
- **Image Library**: Automated Pexels integration for high-quality imagery
- **Admin Dashboard**: Booking management and analytics
- **Weather Integration**: Real-time weather and snow conditions

## Content Generation System

This project includes a sophisticated content generation and publishing system:

### Key Components

1. **Content Schema** (`src/content/config.ts`)
   - Structured content collections with validation
   - SEO metadata and frontmatter
   - Category and tag taxonomy

2. **SEO Keywords Masterlist** (`SEO_KEYWORDS_MASTERLIST.md`)
   - 300+ researched keywords
   - Organized by search volume and intent
   - Content cluster strategy

3. **Publishing Schedule** (`CONTENT_PUBLISHING_SCHEDULE.md`)
   - 270 articles planned for Year 1
   - Daily publishing (Months 1-6)
   - Every other day (Months 7-12)

4. **Master Prompt** (`MASTER_ARTICLE_GENERATION_PROMPT.md`)
   - Comprehensive AI writing guidelines
   - Brand voice and style guide
   - SEO optimization checklist
   - Content templates

### Automation

#### GitHub Actions Workflows

**Article Publishing** (`.github/workflows/publish-articles.yml`)
- Runs daily at 9 AM EST
- Moves scheduled articles from drafts to published
- Triggers Netlify rebuild

**Image Library Refresh** (`.github/workflows/refresh-image-library.yml`)
- Runs bi-weekly (1st and 15th)
- Fetches fresh images from Pexels API
- Updates image library automatically

### Scripts

```bash
# Generate new article template
npm run generate-article

# Manually publish scheduled articles
npm run publish-articles

# Refresh image library
npm run refresh-images
```

## Content Workflow

### 1. Planning (Days 1-2)
- Review publishing schedule
- Research competitors
- Gather data and sources
- Identify linking opportunities

### 2. Content Generation (Days 3-4)
- Use Master Prompt with AI assistant
- Generate content section by section
- Review and refine
- Ensure keyword integration

### 3. SEO Optimization (Day 5)
- Optimize metadata
- Check keyword density
- Add internal/external links
- Verify readability

### 4. Images & Formatting (Day 6)
- Select images from library
- Write alt text
- Format content
- Add CTAs

### 5. Schedule & Publish (Day 7)
- Final quality check
- Create markdown file
- Set publish date
- Commit to drafts folder
- Auto-publish via GitHub Actions

## Project Structure

```
tellurideskihotels.com/
├── src/
│   ├── content/
│   │   ├── blog/          # Published articles
│   │   ├── drafts/        # Scheduled articles
│   │   └── config.ts      # Content schema
│   ├── components/
│   │   ├── blog/          # Blog components
│   │   ├── lodging/       # Lodging components
│   │   └── ...
│   ├── layouts/
│   │   ├── BlogLayout.astro
│   │   └── BaseLayout.astro
│   ├── pages/
│   │   ├── blog/          # Blog routes
│   │   ├── lodging/       # Lodging routes
│   │   └── ...
│   └── lib/               # Utilities
├── scripts/
│   ├── generate-article.js
│   ├── publish-scheduled-articles.js
│   └── refresh-image-library.js
├── .github/
│   └── workflows/         # GitHub Actions
├── public/
│   └── images/
│       └── image-library.json
├── SEO_KEYWORDS_MASTERLIST.md
├── CONTENT_PUBLISHING_SCHEDULE.md
└── MASTER_ARTICLE_GENERATION_PROMPT.md
```

## Environment Variables

Required for content system:

```env
PEXELS_API_KEY=your_pexels_api_key
NETLIFY_BUILD_HOOK=your_netlify_build_hook_url
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Content Guidelines

### SEO Best Practices
- Primary keyword in title, H1, first 100 words
- Meta description 150-160 characters
- 5-10 internal links per article
- 2-4 authoritative external links
- Images with descriptive alt text

### Writing Style
- Conversational but professional
- Specific details and examples
- Honest pros and cons
- Actionable advice
- Mobile-friendly formatting

### Quality Checklist
- [ ] Meets word count target
- [ ] Original, valuable content
- [ ] Facts verified
- [ ] No spelling/grammar errors
- [ ] Natural keyword usage
- [ ] Proper heading hierarchy
- [ ] Images optimized
- [ ] Internal links added
- [ ] CTA included

## Performance Tracking

### Metrics Monitored
- Organic traffic by article
- Keyword rankings (top 10, 20, 50)
- Click-through rate from SERPs
- Time on page
- Conversion rate (bookings)
- Bounce rate

### Goals
- 100,000+ organic sessions (Year 1)
- 50+ keywords in top 10
- 200+ keywords in top 50
- 500+ bookings from content
- 5,000+ newsletter subscribers

## License

Proprietary - All rights reserved

## Support

For questions or issues, contact the development team.
