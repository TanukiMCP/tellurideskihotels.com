#!/usr/bin/env node

/**
 * Viator Media Library Extraction Script
 * 
 * Fetches all Telluride activities from Viator API and extracts images
 * into categorized CSV files for use in the media library workflow.
 * 
 * Usage: VIATOR_API_KEY=xxx node scripts/fetch-viator-images.mjs
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const VIATOR_API_KEY = process.env.VIATOR_API_KEY || '52c01b37-9eb3-4aca-8bf5-cc6949d011de';
const VIATOR_BASE_URL = process.env.VIATOR_BASE_URL || 'https://api.viator.com/partner';
const TELLURIDE_DESTINATION_ID = '26378';
const MEDIA_LIBRARY_DIR = path.join(__dirname, '../media-library');

// Console colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Activity categories based on keywords in title/description
 */
const ACTIVITY_CATEGORIES = {
  'viator-winter-activities.csv': {
    keywords: ['ski', 'skiing', 'snowboard', 'snow', 'winter', 'ice', 'sled', 'snowshoe', 'powder'],
    description: 'Winter sports and snow activities',
  },
  'viator-hiking-activities.csv': {
    keywords: ['hike', 'hiking', 'trail', 'trek', 'trekking', 'walk', 'walking', 'nature walk'],
    description: 'Hiking and trail activities',
  },
  'viator-biking-activities.csv': {
    keywords: ['bike', 'biking', 'bicycle', 'cycling', 'mountain bike', 'ebike', 'e-bike'],
    description: 'Biking and cycling tours',
  },
  'viator-water-activities.csv': {
    keywords: ['raft', 'rafting', 'kayak', 'river', 'water', 'paddle', 'float', 'fishing', 'fly fishing'],
    description: 'Water sports and river activities',
  },
  'viator-tours-activities.csv': {
    keywords: ['tour', 'guided', 'sightseeing', 'scenic', 'day trip', 'excursion', 'photography'],
    description: 'Guided tours and sightseeing',
  },
  'viator-dining-activities.csv': {
    keywords: ['food', 'dining', 'culinary', 'wine', 'tasting', 'brewery', 'distillery', 'restaurant', 'cooking'],
    description: 'Food tours and culinary experiences',
  },
  'viator-family-activities.csv': {
    keywords: ['family', 'kid', 'kids', 'child', 'children', 'beginner', 'easy', 'gentle'],
    description: 'Family-friendly activities',
  },
  'viator-adventure-activities.csv': {
    keywords: ['adventure', 'climb', 'climbing', 'zip', 'zipline', 'atv', 'off-road', 'extreme', 'via ferrata', 'paraglid', 'hot air balloon'],
    description: 'Adventure sports and extreme activities',
  },
  'viator-wellness-activities.csv': {
    keywords: ['spa', 'wellness', 'yoga', 'meditation', 'relax', 'massage', 'hot spring'],
    description: 'Wellness and relaxation experiences',
  },
  'viator-cultural-activities.csv': {
    keywords: ['museum', 'art', 'gallery', 'history', 'historic', 'cultural', 'heritage', 'festival', 'music', 'film'],
    description: 'Cultural and historical experiences',
  },
};

/**
 * Make authenticated request to Viator API
 */
async function viatorRequest(endpoint, options = {}) {
  const url = `${VIATOR_BASE_URL}${endpoint}`;
  
  const headers = {
    'exp-api-key': VIATOR_API_KEY,
    'Accept': 'application/json;version=2.0',
    'Accept-Language': 'en-US',
    'Content-Type': 'application/json;version=2.0',
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(`Viator API error: ${errorMessage}`);
    }

    return await response.json();
  } catch (error) {
    log(`  ❌ API request failed: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Fetch all Telluride activities with pagination (search endpoint - gets product codes)
 */
async function fetchAllProductCodes() {
  const allProducts = [];
  let start = 0;
  const pageSize = 50;
  let totalCount = 0;
  
  log('\n📥 Fetching all Telluride activity codes from Viator...', 'blue');
  
  do {
    const body = {
      currency: 'USD',
      filtering: {
        destination: TELLURIDE_DESTINATION_ID,
      },
      pagination: {
        start,
        count: pageSize,
      },
    };

    try {
      const response = await viatorRequest('/products/search', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      const products = response.products || [];
      totalCount = response.totalCount || 0;
      
      allProducts.push(...products);
      log(`  ✓ Fetched ${allProducts.length}/${totalCount} product codes`, 'cyan');
      
      start += pageSize;
      
      // Rate limiting - 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      log(`  ❌ Error at page ${start / pageSize}: ${error.message}`, 'red');
      break;
    }
    
  } while (start < totalCount);
  
  log(`\n✅ Total product codes fetched: ${allProducts.length}`, 'green');
  return allProducts;
}

/**
 * Fetch full product details for a single product (includes ALL images)
 */
async function fetchProductDetails(productCode) {
  try {
    const product = await viatorRequest(`/products/${productCode}`, {
      method: 'GET',
      headers: {
        'Accept-Language': 'en-US',
        'Accept-Currency': 'USD',
      },
    });
    return product;
  } catch (error) {
    log(`  ⚠️  Could not fetch details for ${productCode}: ${error.message}`, 'yellow');
    return null;
  }
}

/**
 * Fetch all Telluride activities with FULL details (all images)
 */
async function fetchAllActivities() {
  // First get all product codes from search
  const searchResults = await fetchAllProductCodes();
  
  if (searchResults.length === 0) {
    return [];
  }
  
  // Now fetch full details for each product to get all images
  log('\n📥 Fetching full product details (to get all images)...', 'blue');
  
  const fullProducts = [];
  let processed = 0;
  
  for (const product of searchResults) {
    const fullProduct = await fetchProductDetails(product.productCode);
    
    if (fullProduct) {
      fullProducts.push(fullProduct);
    } else {
      // Fall back to search result if detail fetch fails
      fullProducts.push(product);
    }
    
    processed++;
    if (processed % 5 === 0 || processed === searchResults.length) {
      log(`  ✓ Fetched details for ${processed}/${searchResults.length} products`, 'cyan');
    }
    
    // Rate limiting - 200ms between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  log(`\n✅ Total activities with full details: ${fullProducts.length}`, 'green');
  return fullProducts;
}

/**
 * Categorize a product based on its title and description
 */
function categorizeProduct(product) {
  const text = `${product.title || ''} ${product.description || ''}`.toLowerCase();
  const categories = [];
  
  for (const [filename, config] of Object.entries(ACTIVITY_CATEGORIES)) {
    const hasKeyword = config.keywords.some(keyword => text.includes(keyword.toLowerCase()));
    if (hasKeyword) {
      categories.push(filename);
    }
  }
  
  // If no category matched, put in general
  if (categories.length === 0) {
    categories.push('viator-general-activities.csv');
  }
  
  return categories;
}

/**
 * Get the best image URL from variants (prefer largest)
 */
function getBestImageUrl(variants, targetWidth = 1200) {
  if (!variants || variants.length === 0) return null;
  
  // Sort by width descending
  const sorted = [...variants].sort((a, b) => (b.width || 0) - (a.width || 0));
  
  // Find the variant closest to target width
  let best = sorted[0];
  for (const variant of sorted) {
    if (variant.width && variant.width >= targetWidth) {
      best = variant;
    }
  }
  
  return best;
}

/**
 * Extract images from products and organize by category
 */
function extractAndCategorizeImages(products) {
  const imagesByCategory = {};
  
  // Initialize all categories
  for (const filename of Object.keys(ACTIVITY_CATEGORIES)) {
    imagesByCategory[filename] = [];
  }
  imagesByCategory['viator-general-activities.csv'] = [];
  
  let totalImages = 0;
  
  for (const product of products) {
    if (!product.images || product.images.length === 0) continue;
    
    const categories = categorizeProduct(product);
    
    for (const image of product.images) {
      const largeVariant = getBestImageUrl(image.variants, 1920);
      const mediumVariant = getBestImageUrl(image.variants, 1200);
      const smallVariant = getBestImageUrl(image.variants, 720);
      
      if (!mediumVariant) continue;
      
      // Create image record
      const imageRecord = {
        id: `${product.productCode}-${totalImages}`,
        original_url: largeVariant?.url || mediumVariant.url,
        large_url: largeVariant?.url || mediumVariant.url,
        medium_url: mediumVariant.url,
        small_url: smallVariant?.url || mediumVariant.url,
        width: largeVariant?.width || mediumVariant.width || 0,
        height: largeVariant?.height || mediumVariant.height || 0,
        photographer: 'Viator',
        photographer_url: '',
        alt: image.caption || product.title || 'Telluride activity',
        query: product.title || '',
        source: 'viator',
        product_code: product.productCode,
        product_title: product.title || '',
        category: categories[0].replace('viator-', '').replace('-activities.csv', ''),
        is_cover: image.isCover || false,
      };
      
      // Add to all matching categories
      for (const categoryFile of categories) {
        imagesByCategory[categoryFile].push(imageRecord);
      }
      
      totalImages++;
    }
  }
  
  log(`\n📊 Extracted ${totalImages} total images`, 'green');
  return imagesByCategory;
}

/**
 * Escape CSV field value
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Write images to CSV file
 */
async function writeCSV(filename, images) {
  if (images.length === 0) {
    log(`  ⚠️  No images for ${filename}, skipping`, 'yellow');
    return 0;
  }
  
  const csvPath = path.join(MEDIA_LIBRARY_DIR, filename);
  
  const header = 'id,original_url,large_url,medium_url,small_url,width,height,photographer,photographer_url,alt,query,source,product_code,product_title,category,is_cover';
  
  const rows = images.map(img => {
    return [
      escapeCSV(img.id),
      escapeCSV(img.original_url),
      escapeCSV(img.large_url),
      escapeCSV(img.medium_url),
      escapeCSV(img.small_url),
      img.width,
      img.height,
      escapeCSV(img.photographer),
      escapeCSV(img.photographer_url),
      escapeCSV(img.alt),
      escapeCSV(img.query),
      escapeCSV(img.source),
      escapeCSV(img.product_code),
      escapeCSV(img.product_title),
      escapeCSV(img.category),
      img.is_cover,
    ].join(',');
  });
  
  const content = header + '\n' + rows.join('\n');
  await fs.writeFile(csvPath, content, 'utf-8');
  
  log(`  ✅ Wrote ${images.length} images to ${filename}`, 'green');
  return images.length;
}

/**
 * Main execution
 */
async function main() {
  log('\n' + '='.repeat(70), 'bright');
  log('🎬 Viator Media Library Extraction Script', 'bright');
  log('='.repeat(70) + '\n', 'bright');
  
  // Validate API key
  if (!VIATOR_API_KEY) {
    log('❌ VIATOR_API_KEY environment variable is required', 'red');
    process.exit(1);
  }
  
  log(`📌 API Key: ${VIATOR_API_KEY.substring(0, 8)}...`, 'cyan');
  log(`📌 Base URL: ${VIATOR_BASE_URL}`, 'cyan');
  log(`📌 Destination: Telluride (${TELLURIDE_DESTINATION_ID})`, 'cyan');
  
  const startTime = Date.now();
  
  // Ensure media-library directory exists
  await fs.mkdir(MEDIA_LIBRARY_DIR, { recursive: true });
  
  try {
    // Fetch all activities
    const products = await fetchAllActivities();
    
    if (products.length === 0) {
      log('\n⚠️  No products found. Check API key and destination ID.', 'yellow');
      return;
    }
    
    // Extract and categorize images
    const imagesByCategory = extractAndCategorizeImages(products);
    
    // Write CSV files
    log('\n📝 Writing CSV files...', 'blue');
    
    let totalWritten = 0;
    const categoryStats = [];
    
    for (const [filename, images] of Object.entries(imagesByCategory)) {
      const count = await writeCSV(filename, images);
      totalWritten += count;
      if (count > 0) {
        categoryStats.push({ name: filename, count });
      }
    }
    
    // Summary
    log('\n' + '-'.repeat(70), 'bright');
    log('📊 Summary', 'bright');
    log('-'.repeat(70), 'bright');
    log(`✅ Total activities fetched: ${products.length}`, 'green');
    log(`✅ Total images extracted: ${totalWritten}`, 'green');
    log(`✅ CSV files created: ${categoryStats.length}`, 'green');
    
    log('\n📂 Category breakdown:', 'blue');
    categoryStats.sort((a, b) => b.count - a.count);
    for (const stat of categoryStats) {
      log(`   ${stat.name}: ${stat.count} images`, 'cyan');
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log(`\n⏱️  Completed in ${duration}s\n`, 'blue');
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run main
main();

