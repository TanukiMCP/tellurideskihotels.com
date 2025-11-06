import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Users, Bed, Check, AlertCircle } from 'lucide-react';
import type { LiteAPIRate } from '@/lib/liteapi/types';
import { formatCurrency, calculateNights } from '@/lib/utils';
import { format } from 'date-fns';

export interface RoomSelectorCardProps {
  hotelId: string;
  initialCheckIn: string;
  initialCheckOut: string;
  initialAdults: number;
  initialChildren?: number;
  onBookingReady: (bookingData: {
    rateId: string;
    roomData: LiteAPIRate;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  }) => void;
}

interface RoomOption {
  roomId: string;
  roomName: string;
  rates: LiteAPIRate[];
}

export function RoomSelectorCard({
  hotelId,
  initialCheckIn,
  initialCheckOut,
  initialAdults,
  initialChildren = 0,
  onBookingReady,
}: RoomSelectorCardProps) {
  // User selections
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedRateId, setSelectedRateId] = useState<string>('');

  // API data
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(false);

  const nights = calculateNights(checkIn, checkOut);

  // Fetch rates when dates/guests change
  useEffect(() => {
    // Guard: Don't fetch if required params are missing
    if (!hotelId || !checkIn || !checkOut) {
      console.warn('[RoomSelector] Missing required params:', {
        hotelId: !!hotelId,
        checkIn: !!checkIn,
        checkOut: !!checkOut,
      });
      setLoading(false);
      setError('Missing required booking information');
      return;
    }

    async function fetchRates() {
      setLoading(true);
      setError(null);
      setNeedsRefresh(false);

      try {
        const params = new URLSearchParams({
          hotelId,
          checkIn,
          checkOut,
          adults: adults.toString(),
          rooms: '1', // Default to 1 room
        });
        if (children > 0) {
          params.append('children', children.toString());
        }

        console.log('[RoomSelector] Fetching rates from:', `/api/hotels/rates?${params.toString()}`);
        console.log('[RoomSelector] Request params:', { hotelId, checkIn, checkOut, adults, children });
        
        const response = await fetch(`/api/hotels/rates?${params.toString()}`);
        
        console.log('[RoomSelector] Response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[RoomSelector] Error response:', errorData);
          throw new Error(errorData.error || 'Failed to fetch rates');
        }

        const data = await response.json();
        
        console.log('[RoomSelector] Rate response:');
        console.log('  - hasRates:', !!data.rates);
        console.log('  - ratesCount:', data.rates?.length || 0);
        console.log('  - sampleRate:', JSON.stringify(data.rates?.[0], null, 2));
        console.log('  - fullData:', JSON.stringify(data, null, 2));
        
        // TheKeys.com format: flat array of rates
        const rates = data.rates || [];
        
        // Group rates by room
        const roomMap = new Map<string, RoomOption>();
        const roomNameCounts = new Map<string, number>();
        const seenRoomIds = new Set<string>();
        
        // First pass: count how many unique room IDs have each room name
        rates.forEach((rate: any) => {
          const roomId = rate.room_id;
          if (!seenRoomIds.has(roomId)) {
            seenRoomIds.add(roomId);
            const baseRoomName = rate.room_name || 'Standard Room';
            roomNameCounts.set(baseRoomName, (roomNameCounts.get(baseRoomName) || 0) + 1);
          }
        });
        
        // Second pass: assign unique names
        const roomNameUsage = new Map<string, number>();
        rates.forEach((rate: any) => {
          const roomId = rate.room_id;
          if (!roomMap.has(roomId)) {
            const baseRoomName = rate.room_name || 'Standard Room';
            const totalCount = roomNameCounts.get(baseRoomName) || 1;
            const currentUsage = roomNameUsage.get(baseRoomName) || 0;
            roomNameUsage.set(baseRoomName, currentUsage + 1);
            
            // If this room name appears multiple times, append a number to make it unique
            const uniqueRoomName = totalCount > 1 
              ? `${baseRoomName} (${currentUsage + 1})`
              : baseRoomName;
            
            roomMap.set(roomId, {
              roomId: roomId,
              roomName: uniqueRoomName,
              rates: [],
            });
          }
          roomMap.get(roomId)!.rates.push(rate);
        });
        
        const roomOptions = Array.from(roomMap.values());

        console.log('[RoomSelector] Processed rooms:', {
          totalRooms: roomOptions.length,
          sampleRoom: roomOptions[0],
        });

        setRooms(roomOptions);
        
        // Auto-select first room and rate if available
        if (roomOptions.length > 0) {
          setSelectedRoomId(roomOptions[0].roomId);
          if (roomOptions[0].rates.length > 0) {
            setSelectedRateId(roomOptions[0].rates[0].rate_id);
          }
        }
      } catch (err) {
        console.error('[RoomSelector] Error fetching rates:', err);
        setError(err instanceof Error ? err.message : 'Unable to load room availability');
      } finally {
        setLoading(false);
      }
    }

    if (hotelId && checkIn && checkOut) {
      fetchRates();
    }
  }, [hotelId, checkIn, checkOut, adults, children]);

  // Get available room types
  const roomOptions = useMemo(() => {
    return rooms.map(room => ({
      value: room.roomId,
      label: room.roomName,
    }));
  }, [rooms]);

  // Get rate options for selected room
  const rateOptions = useMemo(() => {
    const selectedRoom = rooms.find(r => r.roomId === selectedRoomId);
    if (!selectedRoom) return [];
    
    return selectedRoom.rates.map(rate => ({
      value: rate.rate_id,
      label: rate.board_type || 'Room Only',
      rate,
    }));
  }, [rooms, selectedRoomId]);

  // Get selected rate details
  const selectedRate = useMemo(() => {
    const rateOption = rateOptions.find(r => r.value === selectedRateId);
    return rateOption?.rate;
  }, [rateOptions, selectedRateId]);

  // Check if selections have changed from initial
  const hasChanges = useMemo(() => {
    return checkIn !== initialCheckIn || 
           checkOut !== initialCheckOut || 
           adults !== initialAdults || 
           children !== initialChildren;
  }, [checkIn, checkOut, adults, children, initialCheckIn, initialCheckOut, initialAdults, initialChildren]);

  const handleSearch = () => {
    setNeedsRefresh(true);
    // Trigger re-fetch via useEffect
  };

  const handleBookNow = () => {
    if (!selectedRate || !selectedRoomId) return;

    const selectedRoom = rooms.find(r => r.roomId === selectedRoomId);
    if (!selectedRoom) return;

    onBookingReady({
      rateId: selectedRateId,
      roomData: selectedRate,
      checkIn,
      checkOut,
      adults,
      children,
    });
  };

  const totalPrice = selectedRate?.total?.amount || 0;
  const currency = selectedRate?.total?.currency || 'USD';
  const pricePerNight = nights > 0 ? totalPrice / nights : totalPrice;

  return (
    <Card className="shadow-elevated">
      <CardHeader className="bg-gradient-to-br from-primary-50 to-white border-b border-primary-100">
        <CardTitle className="text-2xl">Select Your Stay</CardTitle>
        <p className="text-sm text-neutral-600 mt-1">Customize your dates, guests, and room preferences</p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Date & Guest Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Check-in */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Check-in
            </label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setNeedsRefresh(true);
              }}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Check-out */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Check-out
            </label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setNeedsRefresh(true);
              }}
              min={checkIn}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Adults */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              Adults
            </label>
            <select
              value={adults}
              onChange={(e) => {
                setAdults(parseInt(e.target.value));
                setNeedsRefresh(true);
              }}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Adult' : 'Adults'}</option>
              ))}
            </select>
          </div>

          {/* Children */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              <Users className="inline w-4 h-4 mr-1" />
              Children
            </label>
            <select
              value={children}
              onChange={(e) => {
                setChildren(parseInt(e.target.value));
                setNeedsRefresh(true);
              }}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
            >
              {[0, 1, 2, 3, 4].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'Child' : 'Children'}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Update Availability Button */}
        {hasChanges && needsRefresh && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Your selections have changed</span>
              </div>
              <Button onClick={handleSearch} size="sm" variant="primary">
                Update Availability
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 font-medium">{error}</p>
            <Button onClick={handleSearch} variant="outline" size="sm" className="mt-4">
              Try Again
            </Button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
            <Bed className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-600 font-medium mb-2">No rooms available</p>
            <p className="text-sm text-neutral-500 mb-4">
              This hotel doesn't have availability for the selected dates and guest count.
              Try adjusting your dates or number of guests above, or search for other hotels.
            </p>
            <Button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/lodging?checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`;
                }
              }}
              variant="outline"
              size="sm"
            >
              ← Back to Search Results
            </Button>
          </div>
        ) : (
          <>
            {/* Room & Rate Selection */}
            <div className="space-y-4">
              {/* Room Type Selector */}
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  <Bed className="inline w-4 h-4 mr-1" />
                  Room Type
                </label>
                <select
                  value={selectedRoomId}
                  onChange={(e) => {
                    setSelectedRoomId(e.target.value);
                    // Auto-select first rate of new room
                    const room = rooms.find(r => r.roomId === e.target.value);
                    if (room && room.rates.length > 0) {
                      setSelectedRateId(room.rates[0].rate_id);
                    }
                  }}
                  className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white text-base font-medium"
                >
                  {roomOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rate/Board Type Selector */}
              {rateOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2">
                    Rate Options
                  </label>
                  <div className="space-y-2">
                    {rateOptions.map(option => {
                      const rateTotal = option.rate.total?.amount || 0;
                      return (
                        <label
                          key={option.value}
                          className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            selectedRateId === option.value
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-neutral-200 hover:border-primary-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="rate"
                              value={option.value}
                              checked={selectedRateId === option.value}
                              onChange={(e) => setSelectedRateId(e.target.value)}
                              className="w-5 h-5 text-primary-600 focus:ring-primary-500"
                            />
                            <div>
                              <div className="font-semibold text-neutral-900">{option.label}</div>
                              {option.rate.cancellation_policies && option.rate.cancellation_policies.length > 0 && (
                                <div className="text-sm text-neutral-600 mt-1">
                                  {option.rate.cancellation_policies[0].type === 'FREE_CANCELLATION' ? (
                                    <span className="text-green-600 font-medium">Free cancellation</span>
                                  ) : (
                                    <span>Cancellation policy applies</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary-600">
                              {formatCurrency(rateTotal, currency)}
                            </div>
                            <div className="text-sm text-neutral-600">
                              {formatCurrency(rateTotal / nights, currency)} / night
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Room Details */}
              {selectedRate && (
                <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                  <h4 className="font-semibold text-neutral-900 mb-3">Room Details</h4>
                  {(selectedRate.bed_types?.length > 0 || selectedRate.max_occupancy) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    {selectedRate.bed_types && selectedRate.bed_types.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white">
                          <Bed className="h-3 w-3 mr-1" />
                          {selectedRate.bed_types.map(b => `${b.count || 1} ${b.type || 'bed'}`).join(', ')}
                        </Badge>
                      </div>
                    )}
                    {selectedRate.max_occupancy && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white">
                          <Users className="h-3 w-3 mr-1" />
                          Max {selectedRate.max_occupancy} guests
                        </Badge>
                      </div>
                    )}
                  </div>
                  )}
                  {selectedRate.amenities && selectedRate.amenities.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-200">
                      <div className="flex flex-wrap gap-2">
                        {selectedRate.amenities.slice(0, 6).map((amenity, idx) => (
                          <span key={idx} className="inline-flex items-center text-xs bg-white px-2 py-1 rounded border border-neutral-200">
                            <Check className="w-3 h-3 text-green-600 mr-1" />
                            {amenity.name || amenity.code}
                          </span>
                        ))}
                        {selectedRate.amenities.length > 6 && (
                          <span className="text-xs text-neutral-500">+{selectedRate.amenities.length - 6} more</span>
                        )}
                      </div>
                    </div>
                  )}
                  {!selectedRate.bed_types?.length && !selectedRate.max_occupancy && !selectedRate.amenities?.length && (
                    <p className="text-sm text-neutral-600">Room details will be confirmed upon booking.</p>
                  )}
                </div>
              )}
            </div>

            {/* Booking Summary & CTA */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm opacity-90 mb-1">Total for {nights} night{nights !== 1 ? 's' : ''}</div>
                  <div className="text-4xl font-bold">
                    {formatCurrency(totalPrice, currency)}
                  </div>
                  <div className="text-sm opacity-90 mt-1">
                    {formatCurrency(pricePerNight, currency)} per night
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90 mb-1">
                    {adults} {adults === 1 ? 'Adult' : 'Adults'}
                    {children > 0 && `, ${children} ${children === 1 ? 'Child' : 'Children'}`}
                  </div>
                  <div className="text-sm opacity-90">
                    {format(new Date(checkIn + 'T00:00:00'), 'MMM d')} - {format(new Date(checkOut + 'T00:00:00'), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
              <Button
                onClick={handleBookNow}
                disabled={!selectedRate || !selectedRoomId}
                size="lg"
                  className="w-full bg-white text-primary-700 hover:bg-neutral-50 disabled:bg-neutral-300 disabled:text-neutral-500 font-bold text-lg py-6 shadow-lg transition-all"
              >
                  {!selectedRate || !selectedRoomId ? 'Please select a room' : 'Continue to Checkout'}
              </Button>
              
              <p className="text-xs text-center mt-3 opacity-75">
                You won't be charged yet. Review your booking on the next page.
              </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

