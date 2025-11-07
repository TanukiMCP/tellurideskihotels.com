#!/usr/bin/env node

/**
 * Automated Article Publishing Script
 * 
 * This script runs daily via GitHub Actions to:
 * 1. Check for articles in src/content/drafts/ with publishDate <= today
 * 2. Move them to src/content/blog/
 * 3. Update status from 'scheduled' to 'published'
 * 4. Commit changes to trigger Netlify rebuild
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DRAFTS_DIR = path.join(__dirname, '../src/content/drafts');
const BLOG_DIR = path.join(__dirname, '../src/content/blog');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Parse frontmatter from markdown file
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    throw new Error('No frontmatter found in file');
  }
  
  const [, frontmatterStr, body] = match;
  
  // Parse JSON frontmatter (Astro content collections use JSON in frontmatter)
  let frontmatter;
  try {
    // Remove any YAML-style formatting and parse as JSON
    const jsonStr = frontmatterStr.trim();
    frontmatter = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Failed to parse frontmatter: ${e.message}`);
  }
  
  return { frontmatter, body };
}

/**
 * Serialize frontmatter and body back to markdown
 */
function serializeFrontmatter(frontmatter, body) {
  const frontmatterJson = JSON.stringify(frontmatter, null, 2);
  return `---\n${frontmatterJson}\n---\n\n${body}`;
}

/**
 * Check if article should be published
 */
function shouldPublish(publishDate) {
  const now = new Date();
  const pubDate = new Date(publishDate);
  return pubDate <= now;
}

/**
 * Get all markdown files from a directory
 */
async function getMarkdownFiles(dir) {
  try {
    const files = await fs.readdir(dir);
    return files.filter(file => file.endsWith('.md'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Process a single draft file
 */
async function processDraft(filename) {
  const draftPath = path.join(DRAFTS_DIR, filename);
  const content = await fs.readFile(draftPath, 'utf-8');
  
  try {
    const { frontmatter, body } = parseFrontmatter(content);
    
    // Check if should be published
    if (!shouldPublish(frontmatter.publishDate)) {
      log(`  ⏰ Not yet time: ${frontmatter.title}`, 'yellow');
      return { published: false, title: frontmatter.title };
    }
    
    // Update status to published
    frontmatter.status = 'published';
    
    // Ensure updatedDate is set
    if (!frontmatter.updatedDate) {
      frontmatter.updatedDate = new Date().toISOString();
    }
    
    // Serialize updated content
    const updatedContent = serializeFrontmatter(frontmatter, body);
    
    // Ensure blog directory exists
    await fs.mkdir(BLOG_DIR, { recursive: true });
    
    // Move to blog directory
    const blogPath = path.join(BLOG_DIR, filename);
    await fs.writeFile(blogPath, updatedContent, 'utf-8');
    
    // Remove from drafts
    await fs.unlink(draftPath);
    
    log(`  ✅ Published: ${frontmatter.title}`, 'green');
    return { 
      published: true, 
      title: frontmatter.title,
      slug: frontmatter.slug,
      category: frontmatter.category
    };
    
  } catch (error) {
    log(`  ❌ Error processing ${filename}: ${error.message}`, 'red');
    return { published: false, error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('📰 Telluride Ski Hotels - Article Publishing System', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  
  const startTime = Date.now();
  const now = new Date();
  log(`🕐 Run time: ${now.toLocaleString()}`, 'blue');
  log(`📂 Checking drafts directory: ${DRAFTS_DIR}\n`, 'blue');
  
  try {
    // Get all draft files
    const draftFiles = await getMarkdownFiles(DRAFTS_DIR);
    
    if (draftFiles.length === 0) {
      log('📭 No draft articles found.\n', 'yellow');
      return;
    }
    
    log(`📄 Found ${draftFiles.length} draft article(s)\n`, 'blue');
    
    // Process each draft
    const results = [];
    for (const filename of draftFiles) {
      const result = await processDraft(filename);
      results.push(result);
    }
    
    // Summary
    const published = results.filter(r => r.published);
    const pending = results.filter(r => !r.published && !r.error);
    const errors = results.filter(r => r.error);
    
    log('\n' + '-'.repeat(60), 'bright');
    log('📊 Publishing Summary', 'bright');
    log('-'.repeat(60), 'bright');
    log(`✅ Published: ${published.length}`, 'green');
    log(`⏰ Still pending: ${pending.length}`, 'yellow');
    log(`❌ Errors: ${errors.length}`, errors.length > 0 ? 'red' : 'reset');
    
    if (published.length > 0) {
      log('\n📝 Published Articles:', 'green');
      published.forEach(article => {
        log(`   • ${article.title}`, 'green');
        log(`     /${article.category}/${article.slug}`, 'blue');
      });
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`\n⏱️  Completed in ${duration}s\n`, 'blue');
    
    // Exit with error code if there were errors
    if (errors.length > 0) {
      process.exit(1);
    }
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}\n`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, processDraft, shouldPublish };

