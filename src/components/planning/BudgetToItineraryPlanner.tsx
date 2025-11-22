'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { HotelGrid } from '@/components/blog/HotelGrid';
import { DollarSign, Calendar, Users, PieChart } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { addDays, format } from 'date-fns';

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
  avgHotelRate: number;
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
  const [avgHotelRate, setAvgHotelRate] = useState(350);

  useEffect(() => {
    fetchRatesAndCalculate();
  }, [budget, length, size, checkIn, checkOut]);

  const fetchRatesAndCalculate = async () => {
    try {
      setLoading(true);
      
      // Default dates: 1 week out from today, 1 week duration
      const defaultCheckIn = new Date();
      defaultCheckIn.setDate(defaultCheckIn.getDate() + 7);
      const defaultCheckOut = new Date(defaultCheckIn);
      defaultCheckOut.setDate(defaultCheckOut.getDate() + 7);
      
      const checkInDate = checkIn || defaultCheckIn.toISOString().split('T')[0];
      const checkOutDate = checkOut || defaultCheckOut.toISOString().split('T')[0];
      
      // Fetch actual hotel rates
      const params = new URLSearchParams({
        cityName: 'Telluride',
        countryCode: 'US',
        limit: '10',
        checkin: checkInDate,
        checkout: checkOutDate,
      });
      
      const response = await fetch(`/api/liteapi/search?${params.toString()}`);
      
      let hotelRate = 350; // Default fallback
      
      if (response.ok) {
        const data = await response.json();
        const hotels: LiteAPIHotel[] = data.data || [];
        
        if (hotels.length > 0) {
          hotelRate = hotels.reduce((sum, h) => sum + (h.min_rate || 350), 0) / hotels.length;
        }
      }
      
      setAvgHotelRate(hotelRate);
      calculateBreakdown(hotelRate);
    } catch (err) {
      // Fall back to default rate if API fails
      calculateBreakdown(avgHotelRate);
    } finally {
      setLoading(false);
    }
  };

  const calculateBreakdown = (hotelRate: number) => {
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
      avgHotelRate: hotelRate,
    });
  };

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

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">
                Hotels Within Your Budget
              </h3>
              <p className="text-neutral-600 mb-6">
                Based on your {formatCurrency(budget)} per person budget for {length} days, here are hotels around {formatCurrency(breakdown.lodging / length)}/night:
              </p>
              <HotelGrid
                filter={getFilterForBudget()}
                limit={6}
                checkIn={checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd')}
                checkOut={checkOut || format(addDays(new Date(), 14), 'yyyy-MM-dd')}
                title=""
                client:load
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

