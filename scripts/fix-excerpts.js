import { readFileSync, writeFileSync } from 'fs';
import { readdirSync } from 'fs';
import { join } from 'path';

const blogDir = 'src/content/blog';
const files = readdirSync(blogDir).filter(f => f.endsWith('.md'));

const issues = [];

files.forEach(file => {
  const filePath = join(blogDir, file);
  const content = readFileSync(filePath, 'utf8');
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  
  if (frontmatterMatch) {
    try {
      const frontmatter = JSON.parse(frontmatterMatch[1]);
      if (frontmatter.excerpt) {
        const length = frontmatter.excerpt.length;
        if (length > 200) {
          issues.push({ file, filePath, length, excerpt: frontmatter.excerpt });
        }
      }
    } catch (e) {
      console.error(`Error parsing ${file}:`, e.message);
    }
  }
});

console.log(`Found ${issues.length} files with excerpts > 200 chars:\n`);

issues.forEach(({ file, length, excerpt }) => {
  console.log(`${file}: ${length} chars`);
  console.log(`  "${excerpt}"\n`);
  
  // Fix the excerpt
  let fixed = excerpt;
  if (length > 200) {
    // Try to shorten intelligently
    fixed = excerpt.substring(0, 197) + '...';
    // If that's still too long, cut more aggressively
    if (fixed.length > 200) {
      fixed = excerpt.substring(0, 200).trim();
      // Remove trailing incomplete words
      const lastSpace = fixed.lastIndexOf(' ');
      if (lastSpace > 150) {
        fixed = fixed.substring(0, lastSpace) + '...';
      }
    }
  }
  
  // Update the file
  const content = readFileSync(filePath, 'utf8');
  const updated = content.replace(
    new RegExp(`"excerpt":\\s*"${excerpt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`),
    `"excerpt": "${fixed.replace(/"/g, '\\"')}"`
  );
  writeFileSync(filePath, updated, 'utf8');
  console.log(`  Fixed to: "${fixed}" (${fixed.length} chars)\n`);
});

console.log(`\n✅ Fixed ${issues.length} files`);

