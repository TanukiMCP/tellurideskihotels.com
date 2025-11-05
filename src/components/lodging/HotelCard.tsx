import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Star, MapPin } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { getHotelMainImage, formatHotelAddress } from '@/lib/liteapi/utils';
import { formatCurrency } from '@/lib/utils';
import { getRatingColor } from '@/lib/constants';

export interface HotelCardProps {
  hotel: LiteAPIHotel;
  minPrice?: number;
  currency?: string;
  nights?: number;
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

  // Only render if we have an image
  if (!imageUrl) {
    return null;
  }

  return (
    <Card 
      className={`overflow-hidden hover:shadow-card-hover transition-all duration-300 group ${
        isSelected ? 'ring-2 ring-primary-600 shadow-card-hover' : ''
      } ${isHovered ? 'shadow-card-hover' : ''}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div 
        className="relative h-56 overflow-hidden cursor-pointer" 
        onClick={() => onSelect(hotel.hotel_id)}
      >
        <img
          src={imageUrl}
          alt={hotel.name || 'Hotel'}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
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
      
      <CardContent className="p-5">
        <h3 className="font-bold text-xl mb-2 line-clamp-1 text-neutral-900">
          {hotel.name}
        </h3>
        
        {address && (
          <div className="flex items-start text-sm text-neutral-600 mb-3">
            <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{address}</span>
          </div>
        )}
        
        {hotel.review_count && rating > 0 && (
          <p className="text-sm text-neutral-600 mb-4">
            <span className="font-semibold">{hotel.review_count.toLocaleString()}</span> review{hotel.review_count !== 1 ? 's' : ''}
          </p>
        )}
        
        {minPrice !== undefined && minPrice > 0 ? (
          <>
            <div className="mb-4 pb-4 border-b border-neutral-200">
              <div className="flex flex-col">
                <span className="text-xs text-neutral-500 uppercase tracking-wide mb-1">From</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-primary-600">
                    {formatCurrency(minPrice, currency)}
                  </span>
                  <span className="text-sm text-neutral-600">/ night</span>
                </div>
              </div>
            </div>
            
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(hotel.hotel_id);
              }}
              className="w-full"
              variant="primary"
            >
              View Details & Book
            </Button>
          </>
        ) : (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(hotel.hotel_id);
            }}
            className="w-full"
            variant="primary"
          >
            View Details & Check Rates
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
