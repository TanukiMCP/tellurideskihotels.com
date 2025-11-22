import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Star, MapPin } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { getHotelMainImage, formatHotelAddress } from '@/lib/liteapi/utils';
import { formatCurrency } from '@/lib/utils';
import { getRatingColor } from '@/lib/constants';
import { format } from 'date-fns';
import { SnowAlertBadge } from '@/components/weather/SnowAlertBadge';

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
  const ratingColor = getRatingColor(rating);

  return (
    <Card 
      className={`overflow-hidden hover:shadow-card-hover transition-all duration-300 group ${
        isSelected ? 'ring-2 ring-primary-600 shadow-card-hover' : ''
      } ${isHovered ? 'shadow-card-hover' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div 
        className="relative h-64 overflow-hidden cursor-pointer" 
        onClick={() => onSelect(hotel.hotel_id)}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={hotel.name || 'Property'}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
            <p className="text-neutral-400 text-sm font-medium">No image available</p>
          </div>
        )}
        
        {/* Star Rating Badge */}
        {hotel.star_rating && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm text-neutral-800 border-0 shadow-sm">
              <Star className="h-3 w-3 mr-1 fill-accent-500 text-accent-500" />
              <span className="font-semibold">{hotel.star_rating}</span>
            </Badge>
          </div>
        )}
        
        {/* Review Score Badge */}
        {rating > 0 && (
          <div className={`absolute top-3 right-3 ${ratingColor.bg} ${ratingColor.text} backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-bold shadow-sm`}>
            {rating.toFixed(1)}
          </div>
        )}
      </div>
      
      <CardContent className="p-6">
        <h3 className="font-bold text-xl mb-2 line-clamp-2 text-neutral-900 min-h-[3rem]">
          {hotel.name}
        </h3>
        
        {address && (
          <div className="flex items-start text-sm text-neutral-600 mb-3">
            <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-1 flex-1 min-w-0" title={address}>{address}</span>
          </div>
        )}
        
        {hotel.review_count && rating > 0 && (
          <p className="text-sm text-neutral-600 mb-3">
            <span className="font-semibold">{hotel.review_count.toLocaleString()}</span> review{hotel.review_count !== 1 ? 's' : ''}
          </p>
        )}
        
        {checkInDate && checkOutDate && (
          <div className="mb-4">
            <SnowAlertBadge checkIn={checkInDate} checkOut={checkOutDate} />
          </div>
        )}
        
        {minPrice !== undefined && minPrice > 0 ? (
          <>
            <div className="mb-5 pb-5 border-b border-neutral-200">
              <div className="flex flex-col">
                <span className="text-xs text-neutral-500 uppercase tracking-wide mb-2">From</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary-600">
                    {formatCurrency(minPrice, currency)}
                  </span>
                  <span className="text-base text-neutral-600">/ night</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onSelect) {
                  onSelect(hotel.hotel_id);
                }
              }}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3.5 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              type="button"
            >
              Check Availability
            </button>
          </>
        ) : (
          <>
            <div className="mb-5 pb-5 border-b border-neutral-200">
              <div className="flex flex-col">
                <span className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Pricing</span>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Check availability to view current rates for this property.
                </p>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onSelect) {
                  onSelect(hotel.hotel_id);
                }
              }}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold py-3.5 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              type="button"
            >
              View Details
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
