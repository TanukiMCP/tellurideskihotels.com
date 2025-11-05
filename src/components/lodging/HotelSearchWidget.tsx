import { useState, type FormEvent } from 'react';
import { Search, MapPin, Calendar, Users } from 'lucide-react';
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
  const [location, setLocation] = useState(initialLocation);
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
  const [children, setChildren] = useState(initialGuests.children.toString());

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      location,
      checkIn,
      checkOut,
      adults,
    });
    if (parseInt(children) > 0) {
      params.append('children', children);
    }
    if (typeof window !== 'undefined') {
      window.location.href = `/lodging?${params.toString()}`;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-elevated p-8 lg:p-10">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-semibold text-neutral-900 mb-2">Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter destination"
                className="pl-12 h-14 text-base border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">Check-in</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="pl-12 h-14 text-base border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">Check-out</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn}
                className="pl-12 h-14 text-base border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">Adults</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="number"
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                min="1"
                max="10"
                className="pl-12 h-14 text-base border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">Children</label>
            <div className="relative">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <Input
                type="number"
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                min="0"
                max="10"
                className="pl-12 h-14 text-base border-neutral-300 focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
        
        <Button 
          type="submit" 
          size="lg" 
          className="w-full h-14 bg-gradient-accent hover:opacity-90 shadow-cta hover:shadow-elevated transition-all duration-300 text-white font-semibold text-lg"
        >
          <Search className="mr-2 h-5 w-5" />
          Search Hotels
        </Button>
      </form>
    </div>
  );
}
