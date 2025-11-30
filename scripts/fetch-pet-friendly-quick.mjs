#!/usr/bin/env node
/**
 * Quick Pet-Friendly Accommodations Fetcher
 * 
 * Fetches hotel details and identifies pet-friendly properties
 * Saves progress incrementally so it can be interrupted and resumed
 * 
 * Usage: node scripts/fetch-pet-friendly-quick.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LITEAPI_PRIVATE_KEY = process.env.LITEAPI_PRIVATE_KEY;
if (!LITEAPI_PRIVATE_KEY) {
  console.error('❌ LITEAPI_PRIVATE_KEY required');
  process.exit(1);
}

const INPUT_CSV = path.join(__dirname, '..', 'src', 'data', 'telluride-hotels.csv');
const OUTPUT_CSV = path.join(__dirname, '..', 'src', 'data', 'pet-friendly-accommodations.csv');
const OUTPUT_JSON = path.join(__dirname, '..', 'src', 'data', 'pet-friendly-accommodations.json');
const PROGRESS_FILE = path.join(__dirname, 'pet-friendly-progress.json');

// Read hotels from CSV
function readHotels() {
  const content = fs.readFileSync(INPUT_CSV, 'utf-8');
  return content.trim().split('\n').slice(1).map(line => {
    const match = line.match(/^([^,]+),(.+)$/);
    return match ? { id: match[1].trim(), name: match[2].replace(/^"|"$/g, '') } : null;
  }).filter(Boolean);
}

// Load progress if exists
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return { processed: [], petFriendly: [], lastIndex: 0 };
}

// Save progress
function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// Fetch hotel details
async function fetchHotel(id) {
  const res = await fetch(`https://api.liteapi.travel/v3.0/data/hotel?hotelId=${id}`, {
    headers: { 'X-API-Key': LITEAPI_PRIVATE_KEY, 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.data || data;
}

// Check if hotel is pet-friendly
function isPetFriendly(hotel) {
  const facilities = hotel.hotelFacilities || [];
  return facilities.some(f => f.toLowerCase().includes('pet'));
}

// Extract pet info
function extractPetInfo(hotel) {
  const facilities = hotel.hotelFacilities || [];
  const petFacilities = facilities.filter(f => f.toLowerCase().includes('pet'));
  const info = hotel.hotelImportantInformation || '';
  
  // Extract pet-related sentences
  const petInfo = info.split(/[.!?]/)
    .filter(s => s.toLowerCase().includes('pet'))
    .join('. ')
    .trim();
  
  // Try to parse fee info
  const feeMatch = info.match(/\$(\d+)/);
  
  return {
    id: hotel.id,
    name: hotel.name,
    petFacilities,
    policyText: petInfo || 'Pet fees and restrictions may apply. Contact property.',
    hasFee: info.toLowerCase().includes('fee'),
    feeAmount: feeMatch ? `$${feeMatch[1]}` : null,
    address: hotel.address,
    city: hotel.city,
    state: hotel.state,
    allFacilities: facilities
  };
}

// Generate CSV
function generateCSV(hotels) {
  const headers = 'id,name,pet_facilities,has_fee,fee_amount,policy_text,address,city';
  const rows = hotels.map(h => [
    h.id,
    `"${(h.name || '').replace(/"/g, '""')}"`,
    `"${(h.petFacilities || []).join('; ')}"`,
    h.hasFee ? 'Yes' : 'Unknown',
    h.feeAmount || '',
    `"${(h.policyText || '').replace(/"/g, '""').substring(0, 200)}"`,
    `"${(h.address || '').replace(/"/g, '""')}"`,
    h.city || ''
  ].join(','));
  return [headers, ...rows].join('\n');
}

async function main() {
  console.log('🐕 Fetching Pet-Friendly Accommodations\n');
  
  const hotels = readHotels();
  let progress = loadProgress();
  
  console.log(`📊 Total hotels: ${hotels.length}`);
  console.log(`   Already processed: ${progress.processed.length}`);
  console.log(`   Pet-friendly found so far: ${progress.petFriendly.length}\n`);
  
  const BATCH_SIZE = 5;
  const DELAY = 1000;
  
  const startIdx = progress.lastIndex;
  const remaining = hotels.slice(startIdx);
  
  console.log(`🔍 Processing ${remaining.length} remaining hotels...\n`);
  
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);
    const currentIdx = startIdx + i;
    
    process.stdout.write(`   Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(remaining.length/BATCH_SIZE)} (${currentIdx + 1}-${currentIdx + batch.length}/${hotels.length})...`);
    
    try {
      const results = await Promise.all(batch.map(async h => {
        try {
          const hotel = await fetchHotel(h.id);
          return { ...h, hotel, error: null };
        } catch (e) {
          return { ...h, hotel: null, error: e.message };
        }
      }));
      
      let newPetFriendly = 0;
      for (const r of results) {
        progress.processed.push(r.id);
        if (r.hotel && isPetFriendly(r.hotel)) {
          const info = extractPetInfo(r.hotel);
          progress.petFriendly.push(info);
          newPetFriendly++;
        }
      }
      
      progress.lastIndex = currentIdx + batch.length;
      saveProgress(progress);
      
      console.log(` ✓ Found ${newPetFriendly} pet-friendly`);
      
    } catch (e) {
      console.log(` ⚠️ Error: ${e.message}`);
    }
    
    await new Promise(r => setTimeout(r, DELAY));
  }
  
  // Save final results
  console.log('\n💾 Saving results...');
  
  fs.writeFileSync(OUTPUT_CSV, generateCSV(progress.petFriendly));
  console.log(`   CSV: ${OUTPUT_CSV}`);
  
  const jsonData = {
    generated: new Date().toISOString(),
    totalHotels: hotels.length,
    processedCount: progress.processed.length,
    petFriendlyCount: progress.petFriendly.length,
    hotels: progress.petFriendly
  };
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(jsonData, null, 2));
  console.log(`   JSON: ${OUTPUT_JSON}`);
  
  // Clean up progress file
  if (progress.processed.length >= hotels.length) {
    fs.unlinkSync(PROGRESS_FILE);
    console.log('   Cleaned up progress file');
  }
  
  console.log(`\n✅ Complete! Found ${progress.petFriendly.length} pet-friendly properties.\n`);
  
  // List them
  console.log('🐕 Pet-Friendly Properties:\n');
  progress.petFriendly.forEach((h, i) => {
    console.log(`${i+1}. ${h.name}`);
    console.log(`   ID: ${h.id}`);
    console.log(`   Facilities: ${h.petFacilities.join(', ')}`);
    console.log(`   Policy: ${h.policyText.substring(0, 100)}${h.policyText.length > 100 ? '...' : ''}`);
    console.log();
  });
}

main().catch(e => {
  console.error('❌ Error:', e);
  process.exit(1);
});



