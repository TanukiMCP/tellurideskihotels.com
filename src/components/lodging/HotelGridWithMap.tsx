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
  viewMode?: 'grid' | 'map';
  defaultView?: 'grid' | 'map';
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
  viewMode: controlledViewMode,
  defaultView = 'grid',
}: HotelGridWithMapProps) {
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'map'>(defaultView);
  const viewMode = controlledViewMode ?? internalViewMode;
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
      window.location.href = `/places-to-stay/${hotelId}?${params.toString()}`;
    }
  };

  if (viewMode === 'map') {
    return (
      <div className="w-full h-[600px] lg:h-[800px]" key="map-view">
        <LodgingMap
          hotels={hotels}
          minPrices={minPrices}
          currency={currency}
          checkInDate={checkIn}
          height="100%"
          selectedHotelId={selectedHotelId}
          hoveredHotelId={hoveredHotelId}
          onHotelClick={handleHotelClick}
          onHotelHover={setHoveredHotelId}
          onViewDetails={handleViewDetails}
        />
      </div>
    );
  }

  // Grid view - show only the grid, no map
  return (
    <div className="w-full">
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
        onHotelHover={setHoveredHotelId}
      />
    </div>
  );
}

