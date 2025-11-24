'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { HotelGrid } from '@/components/blog/HotelGrid';
import { Calendar, TrendingDown, Users, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { format } from 'date-fns';

export interface SeasonComparisonProps {
  groupSize?: number;
  title?: string;
}

interface SeasonData {
  name: string;
  dates: string;
  checkIn: string;
  checkOut: string;
  hotelCost: number;
  liftTicketCost: number;
  crowdLevel: string;
  conditions: string;
  totalCost: number;
}

const BASE_LIFT_COST = 180;

// Hardcoded peak and off-peak date ranges for current season
const PEAK_SEASON = {
  name: 'Peak Season',
  dates: 'Dec 20 - Jan 5',
  checkIn: '2025-12-20',
  checkOut: '2025-12-27', // 7 nights
  crowdLevel: 'High',
  conditions: 'Excellent Snow',
};

const OFF_PEAK_SEASON = {
  name: 'Off-Peak Season',
  dates: 'Jan 15 - Mar 15',
  checkIn: '2026-01-15',
  checkOut: '2026-01-22', // 7 nights
  crowdLevel: 'Low',
  conditions: 'Good to Excellent',
};

export function SeasonComparison({
  groupSize = 2,
  title = 'Peak vs Off-Peak Season Comparison',
}: SeasonComparisonProps) {
  const [guests, setGuests] = useState(groupSize);
  const [selectedSeason, setSelectedSeason] = useState<'peak' | 'offpeak'>('offpeak');
  const [peakData, setPeakData] = useState<SeasonData | null>(null);
  const [offPeakData, setOffPeakData] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(true);

  const nights = 7; // Fixed 7-night stay for comparison

  useEffect(() => {
    fetchSeasonData();
  }, [guests]);

  const fetchSeasonData = async () => {
    try {
      setLoading(true);
      
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
      
      // Fetch peak season rates
      const peakRatesParams = new URLSearchParams({
        hotelIds: hotelIds.join(','),
        checkIn: PEAK_SEASON.checkIn,
        checkOut: PEAK_SEASON.checkOut,
        adults: guests.toString(),
      });
      
      const peakRatesResponse = await fetch(`/api/hotels/min-rates?${peakRatesParams.toString()}`);
      
      // Fetch off-peak season rates
      const offPeakRatesParams = new URLSearchParams({
        hotelIds: hotelIds.join(','),
        checkIn: OFF_PEAK_SEASON.checkIn,
        checkOut: OFF_PEAK_SEASON.checkOut,
        adults: guests.toString(),
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
      
      // Calculate averages (fallback to estimates if no data)
      peakHotelCost = peakCount > 0 ? peakHotelCost / peakCount : 600;
      offPeakHotelCost = offPeakCount > 0 ? offPeakHotelCost / offPeakCount : 280;
      
      const peak: SeasonData = {
        ...PEAK_SEASON,
        hotelCost: peakHotelCost,
        liftTicketCost: BASE_LIFT_COST,
        totalCost: (peakHotelCost * nights + BASE_LIFT_COST * nights) * guests,
      };

      const offPeak: SeasonData = {
        ...OFF_PEAK_SEASON,
        hotelCost: offPeakHotelCost,
        liftTicketCost: BASE_LIFT_COST,
        totalCost: (offPeakHotelCost * nights + BASE_LIFT_COST * nights) * guests,
      };
      
      setPeakData(peak);
      setOffPeakData(offPeak);
    } catch (err) {
      // Use fallback estimates if API fails
      setPeakData({
        ...PEAK_SEASON,
        hotelCost: 600,
        liftTicketCost: BASE_LIFT_COST,
        totalCost: (600 * nights + BASE_LIFT_COST * nights) * guests,
      });
      setOffPeakData({
        ...OFF_PEAK_SEASON,
        hotelCost: 280,
        liftTicketCost: BASE_LIFT_COST,
        totalCost: (280 * nights + BASE_LIFT_COST * nights) * guests,
      });
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
      <Card className="my-12 not-prose border-2 border-primary-200">
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
    <Card className="my-12 not-prose border-2 border-primary-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center shadow-md">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-neutral-900">{title}</CardTitle>
            <p className="text-neutral-600 mt-1 text-sm">
              Compare costs and find the best time to visit
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Season Comparison</p>
            <p>
              Comparing average rates for {nights}-night stays during peak holiday season vs off-peak winter season. 
              Actual prices vary by specific dates and availability.
            </p>
          </div>
        </div>

        {/* Group Size Input */}
        <div className="max-w-xs">
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            <Users className="w-4 h-4 inline mr-2" />
            Number of Guests
          </label>
          <Input
            type="number"
            min="1"
            max="20"
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value) || 2)}
            className="w-full"
          />
        </div>
        
        {/* Season Comparison Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => setSelectedSeason('peak')}
            className={`p-6 border-2 rounded-lg text-left transition-all hover:shadow-md ${
              selectedSeason === 'peak'
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-neutral-200 hover:border-primary-200 bg-white'
            }`}
          >
            <div className="font-bold text-xl text-neutral-900 mb-2">{peakData.name}</div>
            <div className="text-sm text-neutral-600 mb-4">{peakData.dates}</div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Hotel (per night):</span>
                <span className="font-semibold">{formatCurrency(peakData.hotelCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Lift Tickets (per day):</span>
                <span className="font-semibold">{formatCurrency(peakData.liftTicketCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Crowds:</span>
                <span className="font-semibold text-red-600">{peakData.crowdLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Conditions:</span>
                <span className="font-semibold text-green-600">{peakData.conditions}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-neutral-200">
              <div className="text-xs text-neutral-500 mb-1">Total for {guests} {guests === 1 ? 'guest' : 'guests'}, {nights} nights</div>
              <div className="text-2xl font-bold text-primary-600">
                {formatCurrency(peakData.totalCost)}
              </div>
            </div>
            {selectedSeason === 'peak' && (
              <div className="mt-3 text-xs text-primary-600 font-medium">
                ✓ Selected
              </div>
            )}
          </button>

          <button
            onClick={() => setSelectedSeason('offpeak')}
            className={`p-6 border-2 rounded-lg text-left transition-all hover:shadow-md ${
              selectedSeason === 'offpeak'
                ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                : 'border-neutral-200 hover:border-primary-200 bg-white'
            }`}
          >
            <div className="font-bold text-xl text-neutral-900 mb-2">{offPeakData.name}</div>
            <div className="text-sm text-neutral-600 mb-4">{offPeakData.dates}</div>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Hotel (per night):</span>
                <span className="font-semibold">{formatCurrency(offPeakData.hotelCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Lift Tickets (per day):</span>
                <span className="font-semibold">{formatCurrency(offPeakData.liftTicketCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Crowds:</span>
                <span className="font-semibold text-green-600">{offPeakData.crowdLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Conditions:</span>
                <span className="font-semibold text-green-600">{offPeakData.conditions}</span>
              </div>
            </div>
            <div className="pt-4 border-t border-neutral-200">
              <div className="text-xs text-neutral-500 mb-1">Total for {guests} {guests === 1 ? 'guest' : 'guests'}, {nights} nights</div>
              <div className="text-2xl font-bold text-primary-600">
                {formatCurrency(offPeakData.totalCost)}
              </div>
            </div>
            {selectedSeason === 'offpeak' && (
              <div className="mt-3 text-xs text-primary-600 font-medium">
                ✓ Selected
              </div>
            )}
          </button>
        </div>

        {/* Savings Callout */}
        <div className="p-6 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <TrendingDown className="w-6 h-6 text-green-600" />
            <span className="font-bold text-lg text-neutral-900">Potential Savings</span>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {formatCurrency(savings)}
          </div>
          <div className="text-sm text-neutral-700">
            Save <span className="font-bold">{savingsPercent}%</span> by choosing off-peak dates 
            ({offPeakData.dates}) instead of peak season ({peakData.dates}) 
            for {guests} {guests === 1 ? 'person' : 'people'}.
          </div>
        </div>

        {/* Matching Hotels */}
        <div className="pt-6 border-t border-neutral-200">
          <h3 className="text-xl font-bold text-neutral-900 mb-4">
            Available Hotels for {selectedSeason === 'offpeak' ? 'Off-Peak' : 'Peak'} Season
          </h3>
          <p className="text-neutral-600 mb-6">
            {selectedSeason === 'offpeak' 
              ? `Save ${savingsPercent}% with these off-peak season hotels (${offPeakData.dates})`
              : `Premium availability for peak season (${peakData.dates})`
            }
          </p>
          <HotelGrid
            limit={3}
            checkIn={selectedSeason === 'offpeak' ? offPeakData.checkIn : peakData.checkIn}
            checkOut={selectedSeason === 'offpeak' ? offPeakData.checkOut : peakData.checkOut}
            title=""
            displayMode="triple"
          />
        </div>
      </CardContent>
    </Card>
  );
}
