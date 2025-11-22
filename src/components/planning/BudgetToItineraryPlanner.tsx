'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { HotelCard } from '@/components/lodging/HotelCard';
import { DollarSign, Calendar, Users, PieChart } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export interface BudgetToItineraryPlannerProps {
  budgetPerPerson?: number;
  tripLength?: number;
  groupSize?: number;
  checkIn?: string;
  checkOut?: string;
}

interface BudgetBreakdown {
  lodging: number;
  liftTickets: number;
  activities: number;
  dining: number;
  total: number;
  lodgingPercent: number;
  liftPercent: number;
  activitiesPercent: number;
  diningPercent: number;
  hotels: LiteAPIHotel[];
  hotelPrices: Record<string, number>;
}

const LIFT_TICKET_COST = 180;
const ACTIVITIES_COST_PER_DAY = 80;
const DINING_COST_PER_DAY = 60;

export function BudgetToItineraryPlanner({
  budgetPerPerson = 800,
  tripLength = 3,
  groupSize = 2,
  checkIn,
  checkOut,
}: BudgetToItineraryPlannerProps) {
  const [budget, setBudget] = useState(budgetPerPerson);
  const [length, setLength] = useState(tripLength);
  const [size, setSize] = useState(groupSize);
  const [breakdown, setBreakdown] = useState<BudgetBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function calculateBreakdownAndFetchHotels() {
      try {
        setLoading(true);
        setError(null);

        const liftTickets = LIFT_TICKET_COST * length;
        const activities = ACTIVITIES_COST_PER_DAY * length;
        const dining = DINING_COST_PER_DAY * length;
        const fixedCosts = liftTickets + activities + dining;

        const lodging = Math.max(0, budget - fixedCosts);
        const total = lodging + fixedCosts;

        const lodgingPercent = (lodging / total) * 100;
        const liftPercent = (liftTickets / total) * 100;
        const activitiesPercent = (activities / total) * 100;
        const diningPercent = (dining / total) * 100;

        // Fetch hotels that fit the lodging budget
        const maxPricePerNight = lodging / length;
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

        // Filter hotels by budget and fetch pricing
        let matchingHotels = allHotels
          .sort((a: LiteAPIHotel, b: LiteAPIHotel) => (b.review_score || 0) - (a.review_score || 0))
          .slice(0, 10);

        const hotelPrices: Record<string, number> = {};

        if (checkIn && checkOut && matchingHotels.length > 0) {
          const checkInDate = new Date(checkIn);
          const checkOutDate = new Date(checkOut);
          const calculatedNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

          const pricePromises = matchingHotels.map(async (hotel) => {
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
                    const price = Math.min(...ratePrices);
                    return { hotelId: hotel.hotel_id, price };
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
              hotelPrices[result.hotelId] = result.price;
            }
          });

          // Filter hotels that fit budget (with or without pricing)
          matchingHotels = matchingHotels.filter((hotel) => {
            const price = hotelPrices[hotel.hotel_id];
            if (price) {
              return price <= maxPricePerNight * 1.2; // Allow 20% buffer
            }
            // If no pricing, estimate based on star rating
            const estimatedPrice = (hotel.star_rating || 3) * 100;
            return estimatedPrice <= maxPricePerNight * 1.2;
          });
        } else {
          // Without dates, filter by estimated price
          matchingHotels = matchingHotels.filter((hotel) => {
            const estimatedPrice = (hotel.star_rating || 3) * 100;
            return estimatedPrice <= maxPricePerNight * 1.2;
          });
        }

        setBreakdown({
          lodging,
          liftTickets,
          activities,
          dining,
          total,
          lodgingPercent,
          liftPercent,
          activitiesPercent,
          diningPercent,
          hotels: matchingHotels.slice(0, 3),
          hotelPrices,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate budget');
      } finally {
        setLoading(false);
      }
    }

    if (budget > 0 && length > 0 && size > 0) {
      calculateBreakdownAndFetchHotels();
    }
  }, [budget, length, size, checkIn, checkOut]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getFilterForBudget = () => {
    const perNight = breakdown ? breakdown.lodging / length : 0;
    if (perNight < 150) return 'budget';
    if (perNight < 400) return 'family-friendly';
    return 'luxury';
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
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Budget Breakdown Planner</CardTitle>
            <p className="text-neutral-600 mt-1">
              See how your budget is allocated across trip expenses
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Budget Per Person
            </label>
            <Input
              type="number"
              min="300"
              max="5000"
              step="50"
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value) || 800)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Trip Length (Days)
            </label>
            <Input
              type="number"
              min="1"
              max="14"
              value={length}
              onChange={(e) => setLength(parseInt(e.target.value) || 3)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Users className="w-4 h-4 inline mr-2" />
              Group Size
            </label>
            <Input
              type="number"
              min="1"
              max="20"
              value={size}
              onChange={(e) => setSize(parseInt(e.target.value) || 2)}
              className="w-full"
            />
          </div>
        </div>

        {breakdown && (
          <div className="mt-6 space-y-4">
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Budget Allocation for {length} Days
              </h3>
              <div className="space-y-3">
                <div className="p-4 border-2 border-neutral-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-neutral-900">Lodging</span>
                    <span className="font-bold text-primary-600">
                      {formatCurrency(breakdown.lodging)}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${breakdown.lodgingPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {breakdown.lodgingPercent.toFixed(1)}% of budget
                  </div>
                </div>

                <div className="p-4 border-2 border-neutral-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-neutral-900">Lift Tickets</span>
                    <span className="font-bold text-primary-600">
                      {formatCurrency(breakdown.liftTickets)}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${breakdown.liftPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {breakdown.liftPercent.toFixed(1)}% of budget
                  </div>
                </div>

                <div className="p-4 border-2 border-neutral-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-neutral-900">Activities</span>
                    <span className="font-bold text-primary-600">
                      {formatCurrency(breakdown.activities)}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${breakdown.activitiesPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {breakdown.activitiesPercent.toFixed(1)}% of budget
                  </div>
                </div>

                <div className="p-4 border-2 border-neutral-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-neutral-900">Dining</span>
                    <span className="font-bold text-primary-600">
                      {formatCurrency(breakdown.dining)}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{ width: `${breakdown.diningPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">
                    {breakdown.diningPercent.toFixed(1)}% of budget
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-4">
              <div className="p-4 bg-primary-50 border-2 border-primary-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-neutral-900">Total Budget:</span>
                  <span className="text-2xl font-bold text-primary-700">
                    {formatCurrency(breakdown.total)}
                  </span>
                </div>
                <div className="text-sm text-neutral-600 mt-1">
                  Per person for {length} days
                </div>
              </div>
            </div>

            {breakdown.hotels.length > 0 && (
              <div className="border-t border-neutral-200 pt-4">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                  Hotels That Fit Your Budget
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {breakdown.hotels.map((hotel) => (
                    <HotelCard
                      key={hotel.hotel_id}
                      hotel={hotel}
                      minPrice={breakdown.hotelPrices[hotel.hotel_id]}
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
                filter={getFilterForBudget()}
                variant="default"
                title={`Find Hotels Under ${formatCurrency(breakdown.lodging / length)}/night`}
                description="Search available properties that fit your lodging budget"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

