export const SITE_NAME = 'Telluride Ski Hotels';
export const SITE_DESCRIPTION = 'Search and book the best ski hotels in Telluride, Colorado. Compare prices, read reviews, and book directly.';
export const DEFAULT_LOCATION = 'Telluride';
export const DEFAULT_COUNTRY_CODE = 'US';

export const RATING_COLORS = {
  excellent: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  veryGood: { bg: 'bg-turquoise-100', text: 'text-turquoise-800', border: 'border-turquoise-300' },
  good: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  average: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  poor: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

export function getRatingColor(rating: number) {
  if (rating >= 9) return RATING_COLORS.excellent;
  if (rating >= 8) return RATING_COLORS.veryGood;
  if (rating >= 7) return RATING_COLORS.good;
  if (rating >= 6) return RATING_COLORS.average;
  return RATING_COLORS.poor;
}

