import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { ImageWithLoading } from '@/components/shared/ImageWithLoading';
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
}

export function HotelCard({ hotel, minPrice, currency = 'USD', nights = 1, onSelect }: HotelCardProps) {
  const imageUrl = getHotelMainImage(hotel) || '/images/placeholder-hotel.jpg';
  const address = formatHotelAddress(hotel);
  const rating = hotel.review_score || 0;
  const ratingColor = getRatingColor(rating);

  return (
    <Card className="overflow-hidden hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:-translate-y-1">
      <div className="relative h-56 overflow-hidden group" onClick={() => onSelect(hotel.hotel_id)}>
        <ImageWithLoading
          src={imageUrl}
          alt={hotel.name || 'Hotel'}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={() => {}}
        />
        {hotel.star_rating && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm text-neutral-800 border-0 shadow-card">
              <Star className="h-3 w-3 mr-1 fill-accent-400 text-accent-400" />
              <span className="font-semibold">{hotel.star_rating}</span>
            </Badge>
          </div>
        )}
        {rating > 0 && (
          <div className={`absolute top-3 right-3 ${ratingColor.bg} ${ratingColor.text} backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-bold shadow-card`}>
            {rating.toFixed(1)}
          </div>
        )}
      </div>
      <CardContent className="p-5">
        <h3 className="font-bold text-xl mb-2 line-clamp-1 text-neutral-900">{hotel.name}</h3>
        {address && (
          <div className="flex items-center text-sm text-neutral-600 mb-3">
            <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="line-clamp-1">{address}</span>
          </div>
        )}
        {hotel.review_count && rating > 0 && (
          <p className="text-sm text-neutral-600 mb-4">
            <span className="font-semibold">{hotel.review_count}</span> review{hotel.review_count !== 1 ? 's' : ''}
          </p>
        )}
        {minPrice !== undefined && (
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <span className="text-3xl font-bold text-neutral-900">{formatCurrency(minPrice, currency)}</span>
              <span className="text-sm text-neutral-600 ml-1">/ night</span>
            </div>
          </div>
        )}
        <Button
          onClick={() => onSelect(hotel.hotel_id)}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold"
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
