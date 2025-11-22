'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { Calendar, TrendingDown } from 'lucide-react';

export interface SeasonComparisonProps {
  peakDates: string;
  offPeakDates: string;
  groupSize?: number;
}

interface SeasonData {
  name: string;
  dates: string;
  hotelCost: number;
  liftTicketCost: number;
  crowdLevel: string;
  conditions: string;
  totalCost: number;
}

const PEAK_MULTIPLIER = 2.5;
const OFF_PEAK_MULTIPLIER = 0.7;
const BASE_HOTEL_COST = 400;
const BASE_LIFT_COST = 180;

export function SeasonComparison({
  peakDates,
  offPeakDates,
  groupSize = 4,
}: SeasonComparisonProps) {
  const [selectedSeason, setSelectedSeason] = useState<'peak' | 'offpeak'>('peak');

  const peakData: SeasonData = {
    name: 'Peak Season',
    dates: peakDates,
    hotelCost: BASE_HOTEL_COST * PEAK_MULTIPLIER,
    liftTicketCost: BASE_LIFT_COST,
    crowdLevel: 'High',
    conditions: 'Excellent',
    totalCost: 0,
  };

  const offPeakData: SeasonData = {
    name: 'Off-Peak Season',
    dates: offPeakDates,
    hotelCost: BASE_HOTEL_COST * OFF_PEAK_MULTIPLIER,
    liftTicketCost: BASE_LIFT_COST,
    crowdLevel: 'Low',
    conditions: 'Good to Excellent',
    totalCost: 0,
  };

  peakData.totalCost = (peakData.hotelCost + peakData.liftTicketCost) * 4 * groupSize;
  offPeakData.totalCost = (offPeakData.hotelCost + offPeakData.liftTicketCost) * 4 * groupSize;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const savings = peakData.totalCost - offPeakData.totalCost;
  const savingsPercent = ((savings / peakData.totalCost) * 100).toFixed(0);

  return (
    <Card className="my-8 border-2 border-primary-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Peak vs Off-Peak Comparison</CardTitle>
            <p className="text-neutral-600 mt-1">
              Compare costs and conditions between peak and off-peak seasons
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedSeason === 'peak'
                ? 'border-primary-400 bg-primary-50'
                : 'border-neutral-200 hover:border-primary-200'
            }`}
            onClick={() => setSelectedSeason('peak')}
          >
            <div className="font-semibold text-lg text-neutral-900 mb-2">Peak Season</div>
            <div className="text-sm text-neutral-600 mb-4">{peakDates}</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Hotel (per night):</span>
                <span className="font-semibold">{formatCurrency(peakData.hotelCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Lift Tickets:</span>
                <span className="font-semibold">{formatCurrency(peakData.liftTicketCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Crowds:</span>
                <span className="font-semibold">{peakData.crowdLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Conditions:</span>
                <span className="font-semibold">{peakData.conditions}</span>
              </div>
            </div>
          </div>

          <div
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              selectedSeason === 'offpeak'
                ? 'border-primary-400 bg-primary-50'
                : 'border-neutral-200 hover:border-primary-200'
            }`}
            onClick={() => setSelectedSeason('offpeak')}
          >
            <div className="font-semibold text-lg text-neutral-900 mb-2">Off-Peak Season</div>
            <div className="text-sm text-neutral-600 mb-4">{offPeakDates}</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Hotel (per night):</span>
                <span className="font-semibold">{formatCurrency(offPeakData.hotelCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Lift Tickets:</span>
                <span className="font-semibold">{formatCurrency(offPeakData.liftTicketCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Crowds:</span>
                <span className="font-semibold">{offPeakData.crowdLevel}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Conditions:</span>
                <span className="font-semibold">{offPeakData.conditions}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <div className="p-4 bg-neutral-50 border-2 border-neutral-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-neutral-900">Potential Savings</span>
            </div>
            <div className="text-2xl font-bold text-primary-600 mb-1">
              {formatCurrency(savings)}
            </div>
            <div className="text-sm text-neutral-600">
              Save {savingsPercent}% by choosing off-peak dates for {groupSize} people, 4 nights
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <ArticleBookingWidget
            filter={selectedSeason === 'offpeak' ? undefined : 'luxury'}
            variant="default"
            title={selectedSeason === 'offpeak' ? 'See Off-Peak Deals' : 'View Peak Season Availability'}
            description={`Compare rates for ${selectedSeason === 'offpeak' ? 'off-peak' : 'peak'} season dates`}
          />
        </div>
      </CardContent>
    </Card>
  );
}

