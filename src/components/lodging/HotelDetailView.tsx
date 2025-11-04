import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ImageWithLoading } from '@/components/shared/ImageWithLoading';
import { Star, MapPin, Calendar, Users } from 'lucide-react';
import { RoomSelector } from './RoomSelector';
import { AddonsSection } from '@/components/addons/AddonsSection';
import { HotelReviews } from './HotelReviews';
import { CheckoutFlow } from '@/components/checkout/CheckoutFlow';
import type { LiteAPIHotel, LiteAPIRate } from '@/lib/liteapi/types';
import { getHotelImage, formatHotelAddress, getHotelRatingColor, getHotelImages } from '@/lib/liteapi/utils';
import { formatCurrency, calculateNights } from '@/lib/utils';
import { getRatingColor } from '@/lib/constants';
import type { SelectedRoom, SelectedAddon } from '@/lib/types';

export interface HotelDetailViewProps {
  hotel: LiteAPIHotel;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
}

export function HotelDetailView({ hotel, checkIn, checkOut, adults, children = 0 }: HotelDetailViewProps) {
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoom | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const nights = calculateNights(checkIn, checkOut);
  const rating = hotel.review_score || 0;
  const ratingColor = getRatingColor(rating);
  
  // Get images from LiteAPI or fallback to image library
  const apiImages = hotel.images || [];
  const allImages = getHotelImages(hotel);
  const mainImage = allImages[0] || '/images/placeholder-hotel.jpg';
  const galleryImages = allImages.slice(1, 5);

  const handleRoomSelect = (rateId: string, roomData: LiteAPIRate) => {
    const price = roomData.total?.amount || roomData.net?.amount || 0;
    const currency = roomData.total?.currency || roomData.net?.currency || 'USD';

    setSelectedRoom({
      rateId,
      roomId: roomData.room_id,
      roomName: roomData.room_name,
      checkIn,
      checkOut,
      adults,
      children,
      price,
      currency,
    });
  };

  const handleBookNow = () => {
    if (selectedRoom) {
      setShowCheckout(true);
    }
  };

  const handleBookingComplete = (bookingId: string) => {
    setBookingId(bookingId);
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
        addons={selectedAddons}
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

      {/* Description */}
      {hotel.description?.text && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-gray-700 whitespace-pre-line">{hotel.description.text}</p>
          </CardContent>
        </Card>
      )}

      {/* Amenities */}
      {hotel.amenities && hotel.amenities.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {hotel.amenities.map((amenity, index) => (
                <div key={index} className="flex items-center text-sm">
                  <span className="mr-2">✓</span>
                  <span>{amenity.name || amenity.code}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Room Selection */}
      <Card>
        <CardContent className="p-6">
          <RoomSelector
            hotelId={hotel.hotel_id}
            checkIn={checkIn}
            checkOut={checkOut}
            adults={adults}
            children={children}
            onRoomSelect={handleRoomSelect}
          />
        </CardContent>
      </Card>

      {/* Add-ons */}
      {selectedRoom && (
        <Card>
          <CardContent className="p-6">
            <AddonsSection
              hotelId={hotel.hotel_id}
              checkIn={checkIn}
              checkOut={checkOut}
              nights={nights}
              adults={adults}
              children={children}
              onAddonSelect={setSelectedAddons}
            />
          </CardContent>
        </Card>
      )}

      {/* Book Now Button */}
      {selectedRoom && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total for {nights} night{nights !== 1 ? 's' : ''}</p>
              <p className="text-2xl font-bold">
                {formatCurrency(selectedRoom.price + selectedAddons.reduce((sum, a) => sum + a.price, 0), selectedRoom.currency)}
              </p>
            </div>
            <Button onClick={handleBookNow} size="lg">
              Book Now
            </Button>
          </div>
        </div>
      )}

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

