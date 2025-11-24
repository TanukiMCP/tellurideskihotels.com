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
  variant?: 'default' | 'compact'; // 'compact' for blog/article context
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
}: HotelCardProps) {
  const imageUrl = getHotelMainImage(hotel);
  const address = formatHotelAddress(hotel);
  const rating = hotel.review_score || 0;
  const reviewCount = hotel.review_count || 0;
  const starRating = hotel.star_rating || 0;

  // Strip HTML tags and clean description text - replace pipes with bullets
  const stripHTML = (html: string): string => {
    if (!html) return '';
    // Remove all HTML tags
    let text = html.replace(/<[^>]*>/g, '');
    // Decode common HTML entities
    text = text
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#124;/g, '|')
      .replace(/\|/g, ' • ') // Replace pipe with bullet
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();
    return text;
  };

  // Get clean description text
  const descriptionText = hotel.description?.text ? stripHTML(hotel.description.text) : '';

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
      className={`flex flex-col h-full overflow-hidden hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-neutral-200/60 p-0 ${
        isSelected ? 'ring-2 ring-primary-500 shadow-2xl border-primary-300' : ''
      } ${isHovered ? 'shadow-2xl border-primary-200' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => onSelect(hotel.hotel_id)}
    >
      {/* Image Section - Flush to top edge, badge overlays */}
      <div className={`relative w-full overflow-hidden ${variant === 'compact' ? 'h-[200px]' : 'h-56'} ${
        !imageUrl ? 'bg-gradient-to-br from-neutral-100 to-neutral-200' : ''
      }`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={hotel.name || 'Property'}
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
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
        
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none z-[10]" />
        
        {/* Rating Badge - Absolutely positioned overlay */}
        {rating > 0 && (
          <div className={`absolute top-3 right-3 z-[20] ${getRatingStyle(rating)} px-2.5 py-1 rounded-md shadow-md backdrop-blur-sm font-semibold text-sm tracking-tight`}>
            {rating.toFixed(1)}
          </div>
        )}
      </div>
      
      {/* Content Section - Proper spacing, no overlap */}
      <div className="flex flex-col flex-grow bg-white p-4">
        {/* Property Name */}
        <h3 className={`font-bold text-neutral-900 leading-tight line-clamp-2 tracking-tight group-hover:text-primary-700 transition-colors mb-3 ${
          variant === 'compact' ? 'text-lg' : 'text-xl'
        }`}>
          {hotel.name}
        </h3>
        
        {/* Star Rating */}
        {starRating > 0 && (
          <div className="flex items-center gap-0.5 mb-3">
            {[...Array(starRating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
        )}
        
        {/* Address */}
        {address && (
          <div className="flex items-start gap-1.5 text-sm text-neutral-500 mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neutral-400" />
            <span className="line-clamp-1 overflow-hidden text-ellipsis whitespace-nowrap">{address}</span>
          </div>
        )}
        
        {/* Review Count */}
        {reviewCount > 0 && (
          <p className="text-xs text-neutral-500 mb-3">
            <span className="font-semibold text-neutral-700">{reviewCount.toLocaleString()}</span> {reviewCount === 1 ? 'review' : 'reviews'}
          </p>
        )}
        
        {/* Description Preview - Fixed height, 16px bottom margin */}
        {descriptionText && (
          <div className={`text-neutral-600 overflow-hidden flex-shrink-0 ${
            variant === 'compact' ? 'text-xs h-[3.5rem] mb-4' : 'text-sm h-[4rem] mb-4'
          }`}>
            <p 
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
                lineHeight: '1.5rem',
                margin: 0,
                padding: 0
              }}
            >
              {descriptionText}
            </p>
          </div>
        )}
        
        {/* Spacer - pushes button to bottom */}
        <div className="flex-grow"></div>
        
        {/* Price */}
        {minPrice && minPrice > 0 && (
          <div className="mb-3 flex-shrink-0">
            <div className="flex items-baseline gap-1.5">
              <span className={`font-bold text-primary-600 tracking-tight ${
                variant === 'compact' ? 'text-lg' : 'text-xl'
              }`}>
                {formatCurrency(minPrice, currency)}
              </span>
              <span className="text-xs text-neutral-500">/ night</span>
            </div>
          </div>
        )}
        
        {/* CTA Button - Explicit 16px top margin if description exists */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(hotel.hotel_id);
          }}
          className={`w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] flex-shrink-0 ${
            variant === 'compact' ? 'py-2.5 px-3 text-sm' : 'py-3 px-4'
          }`}
          style={{ marginTop: descriptionText ? '16px' : '0px' }}
          type="button"
        >
          {minPrice && minPrice > 0 
            ? (variant === 'compact' ? 'View Rates' : 'Check Availability')
            : 'View Details & Rates'
          }
        </button>
      </div>
    </Card>
  );
}
