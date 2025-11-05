/**
 * HotelGridWithMap Component
 * Wrapper that manages map/grid sync state
 */
import { useState } from 'react';
import { HotelGrid } from './HotelGrid';
import LodgingMap from '@/components/map/LodgingMap';
import type { LiteAPIHotel } from '@/lib/liteapi/types';

interface HotelGridWithMapProps {
  hotels: LiteAPIHotel[];
  loading?: boolean;
  minPrices?: Record<string, number>;
  currency?: string;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
}

export function HotelGridWithMap({
  hotels,
  loading,
  minPrices,
  currency,
  nights,
  checkIn,
  checkOut,
  adults,
}: HotelGridWithMapProps) {
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [hoveredHotelId, setHoveredHotelId] = useState<string | null>(null);

  const handleHotelClick = (hotelId: string) => {
    setSelectedHotelId(hotelId === selectedHotelId ? null : hotelId);
  };

  const handleViewDetails = (hotelId: string) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (checkIn) params.append('checkIn', checkIn);
      if (checkOut) params.append('checkOut', checkOut);
      if (adults) params.append('adults', adults.toString());
      window.location.href = `/lodging/${hotelId}?${params.toString()}`;
    }
  };

  return (
    <div className="lg:flex lg:gap-6">
      {/* Hotel List (Left/Bottom) */}
      <div className="lg:w-3/5 mb-8 lg:mb-0">
        <HotelGrid
          hotels={hotels}
          loading={loading}
          minPrices={minPrices}
          currency={currency}
          nights={nights}
          checkIn={checkIn}
          checkOut={checkOut}
          adults={adults}
          selectedHotelId={selectedHotelId}
          hoveredHotelId={hoveredHotelId}
          onHotelSelect={handleHotelClick}
          onHotelHover={setHoveredHotelId}
        />
      </div>

      {/* Map (Right/Top) - Sticky on Desktop */}
      <div className="lg:w-2/5">
        <div className="lg:sticky lg:top-24">
          <LodgingMap
            hotels={hotels}
            minPrices={minPrices}
            currency={currency}
            height="600px"
            selectedHotelId={selectedHotelId}
            hoveredHotelId={hoveredHotelId}
            onHotelClick={handleHotelClick}
            onHotelHover={setHoveredHotelId}
            onViewDetails={handleViewDetails}
          />
        </div>
      </div>
    </div>
  );
}

