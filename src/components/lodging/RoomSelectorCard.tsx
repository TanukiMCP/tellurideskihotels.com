import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { Calendar, Users, Bed, Check, AlertCircle } from 'lucide-react';
import type { LiteAPIRate } from '@/lib/liteapi/types';
import { formatCurrency, calculateNights } from '@/lib/utils';
import { format } from 'date-fns';
import { RoomCard } from './RoomCard';

export interface RoomSelectorCardProps {
  hotelId: string;
  hotelName?: string;
  hotelAddress?: string;
  hotelImage?: string;
  hotelReviewScore?: number;
  initialCheckIn: string;
  initialCheckOut: string;
  initialAdults: number;
  initialChildren?: number;
  initialRooms?: number;
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
  images?: string[]; // Room photos from hotel details
}

export function RoomSelectorCard({
  hotelId,
  hotelName,
  hotelAddress,
  hotelImage,
  hotelReviewScore,
  initialCheckIn,
  initialCheckOut,
  initialAdults,
  initialChildren = 0,
  initialRooms = 1,
  onBookingReady,
}: RoomSelectorCardProps) {
  // User selections
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [adults, setAdults] = useState(initialAdults);
  const [children, setChildren] = useState(initialChildren);
  const [roomCount] = useState(initialRooms);

  // API data
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bedFilter, setBedFilter] = useState<'all' | '1' | '2'>('all');

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

      try {
        const params = new URLSearchParams({
          hotelId,
          checkIn,
          checkOut,
          adults: adults.toString(),
          children: children.toString(),
          rooms: roomCount.toString(),
        });

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

        // Fetch hotel details to get room photos
        try {
          const detailsResponse = await fetch(`/api/hotels/details?hotelId=${hotelId}`);
          if (detailsResponse.ok) {
            const detailsData = await detailsResponse.json();
            const hotelData = detailsData.data || detailsData;
            
            console.log('[RoomSelector] Hotel details received, rooms:', hotelData.rooms?.length || 0);
            if (hotelData.rooms?.[0]) {
              console.log('[RoomSelector] Sample room from hotel details:', {
                id: hotelData.rooms[0].id,
                name: hotelData.rooms[0].name,
                photosCount: hotelData.rooms[0].photos?.length || 0,
                firstPhoto: hotelData.rooms[0].photos?.[0],
              });
            }
            
            // Extract hotel images as fallback (when room-specific images aren't available)
            const hotelImages: string[] = (hotelData.images || [])
              .map((img: any) => img.url || img)
              .filter((url: string) => url && url.trim() !== '')
              .slice(0, 5); // Limit to first 5 hotel images for fallback
            
            // Create a map of mapped room ID to photos
            const roomPhotosMap = new Map<string, string[]>();
            if (hotelData.rooms && Array.isArray(hotelData.rooms)) {
              for (const room of hotelData.rooms) {
                // Photos are already processed as URL strings in getHotelDetails
                const photos = room.photos || [];
                console.log('[RoomSelector] Processing room from details:', {
                  id: room.id,
                  name: room.name,
                  photosCount: photos.length,
                  firstPhoto: photos[0],
                });
                if (photos.length > 0) {
                  // Use room.id as the key (this is what mappedRoomId refers to)
                  const roomKey = room.id?.toString();
                  if (roomKey) {
                    roomPhotosMap.set(roomKey, photos);
                  }
                }
              }
            }
            
            console.log('[RoomSelector] Room photos map size:', roomPhotosMap.size);
            console.log('[RoomSelector] Room photos map keys:', Array.from(roomPhotosMap.keys()));
            console.log('[RoomSelector] Hotel fallback images:', hotelImages.length);
            
            // Merge photos with room options using mapped_room_id
            console.log('[RoomSelector] Starting to merge photos with', roomOptions.length, 'room options');
            for (const roomOption of roomOptions) {
              // Get the mapped_room_id from the first rate (all rates in a room should have the same mapped_room_id)
              const mappedRoomId = (roomOption.rates[0] as any)?.mapped_room_id?.toString();
              console.log('[RoomSelector] Looking for photos for room:', {
                roomName: roomOption.roomName,
                mappedRoomId,
                rateData: {
                  rate_id: roomOption.rates[0].rate_id,
                  room_id: roomOption.rates[0].room_id,
                  mapped_room_id: (roomOption.rates[0] as any)?.mapped_room_id,
                },
              });
              
              if (mappedRoomId) {
                const photos = roomPhotosMap.get(mappedRoomId);
                if (photos && photos.length > 0) {
                  roomOption.images = photos;
                  console.log('[RoomSelector] ✓ Added', photos.length, 'images to room:', roomOption.roomName);
                } else {
                  // Fallback to hotel images if room-specific images aren't available
                  if (hotelImages.length > 0) {
                    roomOption.images = hotelImages;
                    console.log('[RoomSelector] ⚠ Using hotel fallback images for room:', roomOption.roomName);
                  } else {
                    console.log('[RoomSelector] ✗ No photos found in map for mappedRoomId:', mappedRoomId);
                    console.log('[RoomSelector] Available keys in map:', Array.from(roomPhotosMap.keys()));
                  }
                }
              } else {
                // No mappedRoomId - use hotel images as fallback
                if (hotelImages.length > 0) {
                  roomOption.images = hotelImages;
                  console.log('[RoomSelector] ⚠ No mappedRoomId, using hotel fallback images for room:', roomOption.roomName);
                } else {
                  console.log('[RoomSelector] ✗ No mappedRoomId for room:', roomOption.roomName);
                  console.log('[RoomSelector] Full rate object:', roomOption.rates[0]);
                }
              }
            }
          } else {
            console.warn('[RoomSelector] Failed to fetch hotel details for photos');
          }
        } catch (err) {
          console.warn('[RoomSelector] Error fetching hotel details for photos:', err);
          // Continue without photos - not a critical error
        }

        setRooms(roomOptions);
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
  }, [hotelId, checkIn, checkOut, adults, children, roomCount]);

  const handleBookNow = (rate: LiteAPIRate) => {
    onBookingReady({
      rateId: rate.rate_id,
      roomData: rate,
      checkIn,
      checkOut,
      adults,
      children,
    });
  };

  // Filter rooms based on bed count
  const filteredRooms = useMemo(() => {
    if (bedFilter === 'all') return rooms;
    
    return rooms.filter(room => {
      const bedCount = room.rates[0]?.bed_types?.reduce((sum, bt) => sum + (bt.count || 1), 0) || 1;
      return bedFilter === '1' ? bedCount === 1 : bedCount >= 2;
    });
  }, [rooms, bedFilter]);

  // Get all rates from all filtered rooms with their associated images
  const allRates = useMemo(() => {
    return filteredRooms.flatMap(room => 
      room.rates.map(rate => ({
        ...rate,
        images: room.images, // Attach room images to each rate
      }))
    );
  }, [filteredRooms]);

  return (
    <div className="space-y-6">
      {/* Header Section - Choose your room */}
      <div>
        <h2 className="text-3xl font-bold text-neutral-900 mb-2">Choose your room</h2>
      </div>

      {/* Date & Guest Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Start date */}
        <div className="bg-white border border-neutral-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <label className="text-xs font-medium text-neutral-700">Start date</label>
          </div>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            min={format(new Date(), 'yyyy-MM-dd')}
            className="text-base font-medium text-neutral-900 border-none p-0 focus:ring-0 w-full"
          />
        </div>

        {/* End date */}
        <div className="bg-white border border-neutral-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-neutral-500" />
            <label className="text-xs font-medium text-neutral-700">End date</label>
          </div>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            min={checkIn}
            className="text-base font-medium text-neutral-900 border-none p-0 focus:ring-0 w-full"
          />
        </div>

        {/* Travelers */}
        <div className="bg-white border border-neutral-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-neutral-500" />
            <label className="text-xs font-medium text-neutral-700">Travelers</label>
          </div>
          <div className="text-base font-medium text-neutral-900">
            {adults} {adults === 1 ? 'traveler' : 'travelers'}, 1 room
          </div>
        </div>
      </div>

      {/* Filter Pills and Room Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBedFilter('all')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              bedFilter === 'all'
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400'
            }`}
          >
            All rooms
          </button>
          <button
            onClick={() => setBedFilter('1')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              bedFilter === '1'
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400'
            }`}
          >
            1 bed
          </button>
          <button
            onClick={() => setBedFilter('2')}
            className={`px-4 py-2 rounded-full font-medium text-sm transition-all ${
              bedFilter === '2'
                ? 'bg-neutral-900 text-white'
                : 'bg-white border border-neutral-300 text-neutral-700 hover:border-neutral-400'
            }`}
          >
            2 beds
          </button>
        </div>
        
        {!loading && allRates.length > 0 && (
          <p className="text-sm text-neutral-600">
            Showing {allRates.length} of {rooms.flatMap(r => r.rates).length} rooms
          </p>
        )}
      </div>

      {/* Room Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      ) : allRates.length === 0 ? (
        <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
          <Bed className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
          <p className="text-neutral-600 font-medium mb-2">No rooms available</p>
          <p className="text-sm text-neutral-500">
            Try adjusting your dates or filters above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {allRates.map((rate) => (
            <RoomCard
              key={rate.rate_id}
              rate={rate}
              nights={nights}
              onReserve={handleBookNow}
              available={Math.floor(Math.random() * 5) + 1} // Mock availability
              hotel={
                hotelId && hotelName && hotelAddress && hotelImage
                  ? {
                      id: hotelId,
                      name: hotelName,
                      address: hotelAddress,
                      image: hotelImage,
                      reviewScore: hotelReviewScore,
                    }
                  : undefined
              }
              booking={{
                checkIn,
                checkOut,
                adults,
                children,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

