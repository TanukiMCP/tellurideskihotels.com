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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
      <div className="relative h-48" onClick={() => onSelect(hotel.hotel_id)}>
        <ImageWithLoading
          src={imageUrl}
          alt={hotel.name || 'Hotel'}
          className="w-full h-full object-cover"
          onError={() => {}}
        />
        {hotel.star_rating && (
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="bg-white/90 text-gray-800">
              <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
              {hotel.star_rating}
            </Badge>
          </div>
        )}
        {rating > 0 && (
          <div className={`absolute top-2 right-2 ${ratingColor.bg} ${ratingColor.text} ${ratingColor.border} border rounded-full px-2 py-1 text-xs font-semibold`}>
            {rating.toFixed(1)}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{hotel.name}</h3>
        {address && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="line-clamp-1">{address}</span>
          </div>
        )}
        {hotel.review_count && rating > 0 && (
          <p className="text-sm text-gray-600 mb-3">
            {hotel.review_count} review{hotel.review_count !== 1 ? 's' : ''}
          </p>
        )}
        {minPrice !== undefined && (
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(minPrice, currency)}</p>
              <p className="text-sm text-gray-600">per {nights} night{nights !== 1 ? 's' : ''}</p>
            </div>
          </div>
        )}
        <Button
          onClick={() => onSelect(hotel.hotel_id)}
          className="w-full"
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}

