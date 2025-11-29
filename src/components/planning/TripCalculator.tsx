'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Users, Moon, Bed, Ticket, Utensils, 
  Minus, Plus, DollarSign, Calculator, Compass
} from 'lucide-react';
import { HotelGrid } from '@/components/blog/HotelGrid';
import { ActivityGrid } from '@/components/blog/ActivityGrid';
import { format, addDays } from 'date-fns';

export interface TripCalculatorProps {
  defaultNights?: number;
  defaultGuests?: number;
  defaultBudget?: number;
  title?: string;
}

// Budget allocation percentages
const DEFAULT_ALLOCATION = {
  lodging: 50,
  liftTickets: 25,
  food: 15,
  activities: 10,
};

export function TripCalculator({
  defaultNights = 4,
  defaultGuests = 2,
  defaultBudget = 4000,
  title = 'Plan Your Trip Budget',
}: TripCalculatorProps) {
  const [budget, setBudget] = useState(defaultBudget);
  const [guests, setGuests] = useState(defaultGuests);
  const [nights, setNights] = useState(defaultNights);
  const [allocation, setAllocation] = useState(DEFAULT_ALLOCATION);

  // Computed dates for passing to HotelGrid
  const checkIn = format(addDays(new Date(), 60), 'yyyy-MM-dd');
  const checkOut = format(addDays(new Date(), 60 + nights), 'yyyy-MM-dd');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate budget breakdown
  const breakdown = useMemo(() => {
    const lodgingTotal = (budget * allocation.lodging) / 100;
    const liftTotal = (budget * allocation.liftTickets) / 100;
    const foodTotal = (budget * allocation.food) / 100;
    const activitiesTotal = (budget * allocation.activities) / 100;

    return {
      lodging: {
        total: lodgingTotal,
        perNight: Math.round(lodgingTotal / nights),
      },
      liftTickets: {
        total: liftTotal,
        perPersonDay: Math.round(liftTotal / (guests * nights)),
      },
      food: {
        total: foodTotal,
        perPersonDay: Math.round(foodTotal / (guests * nights)),
      },
      activities: {
        total: activitiesTotal,
        perPerson: Math.round(activitiesTotal / guests),
      },
    };
  }, [budget, allocation, guests, nights]);

  // Adjust allocation - when one changes, others adjust proportionally
  const adjustAllocation = (category: keyof typeof allocation, delta: number) => {
    const newValue = Math.max(5, Math.min(70, allocation[category] + delta));
    const diff = newValue - allocation[category];
    if (diff === 0) return;

    const others = Object.keys(allocation).filter(k => k !== category) as (keyof typeof allocation)[];
    const totalOther = others.reduce((sum, k) => sum + allocation[k], 0);
    
    const newAllocation = { ...allocation, [category]: newValue };
    others.forEach(k => {
      newAllocation[k] = Math.max(5, Math.round(allocation[k] - (diff * allocation[k] / totalOther)));
    });

    // Normalize to 100%
    const total = Object.values(newAllocation).reduce((a, b) => a + b, 0);
    Object.keys(newAllocation).forEach(k => {
      newAllocation[k as keyof typeof allocation] = Math.round(newAllocation[k as keyof typeof allocation] * 100 / total);
    });

    setAllocation(newAllocation);
  };

  const budgetPresets = [2000, 4000, 6000, 10000];

  return (
    <Card className="my-12 not-prose border-0 shadow-xl bg-gradient-to-br from-primary-50 to-primary-100/50 overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-primary-700 to-primary-800 text-white pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
            <Calculator className="w-7 h-7 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-white">{title}</CardTitle>
            <p className="text-primary-100 mt-1 text-sm">
              See real hotels and activities that fit your budget
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Budget + Trip Details */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Budget Input */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Total Trip Budget
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(Math.max(1000, parseInt(e.target.value) || 0))}
                className="w-full pl-10 pr-4 py-3 text-xl font-bold bg-white border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-all tabular-nums"
                min="1000"
                step="500"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {budgetPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setBudget(preset)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    budget === preset
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  {formatCurrency(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Travelers + Nights */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Travelers
              </label>
              <div className="flex items-center justify-between bg-white border-2 border-neutral-200 rounded-xl px-3 py-2">
                <button onClick={() => setGuests(Math.max(1, guests - 1))} className="p-1 hover:text-primary-600">
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-xl font-bold tabular-nums">{guests}</span>
                <button onClick={() => setGuests(Math.min(12, guests + 1))} className="p-1 hover:text-primary-600">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                <Moon className="w-4 h-4 inline mr-1" />
                Nights
              </label>
              <div className="flex items-center justify-between bg-white border-2 border-neutral-200 rounded-xl px-3 py-2">
                <button onClick={() => setNights(Math.max(1, nights - 1))} className="p-1 hover:text-primary-600">
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-xl font-bold tabular-nums">{nights}</span>
                <button onClick={() => setNights(Math.min(14, nights + 1))} className="p-1 hover:text-primary-600">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Budget Breakdown Bar */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-neutral-700">Budget Breakdown</span>
            <span className="text-sm text-neutral-500">{formatCurrency(budget / guests)} per person</span>
          </div>
          
          {/* Visual Bar */}
          <div className="h-6 rounded-full overflow-hidden flex mb-4">
            <div className="bg-primary-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: `${allocation.lodging}%` }}>
              {allocation.lodging}%
            </div>
            <div className="bg-secondary-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: `${allocation.liftTickets}%` }}>
              {allocation.liftTickets}%
            </div>
            <div className="bg-accent-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: `${allocation.food}%` }}>
              {allocation.food}%
            </div>
            <div className="bg-neutral-500 flex items-center justify-center text-white text-xs font-medium" style={{ width: `${allocation.activities}%` }}>
              {allocation.activities}%
            </div>
          </div>

          {/* Allocation Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'lodging', label: 'Lodging', icon: Bed, color: 'bg-primary-500', value: breakdown.lodging.perNight, unit: '/night' },
              { key: 'liftTickets', label: 'Lift Tickets', icon: Ticket, color: 'bg-secondary-500', value: breakdown.liftTickets.perPersonDay, unit: '/person/day' },
              { key: 'food', label: 'Food', icon: Utensils, color: 'bg-accent-500', value: breakdown.food.perPersonDay, unit: '/person/day' },
              { key: 'activities', label: 'Activities', icon: Compass, color: 'bg-neutral-500', value: breakdown.activities.perPerson, unit: '/person total' },
            ].map(({ key, label, icon: Icon, color, value, unit }) => (
              <div key={key} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-xs text-neutral-600">{label}</span>
                </div>
                <div className="text-sm font-bold text-neutral-900">{formatCurrency(value)}</div>
                <div className="text-xs text-neutral-400">{unit}</div>
                <div className="flex justify-center gap-1 mt-1">
                  <button 
                    onClick={() => adjustAllocation(key as keyof typeof allocation, -5)}
                    className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => adjustAllocation(key as keyof typeof allocation, 5)}
                    className="w-6 h-6 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hotels Section - Using existing HotelGrid component */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <HotelGrid 
            maxPrice={breakdown.lodging.perNight}
            limit={3}
            checkIn={checkIn}
            checkOut={checkOut}
            title={`Hotels at ${formatCurrency(breakdown.lodging.perNight)}/night`}
          />
        </div>

        {/* Activities Section - Using existing ActivityGrid component */}
        <div className="bg-white rounded-xl p-4 border border-neutral-200">
          <ActivityGrid 
            limit={3}
            maxPrice={breakdown.activities.perPerson}
            title={`Activities under ${formatCurrency(breakdown.activities.perPerson)}`}
          />
        </div>

        {/* Summary CTA */}
        <div className="bg-primary-600 rounded-xl p-5 text-center">
          <p className="text-primary-100 text-sm mb-1">
            {guests} travelers • {nights} nights • {formatCurrency(budget)} total budget
          </p>
          <p className="text-white font-bold text-lg mb-4">
            Ready to book your Telluride trip?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`/places-to-stay?maxPrice=${breakdown.lodging.perNight}&checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`}
              className="bg-white hover:bg-primary-50 text-primary-700 font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              <Bed className="w-4 h-4" />
              Browse All Hotels
            </a>
            <a
              href="/things-to-do"
              className="bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              Explore Activities
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
