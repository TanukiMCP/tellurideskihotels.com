import { readFile, writeFile, readdir } from 'fs/promises';
import { stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fix image quality in blog posts by updating Pexels URLs to use higher quality settings
 * - Remove h=350 constraint or increase to h=800+
 * - Remove cs=tinysrgb (use default quality)
 * - Add dpr=2 for retina displays
 * - Use w=1200+ for better quality
 */

async function fixImageUrls(content) {
  // Pattern 1: h=350 with cs=tinysrgb - replace with higher quality
  content = content.replace(
    /(https:\/\/images\.pexels\.com\/photos\/[^?]+)\?auto=compress&cs=tinysrgb&h=350/g,
    '$1?auto=compress&w=1200&h=800&fit=crop&dpr=2'
  );
  
  // Pattern 2: h=350 without cs=tinysrgb - still needs fixing
  content = content.replace(
    /(https:\/\/images\.pexels\.com\/photos\/[^?]+)\?auto=compress&h=350/g,
    '$1?auto=compress&w=1200&h=800&fit=crop&dpr=2'
  );
  
  // Pattern 3: h=350 with other params - preserve other params but fix height
  content = content.replace(
    /(https:\/\/images\.pexels\.com\/photos\/[^?]+)\?([^&]*&)?h=350(&|$)/g,
    (match, base, params = '', end) => {
      const cleanParams = params.replace(/&$/, '');
      const separator = cleanParams ? '&' : '';
      return `${base}?${cleanParams}${separator}w=1200&h=800&fit=crop&dpr=2${end === '&' ? '&' : ''}`;
    }
  );
  
  // Pattern 4: cs=tinysrgb anywhere - remove it (it reduces quality)
  content = content.replace(/&cs=tinysrgb/g, '');
  
  // Pattern 5: Featured images with h=650 - upgrade to higher quality
  content = content.replace(
    /(featuredImage:\s*"https:\/\/images\.pexels\.com\/photos\/[^?]+)\?auto=compress[^"]*h=650[^"]*"/g,
    '$1?auto=compress&w=1400&h=900&fit=crop&dpr=2"'
  );
  
  // Pattern 6: Featured images with dpr=2 but low height - upgrade height
  content = content.replace(
    /(featuredImage:\s*"https:\/\/images\.pexels\.com\/photos\/[^?]+)\?auto=compress[^"]*dpr=2[^"]*h=650[^"]*"/g,
    '$1?auto=compress&w=1400&h=900&fit=crop&dpr=2"'
  );
  
  return content;
}

async function getAllFiles(dir, fileList = []) {
  const files = await readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      await getAllFiles(filePath, fileList);
    } else if (file.endsWith('.mdx') || file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

async function main() {
  console.log('🔍 Finding blog post files...');
  
  const blogDir = path.join(__dirname, '..', 'src', 'content', 'blog');
  const blogFiles = await getAllFiles(blogDir);
  
  console.log(`📝 Found ${blogFiles.length} blog post files`);
  
  let totalFixed = 0;
  
  for (const filePath of blogFiles) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const originalContent = content;
      const fixedContent = await fixImageUrls(content);
      
      if (originalContent !== fixedContent) {
        await writeFile(filePath, fixedContent, 'utf-8');
        console.log(`✅ Fixed: ${path.basename(filePath)}`);
        totalFixed++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n✨ Done! Fixed ${totalFixed} files`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

