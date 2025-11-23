import { Card } from '@/components/ui/Card';
import { Star, MapPin } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { getHotelMainImage, formatHotelAddress } from '@/lib/liteapi/utils';
import { formatCurrency } from '@/lib/utils';

export interface HotelCardProps {
  hotel: LiteAPIHotel;
  minPrice?: number;
  currency?: string;
  nights?: number;
  checkInDate?: string;
  checkOutDate?: string;
  onSelect: (hotelId: string) => void;
  isSelected?: boolean;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function HotelCard({ 
  hotel, 
  minPrice, 
  currency = 'USD', 
  nights: _nights = 1, 
  checkInDate,
  checkOutDate,
  onSelect,
  isSelected = false,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
}: HotelCardProps) {
  const imageUrl = getHotelMainImage(hotel);
  const address = formatHotelAddress(hotel);
  const rating = hotel.review_score || 0;
  const reviewCount = hotel.review_count || 0;
  const starRating = hotel.star_rating || 0;

  // Rating color logic
  const getRatingStyle = (score: number) => {
    if (score >= 9) return 'bg-green-600 text-white';
    if (score >= 8) return 'bg-emerald-600 text-white';
    if (score >= 7) return 'bg-blue-600 text-white';
    if (score >= 6) return 'bg-amber-500 text-white';
    return 'bg-neutral-600 text-white';
  };

  return (
    <Card 
      className={`flex flex-col h-full overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer ${
        isSelected ? 'ring-2 ring-primary-600 shadow-xl' : ''
      } ${isHovered ? 'shadow-xl' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => onSelect(hotel.hotel_id)}
    >
      {/* Image Section - Fixed Height */}
      <div className="relative h-56 overflow-hidden bg-neutral-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={hotel.name || 'Property'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f5f5f5" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
            <p className="text-neutral-400 text-sm font-medium">No image available</p>
          </div>
        )}
        
        {/* Rating Badge - Top Right */}
        {rating > 0 && (
          <div className={`absolute top-3 right-3 ${getRatingStyle(rating)} px-3 py-2 rounded-lg shadow-lg font-bold text-lg`}>
            {rating.toFixed(1)}
          </div>
        )}
      </div>
      
      {/* Content Section - Flex Grow */}
      <div className="flex flex-col flex-grow p-6">
        {/* Hotel Name - Fixed Height */}
        <h3 className="font-bold text-xl text-neutral-900 mb-3 leading-tight h-14 overflow-hidden">
          {hotel.name}
        </h3>
        
        {/* Star Rating */}
        {starRating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            {[...Array(starRating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
        )}
        
        {/* Address */}
        {address && (
          <div className="flex items-start gap-2 text-sm text-neutral-600 mb-3">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5 text-neutral-400" />
            <span className="line-clamp-2 leading-relaxed">{address}</span>
          </div>
        )}
        
        {/* Review Count */}
        {reviewCount > 0 && (
          <p className="text-sm text-neutral-600 mb-4">
            <span className="font-semibold text-neutral-900">{reviewCount.toLocaleString()}</span> {reviewCount === 1 ? 'review' : 'reviews'}
          </p>
        )}
        
        {/* Spacer to push pricing to bottom */}
        <div className="flex-grow"></div>
        
        {/* Pricing Section */}
        <div className="mt-auto pt-4 border-t border-neutral-200">
          {minPrice && minPrice > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-xs text-neutral-500 uppercase tracking-wide font-semibold mb-1">From</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary-600">
                    {formatCurrency(minPrice, currency)}
                  </span>
                  <span className="text-base text-neutral-600 font-medium">/ night</span>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(hotel.hotel_id);
                }}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                type="button"
              >
                Check Availability
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Select dates to view pricing
                </p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(hotel.hotel_id);
                }}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
                type="button"
              >
                View Details
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
