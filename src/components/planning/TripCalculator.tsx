'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { HotelGrid } from '@/components/blog/HotelGrid';
import { Calculator, Users, Moon, DollarSign, Mountain, Utensils, Ticket, ChevronDown, ChevronUp, Info, Sparkles } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { addDays, format } from 'date-fns';

export interface TripCalculatorProps {
  defaultNights?: number;
  defaultGuests?: number;
  title?: string;
}

// Cost constants with explanations for transparency
const COST_BREAKDOWN = {
  liftTicket: { amount: 180, label: 'Lift Ticket', icon: Ticket, explanation: 'Adult full-day lift ticket at Telluride Ski Resort' },
  activities: { amount: 80, label: 'Activities', icon: Mountain, explanation: 'Avg daily spend on tours, rentals, spa, etc.' },
  dining: { amount: 60, label: 'Dining', icon: Utensils, explanation: 'Breakfast, lunch, dinner & drinks avg per person' },
};

export function TripCalculator({
  defaultNights = 4,
  defaultGuests = 2,
  title = 'Trip Cost Calculator',
}: TripCalculatorProps) {
  // Default dates: 7 days from today
  const defaultCheckInDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');
  const defaultCheckOutDate = format(addDays(new Date(), 7 + defaultNights), 'yyyy-MM-dd');

  const [guests, setGuests] = useState(defaultGuests);
  const [nights, setNights] = useState(defaultNights);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'budget' | 'midRange' | 'luxury'>('midRange');
  const [lodgingRates, setLodgingRates] = useState({
    budget: 180,
    midRange: 400,
    luxury: 900,
  });

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
        setLodgingRates({ budget: 180, midRange: 400, luxury: 900 });
        setLoading(false);
        return;
      }
      
      const hotelsData = await hotelsResponse.json();
      const hotels: LiteAPIHotel[] = hotelsData.data || [];
      
      if (hotels.length === 0) {
        setLodgingRates({ budget: 180, midRange: 400, luxury: 900 });
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
        setLodgingRates({ budget: 180, midRange: 400, luxury: 900 });
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
          ? Math.round(budgetHotels.reduce((sum, h) => sum + prices[h.hotel_id], 0) / budgetHotels.length)
          : 180,
        midRange: midRangeHotels.length > 0 
          ? Math.round(midRangeHotels.reduce((sum, h) => sum + prices[h.hotel_id], 0) / midRangeHotels.length)
          : 400,
        luxury: luxuryHotels.length > 0 
          ? Math.round(luxuryHotels.reduce((sum, h) => sum + prices[h.hotel_id], 0) / luxuryHotels.length)
          : 900,
      };
      
      setLodgingRates(newRates);
    } catch (err) {
      setLodgingRates({ budget: 180, midRange: 400, luxury: 900 });
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

  // Calculate costs with detailed breakdown
  const costs = useMemo(() => {
    const lodgingPerNight = lodgingRates[selectedTier];
    const lodgingTotal = lodgingPerNight * nights;
    const liftTicketsTotal = COST_BREAKDOWN.liftTicket.amount * nights * guests;
    const activitiesTotal = COST_BREAKDOWN.activities.amount * nights * guests;
    const diningTotal = COST_BREAKDOWN.dining.amount * nights * guests;
    
    const total = lodgingTotal + liftTicketsTotal + activitiesTotal + diningTotal;
    const perPerson = total / guests;

    return {
      lodging: { total: lodgingTotal, perNight: lodgingPerNight, pct: Math.round((lodgingTotal / total) * 100) },
      liftTickets: { total: liftTicketsTotal, perDay: COST_BREAKDOWN.liftTicket.amount, pct: Math.round((liftTicketsTotal / total) * 100) },
      activities: { total: activitiesTotal, perDay: COST_BREAKDOWN.activities.amount, pct: Math.round((activitiesTotal / total) * 100) },
      dining: { total: diningTotal, perDay: COST_BREAKDOWN.dining.amount, pct: Math.round((diningTotal / total) * 100) },
      total,
      perPerson,
    };
  }, [guests, nights, selectedTier, lodgingRates]);

  const tierInfo = {
    budget: { label: 'Budget', desc: '2-3 star hotels, basic amenities', color: 'emerald' },
    midRange: { label: 'Mid-Range', desc: '4 star hotels, good amenities', color: 'blue' },
    luxury: { label: 'Luxury', desc: '5 star resorts, premium experience', color: 'purple' },
  };

  if (loading) {
    return (
      <Card className="my-12 not-prose border-2 border-primary-200">
        <CardContent className="py-12">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-neutral-600">Loading current Telluride rates...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="my-12 not-prose border-0 shadow-xl bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-900 text-white pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
            <Calculator className="w-7 h-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">{title}</CardTitle>
            <p className="text-slate-300 mt-1 text-sm">
              Estimate your Telluride ski trip budget with real-time rates
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8">
        {/* Interactive Controls */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Guests Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users className="w-4 h-4 text-slate-500" />
                Travelers
              </label>
              <span className="text-2xl font-bold text-slate-900">{guests}</span>
            </div>
            <input
              type="range"
              min="1"
              max="12"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Solo</span>
              <span>Couple</span>
              <span>Family</span>
              <span>Group</span>
            </div>
          </div>

          {/* Nights Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Moon className="w-4 h-4 text-slate-500" />
                Nights
              </label>
              <span className="text-2xl font-bold text-slate-900">{nights}</span>
            </div>
            <input
              type="range"
              min="1"
              max="14"
              value={nights}
              onChange={(e) => setNights(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-700"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Weekend</span>
              <span>4 nights</span>
              <span>Week</span>
              <span>Extended</span>
            </div>
          </div>
        </div>

        {/* Budget Tier Selection */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-700">Select Your Budget Tier</label>
          <div className="grid gap-3 md:grid-cols-3">
            {(['budget', 'midRange', 'luxury'] as const).map((tier) => {
              const info = tierInfo[tier];
              const isSelected = selectedTier === tier;
              
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-slate-700 bg-slate-50 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div className="font-bold text-slate-900">{info.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{info.desc}</div>
                  <div className="text-lg font-bold text-slate-700 mt-2">
                    {formatCurrency(lodgingRates[tier])}<span className="text-xs font-normal text-slate-500">/night</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Result Display */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Per Person Cost - Hero Metric */}
            <div className="text-center md:text-left">
              <div className="text-slate-400 text-sm font-medium uppercase tracking-wide">Estimated Cost Per Person</div>
              <div className="text-5xl font-bold mt-2">{formatCurrency(costs.perPerson)}</div>
              <div className="text-slate-400 text-sm mt-1">
                for {nights} nights • {guests} {guests === 1 ? 'traveler' : 'travelers'}
              </div>
            </div>
            
            {/* Total Trip Cost */}
            <div className="text-center md:text-right">
              <div className="text-slate-400 text-sm font-medium uppercase tracking-wide">Total Trip Cost</div>
              <div className="text-4xl font-bold mt-2">{formatCurrency(costs.total)}</div>
              <div className="text-slate-400 text-sm mt-1">
                {formatCurrency(costs.total / nights)}/night average
              </div>
            </div>
          </div>

          {/* Visual Cost Breakdown Bar */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Cost Breakdown</span>
              <span>100%</span>
            </div>
            <div className="h-4 rounded-full overflow-hidden flex bg-slate-700">
              <div 
                className="bg-blue-500 transition-all duration-500" 
                style={{ width: `${costs.lodging.pct}%` }}
                title={`Lodging: ${costs.lodging.pct}%`}
              />
              <div 
                className="bg-emerald-500 transition-all duration-500" 
                style={{ width: `${costs.liftTickets.pct}%` }}
                title={`Lift Tickets: ${costs.liftTickets.pct}%`}
              />
              <div 
                className="bg-amber-500 transition-all duration-500" 
                style={{ width: `${costs.activities.pct}%` }}
                title={`Activities: ${costs.activities.pct}%`}
              />
              <div 
                className="bg-rose-500 transition-all duration-500" 
                style={{ width: `${costs.dining.pct}%` }}
                title={`Dining: ${costs.dining.pct}%`}
              />
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>Lodging {costs.lodging.pct}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span>Lift Tickets {costs.liftTickets.pct}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span>Activities {costs.activities.pct}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-rose-500" />
                <span>Dining {costs.dining.pct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Math Breakdown */}
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
          <button
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Info className="w-4 h-4" />
              How We Calculated This
            </div>
            {showBreakdown ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>
          
          {showBreakdown && (
            <div className="p-4 pt-0 space-y-4 border-t border-slate-100">
              {/* Lodging */}
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-slate-900">Lodging</span>
                    <span className="font-bold text-blue-700">{formatCurrency(costs.lodging.total)}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {formatCurrency(costs.lodging.perNight)}/night × {nights} nights
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Based on avg {tierInfo[selectedTier].label.toLowerCase()} hotel rates in Telluride
                  </div>
                </div>
              </div>

              {/* Lift Tickets */}
              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-slate-900">Lift Tickets</span>
                    <span className="font-bold text-emerald-700">{formatCurrency(costs.liftTickets.total)}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {formatCurrency(costs.liftTickets.perDay)}/person/day × {guests} people × {nights} days
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Adult full-day tickets at Telluride Ski Resort
                  </div>
                </div>
              </div>

              {/* Activities */}
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mountain className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-slate-900">Activities</span>
                    <span className="font-bold text-amber-700">{formatCurrency(costs.activities.total)}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {formatCurrency(costs.activities.perDay)}/person/day × {guests} people × {nights} days
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Equipment rentals, lessons, spa, tours, etc.
                  </div>
                </div>
              </div>

              {/* Dining */}
              <div className="flex items-start gap-3 p-3 bg-rose-50 rounded-lg">
                <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Utensils className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold text-slate-900">Dining</span>
                    <span className="font-bold text-rose-700">{formatCurrency(costs.dining.total)}</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {formatCurrency(costs.dining.perDay)}/person/day × {guests} people × {nights} days
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Breakfast, lunch, dinner, and drinks
                  </div>
                </div>
              </div>

              {/* Total Formula */}
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
                <div className="text-xs font-mono text-slate-600">
                  {formatCurrency(costs.lodging.total)} + {formatCurrency(costs.liftTickets.total)} + {formatCurrency(costs.activities.total)} + {formatCurrency(costs.dining.total)} = <span className="font-bold text-slate-900">{formatCurrency(costs.total)}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {formatCurrency(costs.total)} ÷ {guests} travelers = <span className="font-bold">{formatCurrency(costs.perPerson)}/person</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hotel Recommendations */}
        <div className="pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900">
              {tierInfo[selectedTier].label} Hotels Around {formatCurrency(lodgingRates[selectedTier])}/night
            </h3>
          </div>
          <HotelGrid
            filter={selectedTier === 'budget' ? 'budget' : selectedTier === 'luxury' ? 'luxury' : undefined}
            limit={3}
            checkIn={defaultCheckInDate}
            checkOut={defaultCheckOutDate}
            title=""
            displayMode="triple"
          />
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 text-center">
          Estimates based on average rates. Actual costs vary by season, availability, and choices. 
          Lift ticket prices from tellurideskiresort.com. Does not include airfare or transportation.
        </p>
      </CardContent>
    </Card>
  );
}
