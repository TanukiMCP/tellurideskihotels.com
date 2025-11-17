'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { Calculator, Users, Calendar } from 'lucide-react';

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

const LODGING_COST_PER_NIGHT = {
  budget: 150,
  midRange: 350,
  luxury: 800,
};

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

  const calculateCosts = () => {
    const lodgingBudget = LODGING_COST_PER_NIGHT.budget * nights;
    const lodgingMidRange = LODGING_COST_PER_NIGHT.midRange * nights;
    const lodgingLuxury = LODGING_COST_PER_NIGHT.luxury * nights;

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

  useEffect(() => {
    if (guests > 0 && nights > 0) {
      calculateCosts();
    }
  }, [guests, nights]);

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
              Calculate your total trip cost and cost per person
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

            <div className="border-t border-neutral-200 pt-4">
              <ArticleBookingWidget
                filter={getFilterForBudget(breakdown.midRange)}
                variant="default"
                title={`Find Hotels Under ${formatCurrency(breakdown.midRange)}/person`}
                description="Search available properties that fit your budget"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

