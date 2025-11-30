#!/usr/bin/env node
/**
 * Fetch Pet-Friendly Accommodations from LiteAPI
 * 
 * This script:
 * 1. Reads all hotel IDs from telluride-hotels.csv
 * 2. Fetches detailed information for each hotel from LiteAPI
 * 3. Identifies pet-friendly properties based on hotelFacilities
 * 4. Extracts pet policy details from hotelImportantInformation and description
 * 5. Creates a comprehensive CSV with pet policy information
 * 
 * Usage: node scripts/fetch-pet-friendly-accommodations.mjs
 * 
 * Requires: LITEAPI_PRIVATE_KEY environment variable
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const LITEAPI_BASE_URL = 'https://api.liteapi.travel/v3.0';
const LITEAPI_PRIVATE_KEY = process.env.LITEAPI_PRIVATE_KEY;

if (!LITEAPI_PRIVATE_KEY) {
  console.error('❌ Error: LITEAPI_PRIVATE_KEY environment variable is required');
  console.log('Set it with: export LITEAPI_PRIVATE_KEY="your-api-key"');
  process.exit(1);
}

// Paths
const INPUT_CSV = path.join(__dirname, '..', 'src', 'data', 'telluride-hotels.csv');
const OUTPUT_CSV = path.join(__dirname, '..', 'src', 'data', 'pet-friendly-accommodations.csv');
const OUTPUT_JSON = path.join(__dirname, '..', 'src', 'data', 'pet-friendly-accommodations.json');

// Pet-related keywords to search for in facilities and descriptions
const PET_KEYWORDS = [
  'pet',
  'pets',
  'pets allowed',
  'pet friendly',
  'pet-friendly',
  'dog',
  'dogs',
  'dogs allowed',
  'dog friendly',
  'dog-friendly',
  'cat',
  'cats',
  'animal',
  'animals'
];

// Keywords that indicate pet restrictions or fees
const PET_POLICY_KEYWORDS = [
  'pet fee',
  'pet deposit',
  'pet charge',
  'pet policy',
  'pet restriction',
  'pet weight',
  'weight limit',
  'pet size',
  'size limit',
  'no pets',
  'pet free',
  'pet cleaning',
  'service animal',
  'assistance animal',
  'max pets',
  'number of pets',
  'breed restriction',
  'breed',
  'additional fee',
  'per night',
  'per stay',
  'refundable',
  'non-refundable',
  'deposit'
];

/**
 * Make a request to LiteAPI
 */
async function liteAPIRequest(endpoint) {
  const url = `${LITEAPI_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-API-Key': LITEAPI_PRIVATE_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LiteAPI error ${response.status}: ${errorText}`);
  }

  return response.json();
}

/**
 * Read hotel IDs from the CSV file
 */
function readHotelIds() {
  const csvContent = fs.readFileSync(INPUT_CSV, 'utf-8');
  const lines = csvContent.trim().split('\n');
  
  // Skip header row
  const hotels = lines.slice(1).map(line => {
    // Handle quoted fields
    const match = line.match(/^([^,]+),(.+)$/);
    if (match) {
      const id = match[1].trim();
      const name = match[2].replace(/^"|"$/g, '').trim();
      return { id, name };
    }
    const parts = line.split(',');
    return { id: parts[0], name: parts.slice(1).join(',').replace(/"/g, '') };
  });
  
  return hotels;
}

/**
 * Check if a hotel has pet-related facilities
 */
function hasPetFacilities(facilities) {
  if (!facilities || !Array.isArray(facilities)) return false;
  
  const facilitiesLower = facilities.map(f => f.toLowerCase());
  return PET_KEYWORDS.some(keyword => 
    facilitiesLower.some(facility => facility.includes(keyword))
  );
}

/**
 * Find specific pet facilities
 */
function findPetFacilities(facilities) {
  if (!facilities || !Array.isArray(facilities)) return [];
  
  return facilities.filter(facility => 
    PET_KEYWORDS.some(keyword => facility.toLowerCase().includes(keyword))
  );
}

/**
 * Extract pet policy information from text
 */
function extractPetPolicyFromText(text) {
  if (!text) return null;
  
  const textLower = text.toLowerCase();
  
  // Check if text contains pet-related content
  const hasPetContent = PET_KEYWORDS.some(keyword => textLower.includes(keyword));
  if (!hasPetContent) return null;
  
  // Split into sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim());
  
  // Find sentences containing pet keywords
  const petSentences = sentences.filter(sentence => 
    PET_KEYWORDS.some(keyword => sentence.toLowerCase().includes(keyword)) ||
    PET_POLICY_KEYWORDS.some(keyword => sentence.toLowerCase().includes(keyword))
  );
  
  return petSentences.length > 0 ? petSentences.join('. ').trim() : null;
}

/**
 * Parse fee information from policy text
 */
function parsePetFees(policyText) {
  if (!policyText) return null;
  
  const fees = {
    hasFee: false,
    feeAmount: null,
    feeType: null, // 'per_night', 'per_stay', 'deposit'
    isRefundable: null,
    weightLimit: null,
    maxPets: null,
    notes: []
  };
  
  const textLower = policyText.toLowerCase();
  
  // Check for fees
  if (textLower.includes('fee') || textLower.includes('charge') || textLower.includes('deposit')) {
    fees.hasFee = true;
    
    // Try to extract dollar amounts
    const dollarMatch = policyText.match(/\$(\d+(?:\.\d{2})?)/);
    if (dollarMatch) {
      fees.feeAmount = parseFloat(dollarMatch[1]);
    }
    
    // Determine fee type
    if (textLower.includes('per night')) {
      fees.feeType = 'per_night';
    } else if (textLower.includes('per stay')) {
      fees.feeType = 'per_stay';
    } else if (textLower.includes('deposit')) {
      fees.feeType = 'deposit';
    }
    
    // Check refundable status
    if (textLower.includes('refundable')) {
      fees.isRefundable = !textLower.includes('non-refundable') && !textLower.includes('nonrefundable');
    }
  }
  
  // Check for weight limits
  const weightMatch = policyText.match(/(\d+)\s*(?:lbs?|pounds?)/i);
  if (weightMatch) {
    fees.weightLimit = parseInt(weightMatch[1]);
  }
  
  // Check for max pets
  const maxPetsMatch = policyText.match(/(?:max(?:imum)?|up to)\s*(\d+)\s*pets?/i);
  if (maxPetsMatch) {
    fees.maxPets = parseInt(maxPetsMatch[1]);
  }
  
  return fees;
}

/**
 * Fetch hotel details and extract pet information
 */
async function fetchHotelDetails(hotelId, hotelName, index, total) {
  try {
    const response = await liteAPIRequest(`/data/hotel?hotelId=${hotelId}`);
    const hotel = response.data || response;
    
    const facilities = hotel.hotelFacilities || [];
    const importantInfo = hotel.hotelImportantInformation || '';
    const description = hotel.hotelDescription || '';
    
    // Check if pet-friendly
    const isPetFriendly = hasPetFacilities(facilities);
    const petFacilities = findPetFacilities(facilities);
    
    // Extract policy info from important information and description
    const policyFromImportantInfo = extractPetPolicyFromText(importantInfo);
    const policyFromDescription = extractPetPolicyFromText(description);
    
    // Combine policy info
    let combinedPolicy = [policyFromImportantInfo, policyFromDescription]
      .filter(Boolean)
      .join(' | ');
    
    // Also check if the name or description mentions pets even if not in facilities
    const nameMentionsPets = PET_KEYWORDS.some(k => hotelName.toLowerCase().includes(k));
    const descMentionsPets = PET_KEYWORDS.some(k => description.toLowerCase().includes(k));
    const infoMentionsPets = PET_KEYWORDS.some(k => importantInfo.toLowerCase().includes(k));
    
    const hasPetMention = isPetFriendly || nameMentionsPets || descMentionsPets || infoMentionsPets;
    
    // Parse fee details
    const feeDetails = parsePetFees(combinedPolicy);
    
    return {
      id: hotelId,
      name: hotel.name || hotelName,
      isPetFriendly,
      petFacilities,
      hasPetMention,
      policyText: combinedPolicy || null,
      feeDetails,
      address: hotel.address,
      city: hotel.city,
      state: hotel.state,
      importantInfo: importantInfo.substring(0, 500), // Truncate for CSV
      allFacilities: facilities
    };
  } catch (error) {
    console.error(`  ⚠️ Error fetching ${hotelId}: ${error.message}`);
    return {
      id: hotelId,
      name: hotelName,
      isPetFriendly: false,
      petFacilities: [],
      hasPetMention: false,
      policyText: null,
      feeDetails: null,
      error: error.message
    };
  }
}

/**
 * Escape CSV field
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
 * Generate CSV content
 */
function generateCSV(petFriendlyHotels) {
  const headers = [
    'id',
    'name',
    'is_pet_friendly',
    'pet_facilities',
    'has_fee',
    'fee_amount',
    'fee_type',
    'is_refundable',
    'weight_limit_lbs',
    'max_pets',
    'policy_text',
    'address',
    'city',
    'state'
  ];
  
  const rows = petFriendlyHotels.map(hotel => [
    escapeCSV(hotel.id),
    escapeCSV(hotel.name),
    escapeCSV(hotel.isPetFriendly ? 'Yes' : 'No'),
    escapeCSV(hotel.petFacilities?.join('; ') || ''),
    escapeCSV(hotel.feeDetails?.hasFee ? 'Yes' : 'No'),
    escapeCSV(hotel.feeDetails?.feeAmount || ''),
    escapeCSV(hotel.feeDetails?.feeType || ''),
    escapeCSV(hotel.feeDetails?.isRefundable === true ? 'Yes' : hotel.feeDetails?.isRefundable === false ? 'No' : ''),
    escapeCSV(hotel.feeDetails?.weightLimit || ''),
    escapeCSV(hotel.feeDetails?.maxPets || ''),
    escapeCSV(hotel.policyText || ''),
    escapeCSV(hotel.address || ''),
    escapeCSV(hotel.city || ''),
    escapeCSV(hotel.state || '')
  ].join(','));
  
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🐕 Fetching Pet-Friendly Accommodations from LiteAPI\n');
  
  // Read hotel IDs
  console.log('📖 Reading hotel IDs from CSV...');
  const hotels = readHotelIds();
  console.log(`   Found ${hotels.length} hotels to process\n`);
  
  // Fetch details for each hotel
  console.log('🔍 Fetching hotel details from LiteAPI...');
  console.log('   (This may take several minutes due to rate limiting)\n');
  
  const allResults = [];
  const petFriendlyHotels = [];
  const hotelsPetMentioned = [];
  
  // Process in batches to avoid rate limiting
  const BATCH_SIZE = 10;
  const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds
  
  for (let i = 0; i < hotels.length; i += BATCH_SIZE) {
    const batch = hotels.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(hotels.length / BATCH_SIZE);
    
    console.log(`   Processing batch ${batchNum}/${totalBatches} (hotels ${i + 1}-${Math.min(i + BATCH_SIZE, hotels.length)})...`);
    
    const batchResults = await Promise.all(
      batch.map((hotel, idx) => 
        fetchHotelDetails(hotel.id, hotel.name, i + idx + 1, hotels.length)
      )
    );
    
    allResults.push(...batchResults);
    
    // Categorize results
    for (const result of batchResults) {
      if (result.isPetFriendly) {
        petFriendlyHotels.push(result);
      }
      if (result.hasPetMention && !result.isPetFriendly) {
        hotelsPetMentioned.push(result);
      }
    }
    
    // Delay between batches
    if (i + BATCH_SIZE < hotels.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
  }
  
  // Summary
  console.log('\n📊 Results Summary:');
  console.log(`   Total hotels processed: ${allResults.length}`);
  console.log(`   Pet-friendly (explicit): ${petFriendlyHotels.length}`);
  console.log(`   Pet-mentioned (in text): ${hotelsPetMentioned.length}`);
  console.log(`   Errors: ${allResults.filter(r => r.error).length}\n`);
  
  // Combine pet-friendly and pet-mentioned for comprehensive list
  const allPetRelated = [...petFriendlyHotels, ...hotelsPetMentioned];
  
  // Generate and save CSV
  console.log('💾 Saving CSV file...');
  const csvContent = generateCSV(allPetRelated);
  fs.writeFileSync(OUTPUT_CSV, csvContent, 'utf-8');
  console.log(`   Saved to: ${OUTPUT_CSV}`);
  
  // Save JSON for more detailed data
  console.log('💾 Saving JSON file...');
  const jsonData = {
    generated: new Date().toISOString(),
    totalHotels: hotels.length,
    petFriendlyCount: petFriendlyHotels.length,
    petMentionedCount: hotelsPetMentioned.length,
    petFriendlyHotels: petFriendlyHotels.map(h => ({
      id: h.id,
      name: h.name,
      isPetFriendly: h.isPetFriendly,
      petFacilities: h.petFacilities,
      feeDetails: h.feeDetails,
      policyText: h.policyText,
      address: h.address,
      city: h.city,
      state: h.state,
      allFacilities: h.allFacilities
    })),
    petMentionedHotels: hotelsPetMentioned.map(h => ({
      id: h.id,
      name: h.name,
      hasPetMention: h.hasPetMention,
      policyText: h.policyText,
      address: h.address,
      city: h.city,
      state: h.state
    }))
  };
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(jsonData, null, 2), 'utf-8');
  console.log(`   Saved to: ${OUTPUT_JSON}\n`);
  
  // List pet-friendly properties
  if (petFriendlyHotels.length > 0) {
    console.log('🐕 Pet-Friendly Properties Found:\n');
    petFriendlyHotels.forEach((hotel, idx) => {
      console.log(`   ${idx + 1}. ${hotel.name}`);
      console.log(`      ID: ${hotel.id}`);
      console.log(`      Facilities: ${hotel.petFacilities?.join(', ') || 'N/A'}`);
      if (hotel.policyText) {
        console.log(`      Policy: ${hotel.policyText.substring(0, 100)}...`);
      }
      console.log();
    });
  }
  
  console.log('✅ Done!');
}

// Run
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});




