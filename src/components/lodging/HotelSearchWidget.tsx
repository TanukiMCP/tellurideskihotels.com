import { useState, type FormEvent, useEffect, useRef } from 'react';
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
  // Helper to get date string from Date object or return default
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

  // Track previous initialDates to detect prop changes
  const prevInitialDatesRef = useRef<{ checkIn?: Date; checkOut?: Date } | undefined>(initialDates);
  const isSyncingFromPropsRef = useRef(false);
  
  // Sync state when initialDates prop changes (e.g., from URL params)
  useEffect(() => {
    if (initialDates?.checkIn && initialDates?.checkOut) {
      const newCheckIn = format(initialDates.checkIn, 'yyyy-MM-dd');
      const newCheckOut = format(initialDates.checkOut, 'yyyy-MM-dd');
      
      // Check if initialDates prop actually changed (not just state update)
      const prevCheckIn = prevInitialDatesRef.current?.checkIn 
        ? format(prevInitialDatesRef.current.checkIn, 'yyyy-MM-dd')
        : null;
      const prevCheckOut = prevInitialDatesRef.current?.checkOut
        ? format(prevInitialDatesRef.current.checkOut, 'yyyy-MM-dd')
        : null;
      
      // Only update if initialDates prop changed (not just state)
      if (newCheckIn !== prevCheckIn || newCheckOut !== prevCheckOut) {
        isSyncingFromPropsRef.current = true; // Mark that we're syncing from props
        setCheckIn(newCheckIn);
        setCheckOut(newCheckOut);
        prevInitialDatesRef.current = initialDates; // Update ref
        
        // Reset flag in next tick to ensure state update completes
        requestAnimationFrame(() => {
          isSyncingFromPropsRef.current = false;
        });
      }
    }
  }, [initialDates?.checkIn, initialDates?.checkOut]);

  // Track previous values to only call onDatesChange when dates actually change
  const prevCheckInRef = useRef<string>(checkIn);
  const prevCheckOutRef = useRef<string>(checkOut);
  const onDatesChangeRef = useRef(onDatesChange);
  const isInitialMount = useRef(true);

  // Update ref when callback changes (but don't trigger effect)
  useEffect(() => {
    onDatesChangeRef.current = onDatesChange;
  }, [onDatesChange]);

  // Notify parent when dates change (but not on initial mount or when syncing from props)
  useEffect(() => {
    // Skip on initial mount - parent will handle initial search
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevCheckInRef.current = checkIn;
      prevCheckOutRef.current = checkOut;
      return;
    }

    // Don't call onDatesChange if we're syncing from props
    if (isSyncingFromPropsRef.current) {
      prevCheckInRef.current = checkIn;
      prevCheckOutRef.current = checkOut;
      return;
    }

    // Only call if dates actually changed (user changed them, not prop sync)
    if (
      onDatesChangeRef.current &&
      (prevCheckInRef.current !== checkIn || prevCheckOutRef.current !== checkOut)
    ) {
      prevCheckInRef.current = checkIn;
      prevCheckOutRef.current = checkOut;
      onDatesChangeRef.current(checkIn, checkOut);
    }
  }, [checkIn, checkOut]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
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
                onChange={(e) => setCheckIn(e.target.value)}
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
                onChange={(e) => setCheckOut(e.target.value)}
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
