'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { Building2, Users, Calendar, DollarSign, TrendingDown } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { addDays, format } from 'date-fns';
import type { LiteAPIHotel } from '@/lib/liteapi/types';

export interface HotelSplitCalculatorProps {
  hotelIds?: string[];
  scenario?: string;
  defaultNights?: number;
  defaultGuests?: number;
  checkIn?: string;
  checkOut?: string;
}

interface SplitOption {
  id: string;
  name: string;
  type: 'hotel' | 'condo';
  rooms: number;
  costPerNight: number;
  totalCost: number;
  costPerPerson: number;
}

export function HotelSplitCalculator({
  hotelIds = [],
  scenario,
  defaultNights = 4,
  defaultGuests = 4,
  checkIn,
  checkOut,
}: HotelSplitCalculatorProps) {
  const [guests, setGuests] = useState(defaultGuests);
  const [nights, setNights] = useState(defaultNights);
  const [loading, setLoading] = useState(true);
  const [hotelRate, setHotelRate] = useState(350);
  const [splitOptions, setSplitOptions] = useState<SplitOption[]>([]);

  useEffect(() => {
    fetchRates();
  }, [checkIn, checkOut, nights, hotelIds]);

  useEffect(() => {
    if (!loading) {
      calculateSplitOptions();
    }
  }, [guests, nights, hotelRate, loading]);

  const fetchRates = async () => {
    try {
      setLoading(true);
      
      const defaultCheckIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const defaultCheckOut = format(addDays(new Date(), 7 + nights), 'yyyy-MM-dd');
      
      const checkInDate = checkIn || defaultCheckIn;
      const checkOutDate = checkOut || (checkIn ? format(addDays(new Date(checkIn), nights), 'yyyy-MM-dd') : defaultCheckOut);
      
      const searchParams = new URLSearchParams({
        cityName: 'Telluride',
        countryCode: 'US',
        limit: '20',
      });
      
      const hotelsResponse = await fetch(`/api/liteapi/search?${searchParams.toString()}`);
      
      if (!hotelsResponse.ok) {
        setHotelRate(350);
        return;
      }
      
      const hotelsData = await hotelsResponse.json();
      const hotels: LiteAPIHotel[] = hotelsData.data || [];
      
      if (hotels.length === 0) {
        setHotelRate(350);
        return;
      }
      
      const hotelIdsToUse = hotelIds.length > 0 ? hotelIds : hotels.slice(0, 10).map(h => h.hotel_id);
      const ratesParams = new URLSearchParams({
        hotelIds: hotelIdsToUse.join(','),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: '2',
      });
      
      const ratesResponse = await fetch(`/api/hotels/min-rates?${ratesParams.toString()}`);
      
      if (!ratesResponse.ok) {
        setHotelRate(350);
        return;
      }
      
      const ratesData = await ratesResponse.json();
      
      const prices: number[] = [];
      if (ratesData.data && Array.isArray(ratesData.data)) {
        ratesData.data.forEach((item: any) => {
          if (item.price) {
            const perNight = nights > 0 ? item.price / nights : item.price;
            prices.push(perNight);
          }
        });
      }
      
      if (prices.length > 0) {
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        setHotelRate(Math.round(avgPrice));
      } else {
        setHotelRate(350);
      }
    } catch (err) {
      setHotelRate(350);
    } finally {
      setLoading(false);
    }
  };

  const calculateSplitOptions = () => {
    const condoRate = hotelRate * 1.7;
    const options: SplitOption[] = [];

    if (guests <= 4) {
      options.push({
        id: 'hotel-2-rooms',
        name: '2 Hotel Rooms',
        type: 'hotel',
        rooms: 2,
        costPerNight: hotelRate * 2,
        totalCost: 0,
        costPerPerson: 0,
      });
    }

    if (guests <= 6) {
      options.push({
        id: 'condo-3br',
        name: '3-Bedroom Condo',
        type: 'condo',
        rooms: 3,
        costPerNight: condoRate,
        totalCost: 0,
        costPerPerson: 0,
      });
    }

    if (guests <= 8) {
      options.push({
        id: 'hotel-4-rooms',
        name: '4 Hotel Rooms',
        type: 'hotel',
        rooms: 4,
        costPerNight: hotelRate * 4,
        totalCost: 0,
        costPerPerson: 0,
      });
    }

    if (guests <= 10) {
      options.push({
        id: 'condo-4br',
        name: '4-Bedroom Condo',
        type: 'condo',
        rooms: 4,
        costPerNight: condoRate * 1.3,
        totalCost: 0,
        costPerPerson: 0,
      });
    }

    const calculated = options.map((opt) => {
      const totalCost = opt.costPerNight * nights;
      const costPerPerson = totalCost / guests;
      return { ...opt, totalCost, costPerPerson };
    });

    calculated.sort((a, b) => a.costPerPerson - b.costPerPerson);
    setSplitOptions(calculated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="my-8 border-2 border-primary-200">
        <CardContent className="py-12">
          <div className="flex justify-center items-center">
            <LoadingSpinner size="lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-8 border-2 border-primary-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Hotel vs Condo Split Calculator</CardTitle>
            <p className="text-neutral-600 mt-1">
              Compare costs for hotel rooms vs vacation rentals
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Number of Guests
            </label>
            <Input
              type="number"
              min="1"
              max="20"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Number of Nights
            </label>
            <Input
              type="number"
              min="1"
              max="14"
              value={nights}
              onChange={(e) => setNights(parseInt(e.target.value) || 1)}
              className="w-full"
            />
          </div>
        </div>

        {splitOptions.length > 0 && (
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Accommodation Options for {guests} Guests, {nights} Nights
            </h3>
            <div className="space-y-3">
              {splitOptions.map((option, index) => (
                <div
                  key={option.id}
                  className={`p-4 border-2 rounded-lg ${
                    index === 0
                      ? 'border-primary-400 bg-primary-50'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-neutral-900">{option.name}</div>
                      <div className="text-sm text-neutral-600 mt-1">
                        {option.type === 'hotel' ? 'Hotel rooms' : 'Vacation rental'} • {option.rooms} {option.type === 'condo' ? 'bedrooms' : 'rooms'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary-600">
                        {formatCurrency(option.costPerPerson)}
                      </div>
                      <div className="text-xs text-neutral-500">per person</div>
                    </div>
                  </div>
                  <div className="text-sm text-neutral-600">
                    Total: {formatCurrency(option.totalCost)} • {formatCurrency(option.costPerNight)}/night
                  </div>
                  {index === 0 && (
                    <div className="mt-2 text-sm text-primary-600 font-medium flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      Best Value
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-neutral-200 pt-6">
          <ArticleBookingWidget
            variant="default"
            title="Find Group Accommodations"
            description={`Search hotels and condos for ${guests} guests`}
            guests={guests}
            nights={nights}
            checkIn={checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd')}
            checkOut={checkOut || format(addDays(new Date(), 7 + nights), 'yyyy-MM-dd')}
          />
        </div>
      </CardContent>
    </Card>
  );
}
