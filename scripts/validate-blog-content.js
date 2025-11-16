#!/usr/bin/env node
/**
 * Validate blog content against schema limits
 * Run: node scripts/validate-blog-content.js
 */

const fs = require('fs');
const path = require('path');

const BLOG_DIR = path.join(process.cwd(), 'src/content/blog');
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
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'));
  let hasErrors = false;
  
  console.log('Validating blog content against schema limits...\n');
  
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
    console.log('✅ All blog posts pass validation!');
    process.exit(0);
  } else {
    console.log('❌ Validation failed. Please fix the errors above.');
    process.exit(1);
  }
}

main();

