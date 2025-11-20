import { useEffect, useState } from 'react';
import { BookingCard, AccountBooking } from './BookingCard';
import { Card, CardContent } from '@/components/ui/Card';

interface ApiResponse {
  bookings: AccountBooking[];
  error?: string;
}

export function BookingsList() {
  const [bookings, setBookings] = useState<AccountBooking[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>(
    'loading'
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      try {
        const response = await fetch('/api/account/bookings', {
          credentials: 'include',
        });
        const data: ApiResponse = await response.json();

        if (!isMounted) return;

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load bookings');
        }

        if (!data.bookings || data.bookings.length === 0) {
          setStatus('empty');
          return;
        }

        setBookings(data.bookings);
        setStatus('ready');
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message || 'Unable to load bookings');
        setStatus('error');
      }
    };

    loadBookings();

    return () => {
      isMounted = false;
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, idx) => (
          <Card key={idx} className="animate-pulse border-neutral-200">
            <CardContent className="h-32" />
          </Card>
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="py-8 text-center">
          <p className="text-rose-700 font-medium mb-2">Unable to load bookings</p>
          <p className="text-sm text-rose-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'empty') {
    return (
      <Card className="border-neutral-200 bg-white">
        <CardContent className="py-10 text-center space-y-3">
          <p className="text-lg font-semibold text-neutral-900">No bookings yet</p>
          <p className="text-neutral-600">Start exploring Telluride and book your stay.</p>
          <a
            href="/places-to-stay"
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-white text-sm font-medium hover:bg-primary-700 transition"
          >
            Browse Hotels
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {bookings.map((booking) => (
        <BookingCard key={booking.bookingId} booking={booking} />
      ))}
    </div>
  );
}

