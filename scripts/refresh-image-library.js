#!/usr/bin/env node

/**
 * Image Library Refresh Script
 * 
 * Fetches curated images from Pexels API and updates the image library.
 * Runs bi-weekly via GitHub Actions to keep fresh content.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGE_LIBRARY_PATH = path.join(__dirname, '../public/images/image-library.json');
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

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
 * Image categories and search queries
 */
const IMAGE_CATEGORIES = {
  skiing: {
    queries: [
      'telluride skiing',
      'colorado skiing',
      'ski resort',
      'powder skiing',
      'ski slopes',
      'ski lift',
      'snowboarding',
      'ski mountain',
    ],
    perQuery: 20,
  },
  hotels: {
    queries: [
      'luxury hotel room',
      'ski resort hotel',
      'mountain hotel',
      'hotel lobby',
      'hotel suite',
      'boutique hotel',
      'hotel amenities',
      'ski lodge',
    ],
    perQuery: 20,
  },
  mountains: {
    queries: [
      'colorado mountains',
      'snowy mountains',
      'mountain peaks',
      'mountain landscape',
      'alpine scenery',
      'mountain village',
      'ski town',
      'mountain sunset',
    ],
    perQuery: 15,
  },
  activities: {
    queries: [
      'apres ski',
      'mountain dining',
      'ski equipment',
      'hot tub snow',
      'mountain spa',
      'winter activities',
      'ski lessons',
      'snowshoeing',
    ],
    perQuery: 15,
  },
  town: {
    queries: [
      'mountain town',
      'ski village',
      'colorado town',
      'alpine village',
      'winter town',
      'mountain street',
    ],
    perQuery: 10,
  },
  food: {
    queries: [
      'restaurant interior',
      'fine dining',
      'mountain restaurant',
      'cozy restaurant',
      'bar interior',
      'breakfast restaurant',
    ],
    perQuery: 10,
  },
};

/**
 * Fetch images from Pexels
 */
async function fetchPexelsImages(query, perPage = 20) {
  if (!PEXELS_API_KEY) {
    throw new Error('PEXELS_API_KEY environment variable not set');
  }

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
 * Process and format image data
 */
function formatImageData(photo, category, query) {
  return {
    id: photo.id,
    category,
    subcategory: query,
    url: photo.src.large2x,
    thumbnail: photo.src.medium,
    width: photo.width,
    height: photo.height,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    alt: photo.alt || `${query} - ${category}`,
    avgColor: photo.avg_color,
  };
}

/**
 * Main execution
 */
async function main() {
  log('\n' + '='.repeat(60), 'bright');
  log('🖼️  Telluride Ski Hotels - Image Library Refresh', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  const startTime = Date.now();

  try {
    const imageLibrary = {
      lastUpdated: new Date().toISOString(),
      totalImages: 0,
      categories: {},
      images: [],
    };

    let totalFetched = 0;

    // Fetch images for each category
    for (const [category, config] of Object.entries(IMAGE_CATEGORIES)) {
      log(`📂 Processing category: ${category}`, 'blue');
      imageLibrary.categories[category] = {
        queries: config.queries,
        count: 0,
      };

      for (const query of config.queries) {
        log(`  🔍 Fetching: "${query}"...`, 'cyan');

        const photos = await fetchPexelsImages(query, config.perQuery);

        if (photos.length > 0) {
          const formattedImages = photos.map(photo => formatImageData(photo, category, query));
          imageLibrary.images.push(...formattedImages);
          imageLibrary.categories[category].count += photos.length;
          totalFetched += photos.length;

          log(`  ✅ Added ${photos.length} images`, 'green');
        }

        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      log(`  📊 Category total: ${imageLibrary.categories[category].count} images\n`, 'blue');
    }

    imageLibrary.totalImages = totalFetched;

    // Write to file
    await fs.mkdir(path.dirname(IMAGE_LIBRARY_PATH), { recursive: true });
    await fs.writeFile(IMAGE_LIBRARY_PATH, JSON.stringify(imageLibrary, null, 2), 'utf-8');

    // Summary
    log('-'.repeat(60), 'bright');
    log('📊 Refresh Summary', 'bright');
    log('-'.repeat(60), 'bright');
    log(`✅ Total images fetched: ${totalFetched}`, 'green');
    log(`📂 Categories: ${Object.keys(IMAGE_CATEGORIES).length}`, 'blue');
    log(`💾 Saved to: ${IMAGE_LIBRARY_PATH}`, 'blue');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`⏱️  Completed in ${duration}s\n`, 'blue');
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

export { main, fetchPexelsImages, formatImageData };

