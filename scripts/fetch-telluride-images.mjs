import https from 'https';
import fs from 'fs';
import path from 'path';

const PEXELS_API_KEY = 'Kr3RM9C0wfpwyCa5zLUhidDEOm9CSZQNoA1UiGjjWvWeAViIe8vywIqc';

const queries = [
  'telluride colorado ski resort',
  'telluride mountain village',
  'telluride ski slopes',
  'telluride downtown',
  'telluride gondola',
  'telluride luxury hotel',
];

function fetchPexels(query, perPage = 5) {
  return new Promise((resolve, reject) => {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
    
    const options = {
      headers: {
        'Authorization': PEXELS_API_KEY,
      },
    };

    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🎿 Fetching Telluride images from Pexels...\n');

  const allImages = [];
  
  for (const query of queries) {
    console.log(`Searching: "${query}"...`);
    
    try {
      const result = await fetchPexels(query, 5);
      
      if (result.photos && result.photos.length > 0) {
        result.photos.forEach(photo => {
          allImages.push({
            id: photo.id,
            url: photo.src.large2x,
            medium: photo.src.large,
            small: photo.src.medium,
            photographer: photo.photographer,
            photographer_url: photo.photographer_url,
            query: query,
            alt: photo.alt || query,
          });
        });
        console.log(`  ✓ Found ${result.photos.length} images\n`);
      } else {
        console.log(`  ✗ No images found\n`);
      }
      
      // Rate limiting - wait 1 second between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`  ✗ Error: ${error.message}\n`);
    }
  }

  // Create CSV content
  const csvHeader = 'id,url,medium,small,photographer,photographer_url,query,alt\n';
  const csvRows = allImages.map(img => 
    `${img.id},"${img.url}","${img.medium}","${img.small}","${img.photographer}","${img.photographer_url}","${img.query}","${img.alt}"`
  ).join('\n');
  
  const csvContent = csvHeader + csvRows;

  // Save to CSV file
  const csvPath = path.join(process.cwd(), 'media-library.csv');
  fs.writeFileSync(csvPath, csvContent, 'utf-8');
  
  console.log(`\n✅ Saved ${allImages.length} images to media-library.csv`);
  console.log('\nSample images:');
  allImages.slice(0, 3).forEach(img => {
    console.log(`  • ${img.alt} by ${img.photographer}`);
    console.log(`    ${img.url}\n`);
  });
}

main().catch(console.error);

