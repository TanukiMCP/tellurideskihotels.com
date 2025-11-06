import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Bed, Users } from 'lucide-react';
import type { LiteAPIRate } from '@/lib/liteapi/types';
import { formatCurrency, calculateNights } from '@/lib/utils';

export interface RoomSelectorProps {
  hotelId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  onRoomSelect: (rateId: string, roomData: LiteAPIRate) => void;
}

export function RoomSelector({
  hotelId,
  checkIn,
  checkOut,
  adults,
  children = 0,
  onRoomSelect,
}: RoomSelectorProps) {
  const [rooms, setRooms] = useState<LiteAPIRate[]>([]);
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
          rooms: '1', // Default to 1 room (can be made configurable later)
        });

        console.log('🔍 [RoomSelector] Fetching rates:', params.toString());

        const response = await fetch(`/api/hotels/rates?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch rates');
        }

        const data = await response.json();
        
        console.log('📥 [RoomSelector] Response received:', {
          hasRates: !!data.rates,
          ratesLength: data.rates?.length || 0,
          sampleRate: data.rates?.[0],
        });
        
        // ═══════════════════════════════════════════════════════════
        // ⚠️ CRITICAL: API returns { rates: [...] } - flat array!
        // NOT { data: [{ rooms: [{ rates: [...] }] }] }
        // ═══════════════════════════════════════════════════════════
        const fetchedRates = data.rates || [];
        
        console.log(`✅ [RoomSelector] Loaded ${fetchedRates.length} rate(s)`);

        setRooms(fetchedRates);
      } catch (err) {
        console.error('❌ [RoomSelector] Error fetching rates:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (hotelId && checkIn && checkOut) {
      fetchRates();
    }
  }, [hotelId, checkIn, checkOut, adults, children]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No rooms available for the selected dates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Available Rooms</h3>
      {rooms.map((rate) => {
        const price = rate.total?.amount || rate.net?.amount || 0;
        const currency = rate.total?.currency || rate.net?.currency || 'USD';
        const pricePerNight = nights > 0 ? price / nights : price;

        return (
          <Card key={rate.rate_id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{rate.room_name}</CardTitle>
                  {rate.room_description && (
                    <p className="text-sm text-gray-600 mt-1">{rate.room_description}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold">{formatCurrency(price, currency)}</p>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(pricePerNight, currency)} per night
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {rate.bed_types && rate.bed_types.length > 0 && (
                  <Badge variant="outline">
                    <Bed className="h-3 w-3 mr-1" />
                    {rate.bed_types.map(b => `${b.count || 1} ${b.type || 'bed'}`).join(', ')}
                  </Badge>
                )}
                {rate.max_occupancy && (
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    Up to {rate.max_occupancy} guests
                  </Badge>
                )}
              </div>
              {/* ═══════════════════════════════════════════════════════════
                  Cancellation Policy Display
                  ═══════════════════════════════════════════════════════════
                  cancellation_policies is an ARRAY of policy objects
                  (already transformed in rates.ts from LiteAPI's object format)
              */}
              {rate.cancellation_policies && rate.cancellation_policies.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    {rate.cancellation_policies[0].type === 'FREE_CANCELLATION'
                      ? '✅ Free cancellation available'
                      : rate.cancellation_policies[0].type === 'NON_REFUNDABLE'
                      ? '⚠️ Non-refundable'
                      : '📋 Cancellation policy applies'}
                  </p>
                  {rate.cancellation_policies[0].description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {rate.cancellation_policies[0].description}
                    </p>
                  )}
                </div>
              )}
              <Button
                onClick={() => onRoomSelect(rate.rate_id, rate)}
                className="w-full"
              >
                Select Room
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

