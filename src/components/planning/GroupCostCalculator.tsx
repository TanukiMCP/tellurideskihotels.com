'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Calculator, Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { addDays, format } from 'date-fns';

export interface GroupCostCalculatorProps {
  groupType?: 'family' | 'friends' | 'couples' | 'solo';
  defaultNights?: number;
  defaultGuests?: number;
  checkIn?: string;
  checkOut?: string;
}

const LIFT_TICKET_COST = 180;
const ACTIVITIES_COST_PER_DAY = 80;
const DINING_COST_PER_DAY = 60;

export function GroupCostCalculator({
  groupType = 'friends',
  defaultNights = 4,
  defaultGuests = 4,
  checkIn,
  checkOut,
}: GroupCostCalculatorProps) {
  const [guests, setGuests] = useState(defaultGuests);
  const [nights, setNights] = useState(defaultNights);
  const [checkInDate, setCheckInDate] = useState(checkIn || format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [checkOutDate, setCheckOutDate] = useState(checkOut || format(addDays(new Date(), 7 + defaultNights), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [lodgingRate, setLodgingRate] = useState(350);
  const [totalCost, setTotalCost] = useState(0);
  const [costPerPerson, setCostPerPerson] = useState(0);

  useEffect(() => {
    fetchRates();
  }, [checkInDate, checkOutDate, nights]);

  useEffect(() => {
    if (!loading) {
      calculateCosts();
    }
  }, [guests, nights, lodgingRate, loading]);

  const fetchRates = async () => {
    try {
      setLoading(true);
      
      const checkInDateToUse = checkInDate;
      const checkOutDateToUse = checkOutDate;
      
      const searchParams = new URLSearchParams({
        cityName: 'Telluride',
        countryCode: 'US',
        limit: '20',
      });
      
      const hotelsResponse = await fetch(`/api/liteapi/search?${searchParams.toString()}`);
      
      if (!hotelsResponse.ok) {
        setLodgingRate(350);
        return;
      }
      
      const hotelsData = await hotelsResponse.json();
      const hotels = hotelsData.data || [];
      
      if (hotels.length === 0) {
        setLodgingRate(350);
        return;
      }
      
      const hotelIds = hotels.map((h: any) => h.hotel_id);
      const ratesParams = new URLSearchParams({
        hotelIds: hotelIds.join(','),
        checkIn: checkInDateToUse,
        checkOut: checkOutDateToUse,
        adults: guests.toString(),
      });
      
      const ratesResponse = await fetch(`/api/hotels/min-rates?${ratesParams.toString()}`);
      
      if (!ratesResponse.ok) {
        setLodgingRate(350);
        return;
      }
      
      const ratesData = await ratesResponse.json();
      
      const prices: number[] = [];
      if (ratesData.data && Array.isArray(ratesData.data)) {
        ratesData.data.forEach((item: any) => {
          if (item.price) {
            const perNight = nights > 0 ? item.price / nights : item.price;
            prices.push(perNight);
          }
        });
      }
      
      if (prices.length > 0) {
        const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
        setLodgingRate(Math.round(avgPrice));
      } else {
        setLodgingRate(350);
      }
    } catch (err) {
      setLodgingRate(350);
    } finally {
      setLoading(false);
    }
  };

  const calculateCosts = () => {
    const lodging = lodgingRate * nights;
    const liftTickets = LIFT_TICKET_COST * nights * guests;
    const activities = ACTIVITIES_COST_PER_DAY * nights * guests;
    const dining = DINING_COST_PER_DAY * nights * guests;
    
    const total = lodging + liftTickets + activities + dining;
    const perPerson = total / guests;
    
    setTotalCost(total);
    setCostPerPerson(perPerson);
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
            <CardTitle className="text-2xl">Group Cost Calculator</CardTitle>
            <p className="text-neutral-600 mt-1">
              Estimate total trip expenses for your group
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              value={checkInDate}
              onChange={(e) => {
                if (e.target.value) {
                  setCheckInDate(e.target.value);
                  const newCheckOut = format(addDays(new Date(e.target.value), nights), 'yyyy-MM-dd');
                  setCheckOutDate(newCheckOut);
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
              value={checkOutDate}
              onChange={(e) => {
                if (e.target.value) {
                  setCheckOutDate(e.target.value);
                  const daysDiff = Math.ceil((new Date(e.target.value).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24));
                  if (daysDiff > 0) {
                    setNights(daysDiff);
                  }
                }
              }}
              min={checkInDate}
              className="w-full"
            />
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Cost Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Lodging', amount: lodgingRate * nights, icon: '🏨' },
              { label: 'Lift Tickets', amount: LIFT_TICKET_COST * nights * guests, icon: '🎿' },
              { label: 'Activities', amount: ACTIVITIES_COST_PER_DAY * nights * guests, icon: '🎯' },
              { label: 'Dining', amount: DINING_COST_PER_DAY * nights * guests, icon: '🍽️' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center p-3 bg-neutral-50 rounded-lg">
                <span className="font-medium text-neutral-900 flex items-center gap-2">
                  <span>{item.icon}</span>
                  {item.label}
                </span>
                <span className="font-bold text-primary-600">
                  {formatCurrency(item.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <div className="p-4 bg-primary-50 border-2 border-primary-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-neutral-900">Total Cost:</span>
              <span className="text-2xl font-bold text-primary-700">
                {formatCurrency(totalCost)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-600">Cost Per Person:</span>
              <span className="text-xl font-bold text-primary-600">
                {formatCurrency(costPerPerson)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-200 pt-6">
          <a
            href={`/places-to-stay?guests=${guests}&nights=${nights}&checkin=${checkInDate}&checkout=${checkOutDate}`}
            className="inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 !text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg w-full md:w-auto"
          >
            Find Hotels for {guests} Guests, {nights} Nights →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
