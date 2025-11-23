import { useState, type FormEvent } from 'react';
import { Search, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { format, addDays } from 'date-fns';

export interface HotelSearchWidgetProps {
  initialLocation?: string;
  initialDates?: { checkIn: Date; checkOut: Date };
  initialGuests?: { adults: number; children: number };
  onDatesChange?: (checkIn: string, checkOut: string) => void;
}

export function HotelSearchWidget({
  initialLocation = 'Telluride',
  initialDates,
  initialGuests = { adults: 2, children: 0 },
  onDatesChange,
}: HotelSearchWidgetProps) {
  // Simple state - initialized from props, updated by user input
  const getDateString = (date: Date | undefined, defaultDays: number) => {
    if (date) {
      try {
        return format(date, 'yyyy-MM-dd');
      } catch {
        return format(addDays(new Date(), defaultDays), 'yyyy-MM-dd');
      }
    }
    return format(addDays(new Date(), defaultDays), 'yyyy-MM-dd');
  };

  const [checkIn, setCheckIn] = useState(() =>
    getDateString(initialDates?.checkIn, 7)
  );
  const [checkOut, setCheckOut] = useState(() =>
    getDateString(initialDates?.checkOut, 14)
  );
  const [adults, setAdults] = useState(initialGuests.adults.toString());

  // If onDatesChange is provided, call it when dates change (user input only)
  // If not provided, widget is read-only (just displays dates from URL)
  const handleDateChange = (field: 'checkIn' | 'checkOut', value: string) => {
    if (field === 'checkIn') {
      setCheckIn(value);
    } else {
      setCheckOut(value);
    }
    // Only call onDatesChange if provided (for interactive mode)
    // In read-only mode (onDatesChange is undefined), this widget just displays dates
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Always navigate to new URL on form submit - this is the source of truth
    const params = new URLSearchParams({
      location: initialLocation,
      checkIn,
      checkOut,
      adults,
    });
    if (typeof window !== 'undefined') {
      window.location.href = `/places-to-stay?${params.toString()}`;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-elevated p-6 lg:p-8">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="checkIn" className="block text-sm font-medium text-neutral-700 mb-2">
              Check-in
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
              <Input
                id="checkIn"
                type="date"
                value={checkIn}
                onChange={(e) => handleDateChange('checkIn', e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="pl-11 h-12"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="checkOut" className="block text-sm font-medium text-neutral-700 mb-2">
              Check-out
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
              <Input
                id="checkOut"
                type="date"
                value={checkOut}
                onChange={(e) => handleDateChange('checkOut', e.target.value)}
                min={checkIn}
                className="pl-11 h-12"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="adults" className="block text-sm font-medium text-neutral-700 mb-2">
              Guests
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
              <Input
                id="adults"
                type="number"
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                min="1"
                max="10"
                className="pl-11 h-12"
                required
              />
            </div>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
        >
          <Search className="mr-2 h-5 w-5" />
          Search Places to Stay
        </Button>
      </form>
    </div>
  );
}
