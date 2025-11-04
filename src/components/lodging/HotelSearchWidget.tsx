import { useState, type FormEvent } from 'react';
import { Search } from 'lucide-react';
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
    <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Find Your Perfect Stay</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <Input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Telluride, Colorado"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
            <Input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
            <Input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              min={checkIn}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adults</label>
            <Input
              type="number"
              value={adults}
              onChange={(e) => setAdults(e.target.value)}
              min="1"
              max="10"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
            <Input
              type="number"
              value={children}
              onChange={(e) => setChildren(e.target.value)}
              min="0"
              max="10"
            />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full">
          <Search className="mr-2 h-4 w-4" />
          Search Hotels
        </Button>
      </form>
    </div>
  );
}

