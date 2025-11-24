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
  variant?: 'default' | 'compact';
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

  const getRatingStyle = (score: number) => {
    if (score >= 9) return 'bg-primary-600 text-white';
    if (score >= 8) return 'bg-primary-500 text-white';
    if (score >= 7) return 'bg-primary-400 text-white';
    if (score >= 6) return 'bg-accent-500 text-white';
    return 'bg-neutral-500 text-white';
  };

  return (
    <Card 
      className={`flex flex-col h-full overflow-hidden rounded-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-neutral-200/60 ${
        isSelected ? 'ring-2 ring-primary-500 shadow-2xl border-primary-300' : ''
      } ${isHovered ? 'shadow-2xl border-primary-200' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={() => onSelect(hotel.hotel_id)}
    >
      {/* Image Container */}
      <div className={`relative w-full flex-shrink-0 ${variant === 'compact' ? 'h-[200px]' : 'h-56'}`}>
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
        
        {/* Rating Badge */}
        {rating > 0 && (
          <div 
            className={`absolute top-2 right-2 ${getRatingStyle(rating)} px-2.5 py-1 rounded-md shadow-lg backdrop-blur-sm font-semibold text-sm`}
          >
            {rating.toFixed(1)}
          </div>
        )}
      </div>
      
      {/* Content Section */}
      <div className="flex flex-col flex-grow p-4">
        {/* Hotel Name */}
        <h3 
          className={`font-bold text-neutral-900 leading-tight line-clamp-2 mb-2 group-hover:text-primary-700 transition-colors ${
            variant === 'compact' ? 'text-lg' : 'text-xl'
          }`}
          title={hotel.name}
        >
          {hotel.name}
        </h3>
        
        {/* Star Rating */}
        {starRating > 0 && (
          <div className="flex items-center gap-0.5 mb-2">
            {[...Array(starRating)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
        )}
        
        {/* Address */}
        {address && (
          <div className="flex items-start gap-1.5 text-sm text-neutral-500 mb-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-neutral-400" />
            <span className="line-clamp-1">{address}</span>
          </div>
        )}
        
        {/* Review Count */}
        {reviewCount > 0 && (
          <p className="text-xs text-neutral-500 mb-3">
            <span className="font-semibold text-neutral-700">{reviewCount.toLocaleString()}</span> {reviewCount === 1 ? 'review' : 'reviews'}
          </p>
        )}
        
        {/* Description */}
        {descriptionText && (
          <p 
            className={`text-neutral-600 mb-4 line-clamp-3 ${
              variant === 'compact' ? 'text-xs' : 'text-sm'
            }`}
          >
            {descriptionText}
          </p>
        )}
        
        {/* Spacer */}
        <div className="flex-grow"></div>
        
        {/* Price */}
        {minPrice && minPrice > 0 && (
          <div className="mb-3">
            <div className="flex items-baseline gap-1.5">
              <span className={`font-bold text-primary-600 ${
                variant === 'compact' ? 'text-lg' : 'text-xl'
              }`}>
                {formatCurrency(minPrice, currency)}
              </span>
              <span className="text-xs text-neutral-500">/ night</span>
            </div>
          </div>
        )}
              
        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(hotel.hotel_id);
          }}
          className={`w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${
            variant === 'compact' ? 'py-2.5 text-sm' : 'py-3 text-base'
          }`}
          type="button"
        >
          {minPrice && minPrice > 0 
            ? (variant === 'compact' ? 'View Details & Rates' : 'Check Availability')
            : 'View Details & Rates'
          }
        </button>
      </div>
    </Card>
  );
}
