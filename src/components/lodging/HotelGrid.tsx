import { useState, useMemo } from 'react';
import { HotelCard } from './HotelCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface HotelGridProps {
  hotels: LiteAPIHotel[];
  loading?: boolean;
  minPrices?: Record<string, number>;
  currency?: string;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  selectedHotelId?: string | null;
  hoveredHotelId?: string | null;
  onHotelHover?: (hotelId: string | null) => void;
}

const ITEMS_PER_PAGE = 12;

export function HotelGrid({
  hotels,
  loading = false,
  minPrices = {},
  currency = 'USD',
  nights = 1,
  checkIn,
  checkOut,
  adults = 2,
  selectedHotelId,
  hoveredHotelId,
  onHotelHover,
}: HotelGridProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Hotels are already sorted by the parent component (PlacesToStaySearchWidget)
  // No need to sort again here
  const sortedHotels = hotels;

  const totalPages = Math.ceil(sortedHotels.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHotels = sortedHotels.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        <p className="text-gray-600 text-lg">No places to stay found. Try adjusting your search criteria.</p>
      </div>
    );
  }

  const handleSelect = (hotelId: string) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      
      // Use provided dates or generate defaults (7 days from now for check-in, 7 days for duration)
      const defaultCheckIn = new Date();
      defaultCheckIn.setDate(defaultCheckIn.getDate() + 7);
      const defaultCheckOut = new Date(defaultCheckIn);
      defaultCheckOut.setDate(defaultCheckOut.getDate() + 7);
      
      const finalCheckIn = checkIn || defaultCheckIn.toISOString().split('T')[0];
      const finalCheckOut = checkOut || defaultCheckOut.toISOString().split('T')[0];
      
      params.append('checkIn', finalCheckIn);
      params.append('checkOut', finalCheckOut);
      params.append('adults', adults.toString());
      params.append('rooms', '1'); // Default to 1 room
      window.location.href = `/places-to-stay/${hotelId}?${params.toString()}`;
    }
  };

  return (
    <div>
      {/* Results Count - Removed duplicate sort, it's in sidebar */}
      <div className="mb-10">
        <p className="text-neutral-600 text-sm">
          Showing <span className="font-semibold text-neutral-900">{startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, sortedHotels.length)}</span> of <span className="font-semibold text-neutral-900">{sortedHotels.length}</span> places
        </p>
      </div>

      {/* Hotel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 mb-12">
        {paginatedHotels.map((hotel) => (
            <HotelCard
              key={hotel.hotel_id}
              hotel={hotel}
              minPrice={minPrices[hotel.hotel_id]}
              currency={currency}
              nights={nights}
              checkInDate={checkIn}
              checkOutDate={checkOut}
              onSelect={handleSelect}
              isSelected={hotel.hotel_id === selectedHotelId}
              isHovered={hotel.hotel_id === hoveredHotelId}
              onMouseEnter={() => onHotelHover?.(hotel.hotel_id)}
              onMouseLeave={() => onHotelHover?.(null)}
            />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-300'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-2 text-neutral-400">...</span>;
              }
              return null;
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

