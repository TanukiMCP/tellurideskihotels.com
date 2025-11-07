#!/usr/bin/env node

/**
 * Article Generation Helper Script
 * 
 * This script helps create new article files with proper frontmatter structure.
 * Usage: node scripts/generate-article.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRAFTS_DIR = path.join(__dirname, '../src/content/drafts');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Generate slug from title
 */
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Calculate reading time (words per minute = 200)
 */
function calculateReadingTime(wordCount) {
  return Math.ceil(wordCount / 200);
}

/**
 * Generate article ID
 */
function generateId(slug) {
  return `article-${slug}`;
}

/**
 * Create article template
 */
function createArticleTemplate(data) {
  const frontmatter = {
    id: data.id,
    title: data.title,
    slug: data.slug,
    status: data.status || 'scheduled',
    category: data.category,
    author: 'Telluride Ski Hotels Team',
    publishDate: data.publishDate,
    updatedDate: data.updatedDate || data.publishDate,
    seo: {
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      keywords: data.keywords,
      canonical: `https://tellurideskihotels.com/blog/${data.category}/${data.slug}`,
    },
    featured: data.featured || false,
    featuredImage: data.featuredImage || '/images/uploads/placeholder.jpg',
    featuredImageAlt: data.featuredImageAlt,
    excerpt: data.excerpt,
    wordCount: data.wordCount,
    readingTime: calculateReadingTime(data.wordCount),
    relatedHotels: data.relatedHotels || [],
    relatedArticles: data.relatedArticles || [],
    tags: data.tags,
    seasonalRelevance: data.seasonalRelevance || [],
  };

  const body = data.body || `# ${data.title}

## Introduction

[Write your introduction here. Include the primary keyword in the first 100 words.]

## Main Section 1

[Content for first main section]

## Main Section 2

[Content for second main section]

## Main Section 3

[Content for third main section]

## Practical Tips

[Actionable tips and advice]

## Frequently Asked Questions

### Question 1?

Answer to question 1.

### Question 2?

Answer to question 2.

### Question 3?

Answer to question 3.

## Conclusion

[Summarize key takeaways and include a call-to-action]
`;

  return `---
${JSON.stringify(frontmatter, null, 2)}
---

${body}`;
}

/**
 * Interactive article creation
 */
async function createArticleInteractive() {
  log('\n' + '='.repeat(60), 'bright');
  log('📝 Telluride Ski Hotels - Article Generator', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  try {
    // Basic info
    const title = await question(colors.cyan + 'Article Title: ' + colors.reset);
    const slug = generateSlug(title);
    log(`Generated slug: ${slug}`, 'blue');

    const category = await question(
      colors.cyan +
        'Category (destination-guides/ski-guides/hotel-reviews/planning-tips/seasonal-guides/activity-guides/dining-nightlife/family-travel/luxury-travel/budget-travel): ' +
        colors.reset
    );

    const primaryKeyword = await question(colors.cyan + 'Primary Keyword: ' + colors.reset);
    const wordCount = parseInt(await question(colors.cyan + 'Target Word Count: ' + colors.reset));

    // SEO
    const metaTitle = await question(
      colors.cyan + 'Meta Title (50-60 chars): ' + colors.reset
    );
    const metaDescription = await question(
      colors.cyan + 'Meta Description (150-160 chars): ' + colors.reset
    );

    const secondaryKeywords = await question(
      colors.cyan + 'Secondary Keywords (comma-separated): ' + colors.reset
    );
    const keywords = [primaryKeyword, ...secondaryKeywords.split(',').map(k => k.trim())];

    // Tags
    const tagsInput = await question(colors.cyan + 'Tags (comma-separated): ' + colors.reset);
    const tags = tagsInput.split(',').map(t => t.trim());

    // Excerpt
    const excerpt = await question(colors.cyan + 'Excerpt (under 200 chars): ' + colors.reset);

    // Image
    const featuredImage = await question(
      colors.cyan + 'Featured Image Path (or press Enter for placeholder): ' + colors.reset
    );
    const featuredImageAlt = await question(
      colors.cyan + 'Featured Image Alt Text: ' + colors.reset
    );

    // Publishing
    const publishDateStr = await question(
      colors.cyan + 'Publish Date (YYYY-MM-DD or press Enter for today): ' + colors.reset
    );
    const publishDate = publishDateStr
      ? new Date(publishDateStr).toISOString()
      : new Date().toISOString();

    // Create article data
    const articleData = {
      id: generateId(slug),
      title,
      slug,
      category,
      metaTitle: metaTitle || title,
      metaDescription,
      keywords,
      tags,
      excerpt,
      featuredImage: featuredImage || '/images/uploads/placeholder.jpg',
      featuredImageAlt,
      wordCount,
      publishDate,
      status: 'scheduled',
    };

    // Generate template
    const content = createArticleTemplate(articleData);

    // Ensure drafts directory exists
    await fs.mkdir(DRAFTS_DIR, { recursive: true });

    // Write file
    const filename = `${slug}.md`;
    const filepath = path.join(DRAFTS_DIR, filename);

    await fs.writeFile(filepath, content, 'utf-8');

    log('\n✅ Article template created successfully!', 'green');
    log(`📄 File: ${filepath}`, 'blue');
    log(`📅 Scheduled for: ${new Date(publishDate).toLocaleDateString()}`, 'blue');
    log('\n💡 Next steps:', 'yellow');
    log('   1. Open the file and write your content', 'yellow');
    log('   2. Replace placeholder sections with actual content', 'yellow');
    log('   3. Add images and optimize for SEO', 'yellow');
    log('   4. Commit to repository for automatic publishing\n', 'yellow');
  } catch (error) {
    log(`\n❌ Error: ${error.message}\n`, 'red');
    process.exit(1);
  } finally {
    rl.close();
  }
}

/**
 * Create article from command line args
 */
async function createArticleFromArgs(args) {
  const articleData = {
    id: generateId(args.slug),
    title: args.title,
    slug: args.slug,
    category: args.category,
    metaTitle: args.metaTitle || args.title,
    metaDescription: args.metaDescription,
    keywords: args.keywords,
    tags: args.tags,
    excerpt: args.excerpt,
    featuredImage: args.featuredImage || '/images/uploads/placeholder.jpg',
    featuredImageAlt: args.featuredImageAlt,
    wordCount: args.wordCount,
    publishDate: args.publishDate || new Date().toISOString(),
    status: args.status || 'scheduled',
    body: args.body,
  };

  const content = createArticleTemplate(articleData);
  await fs.mkdir(DRAFTS_DIR, { recursive: true });

  const filename = `${args.slug}.md`;
  const filepath = path.join(DRAFTS_DIR, filename);

  await fs.writeFile(filepath, content, 'utf-8');

  return filepath;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createArticleInteractive();
}

export { createArticleFromArgs, createArticleTemplate, generateSlug, calculateReadingTime };

