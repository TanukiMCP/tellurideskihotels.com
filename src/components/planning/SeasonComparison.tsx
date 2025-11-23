'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { HotelGrid } from '@/components/blog/HotelGrid';
import { Calendar, TrendingDown } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { addDays, format } from 'date-fns';

export interface SeasonComparisonProps {
  peakDates: string;
  offPeakDates: string;
  groupSize?: number;
  peakCheckIn?: string;
  peakCheckOut?: string;
  offPeakCheckIn?: string;
  offPeakCheckOut?: string;
}

interface SeasonData {
  name: string;
  dates: string;
  hotelCost: number;
  liftTicketCost: number;
  crowdLevel: string;
  conditions: string;
  totalCost: number;
}

const BASE_LIFT_COST = 180;

export function SeasonComparison({
  peakDates,
  offPeakDates,
  groupSize = 4,
  peakCheckIn,
  peakCheckOut,
  offPeakCheckIn,
  offPeakCheckOut,
}: SeasonComparisonProps) {
  const [selectedSeason, setSelectedSeason] = useState<'peak' | 'offpeak'>('peak');
  const [peakData, setPeakData] = useState<SeasonData | null>(null);
  const [offPeakData, setOffPeakData] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSeasonData();
  }, [peakCheckIn, peakCheckOut, offPeakCheckIn, offPeakCheckOut, groupSize]);

  const fetchSeasonData = async () => {
    try {
      setLoading(true);
      
      // Default dates: 1 week out from today, 1 week duration
      const defaultCheckIn = new Date();
      defaultCheckIn.setDate(defaultCheckIn.getDate() + 7);
      const defaultCheckOut = new Date(defaultCheckIn);
      defaultCheckOut.setDate(defaultCheckOut.getDate() + 7);
      
      const peakCheckInDate = peakCheckIn || defaultCheckIn.toISOString().split('T')[0];
      const peakCheckOutDate = peakCheckOut || defaultCheckOut.toISOString().split('T')[0];
      const offPeakCheckInDate = offPeakCheckIn || defaultCheckIn.toISOString().split('T')[0];
      const offPeakCheckOutDate = offPeakCheckOut || defaultCheckOut.toISOString().split('T')[0];
      
      // STEP 1: Fetch hotels for both seasons
      const searchParams = new URLSearchParams({
        cityName: 'Telluride',
        countryCode: 'US',
        limit: '20',
      });
      
      const hotelsResponse = await fetch(`/api/liteapi/search?${searchParams.toString()}`);
      
      if (!hotelsResponse.ok) {
        throw new Error('Failed to fetch hotels');
      }
      
      const hotelsData = await hotelsResponse.json();
      const hotels: LiteAPIHotel[] = hotelsData.data || [];
      
      if (hotels.length === 0) {
        throw new Error('No hotels found');
      }
      
      const hotelIds = hotels.map(h => h.hotel_id);
      const nights = Math.ceil((new Date(peakCheckOutDate).getTime() - new Date(peakCheckInDate).getTime()) / (1000 * 60 * 60 * 24));
      
      // STEP 2: Fetch peak season rates
      const peakRatesParams = new URLSearchParams({
        hotelIds: hotelIds.join(','),
        checkIn: peakCheckInDate,
        checkOut: peakCheckOutDate,
        adults: groupSize.toString(),
      });
      
      const peakRatesResponse = await fetch(`/api/hotels/min-rates?${peakRatesParams.toString()}`);
      
      // STEP 3: Fetch off-peak season rates
      const offPeakRatesParams = new URLSearchParams({
        hotelIds: hotelIds.join(','),
        checkIn: offPeakCheckInDate,
        checkOut: offPeakCheckOutDate,
        adults: groupSize.toString(),
      });
      
      const offPeakRatesResponse = await fetch(`/api/hotels/min-rates?${offPeakRatesParams.toString()}`);
      
      let peakHotelCost = 0;
      let offPeakHotelCost = 0;
      let peakCount = 0;
      let offPeakCount = 0;
      
      if (peakRatesResponse.ok) {
        const peakRatesData = await peakRatesResponse.json();
        if (peakRatesData.data && Array.isArray(peakRatesData.data)) {
          peakRatesData.data.forEach((item: any) => {
            if (item.hotelId && item.price) {
              peakHotelCost += nights > 0 ? item.price / nights : item.price;
              peakCount++;
            }
          });
        }
      }
      
      if (offPeakRatesResponse.ok) {
        const offPeakRatesData = await offPeakRatesResponse.json();
        if (offPeakRatesData.data && Array.isArray(offPeakRatesData.data)) {
          offPeakRatesData.data.forEach((item: any) => {
            if (item.hotelId && item.price) {
              offPeakHotelCost += nights > 0 ? item.price / nights : item.price;
              offPeakCount++;
            }
          });
        }
      }
      
      // Calculate averages
      peakHotelCost = peakCount > 0 ? peakHotelCost / peakCount : 600;
      offPeakHotelCost = offPeakCount > 0 ? offPeakHotelCost / offPeakCount : 280;
      
      const peak: SeasonData = {
    name: 'Peak Season',
    dates: peakDates,
        hotelCost: peakHotelCost,
    liftTicketCost: BASE_LIFT_COST,
    crowdLevel: 'High',
    conditions: 'Excellent',
        totalCost: (peakHotelCost * nights + BASE_LIFT_COST * nights) * groupSize,
  };

      const offPeak: SeasonData = {
    name: 'Off-Peak Season',
    dates: offPeakDates,
        hotelCost: offPeakHotelCost,
    liftTicketCost: BASE_LIFT_COST,
    crowdLevel: 'Low',
    conditions: 'Good to Excellent',
        totalCost: (offPeakHotelCost * nights + BASE_LIFT_COST * nights) * groupSize,
      };
      
      setPeakData(peak);
      setOffPeakData(offPeak);
      setError(null);
    } catch (err) {
      // If API fails completely, show error state
      setError('Unable to fetch current rates. Please try again later.');
      setPeakData(null);
      setOffPeakData(null);
    } finally {
      setLoading(false);
    }
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

  if (!peakData || !offPeakData) {
    return null;
  }

  const savings = peakData.totalCost - offPeakData.totalCost;
  const savingsPercent = ((savings / peakData.totalCost) * 100).toFixed(0);

  return (
    <Card className="my-8 border-2 border-primary-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Peak vs Off-Peak Comparison</CardTitle>
            <p className="text-neutral-600 mt-1">
              Compare costs with real-time pricing between peak and off-peak seasons
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Group Size
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={groupSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value) || 4;
                window.location.href = window.location.pathname + `?groupSize=${newSize}`;
              }}
              className="flex h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Peak Check-In
            </label>
            <input
              type="date"
              value={peakCheckIn || format(addDays(new Date(), 7), 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  window.location.href = window.location.pathname + `?peakCheckIn=${e.target.value}`;
                }
              }}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="flex h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Off-Peak Check-In
            </label>
            <input
              type="date"
              value={offPeakCheckIn || format(addDays(new Date(), 7), 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  window.location.href = window.location.pathname + `?offPeakCheckIn=${e.target.value}`;
                }
              }}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="flex h-12 w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Nights
            </label>
            <input
              type="number"
              min="1"
              max="14"
              value={Math.ceil((new Date(peakCheckOut || format(addDays(new Date(), 14), 'yyyy-MM-dd')).getTime() - new Date(peakCheckIn || format(addDays(new Date(), 7), 'yyyy-MM-dd')).getTime()) / (1000 * 60 * 60 * 24))}
              readOnly
              className="flex h-12 w-full rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-base"
            />
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedSeason === 'peak'
                ? 'border-primary-400 bg-primary-50'
                : 'border-neutral-200 hover:border-primary-200'
            }`}
            onClick={() => setSelectedSeason('peak')}
          >
            <div className="font-semibold text-lg text-neutral-900 mb-2">Peak Season</div>
            <div className="text-sm text-neutral-600 mb-4">{peakDates}</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Hotel (per night):</span>
                <span className="font-semibold">{formatCurrency(peakData.hotelCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Lift Tickets:</span>
                <span className="font-semibold">{formatCurrency(peakData.liftTicketCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Crowds:</span>
                <span className="font-semibold">{peakData.crowdLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Conditions:</span>
                <span className="font-semibold">{peakData.conditions}</span>
              </div>
            </div>
          </div>

          <div
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedSeason === 'offpeak'
                ? 'border-primary-400 bg-primary-50'
                : 'border-neutral-200 hover:border-primary-200'
            }`}
            onClick={() => setSelectedSeason('offpeak')}
          >
            <div className="font-semibold text-lg text-neutral-900 mb-2">Off-Peak Season</div>
            <div className="text-sm text-neutral-600 mb-4">{offPeakDates}</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Hotel (per night):</span>
                <span className="font-semibold">{formatCurrency(offPeakData.hotelCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Lift Tickets:</span>
                <span className="font-semibold">{formatCurrency(offPeakData.liftTicketCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Crowds:</span>
                <span className="font-semibold">{offPeakData.crowdLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Conditions:</span>
                <span className="font-semibold">{offPeakData.conditions}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <div className="p-4 bg-neutral-50 border-2 border-neutral-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-neutral-900">Potential Savings</span>
            </div>
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {formatCurrency(savings)}
            </div>
            <div className="text-sm text-neutral-600">
              Save {savingsPercent}% by choosing off-peak dates for {groupSize} people, {nights} nights
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">
            Available Hotels for {selectedSeason === 'offpeak' ? 'Off-Peak' : 'Peak'} Season
          </h3>
          <p className="text-neutral-600 mb-6">
            {selectedSeason === 'offpeak' 
              ? `Save ${savingsPercent}% with these off-peak season hotels (${offPeakDates})`
              : `Premium availability for peak season (${peakDates})`
            }
          </p>
          <HotelGrid
            filter={selectedSeason === 'offpeak' ? undefined : 'luxury'}
            limit={3}
            checkIn={selectedSeason === 'offpeak' 
              ? (offPeakCheckIn || format(addDays(new Date(), 7), 'yyyy-MM-dd'))
              : (peakCheckIn || format(addDays(new Date(), 7), 'yyyy-MM-dd'))
            }
            checkOut={selectedSeason === 'offpeak'
              ? (offPeakCheckOut || format(addDays(new Date(), 14), 'yyyy-MM-dd'))
              : (peakCheckOut || format(addDays(new Date(), 14), 'yyyy-MM-dd'))
            }
            title=""
          />
        </div>
      </CardContent>
    </Card>
  );
}

