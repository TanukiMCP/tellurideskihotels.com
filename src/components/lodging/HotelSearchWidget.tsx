import { useState, type FormEvent } from 'react';
import { Search, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { format, addDays } from 'date-fns';

export interface HotelSearchWidgetProps {
  initialLocation?: string;
  initialDates?: { checkIn: Date; checkOut: Date };
  initialGuests?: { adults: number; children: number };
}

export function HotelSearchWidget({
  initialLocation = 'Telluride',
  initialDates,
  initialGuests = { adults: 2, children: 0 },
}: HotelSearchWidgetProps) {
  const [checkIn, setCheckIn] = useState(
    initialDates?.checkIn
      ? format(initialDates.checkIn, 'yyyy-MM-dd')
      : format(addDays(new Date(), 7), 'yyyy-MM-dd')
  );
  const [checkOut, setCheckOut] = useState(
    initialDates?.checkOut
      ? format(initialDates.checkOut, 'yyyy-MM-dd')
      : format(addDays(new Date(), 14), 'yyyy-MM-dd')
  );
  const [adults, setAdults] = useState(initialGuests.adults.toString());

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      location: initialLocation,
      checkIn,
      checkOut,
      adults,
    });
    if (typeof window !== 'undefined') {
      window.location.href = `/lodging?${params.toString()}`;
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
          className="w-full h-12 bg-gradient-accent hover:opacity-90 shadow-cta transition-all duration-200"
        >
          <Search className="mr-2 h-5 w-5" />
          Search Hotels
        </Button>
      </form>
    </div>
  );
}
