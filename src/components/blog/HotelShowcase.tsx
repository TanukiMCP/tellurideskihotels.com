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
  const [computedCheckIn, setComputedCheckIn] = useState<string>('');
  const [computedCheckOut, setComputedCheckOut] = useState<string>('');

  useEffect(() => {
    // Calculate default dates on client side only to avoid hydration mismatch
    const defaultCheckIn = new Date();
    defaultCheckIn.setDate(defaultCheckIn.getDate() + 7);
    const defaultCheckOut = new Date(defaultCheckIn);
    defaultCheckOut.setDate(defaultCheckOut.getDate() + 7);
    
    setComputedCheckIn(checkIn || defaultCheckIn.toISOString().split('T')[0]);
    setComputedCheckOut(checkOut || defaultCheckOut.toISOString().split('T')[0]);
  }, [checkIn, checkOut]);

  useEffect(() => {
    if (!hotelId) return;
    
    async function fetchHotel() {
      try {
        const params = new URLSearchParams({
          hotelId,
        });
        
        // Use /api/hotels/details for consistency and caching (same as other components)
        const response = await fetch(`/api/hotels/details?${params.toString()}`);
        
        if (!response.ok) {
          return; // Silently fail, render nothing
        }
        
        const data = await response.json();
        // /api/hotels/details returns { data: hotel }, extract hotel
        setHotel(data.data);
      } catch (err) {
        // Silently fail, render nothing
        console.error('[HotelShowcase] Error fetching hotel:', err);
      }
    }

    fetchHotel();
  }, [hotelId]);

  // Render nothing if hotel not available or dates not computed yet
  if (!hotel || !computedCheckIn || !computedCheckOut) {
    return null;
  }

  return (
    <div className="my-8 space-y-6">
      {showGallery && hotel.images && hotel.images.length > 0 && (
        <ImageGallery images={hotel.images.map(img => img.url || '')} />
      )}
      
      <HotelCard
        hotel={hotel}
        checkInDate={computedCheckIn}
        checkOutDate={computedCheckOut}
        onSelect={(id) => {
          window.location.href = `/places-to-stay/${id}`;
        }}
      />
    </div>
  );
}

