#!/usr/bin/env node
/**
 * Validate blog content against schema limits
 * Supports both .md and .mdx files with YAML or JSON frontmatter
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

/**
 * Extract frontmatter from a markdown/mdx file
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return match[1];
}

/**
 * Extract a value from frontmatter (supports both YAML and JSON formats)
 */
function extractValue(frontmatter, key) {
  // Try JSON format: "key": "value"
  const jsonMatch = frontmatter.match(new RegExp(`"${key}":\\s*"([^"]+)"`));
  if (jsonMatch) return jsonMatch[1];
  
  // Try YAML format: key: "value" or key: 'value'
  const yamlDoubleQuoteMatch = frontmatter.match(new RegExp(`^\\s*${key}:\\s*"([^"]+)"`, 'm'));
  if (yamlDoubleQuoteMatch) return yamlDoubleQuoteMatch[1];
  
  const yamlSingleQuoteMatch = frontmatter.match(new RegExp(`^\\s*${key}:\\s*'([^']+)'`, 'm'));
  if (yamlSingleQuoteMatch) return yamlSingleQuoteMatch[1];
  
  // Try YAML format without quotes (for simple values)
  const yamlUnquotedMatch = frontmatter.match(new RegExp(`^\\s*${key}:\\s*([^\\n\\r"']+)`, 'm'));
  if (yamlUnquotedMatch) return yamlUnquotedMatch[1].trim();
  
  return null;
}

/**
 * Check if frontmatter is valid (not JSON inside YAML delimiters)
 */
function validateFrontmatterFormat(frontmatter, fileName) {
  const errors = [];
  
  // Check for JSON object inside YAML frontmatter (common mistake)
  const trimmed = frontmatter.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    errors.push('Invalid frontmatter: JSON object found inside YAML delimiters. Convert to YAML format.');
  }
  
  // Check for empty lines at the start of frontmatter
  if (frontmatter.startsWith('\n') || frontmatter.startsWith('\r')) {
    errors.push('Invalid frontmatter: Empty lines at start. Remove blank lines after opening ---');
  }
  
  return errors;
}

function validateBlogPost(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const errors = [];
  
  // Extract frontmatter
  const frontmatter = extractFrontmatter(content);
  if (!frontmatter) {
    errors.push('No frontmatter found');
    return errors;
  }
  
  // Validate frontmatter format
  const formatErrors = validateFrontmatterFormat(frontmatter, fileName);
  errors.push(...formatErrors);
  
  // Extract and validate metaTitle
  const metaTitle = extractValue(frontmatter, 'metaTitle');
  if (metaTitle) {
    if (metaTitle.length < SCHEMA_LIMITS.metaTitle.min) {
      errors.push(`metaTitle too short: ${metaTitle.length} chars (min ${SCHEMA_LIMITS.metaTitle.min}): "${metaTitle}"`);
    }
    if (metaTitle.length > SCHEMA_LIMITS.metaTitle.max) {
      errors.push(`metaTitle too long: ${metaTitle.length} chars (max ${SCHEMA_LIMITS.metaTitle.max}): "${metaTitle}"`);
    }
  } else {
    errors.push('Missing metaTitle in seo section');
  }
  
  // Extract and validate metaDescription
  const metaDescription = extractValue(frontmatter, 'metaDescription');
  if (metaDescription) {
    if (metaDescription.length < SCHEMA_LIMITS.metaDescription.min) {
      errors.push(`metaDescription too short: ${metaDescription.length} chars (min ${SCHEMA_LIMITS.metaDescription.min}): "${metaDescription}"`);
    }
    if (metaDescription.length > SCHEMA_LIMITS.metaDescription.max) {
      errors.push(`metaDescription too long: ${metaDescription.length} chars (max ${SCHEMA_LIMITS.metaDescription.max}): "${metaDescription.substring(0, 50)}..."`);
    }
  } else {
    errors.push('Missing metaDescription in seo section');
  }
  
  return errors;
}

function main() {
  try {
    // Get all .md and .mdx files
    const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    let hasErrors = false;
    let passCount = 0;
    
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
      } else {
        passCount++;
      }
    }
    
    if (!hasErrors) {
      console.log(`✅ All ${files.length} blog posts pass validation!\n`);
      process.exit(0);
    } else {
      console.log(`\n📊 Results: ${passCount}/${files.length} passed`);
      console.log('❌ Validation failed. Please fix the errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running validation:', error.message);
    console.error('BLOG_DIR:', BLOG_DIR);
    process.exit(1);
  }
}

main();
