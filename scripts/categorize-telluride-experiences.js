/**
 * Categorization Script for Telluride Experiences
 * Extracts all experiences from the live tellurideskihotels.com/things-to-do page
 * and generates a JSON file for manual categorization
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'telluride-experience-categories.json');

async function extractExperiences() {
  console.log('🚀 Starting experience extraction...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('📄 Navigating to https://tellurideskihotels.com/things-to-do...');
    await page.goto('https://tellurideskihotels.com/things-to-do', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    // Wait for activities to load
    console.log('⏳ Waiting for activities to load...');
    await page.waitForSelector('a[href*="/things-to-do/"]', { timeout: 15000 });
    
    // Extract all experience data
    const experiences = await page.evaluate(() => {
      const experienceLinks = Array.from(document.querySelectorAll('a[href*="/things-to-do/"]'));
      const seen = new Set();
      const results = [];
      
      experienceLinks.forEach((link) => {
        const href = link.getAttribute('href');
        if (!href) return;
        
        const match = href.match(/\/things-to-do\/([^\/\?]+)/);
        if (!match) return;
        
        const productCode = match[1];
        if (seen.has(productCode)) return;
        seen.add(productCode);
        
        // Extract title
        const titleElement = link.querySelector('h3, [class*="title"], [class*="name"]');
        const title = titleElement?.textContent?.trim() || link.textContent?.trim() || '';
        
        // Extract description
        const descElement = link.querySelector('p, [class*="description"], [class*="desc"]');
        const description = descElement?.textContent?.trim() || '';
        
        // Extract duration
        const durationMatch = link.textContent?.match(/(\d+[hH]\s*\d+[mM]|\d+[hH]|\d+\s*hour|\d+\s*min)/i);
        const duration = durationMatch ? durationMatch[0] : '';
        
        // Extract rating
        const ratingMatch = link.textContent?.match(/(\d+\.?\d*)\s*\((\d+)\)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
        const reviewCount = ratingMatch ? parseInt(ratingMatch[2]) : null;
        
        // Extract price
        const priceMatch = link.textContent?.match(/\$(\d+(?:\.\d+)?)/);
        const price = priceMatch ? parseFloat(priceMatch[1]) : null;
        
        results.push({
          productCode,
          title,
          description,
          duration,
          rating,
          reviewCount,
          price,
          // categories will be manually added
          categories: [],
        });
      });
      
      return results;
    });
    
    console.log(`✅ Extracted ${experiences.length} experiences`);
    
    // Save to JSON file
    const dataDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(experiences, null, 2), 'utf-8');
    console.log(`💾 Saved to ${OUTPUT_FILE}`);
    console.log('\n📝 Next steps:');
    console.log('1. Open the JSON file and manually add categories array to each experience');
    console.log('2. Categories should be one or more of:');
    console.log('   - "winter-sports"');
    console.log('   - "summer-adventures"');
    console.log('   - "adventure"');
    console.log('   - "family-friendly"');
    console.log('   - "tours-sightseeing"');
    console.log('   - "experiences"');
    console.log('   - "water-activities"');
    console.log('   - "land-activities"');
    console.log('   - "climbing"');
    console.log('   - "driving-tours"');
    
  } catch (error) {
    console.error('❌ Error extracting experiences:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the extraction
extractExperiences().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

