import { useState, useEffect } from 'react';
import { HotelCard } from '@/components/lodging/HotelCard';
import { ImageGallery } from '@/components/lodging/ImageGallery';
import type { LiteAPIHotel } from '@/lib/liteapi/types';

interface HotelShowcaseProps {
  hotelId: string;
  showGallery?: boolean;
  checkIn?: string;
  checkOut?: string;
}

export function HotelShowcase({ 
  hotelId, 
  showGallery = false,
  checkIn,
  checkOut 
}: HotelShowcaseProps) {
  const [hotel, setHotel] = useState<LiteAPIHotel | null>(null);

  useEffect(() => {
    async function fetchHotel() {
      // Default dates: 1 week out from today, 1 week duration
      const defaultCheckIn = new Date();
      defaultCheckIn.setDate(defaultCheckIn.getDate() + 7);
      const defaultCheckOut = new Date(defaultCheckIn);
      defaultCheckOut.setDate(defaultCheckOut.getDate() + 7);
      
      const checkInDate = checkIn || defaultCheckIn.toISOString().split('T')[0];
      const checkOutDate = checkOut || defaultCheckOut.toISOString().split('T')[0];
      
      try {
        const params = new URLSearchParams({
          hotelId,
          checkin: checkInDate,
          checkout: checkOutDate,
        });
        
        const response = await fetch(`/api/liteapi/hotel?${params.toString()}`);
        
        if (!response.ok) {
          return; // Silently fail, render nothing
        }
        
        const data = await response.json();
        setHotel(data);
      } catch (err) {
        // Silently fail, render nothing
        console.error('[HotelShowcase] Error fetching hotel:', err);
      }
    }

    fetchHotel();
  }, [hotelId, checkIn, checkOut]);

  // Render nothing if hotel not available
  if (!hotel) {
    return null;
  }

  return (
    <div className="my-8 space-y-6">
      {showGallery && hotel.images && hotel.images.length > 0 && (
        <ImageGallery images={hotel.images.map(img => img.url || '')} />
      )}
      
      <HotelCard
        hotel={hotel}
        checkInDate={checkIn}
        checkOutDate={checkOut}
        onSelect={(id) => {
          window.location.href = `/places-to-stay/${id}`;
        }}
      />
    </div>
  );
}

