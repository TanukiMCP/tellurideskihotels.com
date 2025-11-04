import { HotelCard } from './HotelCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';

export interface HotelGridProps {
  hotels: LiteAPIHotel[];
  loading?: boolean;
  minPrices?: Record<string, number>;
  currency?: string;
  nights?: number;
  onHotelSelect: (hotelId: string) => void;
}

export function HotelGrid({
  hotels,
  loading = false,
  minPrices = {},
  currency = 'USD',
  nights = 1,
  onHotelSelect,
}: HotelGridProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No hotels found. Try adjusting your search criteria.</p>
      </div>
    );
  }

  const handleSelect = (hotelId: string) => {
    if (typeof window !== 'undefined') {
      onHotelSelect(hotelId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {hotels.map((hotel) => (
        <HotelCard
          key={hotel.hotel_id}
          hotel={hotel}
          minPrice={minPrices[hotel.hotel_id]}
          currency={currency}
          nights={nights}
          onSelect={handleSelect}
        />
      ))}
    </div>
  );
}

