'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Users, Moon, Bed, Ticket, Utensils, Sparkles, ChevronRight } from 'lucide-react';

export interface TripCalculatorProps {
  defaultNights?: number;
  defaultGuests?: number;
  title?: string;
}

// Cost estimates per tier - based on Telluride averages
const TIER_DATA = {
  budget: {
    label: 'Budget',
    lodgingPerNight: 180,
    liftTicketPerDay: 135,
    foodPerDay: 45,
    description: '2-3 star lodging, bring your own gear, casual dining',
  },
  midRange: {
    label: 'Mid-Range',
    lodgingPerNight: 400,
    liftTicketPerDay: 165,
    foodPerDay: 85,
    description: '4 star hotels, equipment rentals, nice restaurants',
  },
  luxury: {
    label: 'Luxury',
    lodgingPerNight: 900,
    liftTicketPerDay: 195,
    foodPerDay: 175,
    description: '5 star resorts, private lessons, fine dining',
  },
} as const;

type Tier = keyof typeof TIER_DATA;

export function TripCalculator({
  defaultNights = 4,
  defaultGuests = 2,
  title = 'Estimate Your Trip Cost',
}: TripCalculatorProps) {
  const [guests, setGuests] = useState(defaultGuests);
  const [nights, setNights] = useState(defaultNights);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate costs for each tier
  const tierCosts = useMemo(() => {
    const calculate = (tier: Tier) => {
      const data = TIER_DATA[tier];
      const lodging = data.lodgingPerNight * nights;
      const liftTickets = data.liftTicketPerDay * nights * guests;
      const food = data.foodPerDay * nights * guests;
      const total = lodging + liftTickets + food;
      const perPerson = total / guests;
      
      return {
        ...data,
        lodging,
        liftTickets,
        food,
        total,
        perPerson,
      };
    };

    return {
      budget: calculate('budget'),
      midRange: calculate('midRange'),
      luxury: calculate('luxury'),
    };
  }, [guests, nights]);

  const handleBookNow = (tier: Tier) => {
    const filter = tier === 'budget' ? 'budget' : tier === 'luxury' ? 'luxury' : '';
    const url = filter ? `/places-to-stay?filter=${filter}` : '/places-to-stay';
    window.location.href = url;
  };

  return (
    <Card className="my-8 not-prose overflow-hidden border-0 shadow-lg">
      {/* Header */}
      <div className="bg-neutral-900 px-6 py-5">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="text-neutral-400 text-sm mt-1">
          Adjust your trip details to see estimated costs
        </p>
      </div>

      <CardContent className="p-6 bg-white">
        {/* Controls */}
        <div className="grid gap-6 sm:grid-cols-2 mb-8">
          {/* Guests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                <Users className="w-4 h-4" />
                Travelers
              </label>
              <span className="text-2xl font-bold text-neutral-900 tabular-nums">{guests}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-900"
            />
            <div className="flex justify-between text-xs text-neutral-400 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Nights */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-2 text-sm font-medium text-neutral-600">
                <Moon className="w-4 h-4" />
                Nights
              </label>
              <span className="text-2xl font-bold text-neutral-900 tabular-nums">{nights}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={nights}
              onChange={(e) => setNights(parseInt(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-900"
            />
            <div className="flex justify-between text-xs text-neutral-400 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>
        </div>

        {/* Tier Comparison */}
        <div className="grid gap-4 lg:grid-cols-3">
          {(['budget', 'midRange', 'luxury'] as const).map((tier) => {
            const data = tierCosts[tier];
            const isMiddle = tier === 'midRange';
            
            return (
              <div
                key={tier}
                className={`relative rounded-xl border-2 overflow-hidden transition-all ${
                  isMiddle 
                    ? 'border-primary-600 bg-primary-50/50' 
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                {isMiddle && (
                  <div className="absolute top-0 left-0 right-0 bg-primary-600 text-white text-xs font-semibold py-1 text-center flex items-center justify-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                )}
                
                <div className={`p-5 ${isMiddle ? 'pt-9' : ''}`}>
                  {/* Tier Label */}
                  <div className="text-sm font-semibold text-neutral-500 uppercase tracking-wide">
                    {data.label}
                  </div>
                  
                  {/* Per Person Cost - Hero */}
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-neutral-900">
                      {formatCurrency(data.perPerson)}
                    </span>
                    <span className="text-neutral-500 text-sm ml-1">/person</span>
                  </div>
                  
                  {/* Total */}
                  <div className="text-sm text-neutral-500 mt-1">
                    {formatCurrency(data.total)} total for {guests} {guests === 1 ? 'person' : 'people'}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-neutral-500 mt-3 leading-relaxed">
                    {data.description}
                  </p>

                  {/* Breakdown */}
                  <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-neutral-600">
                        <Bed className="w-3.5 h-3.5" />
                        Lodging
                      </span>
                      <span className="font-medium text-neutral-900">{formatCurrency(data.lodging)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-neutral-600">
                        <Ticket className="w-3.5 h-3.5" />
                        Lift Tickets
                      </span>
                      <span className="font-medium text-neutral-900">{formatCurrency(data.liftTickets)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-neutral-600">
                        <Utensils className="w-3.5 h-3.5" />
                        Food & Drinks
                      </span>
                      <span className="font-medium text-neutral-900">{formatCurrency(data.food)}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleBookNow(tier)}
                    className={`mt-5 w-full flex items-center justify-center gap-1 font-semibold py-3 px-4 rounded-lg transition-colors text-sm ${
                      isMiddle
                        ? 'bg-primary-600 hover:bg-primary-700 text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'
                    }`}
                  >
                    Browse {data.label} Hotels
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-neutral-400 text-center mt-6">
          Estimates based on average Telluride rates. Does not include airfare, transportation, or activities beyond skiing.
        </p>
      </CardContent>
    </Card>
  );
}
