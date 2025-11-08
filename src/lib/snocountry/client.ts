/**
 * SnoCountry API Client
 * Free ski resort conditions data
 * Documentation: https://www.snocountry.com
 */

import type { SkiConditions, SnoCountryApiResponse } from './types';

const SNOCOUNTRY_API_URL = 'https://feeds.snocountry.net/conditions.php';

/**
 * Fetch ski conditions for Telluride
 * SnoCountry provides free RSS/JSON feeds for ski resort conditions
 */
export async function getTellurideSkiConditions(): Promise<SkiConditions | null> {
  try {
    // SnoCountry free API - no authentication required
    const response = await fetch(`${SNOCOUNTRY_API_URL}?apiKey=demo&ids=304016`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[SnoCountry] API request failed:', response.status);
      return null;
    }

    const data: SnoCountryApiResponse = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.warn('[SnoCountry] No data returned for Telluride');
      return null;
    }

    const resort = data.items[0];
    
    // Transform to our format
    const conditions: SkiConditions = {
      resortName: resort.resortName,
      timestamp: new Date(resort.reportDateTime),
      conditions: {
        newSnow24hr: resort.newSnow24Hours || 0,
        newSnow48hr: resort.newSnow48Hours || 0,
        newSnow72hr: resort.newSnow72Hours || 0,
        baseDepthMin: resort.baseAreaDepth || 0,
        baseDepthMax: resort.topMountainDepth || 0,
        surfaceCondition: resort.surfaceCondition || 'Unknown',
        temperatureHigh: resort.tempHigh || 0,
        temperatureLow: resort.tempLow || 0,
      },
      trails: {
        total: resort.trailsTotal || 0,
        open: resort.trailsOpen || 0,
        percentOpen: resort.trailsTotal > 0 
          ? Math.round((resort.trailsOpen / resort.trailsTotal) * 100) 
          : 0,
      },
      lifts: {
        total: resort.liftsTotal || 0,
        open: resort.liftsOpen || 0,
        percentOpen: resort.liftsTotal > 0 
          ? Math.round((resort.liftsOpen / resort.liftsTotal) * 100) 
          : 0,
      },
      terrainParks: {
        total: resort.terrainParksTotal || 0,
        open: resort.terrainParksOpen || 0,
      },
    };

    console.log('[SnoCountry] Fetched conditions for Telluride:', {
      trails: `${conditions.trails.open}/${conditions.trails.total}`,
      lifts: `${conditions.lifts.open}/${conditions.lifts.total}`,
      newSnow: `${conditions.conditions.newSnow24hr}"`,
    });

    return conditions;
  } catch (error) {
    console.error('[SnoCountry] Error fetching ski conditions:', error);
    return null;
  }
}

/**
 * Format snow depth range
 */
export function formatSnowDepth(min: number, max: number): string {
  if (min === 0 && max === 0) return 'N/A';
  if (min === max) return `${min}"`;
  return `${min}" - ${max}"`;
}

/**
 * Get time since last update
 */
export function getTimeSinceUpdate(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

