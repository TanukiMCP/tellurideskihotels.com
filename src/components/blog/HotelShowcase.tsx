import { useState, useEffect } from 'react';
import { HotelCard } from '@/components/lodging/HotelCard';
import { ImageGallery } from '@/components/lodging/ImageGallery';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHotel() {
      try {
        setLoading(true);
        const response = await fetch(`/api/liteapi/hotel?hotelId=${hotelId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load hotel');
        }
        
        const data = await response.json();
        setHotel(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hotel');
      } finally {
        setLoading(false);
      }
    }

    fetchHotel();
  }, [hotelId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="my-8 p-6 bg-neutral-50 border border-neutral-200 rounded-lg">
        <p className="text-neutral-600 text-center">
          Unable to load hotel details. Please try again later.
        </p>
      </div>
    );
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

