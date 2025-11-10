/**
 * HotelMapPopup Component
 * Popup displayed when clicking a hotel marker on the map
 */
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { formatMapPrice } from '@/lib/mapbox-utils';
import { formatHotelAddress } from '@/lib/liteapi/utils';

interface HotelMapPopupProps {
  hotel: LiteAPIHotel;
  minPrice?: number;
  currency?: string;
  checkInDate?: string;
  onViewDetails: () => void;
}

export default function HotelMapPopup({ 
  hotel, 
  minPrice = 0,
  currency = 'USD',
  checkInDate,
  onViewDetails
}: HotelMapPopupProps) {
  // Get primary image from LiteAPI only
  const primaryImage = hotel.images?.[0]?.url;
  
  // Don't render popup if no image available - this prevents empty popups
  if (!primaryImage) {
    return (
      <div className="min-w-[200px] p-3">
        <h3 className="font-semibold text-neutral-900 mb-2">{hotel.name}</h3>
        {formatHotelAddress(hotel) && (
          <p className="text-sm text-neutral-600 mb-3">{formatHotelAddress(hotel)}</p>
        )}
        <button
          onClick={onViewDetails}
          className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
        >
          View Details
        </button>
      </div>
    );
  }
  
  // Format price
  const priceDisplay = minPrice > 0 ? formatMapPrice(minPrice, currency) : 'View Rates';
  
  return (
    <div className="w-[280px]">
      {/* Hero Image */}
      <div className="relative w-full h-[140px] mb-3 rounded-lg overflow-hidden">
        <img 
          src={primaryImage}
          alt={hotel.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Price Badge */}
        <div className="absolute top-2 right-2 bg-white px-2.5 py-1.5 rounded-md shadow-md">
          {checkInDate && minPrice > 0 && (
            <div className="text-[10px] text-gray-600 mb-0.5">
              Next: {new Date(checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
          <div className="font-semibold text-sm text-primary-600">
            {priceDisplay}
          </div>
        </div>
        
        {/* Star Rating */}
        {hotel.star_rating && hotel.star_rating > 0 && (
          <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded-md shadow-md">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={i < hotel.star_rating! ? 'text-accent-500' : 'text-gray-300'}
                  style={{ fontSize: '12px' }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hotel Name */}
      <h3 className="text-sm font-bold text-neutral-900 mb-2 line-clamp-2 leading-tight">
        {hotel.name}
      </h3>

      {/* Location */}
      <div className="flex items-start gap-1.5 mb-2">
        <svg className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <p className="text-xs text-gray-600 line-clamp-1">
          {hotel.address?.city || hotel.address?.line1 || 'Telluride, CO'}
        </p>
      </div>

      {/* Guest Rating */}
      {hotel.review_score && hotel.review_score > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="bg-primary-600 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
            {hotel.review_score.toFixed(1)}
          </span>
          <span className="text-xs text-gray-600">
            {hotel.review_count ? `${hotel.review_count} reviews` : 'Guest rating'}
          </span>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={onViewDetails}
        className="w-full inline-flex items-center justify-center gap-1.5 bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors mt-3"
      >
        View Details
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}

