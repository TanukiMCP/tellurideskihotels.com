/**
 * Lift Ticket Pricing Utility
 * Calculates lift ticket costs based on real Telluride pricing data
 */

import liftTicketData from '@/data/lift-ticket-prices.json';
import { eachDayOfInterval, parseISO, format, isWithinInterval } from 'date-fns';

export interface SkierGroup {
  adults: number;      // 13+
  children: number;    // 6-12
  toddlers: number;    // 5 & under (free)
}

export interface LiftTicketCalculation {
  totalCost: number;
  breakdown: {
    adults: { count: number; days: number; costPerDay: number; total: number };
    children: { count: number; days: number; costPerDay: number; total: number };
    toddlers: { count: number; days: number; costPerDay: number; total: number };
  };
  dailyPrices: { date: string; adultPrice: number; childPrice: number }[];
  multiDayDiscount: number;
  savings: number;
}

/**
 * Get the lift ticket price for a specific date and age group
 */
export function getPriceForDate(date: string, ageGroup: 'adult' | 'child' | 'toddler'): number {
  if (ageGroup === 'toddler') return 0; // 5 & under free
  
  const pricing = liftTicketData.pricing[ageGroup]?.['1-day'];
  if (!pricing) return 0;
  
  // Return price for date, or average if date not in range
  const price = pricing[date as keyof typeof pricing];
  if (price !== undefined) return price as number;
  
  // If date is outside season, return 0
  const seasonStart = parseISO(liftTicketData.seasonStart);
  const seasonEnd = parseISO(liftTicketData.seasonEnd);
  const targetDate = parseISO(date);
  
  if (!isWithinInterval(targetDate, { start: seasonStart, end: seasonEnd })) {
    return 0;
  }
  
  // Fallback to regular price
  return ageGroup === 'adult' ? 257 : 149;
}

/**
 * Calculate total lift ticket cost for a trip
 */
export function calculateLiftTicketCost(
  checkIn: string,
  checkOut: string,
  skiers: SkierGroup,
  skiDays: number
): LiftTicketCalculation {
  const startDate = parseISO(checkIn);
  const endDate = parseISO(checkOut);
  
  // Get all dates in the trip
  const tripDates = eachDayOfInterval({ start: startDate, end: endDate })
    .slice(0, -1) // Exclude checkout day
    .map(d => format(d, 'yyyy-MM-dd'));
  
  // Limit ski days to trip length
  const actualSkiDays = Math.min(skiDays, tripDates.length);
  
  // Get prices for first N ski days (assuming they ski the first days)
  const skiingDates = tripDates.slice(0, actualSkiDays);
  
  const dailyPrices = skiingDates.map(date => ({
    date,
    adultPrice: getPriceForDate(date, 'adult'),
    childPrice: getPriceForDate(date, 'child'),
  }));
  
  // Calculate base cost (before multi-day discount)
  const adultDailyTotal = dailyPrices.reduce((sum, d) => sum + d.adultPrice, 0);
  const childDailyTotal = dailyPrices.reduce((sum, d) => sum + d.childPrice, 0);
  
  const adultBaseCost = adultDailyTotal * skiers.adults;
  const childBaseCost = childDailyTotal * skiers.children;
  const baseTotalCost = adultBaseCost + childBaseCost;
  
  // Apply multi-day discount
  const multiDayDiscount = actualSkiDays >= 2 
    ? (liftTicketData.multiDayDiscounts as Record<string, number>)[actualSkiDays.toString()] || 0
    : 0;
  
  const discountAmount = baseTotalCost * multiDayDiscount;
  const totalCost = Math.round(baseTotalCost - discountAmount);
  
  // Calculate average cost per day for display
  const avgAdultCostPerDay = actualSkiDays > 0 
    ? Math.round(adultDailyTotal / actualSkiDays) 
    : 0;
  const avgChildCostPerDay = actualSkiDays > 0 
    ? Math.round(childDailyTotal / actualSkiDays) 
    : 0;
  
  return {
    totalCost,
    breakdown: {
      adults: {
        count: skiers.adults,
        days: actualSkiDays,
        costPerDay: avgAdultCostPerDay,
        total: Math.round(adultBaseCost * (1 - multiDayDiscount)),
      },
      children: {
        count: skiers.children,
        days: actualSkiDays,
        costPerDay: avgChildCostPerDay,
        total: Math.round(childBaseCost * (1 - multiDayDiscount)),
      },
      toddlers: {
        count: skiers.toddlers,
        days: actualSkiDays,
        costPerDay: 0,
        total: 0,
      },
    },
    dailyPrices,
    multiDayDiscount,
    savings: Math.round(discountAmount),
  };
}

/**
 * Check if dates are within ski season
 */
export function isWithinSkiSeason(checkIn: string, checkOut: string): boolean {
  const seasonStart = parseISO(liftTicketData.seasonStart);
  const seasonEnd = parseISO(liftTicketData.seasonEnd);
  const tripStart = parseISO(checkIn);
  const tripEnd = parseISO(checkOut);
  
  // Trip overlaps with ski season if it starts before season ends AND ends after season starts
  return tripStart <= seasonEnd && tripEnd >= seasonStart;
}

/**
 * Get season info
 */
export function getSeasonInfo() {
  return {
    season: liftTicketData.season,
    start: liftTicketData.seasonStart,
    end: liftTicketData.seasonEnd,
    lastUpdated: liftTicketData.lastUpdated,
  };
}

/**
 * Get price tier for a specific date
 */
export function getPriceTier(date: string): 'value' | 'regular' | 'peak' | 'off-season' {
  const adultPrice = getPriceForDate(date, 'adult');
  
  if (adultPrice === 0) return 'off-season';
  if (adultPrice <= 164) return 'value';
  if (adultPrice <= 257) return 'regular';
  return 'peak';
}

