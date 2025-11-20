import { readFileSync, writeFileSync } from 'fs';
import { readdirSync } from 'fs';
import { join } from 'path';

const checkDir = (dir) => {
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  const issues = [];

  files.forEach(file => {
    const filePath = join(dir, file);
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
        // Skip if not JSON
      }
    }
  });

  return issues;
};

const blogIssues = checkDir('src/content/blog');
const draftIssues = checkDir('src/content/drafts');
const allIssues = [...blogIssues, ...draftIssues];

if (allIssues.length === 0) {
  console.log('✅ All excerpts are 200 characters or less!');
  process.exit(0);
}

console.log(`Found ${allIssues.length} files with excerpts > 200 chars:\n`);

allIssues.forEach(({ file, filePath, length, excerpt }) => {
  console.log(`${filePath}: ${length} chars`);
  console.log(`  "${excerpt}"\n`);
  
  // Fix the excerpt - shorten to 200 chars max
  let fixed = excerpt;
  if (length > 200) {
    // Cut to 197 chars and add ellipsis
    fixed = excerpt.substring(0, 197).trim();
    // Remove trailing incomplete words
    const lastSpace = fixed.lastIndexOf(' ');
    if (lastSpace > 150) {
      fixed = fixed.substring(0, lastSpace);
    }
    fixed = fixed + '...';
    
    // Ensure it's exactly 200 or less
    if (fixed.length > 200) {
      fixed = fixed.substring(0, 200).trim();
      if (!fixed.endsWith('...')) {
        const lastSpace2 = fixed.lastIndexOf(' ');
        if (lastSpace2 > 150) {
          fixed = fixed.substring(0, lastSpace2) + '...';
        }
      }
    }
  }
  
  // Update the file
  const content = readFileSync(filePath, 'utf8');
  // Escape special regex characters in the excerpt
  const escapedExcerpt = excerpt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const updated = content.replace(
    new RegExp(`"excerpt":\\s*"${escapedExcerpt}"`),
    `"excerpt": "${fixed.replace(/"/g, '\\"')}"`
  );
  writeFileSync(filePath, updated, 'utf8');
  console.log(`  ✅ Fixed to: "${fixed}" (${fixed.length} chars)\n`);
});

console.log(`\n✅ Fixed ${allIssues.length} file(s)`);

