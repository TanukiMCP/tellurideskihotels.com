'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Users, Bed, Ticket, Utensils, Calendar, MapPin,
  Minus, Plus, DollarSign, Calculator, Compass, Music,
  Mountain, ChevronDown, ChevronUp, Snowflake, Baby, User
} from 'lucide-react';
import { HotelGrid } from '@/components/blog/HotelGrid';
import { ActivityGrid } from '@/components/blog/ActivityGrid';
import { format, addDays, differenceInDays, parseISO, isWithinInterval, eachDayOfInterval } from 'date-fns';
import { calculateLiftTicketCost, isWithinSkiSeason, getSeasonInfo, type SkierGroup } from '@/lib/lift-tickets';

export interface TripCalculatorProps {
  defaultNights?: number;
  defaultGuests?: number;
  defaultBudget?: number;
  title?: string;
}

// Categories that can be toggled on/off
interface TripCategories {
  lodging: boolean;
  skiing: boolean;
  activities: boolean;
  dining: boolean;
  events: boolean;
}

// Budget allocation for flexible categories (percentages)
interface BudgetAllocation {
  lodging: number;
  activities: number;
  dining: number;
}

// Sample events data - in production this would come from EventsWidget or API
const SAMPLE_EVENTS = [
  { id: '1', name: 'Noel Night', date: '2025-12-10', type: 'community', description: 'Holiday season kickoff with Ski Tree lighting', url: 'https://www.telluride.com/event/noel-night/', free: true },
  { id: '2', name: 'Mountain Village Holiday Prelude', date: '2025-12-13', type: 'festival', description: 'North Pole transformation celebration', url: 'https://www.telluride.com/event/mountain-village-holiday-prelude/', free: true },
  { id: '3', name: 'Christmas Eve Torchlight Parade', date: '2025-12-24', type: 'community', description: 'Watch instructors descend with torches', url: 'https://www.telluride.com/event/christmas-eve-torchlight-parade/', free: true },
  { id: '4', name: 'New Year\'s Eve Torchlight & Fireworks', date: '2025-12-31', type: 'community', description: 'Ring in the new year on the slopes', url: 'https://www.telluride.com/event/new-years-eve-torchlight-parade-fireworks/', free: true },
  { id: '5', name: 'Telluride Comedy Festival', date: '2026-02-12', type: 'festival', description: '25th annual comedy festival', url: 'https://www.telluride.com/event/telluride-comedy-festival/', free: false },
  { id: '6', name: 'Telluride Gay Ski Week', date: '2026-02-28', type: 'festival', description: 'LGBTQ+ community celebration', url: 'https://www.telluride.com/event/telluride-gay-ski-week/', free: true },
];

export function TripCalculator({
  defaultNights = 4,
  defaultGuests = 2,
  defaultBudget = 4000,
  title = 'Plan Your Trip',
}: TripCalculatorProps) {
  // Core trip details
  const [budget, setBudget] = useState(defaultBudget);
  const [guests, setGuests] = useState(defaultGuests);
  
  // Dates
  const [checkIn, setCheckIn] = useState(() => format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(() => format(addDays(new Date(), 7 + defaultNights), 'yyyy-MM-dd'));
  
  // Category toggles
  const [categories, setCategories] = useState<TripCategories>({
    lodging: true,
    skiing: true,
    activities: true,
    dining: true,
    events: true,
  });
  
  // Skiing details
  const [adultSkiers, setAdultSkiers] = useState(defaultGuests);
  const [childSkiers, setChildSkiers] = useState(0);
  const [toddlerSkiers, setToddlerSkiers] = useState(0);
  const [skiDays, setSkiDays] = useState(defaultNights);
  
  // Budget allocation for flexible categories
  const [allocation, setAllocation] = useState<BudgetAllocation>({
    lodging: 65,
    activities: 20,
    dining: 15,
  });
  
  // UI state
  const [showSkiDetails, setShowSkiDetails] = useState(true);
  const [showAllocation, setShowAllocation] = useState(false);

  // Calculate nights from dates
  const nights = useMemo(() => {
    try {
      const diff = differenceInDays(parseISO(checkOut), parseISO(checkIn));
      return Math.max(1, diff);
    } catch {
      return defaultNights;
    }
  }, [checkIn, checkOut, defaultNights]);

  // Check if trip is during ski season
  const tripInSkiSeason = useMemo(() => {
    return isWithinSkiSeason(checkIn, checkOut);
  }, [checkIn, checkOut]);

  // Calculate lift ticket costs
  const liftTicketCalc = useMemo(() => {
    if (!categories.skiing || !tripInSkiSeason) {
      return null;
    }
    
    const skiers: SkierGroup = {
      adults: adultSkiers,
      children: childSkiers,
      toddlers: toddlerSkiers,
    };
    
    return calculateLiftTicketCost(checkIn, checkOut, skiers, skiDays);
  }, [categories.skiing, tripInSkiSeason, checkIn, checkOut, adultSkiers, childSkiers, toddlerSkiers, skiDays]);

  // Calculate budget breakdown
  const budgetBreakdown = useMemo(() => {
    const fixedCosts = liftTicketCalc?.totalCost || 0;
    const remainingBudget = Math.max(0, budget - fixedCosts);
    
    // Calculate allocations for enabled flexible categories
    const enabledCategories = {
      lodging: categories.lodging,
      activities: categories.activities,
      dining: categories.dining,
    };
    
    const totalAllocation = Object.entries(enabledCategories)
      .filter(([_, enabled]) => enabled)
      .reduce((sum, [key]) => sum + allocation[key as keyof BudgetAllocation], 0);
    
    const normalizedAllocation = {
      lodging: categories.lodging ? (allocation.lodging / totalAllocation) * 100 : 0,
      activities: categories.activities ? (allocation.activities / totalAllocation) * 100 : 0,
      dining: categories.dining ? (allocation.dining / totalAllocation) * 100 : 0,
    };
    
    return {
      fixedCosts,
      remainingBudget,
      lodging: {
        total: Math.round(remainingBudget * normalizedAllocation.lodging / 100),
        perNight: Math.round((remainingBudget * normalizedAllocation.lodging / 100) / nights),
      },
      activities: {
        total: Math.round(remainingBudget * normalizedAllocation.activities / 100),
        perPerson: Math.round((remainingBudget * normalizedAllocation.activities / 100) / guests),
      },
      dining: {
        total: Math.round(remainingBudget * normalizedAllocation.dining / 100),
        perPersonPerDay: Math.round((remainingBudget * normalizedAllocation.dining / 100) / (guests * nights)),
      },
    };
  }, [budget, liftTicketCalc, categories, allocation, nights, guests]);

  // Filter events to trip dates
  const tripEvents = useMemo(() => {
    if (!categories.events) return [];
    
    const start = parseISO(checkIn);
    const end = parseISO(checkOut);
    
    return SAMPLE_EVENTS.filter(event => {
      const eventDate = parseISO(event.date);
      return isWithinInterval(eventDate, { start, end });
    });
  }, [categories.events, checkIn, checkOut]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Handle date changes
  const handleCheckInChange = (newCheckIn: string) => {
    setCheckIn(newCheckIn);
    const checkInDate = parseISO(newCheckIn);
    const checkOutDate = parseISO(checkOut);
    if (checkOutDate <= checkInDate) {
      setCheckOut(format(addDays(checkInDate, 1), 'yyyy-MM-dd'));
    }
  };

  const handleCheckOutChange = (newCheckOut: string) => {
    const checkInDate = parseISO(checkIn);
    const newCheckOutDate = parseISO(newCheckOut);
    if (newCheckOutDate > checkInDate) {
      setCheckOut(newCheckOut);
    }
  };

  // Toggle category
  const toggleCategory = (category: keyof TripCategories) => {
    // Don't allow turning off lodging
    if (category === 'lodging') return;
    setCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Adjust allocation
  const adjustAllocation = (category: keyof BudgetAllocation, delta: number) => {
    const newValue = Math.max(10, Math.min(80, allocation[category] + delta));
    const diff = newValue - allocation[category];
    if (diff === 0) return;

    const others = (Object.keys(allocation) as (keyof BudgetAllocation)[]).filter(k => k !== category);
    const totalOther = others.reduce((sum, k) => sum + allocation[k], 0);
    
    const newAllocation = { ...allocation, [category]: newValue };
    others.forEach(k => {
      newAllocation[k] = Math.max(10, Math.round(allocation[k] - (diff * allocation[k] / totalOther)));
    });

    // Normalize to 100%
    const total = Object.values(newAllocation).reduce((a, b) => a + b, 0);
    (Object.keys(newAllocation) as (keyof BudgetAllocation)[]).forEach(k => {
      newAllocation[k] = Math.round(newAllocation[k] * 100 / total);
    });

    setAllocation(newAllocation);
  };

  const budgetPresets = [2000, 4000, 6000, 10000];
  const minCheckIn = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const seasonInfo = getSeasonInfo();

  return (
    <div className="space-y-6">
      {/* Main Calculator Card */}
      <Card className="border-0 shadow-xl bg-white overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-primary-600 to-primary-700 text-white pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">{title}</CardTitle>
              <p className="text-primary-100 mt-1 text-sm">
                Set your budget and preferences to find what fits
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Section 1: Trip Basics */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Budget */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Total Budget
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Math.max(500, parseInt(e.target.value) || 0))}
                  className="w-full pl-10 pr-4 py-3 text-xl font-bold bg-white border-2 border-neutral-200 rounded-xl focus:border-primary-500 focus:outline-none transition-all tabular-nums"
                  min="500"
                  step="500"
                />
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {budgetPresets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setBudget(preset)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      budget === preset
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {formatCurrency(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Travel Dates
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    min={minCheckIn}
                    className="w-full px-3 py-3 bg-white border-2 border-neutral-200 rounded-xl text-sm focus:border-primary-500 focus:outline-none transition-all"
                  />
                  <span className="text-xs text-neutral-500 mt-1 block">Check-in</span>
                </div>
                <div className="flex-1">
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => handleCheckOutChange(e.target.value)}
                    min={format(addDays(parseISO(checkIn), 1), 'yyyy-MM-dd')}
                    className="w-full px-3 py-3 bg-white border-2 border-neutral-200 rounded-xl text-sm focus:border-primary-500 focus:outline-none transition-all"
                  />
                  <span className="text-xs text-neutral-500 mt-1 block">Check-out</span>
                </div>
              </div>
              <div className="text-center mt-2">
                <span className="text-sm font-medium text-primary-700">{nights} {nights === 1 ? 'night' : 'nights'}</span>
              </div>
            </div>

            {/* Travelers */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Total Travelers
              </label>
              <div className="flex items-center justify-between bg-white border-2 border-neutral-200 rounded-xl px-4 py-3">
                <button 
                  onClick={() => setGuests(Math.max(1, guests - 1))} 
                  className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-2xl font-bold tabular-nums">{guests}</span>
                <button 
                  onClick={() => setGuests(Math.min(20, guests + 1))} 
                  className="w-10 h-10 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center mt-2">
                <span className="text-sm text-neutral-500">{formatCurrency(budget / guests)} per person</span>
              </div>
            </div>
          </div>

          {/* Section 2: Category Toggles */}
          <div className="bg-neutral-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">What's included in your trip?</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'lodging', label: 'Lodging', icon: Bed, locked: true },
                { key: 'skiing', label: 'Skiing', icon: Mountain },
                { key: 'activities', label: 'Activities', icon: Compass },
                { key: 'dining', label: 'Dining', icon: Utensils },
                { key: 'events', label: 'Local Events', icon: Music },
              ].map(({ key, label, icon: Icon, locked }) => (
                <button
                  key={key}
                  onClick={() => toggleCategory(key as keyof TripCategories)}
                  disabled={locked}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    categories[key as keyof TripCategories]
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:border-primary-300'
                  } ${locked ? 'cursor-not-allowed opacity-75' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  {locked && <span className="text-xs opacity-75">(required)</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Skiing Details (conditional) */}
          {categories.skiing && (
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-200">
              <button 
                onClick={() => setShowSkiDetails(!showSkiDetails)}
                className="w-full flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <Snowflake className="w-5 h-5 text-sky-600" />
                  <h3 className="text-sm font-semibold text-neutral-700">Skiing Details</h3>
                  {!tripInSkiSeason && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Off-season dates</span>
                  )}
                </div>
                {showSkiDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              
              {showSkiDetails && (
                <div className="mt-4 space-y-4">
                  {!tripInSkiSeason ? (
                    <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                      Your trip dates are outside ski season ({seasonInfo.start} to {seasonInfo.end}). 
                      Skiing costs won't be included in your budget.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Adult Skiers */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            <User className="w-3 h-3 inline mr-1" />
                            Adults (13+)
                          </label>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setAdultSkiers(Math.max(0, adultSkiers - 1))}
                              className="w-8 h-8 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-lg font-bold w-8 text-center">{adultSkiers}</span>
                            <button 
                              onClick={() => setAdultSkiers(Math.min(guests, adultSkiers + 1))}
                              className="w-8 h-8 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Child Skiers */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            <User className="w-3 h-3 inline mr-1" />
                            Children (6-12)
                          </label>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setChildSkiers(Math.max(0, childSkiers - 1))}
                              className="w-8 h-8 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-lg font-bold w-8 text-center">{childSkiers}</span>
                            <button 
                              onClick={() => setChildSkiers(Math.min(guests - adultSkiers, childSkiers + 1))}
                              className="w-8 h-8 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Toddlers */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            <Baby className="w-3 h-3 inline mr-1" />
                            Under 5 (Free)
                          </label>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setToddlerSkiers(Math.max(0, toddlerSkiers - 1))}
                              className="w-8 h-8 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-lg font-bold w-8 text-center">{toddlerSkiers}</span>
                            <button 
                              onClick={() => setToddlerSkiers(Math.min(guests - adultSkiers - childSkiers, toddlerSkiers + 1))}
                              className="w-8 h-8 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Ski Days */}
                        <div>
                          <label className="block text-xs font-medium text-neutral-600 mb-1">
                            <Ticket className="w-3 h-3 inline mr-1" />
                            Ski Days
                          </label>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setSkiDays(Math.max(1, skiDays - 1))}
                              className="w-8 h-8 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-lg font-bold w-8 text-center">{skiDays}</span>
                            <button 
                              onClick={() => setSkiDays(Math.min(nights, skiDays + 1))}
                              className="w-8 h-8 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Lift Ticket Cost Display */}
                      {liftTicketCalc && (adultSkiers > 0 || childSkiers > 0) && (
                        <div className="bg-white rounded-lg p-4 border border-sky-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-neutral-600">Estimated Lift Ticket Cost</p>
                              <p className="text-2xl font-bold text-sky-700">{formatCurrency(liftTicketCalc.totalCost)}</p>
                            </div>
                            <div className="text-right text-sm text-neutral-500">
                              {liftTicketCalc.breakdown.adults.count > 0 && (
                                <p>{liftTicketCalc.breakdown.adults.count} adult{liftTicketCalc.breakdown.adults.count > 1 ? 's' : ''} × {skiDays} day{skiDays > 1 ? 's' : ''}</p>
                              )}
                              {liftTicketCalc.breakdown.children.count > 0 && (
                                <p>{liftTicketCalc.breakdown.children.count} child{liftTicketCalc.breakdown.children.count > 1 ? 'ren' : ''} × {skiDays} day{skiDays > 1 ? 's' : ''}</p>
                              )}
                              {liftTicketCalc.savings > 0 && (
                                <p className="text-green-600 font-medium">Multi-day savings: {formatCurrency(liftTicketCalc.savings)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 4: Budget Breakdown */}
          <div className="bg-white rounded-xl p-4 border border-neutral-200">
            <button 
              onClick={() => setShowAllocation(!showAllocation)}
              className="w-full flex items-center justify-between text-left mb-3"
            >
              <span className="text-sm font-semibold text-neutral-700">Budget Breakdown</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">Adjust allocation</span>
                {showAllocation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
            
            {/* Summary Row */}
            <div className="flex flex-wrap gap-4 text-sm mb-4">
              <div className="flex items-center gap-2">
                <span className="text-neutral-600">Total:</span>
                <span className="font-bold">{formatCurrency(budget)}</span>
              </div>
              {budgetBreakdown.fixedCosts > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-neutral-600">Lift Tickets:</span>
                  <span className="font-bold text-sky-700">-{formatCurrency(budgetBreakdown.fixedCosts)}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-neutral-600">Remaining:</span>
                <span className="font-bold text-green-700">{formatCurrency(budgetBreakdown.remainingBudget)}</span>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="h-6 rounded-full overflow-hidden flex mb-4">
              {budgetBreakdown.fixedCosts > 0 && (
                <div 
                  className="bg-sky-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(budgetBreakdown.fixedCosts / budget) * 100}%` }}
                >
                  Ski
                </div>
              )}
              {categories.lodging && (
                <div 
                  className="bg-primary-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(budgetBreakdown.lodging.total / budget) * 100}%` }}
                >
                  Lodging
                </div>
              )}
              {categories.activities && (
                <div 
                  className="bg-secondary-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(budgetBreakdown.activities.total / budget) * 100}%` }}
                >
                  Activities
                </div>
              )}
              {categories.dining && (
                <div 
                  className="bg-accent-500 flex items-center justify-center text-white text-xs font-medium"
                  style={{ width: `${(budgetBreakdown.dining.total / budget) * 100}%` }}
                >
                  Dining
                </div>
              )}
            </div>

            {/* Detailed Allocation (collapsible) */}
            {showAllocation && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
                {categories.lodging && (
                  <div className="text-center p-3 bg-primary-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Bed className="w-4 h-4 text-primary-600" />
                      <span className="text-xs font-medium text-neutral-600">Lodging</span>
                    </div>
                    <div className="text-lg font-bold text-neutral-900">{formatCurrency(budgetBreakdown.lodging.perNight)}</div>
                    <div className="text-xs text-neutral-500">per night</div>
                    <div className="flex justify-center gap-1 mt-2">
                      <button 
                        onClick={() => adjustAllocation('lodging', -5)}
                        className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{allocation.lodging}%</span>
                      <button 
                        onClick={() => adjustAllocation('lodging', 5)}
                        className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                {categories.activities && (
                  <div className="text-center p-3 bg-secondary-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Compass className="w-4 h-4 text-secondary-600" />
                      <span className="text-xs font-medium text-neutral-600">Activities</span>
                    </div>
                    <div className="text-lg font-bold text-neutral-900">{formatCurrency(budgetBreakdown.activities.perPerson)}</div>
                    <div className="text-xs text-neutral-500">per person</div>
                    <div className="flex justify-center gap-1 mt-2">
                      <button 
                        onClick={() => adjustAllocation('activities', -5)}
                        className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{allocation.activities}%</span>
                      <button 
                        onClick={() => adjustAllocation('activities', 5)}
                        className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                {categories.dining && (
                  <div className="text-center p-3 bg-accent-50 rounded-lg">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Utensils className="w-4 h-4 text-accent-600" />
                      <span className="text-xs font-medium text-neutral-600">Dining</span>
                    </div>
                    <div className="text-lg font-bold text-neutral-900">{formatCurrency(budgetBreakdown.dining.perPersonPerDay)}</div>
                    <div className="text-xs text-neutral-500">per person/day</div>
                    <div className="flex justify-center gap-1 mt-2">
                      <button 
                        onClick={() => adjustAllocation('dining', -5)}
                        className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{allocation.dining}%</span>
                      <button 
                        onClick={() => adjustAllocation('dining', 5)}
                        className="w-6 h-6 rounded bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results: Hotels */}
      {categories.lodging && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <HotelGrid 
              maxPrice={budgetBreakdown.lodging.perNight}
              limit={4}
              checkIn={checkIn}
              checkOut={checkOut}
              title={`Hotels up to ${formatCurrency(budgetBreakdown.lodging.perNight)}/night`}
            />
            <div className="mt-4 text-center">
              <a
                href={`/places-to-stay?maxPrice=${budgetBreakdown.lodging.perNight}&checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`}
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Browse All Hotels
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results: Activities */}
      {categories.activities && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <ActivityGrid 
              limit={4}
              maxPrice={budgetBreakdown.activities.perPerson}
              title={`Activities under ${formatCurrency(budgetBreakdown.activities.perPerson)}/person`}
            />
            <div className="mt-4 text-center">
              <a
                href="/things-to-do"
                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Explore All Activities
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results: Local Events */}
      {categories.events && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-neutral-900">Local Events During Your Trip</h3>
                <p className="text-sm text-neutral-500">
                  {format(parseISO(checkIn), 'MMM d')} - {format(parseISO(checkOut), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            
            {tripEvents.length > 0 ? (
              <div className="space-y-3">
                {tripEvents.map(event => (
                  <a
                    key={event.id}
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg hover:bg-purple-50 transition-colors group"
                  >
                    <div className="w-14 h-14 bg-purple-100 rounded-lg flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-purple-700">
                        {format(parseISO(event.date), 'MMM')}
                      </span>
                      <span className="text-xl font-bold text-purple-700">
                        {format(parseISO(event.date), 'd')}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-900 group-hover:text-purple-700">
                        {event.name}
                      </h4>
                      <p className="text-sm text-neutral-600">{event.description}</p>
                    </div>
                    {event.free && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                        Free
                      </span>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <p>No events scheduled during your trip dates.</p>
                <p className="text-sm mt-1">Check the full calendar for year-round events!</p>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <a
                href="https://www.telluride.com/festivals-events/events/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
              >
                View Full Event Calendar
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trip Summary CTA */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-center text-white">
        <p className="text-primary-100 text-sm mb-2">
          {guests} traveler{guests > 1 ? 's' : ''} • {nights} night{nights > 1 ? 's' : ''} ({format(parseISO(checkIn), 'MMM d')} - {format(parseISO(checkOut), 'MMM d')}) • {formatCurrency(budget)} budget
        </p>
        <p className="font-bold text-xl mb-4">
          Ready to book your Telluride adventure?
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={`/places-to-stay?maxPrice=${budgetBreakdown.lodging.perNight}&checkin=${checkIn}&checkout=${checkOut}&guests=${guests}`}
            className="inline-flex items-center gap-2 bg-white hover:bg-primary-50 text-primary-700 font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Bed className="w-4 h-4" />
            Browse Hotels
          </a>
          <a
            href="/things-to-do"
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            <Compass className="w-4 h-4" />
            Explore Activities
          </a>
        </div>
      </div>
    </div>
  );
}
