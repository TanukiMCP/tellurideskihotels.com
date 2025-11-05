/**
 * Mapbox GL JS Utilities
 * Configuration, styling, and helper functions for Mapbox maps
 */

// Mapbox Configuration
export const MAPBOX_TOKEN = import.meta.env.PUBLIC_MAPBOX_ACCESS_TOKEN;
export const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

// Telluride center point
export const TELLURIDE_CENTER: [number, number] = [-107.8123, 37.9375]; // [lng, lat]
export const DEFAULT_ZOOM = 13; // Increased from 12 for better initial view

// Maximum distance from Telluride center in km to include hotels (filters out outliers like Sawpit)
export const MAX_DISTANCE_FROM_CENTER_KM = 10;

// Hotel marker colors based on state (Colorado high-country sage green)
export function getHotelMarkerColor(state: 'default' | 'hover' | 'selected'): string {
  switch (state) {
    case 'selected':
      return '#3d6548'; // primary-600 (darker sage)
    case 'hover':
      return '#4A7C59'; // primary-500 (sage green)
    default:
      return '#4A7C59'; // primary-500 (sage green)
  }
}

// Get marker size based on state - reduced for less crowding
export function getMarkerSize(state: 'default' | 'hover' | 'selected'): number {
  return state === 'default' ? 24 : 28; // Reduced from 32/36
}

// Get icon size based on marker state
export function getIconSize(markerSize: number): number {
  return markerSize * 0.45; // Reduced from 0.5 for better proportions
}

// Calculate bounds from coordinates array
export function calculateBounds(
  coordinates: Array<{ lng: number; lat: number } | [number, number]>
): [[number, number], [number, number]] | null {
  if (coordinates.length === 0) return null;

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  coordinates.forEach((coord) => {
    const lng = Array.isArray(coord) ? coord[0] : coord.lng;
    const lat = Array.isArray(coord) ? coord[1] : coord.lat;

    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

// Format price for display
export function formatMapPrice(price: number, currency: string = 'USD'): string {
  if (price === 0) return 'View Rates';
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(price);
}

// Padding for bounds fitting - increased for better view
export const MAP_PADDING = {
  top: 80,
  bottom: 80,
  left: 80,
  right: 80,
};

// Max zoom when fitting bounds - reduced to show more area
export const MAX_BOUNDS_ZOOM = 14;

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a hotel is within the acceptable distance from Telluride center
 * Filters out outliers like hotels in Sawpit that skew the map view
 */
export function isHotelNearTelluride(lat: number, lon: number): boolean {
  const distance = calculateDistance(
    TELLURIDE_CENTER[1], // Telluride latitude
    TELLURIDE_CENTER[0], // Telluride longitude
    lat,
    lon
  );
  return distance <= MAX_DISTANCE_FROM_CENTER_KM;
}

/**
 * Find the closest trail/lift to a hotel
 * @param hotelLat Hotel latitude
 * @param hotelLon Hotel longitude
 * @param trails Array of trail features with geometry coordinates
 * @returns The closest trail/lift with distance in meters
 */
export function findClosestTrail(
  hotelLat: number,
  hotelLon: number,
  trails: any[]
): { trail: any; distance: number } | null {
  if (!trails || trails.length === 0) return null;

  let closestTrail = null;
  let minDistance = Infinity;

  trails.forEach((trail) => {
    if (!trail.geometry?.coordinates) return;

    // For LineString, find the closest point on the line
    const coordinates = trail.geometry.coordinates;
    coordinates.forEach((coord: [number, number]) => {
      const distance = calculateDistance(hotelLat, hotelLon, coord[1], coord[0]) * 1000; // Convert to meters
      if (distance < minDistance) {
        minDistance = distance;
        closestTrail = trail;
      }
    });
  });

  return closestTrail ? { trail: closestTrail, distance: minDistance } : null;
}

/**
 * Calculate walking time in minutes based on distance in meters
 * Assumes average walking speed of 5 km/h
 */
export function calculateWalkingTime(distanceMeters: number): number {
  const walkingSpeedKmH = 5;
  const distanceKm = distanceMeters / 1000;
  const timeHours = distanceKm / walkingSpeedKmH;
  return Math.round(timeHours * 60);
}

