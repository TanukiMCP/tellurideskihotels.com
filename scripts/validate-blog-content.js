#!/usr/bin/env node
/**
 * Validate blog content against schema limits
 * Run: node scripts/validate-blog-content.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BLOG_DIR = path.join(__dirname, '..', 'src/content/blog');
const SCHEMA_LIMITS = {
  metaTitle: { min: 40, max: 60 },
  metaDescription: { min: 140, max: 160 },
};

function validateBlogPost(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const errors = [];
  
  // Extract metaTitle
  const titleMatch = content.match(/"metaTitle":\s*"([^"]+)"/);
  if (titleMatch) {
    const title = titleMatch[1];
    if (title.length < SCHEMA_LIMITS.metaTitle.min) {
      errors.push(`metaTitle too short: ${title.length} chars (min ${SCHEMA_LIMITS.metaTitle.min})`);
    }
    if (title.length > SCHEMA_LIMITS.metaTitle.max) {
      errors.push(`metaTitle too long: ${title.length} chars (max ${SCHEMA_LIMITS.metaTitle.max}): "${title}"`);
    }
  }
  
  // Extract metaDescription
  const descMatch = content.match(/"metaDescription":\s*"([^"]+)"/);
  if (descMatch) {
    const desc = descMatch[1];
    if (desc.length < SCHEMA_LIMITS.metaDescription.min) {
      errors.push(`metaDescription too short: ${desc.length} chars (min ${SCHEMA_LIMITS.metaDescription.min})`);
    }
    if (desc.length > SCHEMA_LIMITS.metaDescription.max) {
      errors.push(`metaDescription too long: ${desc.length} chars (max ${SCHEMA_LIMITS.metaDescription.max})`);
    }
  }
  
  return errors;
}

function main() {
  try {
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
    let hasErrors = false;
    
    console.log('Validating blog content against schema limits...\n');
    console.log(`Found ${files.length} blog posts to validate\n`);
    
    for (const file of files) {
      const filePath = path.join(BLOG_DIR, file);
      const errors = validateBlogPost(filePath);
      
      if (errors.length > 0) {
        hasErrors = true;
        console.log(`❌ ${file}:`);
        errors.forEach(err => console.log(`   ${err}`));
        console.log('');
      }
    }
    
    if (!hasErrors) {
      console.log('✅ All blog posts pass validation!\n');
      process.exit(0);
    } else {
      console.log('\n❌ Validation failed. Please fix the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running validation:', error.message);
    console.error('BLOG_DIR:', BLOG_DIR);
    process.exit(1);
  }
}

main();

