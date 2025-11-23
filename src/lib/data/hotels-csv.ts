/**
 * Utility to read hotel data from CSV file
 * Lightweight alternative to JSON for manual curation
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface HotelEntry {
  id: string;
  name: string;
}

/**
 * Read hotels from CSV file
 * Returns array of hotel entries with id and name
 */
export function readHotelsFromCSV(): HotelEntry[] {
  try {
    const csvPath = join(process.cwd(), 'src', 'data', 'telluride-hotels.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    
    const lines = csvContent.trim().split('\n');
    const hotels: HotelEntry[] = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line (handles quoted values with commas)
      const match = line.match(/^([^,]+),"?([^"]*(?:"[^"]*"[^"]*)*)"?$/);
      if (match) {
        const [, id, name] = match;
        hotels.push({
          id: id.trim(),
          name: name.trim().replace(/^"|"$/g, '').replace(/""/g, '"'),
        });
      } else {
        // Simple split if no quotes
        const [id, ...nameParts] = line.split(',');
        if (id && nameParts.length > 0) {
          hotels.push({
            id: id.trim(),
            name: nameParts.join(',').trim(),
          });
        }
      }
    }
    
    return hotels;
  } catch (error) {
    console.error('[Hotels CSV] Error reading CSV file:', error);
    return [];
  }
}

/**
 * Find hotel by ID
 */
export function findHotelById(hotelId: string): HotelEntry | undefined {
  const hotels = readHotelsFromCSV();
  return hotels.find(h => h.id === hotelId);
}

/**
 * Find hotels by name (case-insensitive partial match)
 */
export function findHotelsByName(searchName: string): HotelEntry[] {
  const hotels = readHotelsFromCSV();
  const lowerSearch = searchName.toLowerCase();
  return hotels.filter(h => 
    h.name.toLowerCase().includes(lowerSearch)
  );
}

