'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { HotelCard } from '@/components/lodging/HotelCard';
import { Calculator, Users, Calendar } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export interface GroupCostCalculatorProps {
  groupType?: 'family' | 'friends' | 'couples' | 'corporate' | 'solo';
  defaultNights?: number;
  defaultGuests?: number;
  checkIn?: string;
  checkOut?: string;
}

interface CostBreakdown {
  budget: number;
  midRange: number;
  luxury: number;
  totalBudget: number;
  totalMidRange: number;
  totalLuxury: number;
  budgetHotels: LiteAPIHotel[];
  midRangeHotels: LiteAPIHotel[];
  luxuryHotels: LiteAPIHotel[];
  budgetPrices: Record<string, number>;
  midRangePrices: Record<string, number>;
  luxuryPrices: Record<string, number>;
}

const LIFT_TICKET_COST = 180;
const ACTIVITIES_COST_PER_DAY = 80;
const DINING_COST_PER_DAY = 60;

export function GroupCostCalculator({
  groupType = 'family',
  defaultNights = 4,
  defaultGuests = 2,
  checkIn,
  checkOut,
}: GroupCostCalculatorProps) {
  const [guests, setGuests] = useState(defaultGuests);
  const [nights, setNights] = useState(defaultNights);
  const [loading, setLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHotelsAndCalculate() {
      try {
        setLoading(true);
        setError(null);

        // Fetch hotels for each category
        const params = new URLSearchParams({
          cityName: 'Telluride',
          countryCode: 'US',
          limit: '50',
        });

        const response = await fetch(`/api/liteapi/search?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to load hotels');
        }

        const data = await response.json();
        const allHotels: LiteAPIHotel[] = data.data || [];

        // Filter hotels by category
        const budgetHotels = allHotels
          .filter((h: LiteAPIHotel) => (h.star_rating || 0) <= 3 && (h.review_score || 0) < 8)
          .sort((a: LiteAPIHotel, b: LiteAPIHotel) => (a.review_score || 0) - (b.review_score || 0))
          .slice(0, 5);

        const midRangeHotels = allHotels
          .filter((h: LiteAPIHotel) => 
            (h.star_rating || 0) >= 3 && (h.star_rating || 0) < 5 && (h.review_score || 0) >= 7
          )
          .sort((a: LiteAPIHotel, b: LiteAPIHotel) => (b.review_score || 0) - (a.review_score || 0))
          .slice(0, 5);

        const luxuryHotels = allHotels
          .filter((h: LiteAPIHotel) => (h.star_rating || 0) >= 4 || (h.review_score || 0) >= 8)
          .sort((a: LiteAPIHotel, b: LiteAPIHotel) => (b.review_score || 0) - (a.review_score || 0))
          .slice(0, 5);

        // Fetch pricing if dates provided
        const fetchPrices = async (hotels: LiteAPIHotel[]) => {
          const prices: Record<string, number> = {};
          
          if (checkIn && checkOut && hotels.length > 0) {
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
          }

          return prices;
        };

        const [budgetPrices, midRangePrices, luxuryPrices] = await Promise.all([
          fetchPrices(budgetHotels),
          fetchPrices(midRangeHotels),
          fetchPrices(luxuryHotels),
        ]);

        // Calculate average prices per category
        const getAveragePrice = (hotels: LiteAPIHotel[], prices: Record<string, number>) => {
          if (hotels.length === 0) return 0;
          const validPrices = hotels
            .map(h => prices[h.hotel_id] || (h.star_rating ? h.star_rating * 100 : 300))
            .filter(p => p > 0);
          if (validPrices.length === 0) return 0;
          return validPrices.reduce((a, b) => a + b, 0) / validPrices.length;
        };

        const avgBudgetPrice = getAveragePrice(budgetHotels, budgetPrices) || 200;
        const avgMidRangePrice = getAveragePrice(midRangeHotels, midRangePrices) || 400;
        const avgLuxuryPrice = getAveragePrice(luxuryHotels, luxuryPrices) || 800;

        const lodgingBudget = avgBudgetPrice * nights;
        const lodgingMidRange = avgMidRangePrice * nights;
        const lodgingLuxury = avgLuxuryPrice * nights;

        const liftTickets = LIFT_TICKET_COST * nights * guests;
        const activities = ACTIVITIES_COST_PER_DAY * nights * guests;
        const dining = DINING_COST_PER_DAY * nights * guests;

        const totalBudget = lodgingBudget + liftTickets + activities + dining;
        const totalMidRange = lodgingMidRange + liftTickets + activities + dining;
        const totalLuxury = lodgingLuxury + liftTickets + activities + dining;

        const perPersonBudget = totalBudget / guests;
        const perPersonMidRange = totalMidRange / guests;
        const perPersonLuxury = totalLuxury / guests;

        setBreakdown({
          budget: perPersonBudget,
          midRange: perPersonMidRange,
          luxury: perPersonLuxury,
          totalBudget,
          totalMidRange,
          totalLuxury,
          budgetHotels: budgetHotels.slice(0, 3),
          midRangeHotels: midRangeHotels.slice(0, 3),
          luxuryHotels: luxuryHotels.slice(0, 3),
          budgetPrices,
          midRangePrices,
          luxuryPrices,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate costs');
      } finally {
        setLoading(false);
      }
    }

    if (guests > 0 && nights > 0) {
      fetchHotelsAndCalculate();
    }
  }, [guests, nights, checkIn, checkOut]);

  const getFilterForBudget = (perPerson: number) => {
    const perNightPerPerson = perPerson / nights;
    if (perNightPerPerson < 200) return 'budget';
    if (perNightPerPerson < 400) return 'family-friendly';
    return 'luxury';
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

  if (error) {
    return (
      <Card className="my-8 border-2 border-primary-200">
        <CardContent className="p-6">
          <p className="text-neutral-600 text-center">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-8 border-2 border-primary-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Trip Cost Calculator</CardTitle>
            <p className="text-neutral-600 mt-1">
              Calculate your total trip cost and cost per person
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

        {breakdown && (
          <div className="mt-6 space-y-4">
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Cost Per Person
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border-2 border-neutral-200 rounded-lg">
                  <div className="text-sm text-neutral-600 mb-1">Budget</div>
                  <div className="text-2xl font-bold text-primary-600">
                    {formatCurrency(breakdown.budget)}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">per person</div>
                </div>
                <div className="p-4 border-2 border-primary-300 rounded-lg bg-primary-50">
                  <div className="text-sm text-neutral-600 mb-1">Mid-Range</div>
                  <div className="text-2xl font-bold text-primary-700">
                    {formatCurrency(breakdown.midRange)}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">per person</div>
                </div>
                <div className="p-4 border-2 border-neutral-200 rounded-lg">
                  <div className="text-sm text-neutral-600 mb-1">Luxury</div>
                  <div className="text-2xl font-bold text-primary-600">
                    {formatCurrency(breakdown.luxury)}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">per person</div>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-3">
                Total Trip Cost
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Budget Total:</span>
                  <span className="font-semibold">{formatCurrency(breakdown.totalBudget)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Mid-Range Total:</span>
                  <span className="font-semibold">{formatCurrency(breakdown.totalMidRange)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Luxury Total:</span>
                  <span className="font-semibold">{formatCurrency(breakdown.totalLuxury)}</span>
                </div>
              </div>
            </div>

            {breakdown.midRangeHotels.length > 0 && (
              <div className="border-t border-neutral-200 pt-4">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Recommended Mid-Range Hotels
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {breakdown.midRangeHotels.map((hotel) => (
                    <HotelCard
                      key={hotel.hotel_id}
                      hotel={hotel}
                      minPrice={breakdown.midRangePrices[hotel.hotel_id]}
                      checkInDate={checkIn}
                      checkOutDate={checkOut}
                      onSelect={(id) => {
                        window.location.href = `/places-to-stay/${id}${checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`;
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-neutral-200 pt-4">
              <ArticleBookingWidget
                filter={getFilterForBudget(breakdown.midRange)}
                variant="default"
                title={`Find Hotels Under ${formatCurrency(breakdown.midRange)}/person`}
                description="Search available properties that fit your budget"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

