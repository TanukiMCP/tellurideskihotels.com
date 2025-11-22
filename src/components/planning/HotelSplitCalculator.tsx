'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { Building2, Users, Calendar, TrendingUp } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export interface HotelSplitCalculatorProps {
  hotelIds: string[];
  scenario?: string;
  defaultNights?: number;
  defaultGuests?: number;
  checkIn?: string;
  checkOut?: string;
}

interface ComparisonOption {
  id: string;
  name: string;
  type: 'hotel' | 'condo' | 'suite';
  rooms: number;
  costPerNight: number;
  totalCost: number;
  costPerPerson: number;
  hotel?: LiteAPIHotel;
  minPrice?: number;
}

export function HotelSplitCalculator({
  hotelIds,
  scenario = 'group',
  defaultNights = 4,
  defaultGuests = 4,
  checkIn,
  checkOut,
}: HotelSplitCalculatorProps) {
  const [guests, setGuests] = useState(defaultGuests);
  const [nights, setNights] = useState(defaultNights);
  const [comparisons, setComparisons] = useState<ComparisonOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHotelsAndCalculate() {
      try {
        setLoading(true);
        setError(null);

        // Fetch hotel details
        const hotelPromises = hotelIds.map(async (id) => {
          try {
            const response = await fetch(`/api/liteapi/hotel?hotelId=${id}`);
            if (response.ok) {
              return await response.json();
            }
            return null;
          } catch (err) {
            console.warn(`Failed to fetch hotel ${id}:`, err);
            return null;
          }
        });

        const hotels = (await Promise.all(hotelPromises)).filter(Boolean) as LiteAPIHotel[];

        // Fetch pricing if dates provided
        const prices: Record<string, number> = {};
        if (checkIn && checkOut && hotels.length > 0) {
          try {
            const checkInDate = new Date(checkIn);
            const checkOutDate = new Date(checkOut);
            const calculatedNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

            const pricePromises = hotels.map(async (hotel) => {
              try {
                const params = new URLSearchParams({
                  hotelId: hotel.hotel_id,
                  checkIn,
                  checkOut,
                  adults: '2',
                  children: '0',
                });
                
                const response = await fetch(`/api/hotels/rates?${params.toString()}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.rates && data.rates.length > 0) {
                    const ratePrices = data.rates
                      .map((rate: any) => {
                        const total = rate.total?.amount || rate.net?.amount;
                        return total && calculatedNights > 0 ? total / calculatedNights : null;
                      })
                      .filter((p: number | null): p is number => p !== null && p > 0);
                    
                    if (ratePrices.length > 0) {
                      return { hotelId: hotel.hotel_id, price: Math.min(...ratePrices) };
                    }
                  }
                }
              } catch (err) {
                console.warn(`Failed to fetch pricing for ${hotel.hotel_id}:`, err);
              }
              return null;
            });

            const priceResults = await Promise.all(pricePromises);
            priceResults.forEach((result) => {
              if (result) {
                prices[result.hotelId] = result.price;
              }
            });
          } catch (priceError) {
            console.warn('Failed to fetch pricing:', priceError);
          }
        }

        // Calculate comparisons based on hotel data
        const options: ComparisonOption[] = [];

        // Add hotel room options
        hotels.forEach((hotel, index) => {
          const costPerNight = prices[hotel.hotel_id] || 350;
          const roomsNeeded = Math.ceil(guests / 2); // Assume 2 per room
          const totalCost = costPerNight * roomsNeeded * nights;
          const costPerPerson = totalCost / guests;

          options.push({
            id: `hotel-${hotel.hotel_id}`,
            name: hotel.name,
            type: 'hotel',
            rooms: roomsNeeded,
            costPerNight: costPerNight * roomsNeeded,
            totalCost,
            costPerPerson,
            hotel,
            minPrice: prices[hotel.hotel_id],
          });
        });

        // Add condo option if we have pricing data
        if (hotels.length > 0) {
          const avgPrice = Object.values(prices).reduce((a, b) => a + b, 0) / Object.keys(prices).length || 400;
          const condoPrice = avgPrice * 1.5; // Condos typically cost more but sleep more
          const totalCost = condoPrice * nights;
          const costPerPerson = totalCost / guests;

          options.push({
            id: 'condo-option',
            name: '3-Bedroom Condo',
            type: 'condo',
            rooms: 3,
            costPerNight: condoPrice,
            totalCost,
            costPerPerson,
          });
        }

        options.sort((a, b) => a.costPerPerson - b.costPerPerson);
        setComparisons(options);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load comparison data');
      } finally {
        setLoading(false);
      }
    }

    if (hotelIds.length > 0) {
      fetchHotelsAndCalculate();
    }
  }, [hotelIds, checkIn, checkOut, nights, guests]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 my-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || comparisons.length === 0) {
    return (
      <Card className="my-8 border-2 border-primary-200">
        <CardContent className="p-6">
          <p className="text-neutral-600 text-center">
            {error || 'Unable to load comparison data.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-8 border-2 border-primary-200 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Compare Hotel vs Condo Options</CardTitle>
            <p className="text-neutral-600 mt-1">
              See how splitting costs changes per-person pricing
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            <label className="text-sm font-medium text-neutral-700">Group Size</label>
            <Input
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-600" />
            <label className="text-sm font-medium text-neutral-700">Nights</label>
            <Input
              type="number"
              min="1"
              value={nights}
              onChange={(e) => setNights(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20"
            />
          </div>
        </div>

        <div className="space-y-4">
          {comparisons.map((option) => (
            <div
              key={option.id}
              className="border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-neutral-900 mb-1">{option.name}</h4>
                  <p className="text-sm text-neutral-600">
                    {option.rooms} {option.rooms === 1 ? 'room' : 'rooms'} • {option.type}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">
                    {formatCurrency(option.costPerPerson)}
                  </div>
                  <div className="text-sm text-neutral-600">per person</div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-neutral-200">
                <div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Per Night</div>
                  <div className="text-lg font-semibold text-neutral-900">
                    {formatCurrency(option.costPerNight)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Total Stay</div>
                  <div className="text-lg font-semibold text-neutral-900">
                    {formatCurrency(option.totalCost)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Per Person</div>
                  <div className="text-lg font-semibold text-primary-600">
                    {formatCurrency(option.costPerPerson)}
                  </div>
                </div>
              </div>

              {option.hotel && (
                <div className="mt-4">
                  <a
                    href={`/places-to-stay/${option.hotel.hotel_id}${checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 font-semibold text-sm"
                  >
                    View Hotel Details →
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6">
          <ArticleBookingWidget
            title="Book Your Group Stay"
            description="Compare rates and availability for your group"
            variant="default"
          />
        </div>
      </CardContent>
    </Card>
  );
}
