'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { PieChart, DollarSign, Users, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { addDays, format } from 'date-fns';

export interface BudgetToItineraryPlannerProps {
  budgetPerPerson?: number;
  tripLength?: number;
  groupSize?: number;
  checkIn?: string;
  checkOut?: string;
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
  const [nights, setNights] = useState(tripLength);
  const [guests, setGuests] = useState(groupSize);
  const [loading, setLoading] = useState(true);
  const [lodgingRate, setLodgingRate] = useState(350);
  const [breakdown, setBreakdown] = useState({
    lodging: 0,
    liftTickets: 0,
    activities: 0,
    dining: 0,
    total: 0,
  });

  useEffect(() => {
    fetchRates();
  }, [checkIn, checkOut, nights]);

  useEffect(() => {
    if (!loading) {
      calculateBreakdown();
    }
  }, [budget, nights, lodgingRate, loading]);

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
        setLodgingRate(350);
        return;
      }
      
      const hotelsData = await hotelsResponse.json();
      const hotels = hotelsData.data || [];
      
      if (hotels.length === 0) {
        setLodgingRate(350);
        return;
      }
      
      const hotelIds = hotels.map((h: any) => h.hotel_id);
      const ratesParams = new URLSearchParams({
        hotelIds: hotelIds.join(','),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: guests.toString(),
      });
      
      const ratesResponse = await fetch(`/api/hotels/min-rates?${ratesParams.toString()}`);
      
      if (!ratesResponse.ok) {
        setLodgingRate(350);
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
        setLodgingRate(Math.round(avgPrice));
      } else {
        setLodgingRate(350);
      }
    } catch (err) {
      setLodgingRate(350);
    } finally {
      setLoading(false);
    }
  };

  const calculateBreakdown = () => {
    // Budget is per person per night
    // Fixed costs per person per night
    const liftTicketsPerNight = LIFT_TICKET_COST;
    const activitiesPerNight = ACTIVITIES_COST_PER_DAY;
    const diningPerNight = DINING_COST_PER_DAY;
    const fixedCostsPerNight = liftTicketsPerNight + activitiesPerNight + diningPerNight;
    
    // Lodging per person per night = budget - fixed costs per night
    const lodgingPerNight = Math.max(0, budget - fixedCostsPerNight);
    
    // Total for the trip (per person)
    const liftTickets = liftTicketsPerNight * nights;
    const activities = activitiesPerNight * nights;
    const dining = diningPerNight * nights;
    const lodging = lodgingPerNight * nights;
    const total = lodging + liftTickets + activities + dining;
    
    setBreakdown({
      lodging,
      liftTickets,
      activities,
      dining,
      total,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPercent = (amount: number) => {
    return breakdown.total > 0 ? (amount / breakdown.total) * 100 : 0;
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
            <PieChart className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Budget to Itinerary Planner</CardTitle>
            <p className="text-neutral-600 mt-1">
              Allocate your budget across trip expenses
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <DollarSign className="w-4 h-4 inline mr-2" />
              Budget Per Person Per Night
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
              value={nights}
              onChange={(e) => setNights(parseInt(e.target.value) || 3)}
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
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 2)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Check-In Date
            </label>
            <Input
              type="date"
              value={checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  const newCheckIn = e.target.value;
                  const newCheckOut = checkOut || format(addDays(new Date(newCheckIn), nights), 'yyyy-MM-dd');
                  window.location.href = `/places-to-stay?guests=${guests}&nights=${nights}&maxPrice=${Math.round(breakdown.lodging / nights)}&checkin=${newCheckIn}&checkout=${newCheckOut}`;
                }
              }}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Check-Out Date
            </label>
            <Input
              type="date"
              value={checkOut || format(addDays(new Date(), 7 + nights), 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  const newCheckOut = e.target.value;
                  const newCheckIn = checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd');
                  window.location.href = `/places-to-stay?guests=${guests}&nights=${nights}&maxPrice=${Math.round(breakdown.lodging / nights)}&checkin=${newCheckIn}&checkout=${newCheckOut}`;
                }
              }}
              min={checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd')}
              className="w-full"
            />
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Budget Allocation for {nights} Days
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Lodging', amount: breakdown.lodging, percent: getPercent(breakdown.lodging), color: 'bg-primary-600' },
              { label: 'Lift Tickets', amount: breakdown.liftTickets, percent: getPercent(breakdown.liftTickets), color: 'bg-primary-500' },
              { label: 'Activities', amount: breakdown.activities, percent: getPercent(breakdown.activities), color: 'bg-primary-400' },
              { label: 'Dining', amount: breakdown.dining, percent: getPercent(breakdown.dining), color: 'bg-primary-300' },
            ].map((item) => (
              <div key={item.label} className="p-4 border-2 border-neutral-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-neutral-900">{item.label}</span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <div className="text-xs text-neutral-500 mt-1">
                  {item.percent.toFixed(1)}% of budget
                </div>
              </div>
            ))}
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
              Per person for {nights} nights ({formatCurrency(budget)}/night)
            </div>
          </div>
        </div>

        {breakdown.lodging > 0 && (
          <div className="border-t border-neutral-200 pt-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Recommended Hotels
            </h3>
            <p className="text-neutral-600 mb-4">
              Based on your {formatCurrency(budget)} per person budget, here are hotels around {formatCurrency(breakdown.lodging / nights)}/night:
            </p>
            <a
              href={`/places-to-stay?guests=${guests}&nights=${nights}&maxPrice=${Math.round(breakdown.lodging / nights)}${checkIn ? `&checkin=${checkIn}` : ''}${checkOut ? `&checkout=${checkOut}` : ''}`}
              className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 !text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg w-full md:w-auto"
            >
              Find Hotels Around {formatCurrency(breakdown.lodging / nights)}/Night →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

