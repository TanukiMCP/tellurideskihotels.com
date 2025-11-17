'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { Building2, Users, Calendar, TrendingUp } from 'lucide-react';

export interface HotelSplitCalculatorProps {
  hotelIds: string[];
  scenario?: string;
  defaultNights?: number;
  defaultGuests?: number;
}

interface ComparisonOption {
  id: string;
  name: string;
  type: 'hotel' | 'condo' | 'suite';
  rooms: number;
  costPerNight: number;
  totalCost: number;
  costPerPerson: number;
  amenities: string[];
}

const ESTIMATED_COSTS = {
  hotelRoom: 350,
  condo3BR: 600,
  suite2BR: 800,
};

export function HotelSplitCalculator({
  hotelIds,
  scenario = 'group',
  defaultNights = 4,
  defaultGuests = 4,
}: HotelSplitCalculatorProps) {
  const [guests, setGuests] = useState(defaultGuests);
  const [nights, setNights] = useState(defaultNights);
  const [comparisons, setComparisons] = useState<ComparisonOption[]>([]);

  useEffect(() => {
    calculateComparisons();
  }, [guests, nights]);

  const calculateComparisons = () => {
    const options: ComparisonOption[] = [];

    if (guests <= 4) {
      options.push({
        id: 'hotel-2-rooms',
        name: '2 Hotel Rooms',
        type: 'hotel',
        rooms: 2,
        costPerNight: ESTIMATED_COSTS.hotelRoom * 2,
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
        costPerNight: ESTIMATED_COSTS.condo3BR,
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
        costPerNight: ESTIMATED_COSTS.hotelRoom * 4,
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
        costPerNight: ESTIMATED_COSTS.suite2BR,
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
    setComparisons(calculated);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBestOption = () => {
    return comparisons[0];
  };

  return (
    <Card className="my-8 border-2 border-primary-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Accommodation Cost Comparison</CardTitle>
            <p className="text-neutral-600 mt-1">
              Compare costs for different lodging options for your group
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
              min="2"
              max="20"
              value={guests}
              onChange={(e) => setGuests(parseInt(e.target.value) || 2)}
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

        {comparisons.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                Cost Comparison for {guests} Guests, {nights} Nights
              </h3>
              <div className="space-y-3">
                {comparisons.map((option, index) => (
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
                      <div className="mt-2 flex items-center gap-1 text-sm text-primary-600 font-medium">
                        <TrendingUp className="w-4 h-4" />
                        Best Value
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {getBestOption() && (
              <div className="border-t border-neutral-200 pt-4">
                <ArticleBookingWidget
                  filter={getBestOption()?.type === 'condo' ? undefined : 'family-friendly'}
                  variant="default"
                  title={`View ${getBestOption()?.name} Options`}
                  description={`Best value at ${formatCurrency(getBestOption()?.costPerPerson || 0)} per person`}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

