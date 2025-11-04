import { useState, FormEvent } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { format, addDays } from 'date-fns';

export function HotelSearchBar() {
  const [location, setLocation] = useState('Telluride');
  const [checkIn, setCheckIn] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [adults, setAdults] = useState('2');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams({
      location,
      checkIn,
      checkOut,
      adults,
    });
    if (typeof window !== 'undefined') {
      window.location.href = `/lodging?${params.toString()}`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <Input
        type="text"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        placeholder="Location"
        className="flex-1"
      />
      <Input
        type="date"
        value={checkIn}
        onChange={(e) => setCheckIn(e.target.value)}
        label="Check-in"
        min={format(new Date(), 'yyyy-MM-dd')}
      />
      <Input
        type="date"
        value={checkOut}
        onChange={(e) => setCheckOut(e.target.value)}
        label="Check-out"
        min={checkIn}
      />
      <Input
        type="number"
        value={adults}
        onChange={(e) => setAdults(e.target.value)}
        label="Adults"
        min="1"
        max="10"
        className="w-24"
      />
      <Button type="submit" className="sm:mt-6">
        <Search className="mr-2 h-4 w-4" />
        Search
      </Button>
    </form>
  );
}

