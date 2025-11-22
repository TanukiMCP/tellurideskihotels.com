import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = site?.toString().replace(/\/$/, '') || 'https://tellurideskihotels.com';
  
  // Get all blog articles
  const blogArticles = await getCollection('blog', ({ data }) => {
    return data.status === 'published';
  });

  // Static pages
  const staticPages = [
    '',
    '/places-to-stay',
    '/things-to-do',
    '/trail-map',
    '/mountain-conditions',
    '/blog',
    '/about',
    '/contact',
    '/faq',
    '/privacy',
    '/terms',
    '/cancellation-policy',
  ];

  // Blog category pages
  const categories = [
    'destination-guides',
    'ski-guides',
    'hotel-reviews',
    'planning-tips',
    'seasonal-guides',
    'activity-guides',
    'dining-nightlife',
    'family-travel',
    'luxury-travel',
    'budget-travel',
  ];

  // Generate URLs
  const urls: Array<{ loc: string; lastmod: string; changefreq: string; priority: number }> = [];

  // Add static pages
  staticPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page}`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: page === '' ? 1.0 : 0.8,
    });
  });

  // Add blog category pages
  categories.forEach(category => {
    urls.push({
      loc: `${baseUrl}/blog/${category}`,
      lastmod: new Date().toISOString(),
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  // Add blog articles
  blogArticles.forEach(article => {
    urls.push({
      loc: `${baseUrl}/blog/${article.data.category}/${article.slug}`,
      lastmod: article.data.publishDate.toISOString(),
      changefreq: 'monthly',
      priority: 0.6,
    });
  });

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

