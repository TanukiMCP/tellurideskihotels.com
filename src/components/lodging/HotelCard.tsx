import { Card } from '@/components/ui/Card';
import { Star, MapPin, TrendingUp, ChevronRight } from 'lucide-react';
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
  variant?: 'default' | 'compact';
  /** Show loading state for prices */
  priceLoading?: boolean;
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
  variant = 'default',
  priceLoading = false,
}: HotelCardProps) {
  const imageUrl = getHotelMainImage(hotel);
  const address = formatHotelAddress(hotel);
  const rating = hotel.review_score || 0;
  const reviewCount = hotel.review_count || 0;
  // Ensure starRating is a valid positive integer (0-5) to avoid Invalid Array Length errors
  const rawStarRating = hotel.star_rating || 0;
  const starRating = Math.max(0, Math.min(5, Math.floor(Number(rawStarRating) || 0)));

  const stripHTML = (html: string): string => {
    if (!html) return '';
    let text = html.replace(/<[^>]*>/g, '');
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#124;/g, '|')
      .replace(/\|/g, ' • ')
      .replace(/\s+/g, ' ')
      .trim();
    return text;
  };

  const descriptionText = hotel.description?.text ? stripHTML(hotel.description.text) : '';

  const getRatingLabel = (score: number) => {
    if (score >= 9) return 'Exceptional';
    if (score >= 8) return 'Excellent';
    if (score >= 7) return 'Very Good';
    if (score >= 6) return 'Good';
    return 'Fair';
  };

  return (
    <Card 
      className={`flex flex-col h-full overflow-hidden rounded-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-neutral-200/60 bg-white ${
        isSelected ? 'ring-2 ring-primary-500 shadow-2xl border-primary-300' : ''
      } ${isHovered ? 'shadow-2xl border-primary-200' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => onSelect(hotel.hotel_id)}
    >
      {/* Image Container */}
      <div className={`relative w-full flex-shrink-0 ${variant === 'compact' ? 'h-[180px]' : 'h-52'}`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={hotel.name || 'Property'}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
        
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        
        {/* Rating Badge - Top Right */}
        {rating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-md">
            <span className="text-sm font-bold text-primary-700">{rating.toFixed(1)}</span>
            <span className="text-xs text-neutral-500">{getRatingLabel(rating)}</span>
          </div>
        )}
        
        {/* Price Badge - Bottom Left (prominent position) */}
        <div className="absolute bottom-3 left-3">
          {priceLoading ? (
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-neutral-500">Loading rates...</span>
              </div>
            </div>
          ) : minPrice && minPrice > 0 ? (
            <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md">
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-neutral-500">From</span>
                <span className="text-lg font-bold text-primary-700">{formatCurrency(minPrice, currency)}</span>
                <span className="text-xs text-neutral-500">/night</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      
      {/* Content Section */}
      <div className="flex flex-col flex-grow p-4">
        {/* Hotel Name */}
        <h3 
          className={`font-bold text-neutral-900 leading-tight line-clamp-1 mb-1.5 group-hover:text-primary-700 transition-colors ${
            variant === 'compact' ? 'text-base' : 'text-lg'
          }`}
          title={hotel.name}
        >
          {hotel.name}
        </h3>
        
        {/* Star Rating + Location Row */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {starRating > 0 && (
            <div className="flex items-center gap-0.5">
              {[...Array(Math.min(starRating, 5))].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          )}
          {address && (
            <div className="flex items-center gap-1 text-xs text-neutral-500">
              <MapPin className="w-3 h-3 text-neutral-400" />
              <span className="line-clamp-1">{address}</span>
            </div>
          )}
        </div>
        
        {/* Review Count with better formatting */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
            <span className="text-xs text-neutral-600">
              <span className="font-semibold">{reviewCount.toLocaleString()}</span> guest {reviewCount === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        )}
        
        {/* Description - Only show in default variant */}
        {variant !== 'compact' && descriptionText && (
          <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
            {descriptionText}
          </p>
        )}
        
        {/* Spacer */}
        <div className="flex-grow"></div>
        
        {/* CTA Button - Always consistent */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(hotel.hotel_id);
          }}
          className={`w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 ${
            variant === 'compact' ? 'py-2.5 text-sm' : 'py-3 text-sm'
          }`}
          type="button"
        >
          View Details & Rates
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </Card>
  );
}

