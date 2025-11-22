'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { HotelCard } from '@/components/lodging/HotelCard';
import { Calendar, TrendingDown } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export interface SeasonComparisonProps {
  peakDates: string;
  offPeakDates: string;
  groupSize?: number;
}

interface SeasonData {
  name: string;
  dates: string;
  hotelCost: number;
  liftTicketCost: number;
  crowdLevel: string;
  conditions: string;
  totalCost: number;
  hotels: LiteAPIHotel[];
  hotelPrices: Record<string, number>;
}

const BASE_LIFT_COST = 180;

export function SeasonComparison({
  peakDates,
  offPeakDates,
  groupSize = 4,
}: SeasonComparisonProps) {
  const [selectedSeason, setSelectedSeason] = useState<'peak' | 'offpeak'>('peak');
  const [peakData, setPeakData] = useState<SeasonData | null>(null);
  const [offPeakData, setOffPeakData] = useState<SeasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSeasonPricing() {
      try {
        setLoading(true);
        setError(null);

        // Parse dates (assuming format like "Dec 15 - Jan 5" or "Mar 1 - Mar 15")
        const parseDateRange = (dateStr: string) => {
          // Simple parsing - extract first date mentioned
          const parts = dateStr.split(/[-–]/);
          if (parts.length >= 2) {
            const startStr = parts[0].trim();
            const endStr = parts[1].trim();
            // Try to parse dates (this is simplified - you may need more robust parsing)
            const currentYear = new Date().getFullYear();
            const startDate = new Date(`${startStr} ${currentYear}`);
            const endDate = new Date(`${endStr} ${currentYear}`);
            return { startDate, endDate };
          }
          return null;
        };

        const peakRange = parseDateRange(peakDates);
        const offPeakRange = parseDateRange(offPeakDates);

        // Fetch hotels for comparison
        const params = new URLSearchParams({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: '20',
        });

        const response = await fetch(`/api/liteapi/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to load hotels');
        }

        const data = await response.json();
        const hotels: LiteAPIHotel[] = (data.data || [])
          .sort((a: LiteAPIHotel, b: LiteAPIHotel) => (b.review_score || 0) - (a.review_score || 0))
          .slice(0, 5);

        const fetchPrices = async (hotels: LiteAPIHotel[], checkIn: string, checkOut: string) => {
          const prices: Record<string, number> = {};
          const checkInDate = new Date(checkIn);
          const checkOutDate = new Date(checkOut);
          const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

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
                      return total && nights > 0 ? total / nights : null;
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

          return prices;
        };

        // Use sample dates if parsing fails
        const peakCheckIn = peakRange?.startDate.toISOString().split('T')[0] || '2024-12-20';
        const peakCheckOut = peakRange?.endDate.toISOString().split('T')[0] || '2024-12-24';
        const offPeakCheckIn = offPeakRange?.startDate.toISOString().split('T')[0] || '2024-03-01';
        const offPeakCheckOut = offPeakRange?.endDate.toISOString().split('T')[0] || '2024-03-05';

        const [peakPrices, offPeakPrices] = await Promise.all([
          fetchPrices(hotels, peakCheckIn, peakCheckOut),
          fetchPrices(hotels, offPeakCheckIn, offPeakCheckOut),
        ]);

        // Calculate average prices
        const getAveragePrice = (prices: Record<string, number>) => {
          const validPrices = Object.values(prices).filter(p => p > 0);
          if (validPrices.length === 0) return 0;
          return validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
        };

        const avgPeakPrice = getAveragePrice(peakPrices) || 800;
        const avgOffPeakPrice = getAveragePrice(offPeakPrices) || 300;

        const peakTotalCost = (avgPeakPrice + BASE_LIFT_COST) * 4 * groupSize;
        const offPeakTotalCost = (avgOffPeakPrice + BASE_LIFT_COST) * 4 * groupSize;

        setPeakData({
          name: 'Peak Season',
          dates: peakDates,
          hotelCost: avgPeakPrice,
          liftTicketCost: BASE_LIFT_COST,
          crowdLevel: 'High',
          conditions: 'Excellent',
          totalCost: peakTotalCost,
          hotels: hotels.slice(0, 3),
          hotelPrices: peakPrices,
        });

        setOffPeakData({
          name: 'Off-Peak Season',
          dates: offPeakDates,
          hotelCost: avgOffPeakPrice,
          liftTicketCost: BASE_LIFT_COST,
          crowdLevel: 'Low',
          conditions: 'Good to Excellent',
          totalCost: offPeakTotalCost,
          hotels: hotels.slice(0, 3),
          hotelPrices: offPeakPrices,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pricing data');
      } finally {
        setLoading(false);
      }
    }

    fetchSeasonPricing();
  }, [peakDates, offPeakDates, groupSize]);

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

  if (error || !peakData || !offPeakData) {
    return (
      <Card className="my-8 border-2 border-primary-200">
        <CardContent className="p-6">
          <p className="text-neutral-600 text-center">
            {error || 'Unable to load pricing comparison.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const savings = peakData.totalCost - offPeakData.totalCost;
  const savingsPercent = peakData.totalCost > 0 ? ((savings / peakData.totalCost) * 100).toFixed(0) : '0';
  const selectedData = selectedSeason === 'peak' ? peakData : offPeakData;

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
              Compare costs and conditions between peak and off-peak seasons
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

        {selectedData.hotels.length > 0 && (
          <div className="border-t border-neutral-200 pt-4">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              {selectedData.name} Hotels
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedData.hotels.map((hotel) => (
                <HotelCard
                  key={hotel.hotel_id}
                  hotel={hotel}
                  minPrice={selectedData.hotelPrices[hotel.hotel_id]}
                  onSelect={(id) => {
                    window.location.href = `/places-to-stay/${id}`;
                  }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-neutral-200 pt-4">
          <ArticleBookingWidget
            filter={selectedSeason === 'offpeak' ? undefined : 'luxury'}
            variant="default"
            title={selectedSeason === 'offpeak' ? 'See Off-Peak Deals' : 'View Peak Season Availability'}
            description={`Compare rates for ${selectedSeason === 'offpeak' ? 'off-peak' : 'peak'} season dates`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

