import { defineCollection, z } from 'astro:content';

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string(),
    title: z.string().min(10).max(80),
    slug: z.string(),
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
    author: z.string().default('Telluride Ski Hotels Team'),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    seo: z.object({
      metaTitle: z.string().min(40).max(60),
      metaDescription: z.string().min(140).max(160),
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

