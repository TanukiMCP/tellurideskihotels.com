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

  // Rating color logic - using Telluride sage green palette
  const getRatingStyle = (score: number) => {
    if (score >= 9) return 'bg-primary-600 text-white';
    if (score >= 8) return 'bg-primary-500 text-white';
    if (score >= 7) return 'bg-primary-400 text-white';
    if (score >= 6) return 'bg-accent-500 text-white';
    return 'bg-neutral-500 text-white';
  };

  return (
    <Card 
      className={`flex flex-col h-full overflow-hidden hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-neutral-200/60 ${
        isSelected ? 'ring-2 ring-primary-500 shadow-2xl border-primary-300' : ''
      } ${isHovered ? 'shadow-2xl border-primary-200' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => onSelect(hotel.hotel_id)}
    >
      {/* Image Section with seamless connection to content */}
      <div className="relative h-56 overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={hotel.name || 'Property'}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f5f5f5" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
            <p className="text-neutral-400 text-sm font-medium">No image available</p>
          </div>
        )}
        
        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none z-10" />
        
        {/* Rating Badge - Refined sage green styling - Overlay on top of image */}
        {rating > 0 && (
          <div className={`absolute top-4 right-4 z-20 ${getRatingStyle(rating)} px-3 py-1.5 rounded-md shadow-md backdrop-blur-sm font-semibold text-sm tracking-tight`}>
            {rating.toFixed(1)}
          </div>
        )}
      </div>
      
      {/* Content Section - Enhanced hierarchy and spacing */}
      <div className="flex flex-col flex-grow p-6 bg-white">
        {/* Hotel Name - Hero element with confident typography */}
        <h3 className="font-bold text-2xl text-neutral-900 mb-2.5 leading-tight line-clamp-2 tracking-tight group-hover:text-primary-700 transition-colors">
          {hotel.name}
        </h3>
        
        {/* Star Rating - Subtle, refined */}
        {starRating > 0 && (
          <div className="flex items-center gap-0.5 mb-3">
            {[...Array(starRating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
        )}
        
        {/* Address - Secondary information, softer styling */}
        {address && (
          <div className="flex items-start gap-1.5 text-sm text-neutral-500 mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neutral-400" />
            <span className="line-clamp-1 leading-relaxed">{address}</span>
          </div>
        )}
        
        {/* Review Count - Tertiary, subtle */}
        {reviewCount > 0 && (
          <p className="text-xs text-neutral-500 mb-5 font-medium">
            <span className="font-semibold text-neutral-700">{reviewCount.toLocaleString()}</span> {reviewCount === 1 ? 'review' : 'reviews'}
          </p>
        )}
        
        {/* Spacer to push pricing to bottom */}
        <div className="flex-grow"></div>
        
        {/* Pricing Section - Refined with better visual connection */}
        <div className="mt-auto pt-5 border-t border-neutral-200/80">
          {minPrice && minPrice > 0 ? (
            <>
              <div className="mb-4">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-1.5">From</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-primary-600 tracking-tight">
                    {formatCurrency(minPrice, currency)}
                  </span>
                  <span className="text-sm text-neutral-500 font-normal">/ night</span>
                </div>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(hotel.hotel_id);
                }}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                type="button"
              >
                Check Availability
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-xs text-neutral-500 uppercase tracking-wider font-medium mb-2">
                  Pricing Available
                </p>
                <p className="text-sm text-neutral-600 leading-relaxed font-normal">
                  Select dates to view rates
                </p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(hotel.hotel_id);
                }}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                type="button"
              >
                View Details & Rates
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
