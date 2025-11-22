'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { HotelGrid } from '@/components/blog/HotelGrid';
import { Calculator, Users, Calendar } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { addDays, format } from 'date-fns';

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
  const [calculated, setCalculated] = useState(false);
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [lodgingRates, setLodgingRates] = useState({
    budget: 150,
    midRange: 350,
    luxury: 800,
  });

  useEffect(() => {
    fetchRatesAndCalculate();
  }, [guests, nights, checkIn, checkOut]);

  const fetchRatesAndCalculate = async () => {
    try {
      setLoading(true);
      
      // Default dates: 1 week out from today, 1 week duration
      const defaultCheckIn = format(addDays(new Date(), 7), 'yyyy-MM-dd');
      const defaultCheckOut = format(addDays(new Date(), 14), 'yyyy-MM-dd');
      
      const checkInDate = checkIn || defaultCheckIn;
      const checkOutDate = checkOut || defaultCheckOut;
      
      // STEP 1: Fetch hotels
      const searchParams = new URLSearchParams({
        cityName: 'Telluride',
        countryCode: 'US',
        limit: '30', // Fetch enough to get good sample
      });
      
      const hotelsResponse = await fetch(`/api/liteapi/search?${searchParams.toString()}`);
      
      if (!hotelsResponse.ok) {
        throw new Error('Failed to fetch hotels');
      }
      
      const hotelsData = await hotelsResponse.json();
      const hotels: LiteAPIHotel[] = hotelsData.data || [];
      
      if (hotels.length === 0) {
        calculateCosts(); // Use default rates
        return;
      }
      
      // STEP 2: Fetch min rates for all hotels
      const hotelIds = hotels.map(h => h.hotel_id);
      const ratesParams = new URLSearchParams({
        hotelIds: hotelIds.join(','),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: '2',
      });
      
      const ratesResponse = await fetch(`/api/hotels/min-rates?${ratesParams.toString()}`);
      
      if (!ratesResponse.ok) {
        calculateCosts(); // Use default rates if rates API fails
        return;
      }
      
      const ratesData = await ratesResponse.json();
      const nights = Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
      
      // Build price map
      const prices: Record<string, number> = {};
      if (ratesData.data && Array.isArray(ratesData.data)) {
        ratesData.data.forEach((item: any) => {
          if (item.hotelId && item.price) {
            prices[item.hotelId] = nights > 0 ? item.price / nights : item.price;
          }
        });
      }
      
      // STEP 3: Calculate average rates by category
      const budgetHotels = hotels.filter(h => (h.star_rating || 0) <= 3 && prices[h.hotel_id]);
      const midRangeHotels = hotels.filter(h => (h.star_rating || 0) === 4 && prices[h.hotel_id]);
      const luxuryHotels = hotels.filter(h => (h.star_rating || 0) >= 5 && prices[h.hotel_id]);
      
      const newRates = {
        budget: budgetHotels.length > 0 
          ? budgetHotels.reduce((sum, h) => sum + prices[h.hotel_id], 0) / budgetHotels.length 
          : lodgingRates.budget, // Keep existing if no data
        midRange: midRangeHotels.length > 0 
          ? midRangeHotels.reduce((sum, h) => sum + prices[h.hotel_id], 0) / midRangeHotels.length 
          : lodgingRates.midRange,
        luxury: luxuryHotels.length > 0 
          ? luxuryHotels.reduce((sum, h) => sum + prices[h.hotel_id], 0) / luxuryHotels.length 
          : lodgingRates.luxury,
      };
      
      setLodgingRates(newRates);
      calculateCosts();
    } catch (err) {
      // Fall back to existing rates if API fails
      calculateCosts();
    } finally {
      setLoading(false);
    }
  };

  const calculateCosts = () => {
    const lodgingBudget = lodgingRates.budget * nights;
    const lodgingMidRange = lodgingRates.midRange * nights;
    const lodgingLuxury = lodgingRates.luxury * nights;

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
    });
    setCalculated(true);
  };

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
              Calculate your total trip cost and cost per person (based on real hotel rates)
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

        {calculated && breakdown && (
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

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">
                Hotels Matching Your Mid-Range Budget
              </h3>
              <p className="text-neutral-600 mb-6">
                Based on your {guests} guests for {nights} nights, here are available hotels around {formatCurrency(lodgingRates.midRange)}/night:
              </p>
              <HotelGrid
                filter={getFilterForBudget(breakdown.midRange)}
                limit={3}
                checkIn={checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd')}
                checkOut={checkOut || format(addDays(new Date(), 14), 'yyyy-MM-dd')}
                title=""
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

