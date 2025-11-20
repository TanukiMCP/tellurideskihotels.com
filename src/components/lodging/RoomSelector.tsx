import { useState, useEffect } from 'react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import type { LiteAPIRate } from '@/lib/liteapi/types';
import { formatCurrency, calculateNights } from '@/lib/utils';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

export interface RoomSelectorProps {
  hotelId: string;
  hotelName: string;
  hotelAddress: string;
  hotelImage: string;
  hotelReviewScore?: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  onRoomSelect: (rateId: string, roomData: LiteAPIRate) => void;
}

export function RoomSelector({
  hotelId,
  hotelName,
  hotelAddress,
  hotelImage,
  hotelReviewScore,
  checkIn,
  checkOut,
  adults,
  children = 0,
  rooms = 1,
  onRoomSelect,
}: RoomSelectorProps) {
  const [roomRates, setRoomRates] = useState<LiteAPIRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const nights = calculateNights(checkIn, checkOut);

  useEffect(() => {
    async function fetchRates() {
      setLoading(true);
      setError(null);
      try {
        // ═══════════════════════════════════════════════════════════
        // Build query parameters (include rooms parameter!)
        // ═══════════════════════════════════════════════════════════
        const params = new URLSearchParams({
          hotelId,
          checkIn,
          checkOut,
          adults: adults.toString(),
          children: children.toString(), // Always include, even if 0
          rooms: rooms.toString(),
        });

        console.log('[RoomSelector] Fetching rates:', params.toString());

        const response = await fetch(`/api/hotels/rates?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch rates');
        }

        const data = await response.json();
        
        console.log('[RoomSelector] Response received:', {
          hasRates: !!data.rates,
          ratesLength: data.rates?.length || 0,
          sampleRate: data.rates?.[0],
        });
        
        // CRITICAL: API returns { rates: [...] } - flat array!
        // NOT { data: [{ rooms: [{ rates: [...] }] }] }
        const fetchedRates = data.rates || [];
        
        console.log(`[RoomSelector] Loaded ${fetchedRates.length} rate(s)`);

        setRoomRates(fetchedRates);
      } catch (err) {
        console.error('[RoomSelector] Error fetching rates:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (hotelId && checkIn && checkOut) {
      fetchRates();
    }
  }, [hotelId, checkIn, checkOut, adults, children, rooms]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to Load Rooms"
        description={error}
        icon={
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
    );
  }

  if (roomRates.length === 0) {
    return (
      <EmptyState
        title="No Rooms Available"
        description="There are no available rooms for the selected dates. Try different dates or check back later."
        action={{
          label: "Search Other Hotels",
          href: "/search"
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-bold text-neutral-900 mb-6">Select Your Room</h3>
      {roomRates.map((rate) => {
        // PRICING: rate.total and rate.net contain retailRate.total from LiteAPI
        // This is the final price customer pays (base rate + margin + taxes)
        // Commission is already included via the margin parameter in API calls
        // SSP (suggested_selling_price) is stored separately and is typically higher
        const displayPrice = rate.total?.amount || 0;  // Retail total for stay
        const currency = rate.total?.currency || 'USD';
        const pricePerNight = rate.net?.amount || 0;   // Retail per night
        
        // Extract refundable status from cancellation policy
        const cancellationPolicy = rate.cancellation_policy;
        const isRefundable = cancellationPolicy?.refundableTag === 'RFN' || 
                            rate.cancellation_policies?.some(p => p.type === 'FREE_CANCELLATION');
        
        // Check for excluded fees (pay at property)
        const hasExcludedFees = rate.taxes_and_fees && rate.taxes_and_fees.excluded > 0;

        return (
          <div 
            key={rate.rate_id} 
            className="group bg-white rounded-2xl border border-neutral-200 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
          >
            <div className="flex flex-col lg:flex-row">
              {/* Left: Room Info */}
              <div className="flex-1 p-6">
                {/* Room Name & Board Type */}
                <div className="mb-4">
                  <h4 className="text-lg lg:text-xl font-bold text-neutral-900 mb-2">
                    {rate.room_name}
                  </h4>
                  {rate.board_type && (
                    <span className="inline-block px-3 py-1 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg">
                      {rate.board_type}
                    </span>
                  )}
                </div>

                {/* Bed Types */}
                {rate.bed_types && rate.bed_types.length > 0 && (
                  <div className="flex items-center gap-2 text-neutral-700 mb-3">
                    <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="text-sm font-medium">
                      {rate.bed_types.map(b => `${b.count || 1} ${b.type || 'bed'}`).join(', ')}
                    </span>
                  </div>
                )}

                {/* Max Occupancy */}
                {rate.max_occupancy && (
                  <div className="flex items-center gap-2 text-neutral-700 mb-4">
                    <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-sm font-medium">Up to {rate.max_occupancy} guests</span>
                  </div>
                )}

                {/* Cancellation Policy Badges */}
                <div className="flex flex-wrap gap-2">
                  {isRefundable ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-semibold rounded-lg">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Free Cancellation
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-sm font-semibold rounded-lg">
                      Non-Refundable
                    </span>
                  )}
                </div>

                {/* Cancellation Description */}
                {rate.cancellation_policies?.[0]?.description && (
                  <p className="text-sm text-neutral-600 mt-3 leading-relaxed">
                    {rate.cancellation_policies[0].description}
                  </p>
                )}
              </div>

              {/* Right: Pricing & CTA */}
              <div className="lg:w-72 bg-neutral-50 p-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-neutral-200">
                <div className="mb-4">
                  <div className="text-sm text-neutral-600 mb-1">Total for {nights} {nights === 1 ? 'night' : 'nights'}</div>
                  <div className="text-3xl lg:text-4xl font-bold text-primary-600 mb-2">
                    {formatCurrency(displayPrice, currency)}
                  </div>
                  <div className="text-sm text-neutral-600">
                    {formatCurrency(pricePerNight, currency)} per night
                  </div>
                  
                  {/* Tax & Fee Information */}
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <div className="text-xs text-neutral-500">
                      Total includes all taxes and fees
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <AddToCartButton
                    hotel={{
                      id: hotelId,
                      name: hotelName,
                      address: hotelAddress,
                      image: hotelImage,
                      reviewScore: hotelReviewScore,
                    }}
                    room={{
                      name: rate.room_name,
                      rateId: rate.rate_id,
                      rate,
                    }}
                    booking={{
                      checkIn,
                      checkOut,
                      adults,
                      children,
                      nights,
                    }}
                    pricing={{
                      total: displayPrice,
                      perNight: pricePerNight,
                      currency,
                    }}
                    className="w-full"
                  />
                  <button
                    onClick={() => onRoomSelect(rate.rate_id, rate)}
                    className="w-full bg-white text-primary-600 px-6 py-3 rounded-xl font-bold border-2 border-primary-600 hover:bg-primary-50 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    Book Now
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

