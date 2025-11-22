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
      
      // Fetch peak season rates
      const peakParams = new URLSearchParams({
        cityName: 'Telluride',
        countryCode: 'US',
        limit: '5',
        checkin: peakCheckInDate,
        checkout: peakCheckOutDate,
      });
      
      const peakResponse = await fetch(`/api/liteapi/search?${peakParams.toString()}`);
      
      // Fetch off-peak season rates
      const offPeakParams = new URLSearchParams({
        cityName: 'Telluride',
        countryCode: 'US',
        limit: '5',
        checkin: offPeakCheckInDate,
        checkout: offPeakCheckOutDate,
      });
      
      const offPeakResponse = await fetch(`/api/liteapi/search?${offPeakParams.toString()}`);
      
      let peakHotelCost = 600; // Default fallback
      let offPeakHotelCost = 280; // Default fallback
      
      if (peakResponse.ok) {
        const peakDataResult = await peakResponse.json();
        const peakHotels: LiteAPIHotel[] = peakDataResult.data || [];
        if (peakHotels.length > 0) {
          peakHotelCost = peakHotels.reduce((sum, h) => sum + (h.min_rate || 600), 0) / peakHotels.length;
        }
      }
      
      if (offPeakResponse.ok) {
        const offPeakDataResult = await offPeakResponse.json();
        const offPeakHotels: LiteAPIHotel[] = offPeakDataResult.data || [];
        if (offPeakHotels.length > 0) {
          offPeakHotelCost = offPeakHotels.reduce((sum, h) => sum + (h.min_rate || 280), 0) / offPeakHotels.length;
        }
      }
      
      const peak: SeasonData = {
    name: 'Peak Season',
    dates: peakDates,
        hotelCost: peakHotelCost,
    liftTicketCost: BASE_LIFT_COST,
    crowdLevel: 'High',
    conditions: 'Excellent',
        totalCost: (peakHotelCost + BASE_LIFT_COST) * 4 * groupSize,
  };

      const offPeak: SeasonData = {
        name: 'Off-Peak Season',
        dates: offPeakDates,
        hotelCost: offPeakHotelCost,
        liftTicketCost: BASE_LIFT_COST,
        crowdLevel: 'Low',
        conditions: 'Good to Excellent',
        totalCost: (offPeakHotelCost + BASE_LIFT_COST) * 4 * groupSize,
      };
      
      setPeakData(peak);
      setOffPeakData(offPeak);
      setError(null);
    } catch (err) {
      // Fallback to estimated rates if API fails
      const peak: SeasonData = {
        name: 'Peak Season',
        dates: peakDates,
        hotelCost: 600,
        liftTicketCost: BASE_LIFT_COST,
        crowdLevel: 'High',
        conditions: 'Excellent',
        totalCost: (600 + BASE_LIFT_COST) * 4 * groupSize,
      };

      const offPeak: SeasonData = {
    name: 'Off-Peak Season',
    dates: offPeakDates,
        hotelCost: 280,
    liftTicketCost: BASE_LIFT_COST,
    crowdLevel: 'Low',
    conditions: 'Good to Excellent',
        totalCost: (280 + BASE_LIFT_COST) * 4 * groupSize,
      };
      
      setPeakData(peak);
      setOffPeakData(offPeak);
      setError(null); // Don't show error, just use estimates
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
              Save {savingsPercent}% by choosing off-peak dates for {groupSize} people, 4 nights
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
            limit={6}
            checkIn={selectedSeason === 'offpeak' 
              ? (offPeakCheckIn || format(addDays(new Date(), 7), 'yyyy-MM-dd'))
              : (peakCheckIn || format(addDays(new Date(), 7), 'yyyy-MM-dd'))
            }
            checkOut={selectedSeason === 'offpeak'
              ? (offPeakCheckOut || format(addDays(new Date(), 14), 'yyyy-MM-dd'))
              : (peakCheckOut || format(addDays(new Date(), 14), 'yyyy-MM-dd'))
            }
            title=""
            client:load
          />
        </div>
      </CardContent>
    </Card>
  );
}

