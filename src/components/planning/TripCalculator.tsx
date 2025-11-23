'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { HotelGrid } from '@/components/blog/HotelGrid';
import { Calculator, Users, Calendar, DollarSign, Building2, PieChart } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { addDays, format } from 'date-fns';

export interface TripCalculatorProps {
  /** Default view: 'cost' | 'split' | 'budget' */
  defaultView?: 'cost' | 'split' | 'budget';
  /** Group type for context */
  groupType?: 'family' | 'friends' | 'couples' | 'corporate' | 'solo';
  /** Default number of nights */
  defaultNights?: number;
  /** Default number of guests */
  defaultGuests?: number;
  /** Default budget per person (for budget view) */
  budgetPerPerson?: number;
  /** Check-in date */
  checkIn?: string;
  /** Check-out date */
  checkOut?: string;
}

interface CostBreakdown {
  lodging: number;
  liftTickets: number;
  activities: number;
  dining: number;
  total: number;
  lodgingPercent: number;
  liftPercent: number;
  activitiesPercent: number;
  diningPercent: number;
}

interface SplitOption {
  id: string;
  name: string;
  type: 'hotel' | 'condo' | 'suite';
  rooms: number;
  costPerNight: number;
  totalCost: number;
  costPerPerson: number;
  amenities: string[];
}

const LIFT_TICKET_COST = 180;
const ACTIVITIES_COST_PER_DAY = 80;
const DINING_COST_PER_DAY = 60;

export function TripCalculator({
  defaultView = 'cost',
  groupType = 'family',
  defaultNights = 4,
  defaultGuests = 2,
  budgetPerPerson = 800,
  checkIn,
  checkOut,
}: TripCalculatorProps) {
  const [activeTab, setActiveTab] = useState<'cost' | 'split' | 'budget'>(defaultView);
  const [guests, setGuests] = useState(defaultGuests);
  const [nights, setNights] = useState(defaultNights);
  const [budget, setBudget] = useState(budgetPerPerson);
  const [loading, setLoading] = useState(true);
  const [lodgingRates, setLodgingRates] = useState({
    budget: 150,
    midRange: 350,
    luxury: 800,
  });
  const [selectedTier, setSelectedTier] = useState<'budget' | 'midRange' | 'luxury'>('midRange');
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown | null>(null);
  const [budgetBreakdown, setBudgetBreakdown] = useState<CostBreakdown | null>(null);
  const [splitOptions, setSplitOptions] = useState<SplitOption[]>([]);

  useEffect(() => {
    fetchRates();
  }, [checkIn, checkOut, nights]);

  useEffect(() => {
    if (!loading) {
      calculateCostBreakdown();
      calculateBudgetBreakdown();
      calculateSplitOptions();
    }
  }, [guests, nights, budget, lodgingRates, loading]);

  const fetchRates = async () => {
    try {
      setLoading(true);
      
      const defaultCheckIn = format(addDays(new Date(), 45), 'yyyy-MM-dd');
      const defaultCheckOut = format(addDays(new Date(), 45 + nights), 'yyyy-MM-dd');
      
      const checkInDate = checkIn || defaultCheckIn;
      const checkOutDate = checkOut || (checkIn ? format(addDays(new Date(checkIn), nights), 'yyyy-MM-dd') : defaultCheckOut);
      
      const searchParams = new URLSearchParams({
        cityName: 'Telluride',
        countryCode: 'US',
        limit: '30',
      });
      
      const hotelsResponse = await fetch(`/api/liteapi/search?${searchParams.toString()}`);
      
      if (!hotelsResponse.ok) {
        setLodgingRates({ budget: 150, midRange: 350, luxury: 800 });
        return;
      }
      
      const hotelsData = await hotelsResponse.json();
      const hotels: LiteAPIHotel[] = hotelsData.data || [];
      
      if (hotels.length === 0) {
        setLodgingRates({ budget: 150, midRange: 350, luxury: 800 });
        return;
      }
      
      const hotelIds = hotels.map(h => h.hotel_id);
      const ratesParams = new URLSearchParams({
        hotelIds: hotelIds.join(','),
        checkIn: checkInDate,
        checkOut: checkOutDate,
        adults: guests.toString(),
      });
      
      const ratesResponse = await fetch(`/api/hotels/min-rates?${ratesParams.toString()}`);
      
      if (!ratesResponse.ok) {
        setLodgingRates({ budget: 150, midRange: 350, luxury: 800 });
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

  const calculateCostBreakdown = () => {
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

    setCostBreakdown({
      lodging: selectedTier === 'budget' ? lodgingBudget : selectedTier === 'luxury' ? lodgingLuxury : lodgingMidRange,
      liftTickets,
      activities,
      dining,
      total: selectedTier === 'budget' ? totalBudget : selectedTier === 'luxury' ? totalLuxury : totalMidRange,
      lodgingPercent: 0,
      liftPercent: 0,
      activitiesPercent: 0,
      diningPercent: 0,
    });
  };

  const calculateBudgetBreakdown = () => {
    const liftTickets = LIFT_TICKET_COST * nights;
    const activities = ACTIVITIES_COST_PER_DAY * nights;
    const dining = DINING_COST_PER_DAY * nights;
    const fixedCosts = liftTickets + activities + dining;

    const lodging = Math.max(0, budget - fixedCosts);
    const total = lodging + fixedCosts;

    const lodgingPercent = (lodging / total) * 100;
    const liftPercent = (liftTickets / total) * 100;
    const activitiesPercent = (activities / total) * 100;
    const diningPercent = (dining / total) * 100;

    setBudgetBreakdown({
      lodging,
      liftTickets,
      activities,
      dining,
      total,
      lodgingPercent,
      liftPercent,
      activitiesPercent,
      diningPercent,
    });
  };

  const calculateSplitOptions = () => {
    const hotelRate = lodgingRates.midRange;
    const condoRate = hotelRate * 1.7;
    const suiteRate = hotelRate * 2.3;

    const options: SplitOption[] = [];

    if (guests <= 4) {
      options.push({
        id: 'hotel-2-rooms',
        name: '2 Hotel Rooms',
        type: 'hotel',
        rooms: 2,
        costPerNight: hotelRate * 2,
        totalCost: 0,
        costPerPerson: 0,
        amenities: ['Daily housekeeping', 'Hotel amenities', 'Separate rooms'],
      });
    }

    if (guests <= 6) {
      options.push({
        id: 'condo-3br',
        name: '3-Bedroom Condo',
        type: 'condo',
        rooms: 3,
        costPerNight: condoRate,
        totalCost: 0,
        costPerPerson: 0,
        amenities: ['Full kitchen', 'Living room', 'More space', 'Privacy'],
      });
    }

    if (guests <= 8) {
      options.push({
        id: 'hotel-4-rooms',
        name: '4 Hotel Rooms',
        type: 'hotel',
        rooms: 4,
        costPerNight: hotelRate * 4,
        totalCost: 0,
        costPerPerson: 0,
        amenities: ['Daily housekeeping', 'Hotel amenities', 'Separate rooms'],
      });
    }

    if (guests <= 4) {
      options.push({
        id: 'suite-2br',
        name: '2-Bedroom Suite',
        type: 'suite',
        rooms: 2,
        costPerNight: suiteRate,
        totalCost: 0,
        costPerPerson: 0,
        amenities: ['More space', 'Kitchenette', 'Hotel amenities', 'Privacy'],
      });
    }

    const calculated = options.map((opt) => {
      const totalCost = opt.costPerNight * nights;
      const costPerPerson = totalCost / guests;
      return { ...opt, totalCost, costPerPerson };
    });

    calculated.sort((a, b) => a.costPerPerson - b.costPerPerson);
    setSplitOptions(calculated);
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
              Calculate costs, compare options, and plan your budget
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-200">
          <button
            onClick={() => setActiveTab('cost')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'cost'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Calculator className="w-4 h-4 inline mr-2" />
            Cost Breakdown
          </button>
          <button
            onClick={() => setActiveTab('split')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'split'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Building2 className="w-4 h-4 inline mr-2" />
            Split Options
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'budget'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <PieChart className="w-4 h-4 inline mr-2" />
            Budget Planner
          </button>
        </div>

        {/* Inputs */}
        <div className={`grid gap-4 ${activeTab === 'budget' ? 'md:grid-cols-2 lg:grid-cols-5' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
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
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Check-In Date
            </label>
            <Input
              type="date"
              value={checkIn || format(addDays(new Date(), 45), 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  const newCheckIn = e.target.value;
                  const newCheckOut = checkOut || format(addDays(new Date(newCheckIn), nights), 'yyyy-MM-dd');
                  window.location.href = `/places-to-stay?guests=${guests}&nights=${nights}&checkin=${newCheckIn}&checkout=${newCheckOut}`;
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
              value={checkOut || format(addDays(new Date(), 45 + nights), 'yyyy-MM-dd')}
              onChange={(e) => {
                if (e.target.value) {
                  const newCheckOut = e.target.value;
                  const newCheckIn = checkIn || format(addDays(new Date(), 45), 'yyyy-MM-dd');
                  window.location.href = `/places-to-stay?guests=${guests}&nights=${nights}&checkin=${newCheckIn}&checkout=${newCheckOut}`;
                }
              }}
              min={checkIn || format(addDays(new Date(), 45), 'yyyy-MM-dd')}
              className="w-full"
            />
          </div>
          {activeTab === 'budget' && (
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
          )}
        </div>

        {/* Cost Breakdown Tab */}
        {activeTab === 'cost' && costBreakdown && (
          <div className="space-y-4">
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Cost Per Person by Tier
              </h3>
              <div className="grid gap-4 md:grid-cols-3">
                {(['budget', 'midRange', 'luxury'] as const).map((tier) => {
                  const lodging = lodgingRates[tier] * nights;
                  const liftTickets = LIFT_TICKET_COST * nights * guests;
                  const activities = ACTIVITIES_COST_PER_DAY * nights * guests;
                  const dining = DINING_COST_PER_DAY * nights * guests;
                  const total = lodging + liftTickets + activities + dining;
                  const perPerson = total / guests;

                  return (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all cursor-pointer hover:shadow-md ${
                        selectedTier === tier
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-neutral-200 hover:border-primary-200'
                      }`}
                    >
                      <div className="text-sm text-neutral-600 mb-1 capitalize">{tier.replace('Range', '-Range')}</div>
                      <div className="text-2xl font-bold text-primary-600">
                        {formatCurrency(perPerson)}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">per person</div>
                      <div className="text-xs text-neutral-500 mt-2">
                        {formatCurrency(total)} total
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">
                Hotels Matching Your {selectedTier === 'budget' ? 'Budget' : selectedTier === 'midRange' ? 'Mid-Range' : 'Luxury'} Budget
              </h3>
              <p className="text-neutral-600 mb-6">
                Based on {guests} guests for {nights} nights, here are hotels around {formatCurrency(lodgingRates[selectedTier])}/night:
              </p>
              <HotelGrid
                filter={selectedTier === 'budget' ? 'budget' : selectedTier === 'luxury' ? 'luxury' : 'family-friendly'}
                limit={3}
                checkIn={checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd')}
                checkOut={checkOut || format(addDays(new Date(), 14), 'yyyy-MM-dd')}
                title=""
              />
            </div>
          </div>
        )}

        {/* Split Options Tab */}
        {activeTab === 'split' && splitOptions.length > 0 && (
          <div className="space-y-4">
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Accommodation Options for {guests} Guests, {nights} Nights
              </h3>
              <div className="space-y-3">
                {splitOptions.map((option, index) => (
                  <div
                    key={option.id}
                    className={`p-4 border-2 rounded-lg ${
                      index === 0
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-neutral-900">{option.name}</div>
                        <div className="text-sm text-neutral-600 mt-1">
                          {option.amenities.slice(0, 2).join(' • ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary-600">
                          {formatCurrency(option.costPerPerson)}
                        </div>
                        <div className="text-xs text-neutral-500">per person</div>
                      </div>
                    </div>
                    <div className="text-sm text-neutral-600 mt-2">
                      Total: {formatCurrency(option.totalCost)} • {option.rooms} {option.type === 'condo' ? 'bedrooms' : 'rooms'}
                    </div>
                    {index === 0 && (
                      <div className="mt-2 text-sm text-primary-600 font-medium">
                        ✓ Best Value
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">
                Available Properties
              </h3>
              <HotelGrid
                filter="family-friendly"
                limit={3}
                checkIn={checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd')}
                checkOut={checkOut || format(addDays(new Date(), 14), 'yyyy-MM-dd')}
                title=""
              />
            </div>
          </div>
        )}

        {/* Budget Planner Tab */}
        {activeTab === 'budget' && budgetBreakdown && (
          <div className="space-y-4">
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Budget Allocation for {nights} Days
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Lodging', amount: budgetBreakdown.lodging, percent: budgetBreakdown.lodgingPercent },
                  { label: 'Lift Tickets', amount: budgetBreakdown.liftTickets, percent: budgetBreakdown.liftPercent },
                  { label: 'Activities', amount: budgetBreakdown.activities, percent: budgetBreakdown.activitiesPercent },
                  { label: 'Dining', amount: budgetBreakdown.dining, percent: budgetBreakdown.diningPercent },
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
                        className="bg-primary-600 h-2 rounded-full"
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
                    {formatCurrency(budgetBreakdown.total)}
                  </span>
                </div>
                <div className="text-sm text-neutral-600 mt-1">
                  Per person for {nights} days
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 pt-6">
              <h3 className="text-xl font-bold text-neutral-900 mb-4">
                Hotels Within Your Budget
              </h3>
              <p className="text-neutral-600 mb-6">
                Based on your {formatCurrency(budget)} per person budget for {nights} days, here are hotels around {formatCurrency(budgetBreakdown.lodging / nights)}/night:
              </p>
              <HotelGrid
                filter={budgetBreakdown.lodging / nights < 150 ? 'budget' : budgetBreakdown.lodging / nights < 400 ? 'family-friendly' : 'luxury'}
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

