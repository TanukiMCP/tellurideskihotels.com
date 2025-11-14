/**
 * Script to optimize favicon to WebP format
 * Run with: node scripts/optimize-favicon.js
 */

import sharp from 'sharp';
import { join } from 'path';

const publicDir = join(process.cwd(), 'public');

async function optimizeFavicon() {
  try {
    const inputPath = join(publicDir, 'favicon-icon.png');
    const outputPath = join(publicDir, 'favicon-icon.webp');
    
    console.log('Optimizing favicon...');
    
    // Convert to WebP with high quality
    await sharp(inputPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .webp({ quality: 90, lossless: false })
      .toFile(outputPath);
    
    console.log(`✓ Created optimized WebP favicon: ${outputPath}`);
    
    // Also create a smaller version for header
    const smallOutputPath = join(publicDir, 'favicon-icon-small.webp');
    await sharp(inputPath)
      .resize(48, 48, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .webp({ quality: 90, lossless: false })
      .toFile(smallOutputPath);
    
    console.log(`✓ Created small WebP favicon: ${smallOutputPath}`);
    
  } catch (error) {
    console.error('Error optimizing favicon:', error);
    process.exit(1);
  }
}

optimizeFavicon();

