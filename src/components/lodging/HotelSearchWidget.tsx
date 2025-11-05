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
    <div className="bg-white rounded-2xl shadow-strong p-8 md:p-12 border border-gray-200" style={{boxShadow: '0 20px 60px rgba(0,0,0,0.15)'}}>
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-3 text-gray-900" style={{fontSize: '32px', lineHeight: '1.3'}}>Find Your Perfect Stay</h2>
        <p className="text-gray-600 text-lg" style={{fontSize: '18px', lineHeight: '1.6'}}>Discover the best ski hotels in Telluride</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="relative">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <Input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Telluride, Colorado"
              className="pl-10"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-in</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <Input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Check-out</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <Input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                min={checkIn}
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Adults</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <Input
                type="number"
                value={adults}
                onChange={(e) => setAdults(e.target.value)}
                min="1"
                max="10"
                className="pl-10"
                required
              />
            </div>
          </div>
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Children</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <Input
                type="number"
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                min="0"
                max="10"
                className="pl-10"
              />
            </div>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full bg-primary-500 hover:bg-primary-600 shadow-medium hover:shadow-strong transition-all duration-300 text-white font-semibold" style={{height: '56px', fontWeight: '600'}}>
          <Search className="mr-2 h-5 w-5" />
          Search Hotels
        </Button>
      </form>
    </div>
  );
}

