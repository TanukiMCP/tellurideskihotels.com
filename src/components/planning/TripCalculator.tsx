'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { HotelGrid } from '@/components/blog/HotelGrid';
import { Calculator, Users, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { addDays, format } from 'date-fns';

export interface TripCalculatorProps {
  defaultNights?: number;
  defaultGuests?: number;
  title?: string;
}

const LIFT_TICKET_COST = 180;
const ACTIVITIES_COST_PER_DAY = 80;
const DINING_COST_PER_DAY = 60;

export function TripCalculator({
  defaultNights = 7,
  defaultGuests = 2,
  title = 'Trip Cost Calculator',
}: TripCalculatorProps) {
  // Default dates: 7 days from today, 7-night stay
  const defaultCheckInDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');
  const defaultCheckOutDate = format(addDays(new Date(), 14), 'yyyy-MM-dd');

  const [guests, setGuests] = useState(defaultGuests);
  const [nights, setNights] = useState(defaultNights);
  const [loading, setLoading] = useState(true);
  const [lodgingRates, setLodgingRates] = useState({
    budget: 150,
    midRange: 350,
    luxury: 800,
  });
  const [selectedTier, setSelectedTier] = useState<'budget' | 'midRange' | 'luxury'>('midRange');

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      
      const searchParams = new URLSearchParams({
        cityName: 'Telluride',
        countryCode: 'US',
        limit: '30',
      });
      
      const hotelsResponse = await fetch(`/api/liteapi/search?${searchParams.toString()}`);
      
      if (!hotelsResponse.ok) {
        setLodgingRates({ budget: 150, midRange: 350, luxury: 800 });
        setLoading(false);
        return;
      }
      
      const hotelsData = await hotelsResponse.json();
      const hotels: LiteAPIHotel[] = hotelsData.data || [];
      
      if (hotels.length === 0) {
        setLodgingRates({ budget: 150, midRange: 350, luxury: 800 });
        setLoading(false);
        return;
      }
      
      const hotelIds = hotels.map(h => h.hotel_id);
      const ratesParams = new URLSearchParams({
        hotelIds: hotelIds.join(','),
        checkIn: defaultCheckInDate,
        checkOut: defaultCheckOutDate,
        adults: guests.toString(),
      });
      
      const ratesResponse = await fetch(`/api/hotels/min-rates?${ratesParams.toString()}`);
      
      if (!ratesResponse.ok) {
        setLodgingRates({ budget: 150, midRange: 350, luxury: 800 });
        setLoading(false);
        return;
      }
      
      const ratesData = await ratesResponse.json();
      
      const prices: Record<string, number> = {};
      if (ratesData.data && Array.isArray(ratesData.data)) {
        ratesData.data.forEach((item: any) => {
          if (item.hotelId && item.price) {
            prices[item.hotelId] = nights > 0 ? item.price / nights : item.price;
          }
        });
      }
      
      const budgetHotels = hotels.filter(h => (h.star_rating || 0) <= 3 && prices[h.hotel_id]);
      const midRangeHotels = hotels.filter(h => (h.star_rating || 0) === 4 && prices[h.hotel_id]);
      const luxuryHotels = hotels.filter(h => (h.star_rating || 0) >= 5 && prices[h.hotel_id]);
      
      const newRates = {
        budget: budgetHotels.length > 0 
          ? budgetHotels.reduce((sum, h) => sum + prices[h.hotel_id], 0) / budgetHotels.length 
          : 150,
        midRange: midRangeHotels.length > 0 
          ? midRangeHotels.reduce((sum, h) => sum + prices[h.hotel_id], 0) / midRangeHotels.length 
          : 350,
        luxury: luxuryHotels.length > 0 
          ? luxuryHotels.reduce((sum, h) => sum + prices[h.hotel_id], 0) / luxuryHotels.length 
          : 800,
      };
      
      setLodgingRates(newRates);
    } catch (err) {
      setLodgingRates({ budget: 150, midRange: 350, luxury: 800 });
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

  const calculateTierCosts = (tier: 'budget' | 'midRange' | 'luxury') => {
    const lodging = lodgingRates[tier] * nights;
    const liftTickets = LIFT_TICKET_COST * nights * guests;
    const activities = ACTIVITIES_COST_PER_DAY * nights * guests;
    const dining = DINING_COST_PER_DAY * nights * guests;
    const total = lodging + liftTickets + activities + dining;
    const perPerson = total / guests;

    return {
      lodging,
      liftTickets,
      activities,
      dining,
      total,
      perPerson,
    };
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

  const selectedCosts = calculateTierCosts(selectedTier);

  return (
    <Card className="my-12 not-prose border-2 border-primary-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center shadow-md">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-neutral-900">{title}</CardTitle>
            <p className="text-neutral-600 mt-1 text-sm">
              Estimate your trip costs and find matching hotels
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Disclaimer */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Cost Estimates</p>
            <p>
              Estimates based on average rates for a {nights}-night stay starting {format(new Date(defaultCheckInDate), 'MMM d, yyyy')}. 
              Actual costs may vary based on specific dates and availability.
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
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
            <label className="block text-sm font-medium text-neutral-700 mb-2">
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

        {/* Cost Tiers */}
        <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Select Your Budget Tier
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {(['budget', 'midRange', 'luxury'] as const).map((tier) => {
              const costs = calculateTierCosts(tier);
              const tierLabels = {
                budget: 'Budget',
                midRange: 'Mid-Range',
                luxury: 'Luxury',
              };

                  return (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                  className={`p-5 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                        selectedTier === tier
                      ? 'border-primary-500 bg-primary-50 shadow-sm ring-2 ring-primary-200'
                      : 'border-neutral-200 hover:border-primary-200 bg-white'
                      }`}
                    >
                  <div className="text-sm font-medium text-neutral-600 mb-2">{tierLabels[tier]}</div>
                  <div className="text-3xl font-bold text-primary-600 mb-1">
                    {formatCurrency(costs.perPerson)}
                  </div>
                  <div className="text-xs text-neutral-500 mb-3">per person</div>
                  <div className="text-xs text-neutral-600 space-y-1">
                    <div>Lodging: {formatCurrency(costs.lodging)}</div>
                    <div>Lift Tickets: {formatCurrency(costs.liftTickets)}</div>
                    <div>Activities: {formatCurrency(costs.activities)}</div>
                    <div>Dining: {formatCurrency(costs.dining)}</div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <div className="text-xs text-neutral-500">Total Trip Cost</div>
                    <div className="text-lg font-bold text-neutral-900">
                      {formatCurrency(costs.total)}
                    </div>
                      </div>
                  {selectedTier === tier && (
                    <div className="mt-3 text-xs text-primary-600 font-medium">
                      ✓ Selected
                      </div>
                  )}
                    </button>
                  );
                })}
              </div>
            </div>

        {/* Matching Hotels */}
        <div className="pt-6 border-t border-neutral-200">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">
            {selectedTier === 'budget' ? 'Budget' : selectedTier === 'midRange' ? 'Mid-Range' : 'Luxury'} Hotels
              </h3>
              <p className="text-neutral-600 mb-6">
            Based on {guests} {guests === 1 ? 'guest' : 'guests'} for {nights} {nights === 1 ? 'night' : 'nights'}, 
            here are hotels around {formatCurrency(lodgingRates[selectedTier])}/night:
              </p>
              <HotelGrid
            filter={selectedTier === 'budget' ? 'budget' : selectedTier === 'luxury' ? 'luxury' : undefined}
                limit={3}
            checkIn={defaultCheckInDate}
            checkOut={defaultCheckOutDate}
                title=""
            displayMode="triple"
              />
            </div>
      </CardContent>
    </Card>
  );
}
