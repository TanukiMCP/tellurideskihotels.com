#!/usr/bin/env node

/**
 * Media Library CSV Population Script
 * 
 * Fetches landscape-only images from Pexels API and populates CSV files
 * in the media-library/ directory. Filters out portrait images and avoids duplicates.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MEDIA_LIBRARY_DIR = path.join(__dirname, '../media-library');
const PEXELS_API_KEY = process.env.PEXELS_API_KEY || 'Kr3RM9C0wfpwyCa5zLUhidDEOm9CSZQNoA1UiGjjWvWeAViIe8vywIqc';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * CSV categories and their search queries
 */
const CSV_CATEGORIES = {
  'luxury-ski-hotels.csv': {
    queries: ['luxury ski hotel', 'mountain resort hotel', 'ski resort luxury', 'alpine hotel'],
    perQuery: 8,
  },
  'ski-slopes.csv': {
    queries: ['ski resort slopes', 'skiing mountain', 'ski trails', 'alpine skiing'],
    perQuery: 8,
  },
  'hotel-rooms.csv': {
    queries: ['mountain hotel room', 'ski resort room', 'luxury hotel suite', 'mountain view room'],
    perQuery: 8,
  },
  'ski-lifts.csv': {
    queries: ['ski lift chairlift', 'mountain gondola', 'ski resort lift', 'alpine lift'],
    perQuery: 8,
  },
  'powder-skiing.csv': {
    queries: ['skiing powder snow', 'deep powder skiing', 'fresh snow skiing', 'powder day'],
    perQuery: 8,
  },
  'mountain-villages.csv': {
    queries: ['mountain village town', 'ski town', 'alpine village', 'mountain resort town'],
    perQuery: 8,
  },
  'hotel-spas.csv': {
    queries: ['hotel spa luxury', 'mountain spa', 'resort spa', 'luxury spa'],
    perQuery: 8,
  },
  'restaurants.csv': {
    queries: ['mountain restaurant dining', 'ski resort restaurant', 'alpine dining', 'mountain fine dining'],
    perQuery: 8,
  },
  'winter-landscapes.csv': {
    queries: ['winter mountain landscape', 'snowy mountains', 'alpine winter', 'mountain snow'],
    perQuery: 8,
  },
  'snowboarding.csv': {
    queries: ['snowboarding action', 'snowboard mountain', 'snowboard powder', 'snowboarder'],
    perQuery: 8,
  },
  'hotel-pools.csv': {
    queries: ['hotel pool mountain', 'resort pool', 'mountain view pool', 'outdoor pool snow'],
    perQuery: 8,
  },
  'apres-ski.csv': {
    queries: ['apres ski bar', 'ski bar', 'mountain bar', 'ski resort nightlife'],
    perQuery: 8,
  },
  'ski-equipment.csv': {
    queries: ['ski equipment gear', 'ski rental', 'ski boots', 'skiing gear'],
    perQuery: 8,
  },
  'family-skiing.csv': {
    queries: ['family skiing', 'kids skiing', 'family ski resort', 'beginner skiing'],
    perQuery: 8,
  },
  'gondolas.csv': {
    queries: ['gondola cable car', 'mountain gondola', 'ski gondola', 'cable car mountain'],
    perQuery: 8,
  },
  'mountain-sunsets.csv': {
    queries: ['mountain sunset sunrise', 'alpine sunset', 'mountain golden hour', 'snowy sunset'],
    perQuery: 8,
  },
  'hotel-lobbies.csv': {
    queries: ['hotel lobby luxury', 'resort lobby', 'mountain hotel lobby', 'luxury hotel entrance'],
    perQuery: 8,
  },
  'ski-lessons.csv': {
    queries: ['ski lesson instructor', 'skiing lesson', 'learn to ski', 'ski instructor'],
    perQuery: 8,
  },
  'colorado-mountains.csv': {
    queries: ['colorado mountains', 'rocky mountains', 'colorado alpine', 'colorado peaks'],
    perQuery: 8,
  },
  'hot-tubs.csv': {
    queries: ['hot tub outdoor', 'outdoor hot tub snow', 'mountain hot tub', 'resort hot tub'],
    perQuery: 8,
  },
  'hotel-bedrooms.csv': {
    queries: ['hotel bedroom cozy', 'luxury bedroom', 'mountain view bedroom', 'resort bedroom'],
    perQuery: 8,
  },
  'ski-trails.csv': {
    queries: ['ski trail map', 'mountain trail', 'ski run', 'alpine trail'],
    perQuery: 8,
  },
  'mountain-peaks.csv': {
    queries: ['mountain peak summit', 'alpine peak', 'mountain top', 'snowy peak'],
    perQuery: 8,
  },
  'winter-roads.csv': {
    queries: ['winter mountain road', 'snowy road', 'mountain highway winter', 'winter driving'],
    perQuery: 8,
  },
};

/**
 * Fetch images from Pexels with landscape orientation filter
 */
async function fetchPexelsImages(query, perPage = 20) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.photos || [];
  } catch (error) {
    log(`  ❌ Error fetching images for "${query}": ${error.message}`, 'red');
    return [];
  }
}

/**
 * Read existing CSV file and return set of existing image IDs
 */
async function getExistingImageIds(csvPath) {
  try {
    const content = await fs.readFile(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    if (lines.length <= 1) return new Set(); // Header only or empty
    
    const ids = new Set();
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const id = line.split(',')[0];
      if (id) ids.add(id);
    }
    return ids;
  } catch (error) {
    // File doesn't exist yet, return empty set
    return new Set();
  }
}

/**
 * Filter out portrait images (width < height) as safety check
 */
function isLandscape(photo) {
  return photo.width > photo.height;
}

/**
 * Format image data for CSV
 */
function formatImageForCSV(photo, query) {
  const originalUrl = photo.src.original || photo.src.large2x;
  const largeUrl = photo.src.large2x || photo.src.large;
  const mediumUrl = photo.src.large || photo.src.medium;
  const smallUrl = photo.src.medium || photo.src.small;
  
  // Escape quotes in alt text
  const alt = (photo.alt || query).replace(/"/g, '""');
  const photographer = photo.photographer.replace(/"/g, '""');
  
  return {
    id: photo.id,
    original_url: originalUrl,
    large_url: largeUrl,
    medium_url: mediumUrl,
    small_url: smallUrl,
    width: photo.width,
    height: photo.height,
    photographer: photographer,
    photographer_url: photo.photographer_url,
    alt: alt,
    query: query,
  };
}

/**
 * Write images to CSV file
 */
async function writeCSV(csvPath, images) {
  if (images.length === 0) {
    log(`  ⚠️  No images to write`, 'yellow');
    return;
  }

  const header = 'id,original_url,large_url,medium_url,small_url,width,height,photographer,photographer_url,alt,query\n';
  const rows = images.map(img => {
    return `${img.id},"${img.original_url}","${img.large_url}","${img.medium_url}","${img.small_url}",${img.width},${img.height},"${img.photographer}","${img.photographer_url}","${img.alt}","${img.query}"`;
  }).join('\n');
  
  const content = header + rows;
  await fs.writeFile(csvPath, content, 'utf-8');
  log(`  ✅ Wrote ${images.length} images to ${path.basename(csvPath)}`, 'green');
}

/**
 * Process a single CSV category
 */
async function processCategory(filename, config) {
  const csvPath = path.join(MEDIA_LIBRARY_DIR, filename);
  log(`\n📂 Processing: ${filename}`, 'blue');
  
  // Get existing image IDs to avoid duplicates
  const existingIds = await getExistingImageIds(csvPath);
  log(`  📋 Found ${existingIds.size} existing images`, 'cyan');
  
  const allImages = [];
  
  for (const query of config.queries) {
    log(`  🔍 Fetching: "${query}"...`, 'cyan');
    
    const photos = await fetchPexelsImages(query, config.perQuery);
    
    if (photos.length > 0) {
      // Filter landscape only and remove duplicates
      const newImages = photos
        .filter(photo => isLandscape(photo) && !existingIds.has(photo.id.toString()))
        .map(photo => formatImageForCSV(photo, query));
      
      allImages.push(...newImages);
      newImages.forEach(img => existingIds.add(img.id.toString()));
      
      log(`  ✅ Added ${newImages.length} new landscape images (${photos.length - newImages.length} filtered out)`, 'green');
    } else {
      log(`  ⚠️  No images found`, 'yellow');
    }
    
    // Rate limiting: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Read existing images and merge (only keep landscape ones)
  let existingImages = [];
  if (existingIds.size > 0) {
    try {
      const content = await fs.readFile(csvPath, 'utf-8');
      const lines = content.trim().split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parsing - split by comma, handling quoted fields
        const parts = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            parts.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        parts.push(current.trim());
        
        if (parts.length >= 11) {
          const width = parseInt(parts[5]);
          const height = parseInt(parts[6]);
          // Only keep landscape images from existing file
          if (width > height) {
            existingImages.push({
              id: parts[0],
              original_url: parts[1].replace(/^"|"$/g, ''),
              large_url: parts[2].replace(/^"|"$/g, ''),
              medium_url: parts[3].replace(/^"|"$/g, ''),
              small_url: parts[4].replace(/^"|"$/g, ''),
              width: width,
              height: height,
              photographer: parts[7].replace(/^"|"$/g, ''),
              photographer_url: parts[8].replace(/^"|"$/g, ''),
              alt: parts[9].replace(/^"|"$/g, ''),
              query: parts[10].replace(/^"|"$/g, ''),
            });
          }
        }
      }
    } catch (error) {
      // File doesn't exist, start fresh
    }
  }
  
  // Combine existing and new, remove duplicates by ID
  const imageMap = new Map();
  [...existingImages, ...allImages].forEach(img => {
    if (!imageMap.has(img.id.toString())) {
      imageMap.set(img.id.toString(), img);
    }
  });
  
  const finalImages = Array.from(imageMap.values());
  
  // Write CSV
  await writeCSV(csvPath, finalImages);
  
  return {
    existing: existingImages.length,
    new: allImages.length,
    total: finalImages.length,
  };
}

/**
 * Main execution
 */
async function main() {
  log('\n' + '='.repeat(70), 'bright');
  log('🖼️  Media Library CSV Population Script', 'bright');
  log('='.repeat(70) + '\n', 'bright');
  
  const startTime = Date.now();
  
  // Ensure media-library directory exists
  await fs.mkdir(MEDIA_LIBRARY_DIR, { recursive: true });
  
  const results = {};
  let totalNew = 0;
  let totalExisting = 0;
  
  for (const [filename, config] of Object.entries(CSV_CATEGORIES)) {
    const result = await processCategory(filename, config);
    results[filename] = result;
    totalNew += result.new;
    totalExisting += result.existing;
  }
  
  // Summary
  log('\n' + '-'.repeat(70), 'bright');
  log('📊 Summary', 'bright');
  log('-'.repeat(70), 'bright');
  log(`✅ Total new images added: ${totalNew}`, 'green');
  log(`📋 Total existing images: ${totalExisting}`, 'blue');
  log(`📂 CSV files processed: ${Object.keys(CSV_CATEGORIES).length}`, 'blue');
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log(`⏱️  Completed in ${duration}s\n`, 'blue');
}

// Always run main when script is executed
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}\n`, 'red');
  console.error(error);
  process.exit(1);
});

export { main, fetchPexelsImages, isLandscape };

