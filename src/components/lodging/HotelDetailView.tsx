import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ImageWithLoading } from '@/components/shared/ImageWithLoading';
import { Star, MapPin } from 'lucide-react';
import { RoomSelectorCard } from './RoomSelectorCard';
import { HotelReviews } from './HotelReviews';
import { CheckoutFlow } from '@/components/checkout/CheckoutFlow';
import type { LiteAPIHotel, LiteAPIRate } from '@/lib/liteapi/types';
import { formatHotelAddress, getHotelImages } from '@/lib/liteapi/utils';
import { getRatingColor } from '@/lib/constants';
import type { SelectedRoom } from '@/lib/types';

export interface HotelDetailViewProps {
  hotel: LiteAPIHotel;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
}

export function HotelDetailView({ hotel, checkIn, checkOut, adults, children = 0 }: HotelDetailViewProps) {
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoom | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const rating = hotel.review_score || 0;
  const ratingColor = getRatingColor(rating);
  
  // Get images from LiteAPI only - no fallbacks
  const allImages = getHotelImages(hotel);
  const mainImage = allImages[0];
  const galleryImages = allImages.slice(1, 5);
  
  // Don't render if no images available
  if (!mainImage) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Hotel images not available</p>
      </div>
    );
  }

  const handleBookingReady = (bookingData: {
    rateId: string;
    roomData: LiteAPIRate;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  }) => {
    const price = bookingData.roomData.total?.amount || bookingData.roomData.net?.amount || 0;
    const currency = bookingData.roomData.total?.currency || bookingData.roomData.net?.currency || 'USD';

    setSelectedRoom({
      rateId: bookingData.rateId,
      roomId: bookingData.roomData.room_id,
      roomName: bookingData.roomData.room_name,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      adults: bookingData.adults,
      children: bookingData.children,
      price,
      currency,
    });
    
    setShowCheckout(true);
  };

  const handleBookingComplete = (bookingId: string) => {
    setShowCheckout(false);
    if (typeof window !== 'undefined') {
      window.location.href = `/booking/confirmation/${bookingId}`;
    }
  };

  if (showCheckout && selectedRoom) {
    return (
      <CheckoutFlow
        hotelId={hotel.hotel_id}
        hotelName={hotel.name || ''}
        room={selectedRoom}
        addons={[]}
        onComplete={handleBookingComplete}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
            {formatHotelAddress(hotel) && (
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{formatHotelAddress(hotel)}</span>
              </div>
            )}
            <div className="flex items-center gap-4">
              {hotel.star_rating && (
                <Badge variant="secondary">
                  <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                  {hotel.star_rating} Stars
                </Badge>
              )}
              {rating > 0 && (
                <div className={`${ratingColor.bg} ${ratingColor.text} ${ratingColor.border} border rounded-full px-3 py-1 text-sm font-semibold`}>
                  {rating.toFixed(1)} / 10
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <ImageWithLoading
            src={mainImage}
            alt={hotel.name || 'Hotel'}
            className="w-full h-96 object-cover rounded-lg"
          />
        </div>
        {galleryImages.map((imgUrl, index) => (
          <ImageWithLoading
            key={index}
            src={imgUrl}
            alt={`${hotel.name} - Image ${index + 2}`}
            className="w-full h-48 object-cover rounded-lg"
          />
        ))}
      </div>

      {/* Hotel Info Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hotel.star_rating && (
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-accent-500 fill-accent-500" />
              <div className="text-2xl font-bold text-neutral-900">{hotel.star_rating} Stars</div>
              <div className="text-sm text-neutral-600">Hotel Rating</div>
            </CardContent>
          </Card>
        )}
        
        {rating > 0 && (
          <Card>
            <CardContent className="p-4 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${ratingColor.bg} mb-2`}>
                <span className={`text-2xl font-bold ${ratingColor.text}`}>{rating.toFixed(1)}</span>
              </div>
              <div className="text-sm text-neutral-600">
                {hotel.review_count ? `${hotel.review_count.toLocaleString()} reviews` : 'Guest Rating'}
              </div>
            </CardContent>
          </Card>
        )}
        
        {hotel.location && (
          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-primary-600" />
              <div className="text-sm font-semibold text-neutral-900">Prime Location</div>
              <div className="text-xs text-neutral-600">Telluride, Colorado</div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Description */}
      {hotel.description?.text && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-neutral-900">About This Hotel</h2>
            <div 
              className="text-neutral-700 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: hotel.description.text.replace(/\n/g, '<br/>') }}
            />
          </CardContent>
        </Card>
      )}

      {/* Amenities */}
      {hotel.amenities && hotel.amenities.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-neutral-900">Hotel Amenities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {hotel.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center text-sm bg-neutral-50 rounded-lg p-3 border border-neutral-200">
                  <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-neutral-700 font-medium">{amenity.name || amenity.code}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room Selection */}
      <RoomSelectorCard
        hotelId={hotel.hotel_id}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        initialAdults={adults}
        initialChildren={children}
        onBookingReady={handleBookingReady}
      />

      {/* Reviews */}
      <Card>
        <CardContent className="p-6">
          <HotelReviews
            averageRating={rating}
            reviewCount={hotel.review_count}
          />
        </CardContent>
      </Card>
    </div>
  );
}

