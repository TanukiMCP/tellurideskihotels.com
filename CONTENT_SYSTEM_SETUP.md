# Content System Setup Guide

## Quick Start

The content generation system is now fully installed and ready to use. Follow these steps to get started.

## 1. Environment Setup

Add these environment variables to your `.env` file and Netlify:

```env
# Required for image library
PEXELS_API_KEY=your_pexels_api_key_here

# Required for automatic deployments
NETLIFY_BUILD_HOOK=your_netlify_build_hook_url
```

### Getting API Keys

**Pexels API:**
1. Sign up at https://www.pexels.com/api/
2. Get your free API key
3. Add to environment variables

**Netlify Build Hook:**
1. Go to Netlify Dashboard → Site Settings → Build & Deploy
2. Scroll to "Build hooks"
3. Click "Add build hook"
4. Name it "Content Publishing" and select branch
5. Copy the webhook URL

## 2. Initial Image Library Setup

Run this once to populate your image library:

```bash
npm run refresh-images
```

This will fetch ~600 curated images from Pexels organized by category.

## 3. Create Your First Article

### Option A: Interactive Generator

```bash
npm run generate-article
```

Follow the prompts to create an article template.

### Option B: Manual Creation

1. Create a new file in `src/content/drafts/`
2. Use this template:

```markdown
---
{
  "id": "article-your-slug",
  "title": "Your Article Title (50-60 chars)",
  "slug": "your-slug",
  "status": "scheduled",
  "category": "destination-guides",
  "author": "Telluride Ski Hotels Team",
  "publishDate": "2025-11-15T14:00:00Z",
  "seo": {
    "metaTitle": "Meta Title (50-60 chars)",
    "metaDescription": "Meta description 150-160 characters",
    "keywords": ["primary keyword", "secondary keyword"],
    "canonical": "https://tellurideskihotels.com/blog/category/slug"
  },
  "featured": false,
  "featuredImage": "/images/uploads/article.jpg",
  "featuredImageAlt": "Descriptive alt text",
  "excerpt": "Short summary under 200 characters",
  "wordCount": 2500,
  "readingTime": 13,
  "relatedHotels": [],
  "relatedArticles": [],
  "tags": ["telluride", "skiing"],
  "seasonalRelevance": ["winter"]
}
---

# Your Article Title

## Introduction

Your content here...
```

## 4. Content Generation Workflow

### Using AI Assistant (Recommended)

1. **Open your AI assistant** (Claude, GPT-4, or Cursor AI)

2. **Provide the Master Prompt:**
   - Copy entire contents of `MASTER_ARTICLE_GENERATION_PROMPT.md`
   - Paste into AI assistant

3. **Give Article Brief:**
   ```
   Using the Master Prompt, create an article:
   
   Title: "Best Hotels in Telluride: Top 15 Places to Stay"
   Primary Keyword: best hotels in telluride (1,900/mo)
   Word Count: 2,800
   Content Type: Listicle
   Category: hotel-reviews
   
   Include:
   - 15 hotel recommendations
   - Pros/cons for each
   - Price ranges
   - Booking tips
   - FAQ section
   ```

4. **Generate Section by Section:**
   - Request outline first
   - Generate introduction
   - Generate each main section
   - Generate FAQ
   - Generate conclusion

5. **Review and Refine:**
   - Check keyword usage
   - Verify facts
   - Add internal links
   - Optimize for SEO

### Manual Writing

If writing manually, follow the guidelines in `MASTER_ARTICLE_GENERATION_PROMPT.md`:
- Use conversational, professional tone
- Include specific details and examples
- Optimize for target keywords
- Add 5-10 internal links
- Include 2-4 external authoritative links
- Add images every 300-400 words

## 5. Publishing Process

### Automatic Publishing (Recommended)

1. Save article to `src/content/drafts/your-article.md`
2. Set `publishDate` to desired date
3. Set `status: "scheduled"`
4. Commit and push to GitHub
5. GitHub Actions will automatically publish at 9 AM EST on the scheduled date

### Manual Publishing

```bash
# Publish all scheduled articles now
npm run publish-articles
```

Or manually move file from `drafts/` to `blog/` and change status to `"published"`.

## 6. Content Schedule

Follow the publishing schedule in `CONTENT_PUBLISHING_SCHEDULE.md`:

- **Months 1-6:** 1 article per day (180 articles)
- **Months 7-12:** 1 article every other day (90 articles)
- **Total Year 1:** 270 articles

### Weekly Workflow

**Monday-Tuesday:** Research
- Review schedule for week
- Analyze competitors
- Gather data and sources

**Wednesday-Thursday:** Content Generation
- Use AI with Master Prompt
- Generate section by section
- Review and refine

**Friday:** SEO Optimization
- Optimize metadata
- Check keyword density
- Add links

**Saturday:** Images & Formatting
- Select images
- Write alt text
- Format content

**Sunday:** Schedule & Publish
- Final quality check
- Commit to drafts
- Auto-publish Monday 9 AM

## 7. SEO Strategy

### Keyword Research

Refer to `SEO_KEYWORDS_MASTERLIST.md` for:
- 300+ researched keywords
- Search volumes
- Competition levels
- Content clusters

### On-Page SEO Checklist

- [ ] Primary keyword in title, H1, first 100 words
- [ ] Meta description 150-160 characters
- [ ] URL slug optimized
- [ ] 5-10 internal links
- [ ] 2-4 external authoritative links
- [ ] Images with alt text
- [ ] H2 every 300-400 words
- [ ] FAQ section included

## 8. Image Management

### Automatic Refresh

Images are automatically refreshed bi-weekly via GitHub Actions.

### Manual Refresh

```bash
npm run refresh-images
```

### Using Images in Articles

Images are stored in `public/images/image-library.json` organized by:
- skiing
- hotels
- mountains
- activities
- town
- food

Reference in articles:
```markdown
![Alt text](/images/uploads/skiing-telluride-powder.jpg)
```

## 9. Quality Control

Before publishing, verify:

**Content Quality:**
- [ ] Meets word count target
- [ ] Original, valuable content
- [ ] Facts verified and accurate
- [ ] No spelling/grammar errors
- [ ] Natural keyword usage

**SEO:**
- [ ] All SEO elements optimized
- [ ] Internal links added
- [ ] External sources cited
- [ ] Images optimized

**Structure:**
- [ ] Clear heading hierarchy
- [ ] Short paragraphs (2-4 sentences)
- [ ] Bullet points and lists
- [ ] FAQ section
- [ ] Conclusion with CTA

## 10. Performance Tracking

### Metrics to Monitor

- Organic traffic by article
- Keyword rankings (top 10, 20, 50)
- Time on page
- Bounce rate
- Conversion rate (hotel bookings)

### Tools

- Google Search Console
- Google Analytics 4
- SEMrush or Ahrefs
- Netlify Analytics

### Goals

**Per Article (after 6 months):**
- 500+ monthly sessions
- Top 10 for primary keyword
- 3+ minute time on page
- <60% bounce rate
- 2%+ conversion rate

**Year 1 Totals:**
- 100,000+ organic sessions
- 50+ keywords in top 10
- 200+ keywords in top 50
- 500+ hotel bookings from content

## 11. Troubleshooting

### Articles Not Publishing

1. Check `publishDate` is in the past
2. Verify `status: "scheduled"` in frontmatter
3. Check GitHub Actions logs
4. Manually run: `npm run publish-articles`

### Images Not Loading

1. Verify Pexels API key is set
2. Check `public/images/image-library.json` exists
3. Run: `npm run refresh-images`

### Build Errors

1. Check frontmatter JSON is valid
2. Verify all required fields are present
3. Run: `npm run build` locally to test

## 12. Advanced Features

### Content Clusters

Organize articles into topic clusters (see `SEO_KEYWORDS_MASTERLIST.md`):
- 1 pillar article (3,000+ words)
- 8-12 spoke articles (2,000-2,500 words)
- All interlinked

### Related Articles

Specify related articles in frontmatter:
```json
"relatedArticles": ["article-slug-1", "article-slug-2"]
```

### Related Hotels

Link to hotel pages:
```json
"relatedHotels": ["hotel-id-1", "hotel-id-2"]
```

### Seasonal Content

Tag seasonal relevance:
```json
"seasonalRelevance": ["winter", "spring"]
```

## 13. Maintenance

### Weekly
- Monitor published articles
- Check for broken links
- Review performance metrics

### Monthly
- Update top-performing articles
- Add new internal links
- Refresh statistics and data

### Quarterly
- Major content refresh for pillar articles
- Update seasonal information
- Fix any SEO issues
- Analyze and adjust strategy

## 14. Best Practices

### Writing
- Be specific with details (elevations, distances, prices)
- Use conversational but professional tone
- Include pros and cons honestly
- Provide actionable advice

### SEO
- Natural keyword integration (0.5-1.5% density)
- Descriptive anchor text for links
- Unique meta descriptions
- Mobile-friendly formatting

### Conversion
- Natural CTAs throughout content
- Clear path to hotel booking
- Trust signals (reviews, ratings)
- Specific recommendations

## 15. Resources

**Documentation:**
- `SEO_KEYWORDS_MASTERLIST.md` - Keyword research
- `CONTENT_PUBLISHING_SCHEDULE.md` - Publishing calendar
- `MASTER_ARTICLE_GENERATION_PROMPT.md` - Writing guidelines

**Scripts:**
- `scripts/generate-article.js` - Create article templates
- `scripts/publish-scheduled-articles.js` - Publish articles
- `scripts/refresh-image-library.js` - Update images

**Workflows:**
- `.github/workflows/publish-articles.yml` - Auto-publishing
- `.github/workflows/refresh-image-library.yml` - Image refresh

## Support

For questions or issues:
1. Check this guide first
2. Review the Master Prompt documentation
3. Check GitHub Actions logs
4. Contact the development team

---

**You're all set! Start creating amazing content for Telluride Ski Hotels.**

