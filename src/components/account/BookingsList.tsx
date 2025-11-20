import { useEffect, useState } from 'react';
import { BookingCard } from './BookingCard';
import type { AccountBooking } from './BookingCard';
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
      <div className="text-center py-16">
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
          <svg className="w-12 h-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-3">No bookings yet</h3>
        <p className="text-neutral-600 mb-8 max-w-md mx-auto">
          Ready to explore Telluride? Browse our selection of premium ski hotels and make your first reservation.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/places-to-stay"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-white font-semibold hover:bg-primary-700 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse Hotels
          </a>
          <a
            href="/trail-map"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-neutral-300 px-6 py-3 text-neutral-700 font-semibold hover:border-primary-300 hover:bg-primary-50 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Explore Trail Map
          </a>
        </div>
      </div>
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

