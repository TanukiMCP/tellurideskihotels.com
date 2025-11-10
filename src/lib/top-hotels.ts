/**
 * Top Hotels Algorithm
 * Calculates balanced score: review_score × log(review_count + 1) × amenity_factor
 * This prevents hotels with few reviews from dominating while rewarding quality + volume
 */

import type { LiteAPIHotel } from './liteapi/types';

interface ScoredHotel extends LiteAPIHotel {
  score: number;
  scoreBreakdown?: {
    reviewScore: number;
    reviewVolume: number;
    amenityScore: number;
  };
}

// Calculate amenity score based on key ski resort amenities
function calculateAmenityScore(hotel: LiteAPIHotel): number {
  if (!hotel.amenities || hotel.amenities.length === 0) return 1;

  const keyAmenities = [
    'wifi', 'free wifi', 'internet',
    'parking', 'free parking',
    'pool', 'hot tub', 'spa', 'sauna',
    'restaurant', 'bar', 'breakfast',
    'fitness', 'gym',
    'ski storage', 'ski', 'ski-in',
    'shuttle', 'transportation'
  ];

  const amenityNames = hotel.amenities.map(a => 
    (a.name || a.code || '').toLowerCase()
  );

  const matchedCount = keyAmenities.filter(key =>
    amenityNames.some(name => name.includes(key))
  ).length;

  // Normalize: 1.0 baseline, up to 1.5x multiplier for exceptional amenities
  return 1.0 + (matchedCount / keyAmenities.length) * 0.5;
}

// Main scoring function
export function calculateHotelScore(hotel: LiteAPIHotel): number {
  const reviewScore = hotel.review_score || 0;
  const reviewCount = hotel.review_count || 0;
  
  // Review score component (0-10 scale)
  const scoreComponent = reviewScore / 10;
  
  // Volume component using log scale to prevent overwhelming by review count
  // log(1) = 0, log(11) ≈ 1, log(101) ≈ 2, log(1001) ≈ 3
  // This gives weight to popular hotels without letting volume dominate
  const volumeComponent = Math.log10(reviewCount + 1);
  
  // Amenity multiplier
  const amenityMultiplier = calculateAmenityScore(hotel);
  
  // Final score: quality × volume × amenities
  // Example: 9.0 rating × log(100 reviews) × 1.3 amenities = 9.0 × 2 × 1.3 = 23.4
  const finalScore = scoreComponent * 10 * volumeComponent * amenityMultiplier;
  
  return finalScore;
}

// Get top N hotels with balanced scoring
export function getTopHotels(hotels: LiteAPIHotel[], count: number = 10): ScoredHotel[] {
  // Filter out hotels without reviews
  const hotelsWithReviews = hotels.filter(h => 
    (h.review_score && h.review_score > 0) || (h.review_count && h.review_count > 0)
  );

  // Calculate scores
  const scoredHotels: ScoredHotel[] = hotelsWithReviews.map(hotel => ({
    ...hotel,
    score: calculateHotelScore(hotel),
    scoreBreakdown: {
      reviewScore: hotel.review_score || 0,
      reviewVolume: Math.log10((hotel.review_count || 0) + 1),
      amenityScore: calculateAmenityScore(hotel)
    }
  }));

  // Sort by score descending and return top N
  return scoredHotels
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// Alternative: Get featured hotels with more strict criteria
export function getFeaturedHotels(hotels: LiteAPIHotel[], count: number = 10): ScoredHotel[] {
  // Only consider hotels with:
  // - Rating >= 8.0
  // - At least 20 reviews
  // - At least 5 amenities
  const qualityHotels = hotels.filter(h => 
    (h.review_score || 0) >= 8.0 &&
    (h.review_count || 0) >= 20 &&
    (h.amenities?.length || 0) >= 5
  );

  return getTopHotels(qualityHotels, count);
}

