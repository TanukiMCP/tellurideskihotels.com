import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BookingDetails } from './BookingDetails';
import type { BookingLookupResult } from './BookingDetails';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function LookupForm() {
  const [bookingId, setBookingId] = useState('');
  const [email, setEmail] = useState('');
  const [lastName, setLastName] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingLookupResult | null>(null);
  const [lastRequest, setLastRequest] = useState<{
    bookingId: string;
    email: string;
    lastName?: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paramBookingId = params.get('bookingId') || params.get('booking_id');
    const paramEmail = params.get('email');
    const paramLastName = params.get('lastName') || params.get('last_name');

    if (paramBookingId) {
      setBookingId(paramBookingId);
    }
    if (paramEmail) {
      setEmail(paramEmail);
    }
    if (paramLastName) {
      setLastName(paramLastName);
    }
  }, []);

  const executeLookup = async (payload: { bookingId: string; email: string; lastName?: string }) => {
    setStatus('loading');
    setError(null);
    try {
      const response = await fetch('/api/booking/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Booking not found');
      }

      setResult(data as BookingLookupResult);
      setStatus('success');
      setLastRequest(payload);
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'Unable to find booking');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!bookingId.trim() || !email.trim()) {
      setError('Booking ID and email are required.');
      return;
    }

    await executeLookup({
      bookingId: bookingId.trim(),
      email: email.trim(),
      lastName: lastName.trim() || undefined,
    });
  };

  const refreshBooking = async () => {
    if (!lastRequest) return;
    await executeLookup(lastRequest);
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Booking ID"
            placeholder="e.g. X6VOhc8KR"
            value={bookingId}
            onChange={(e) => setBookingId(e.target.value)}
            required
          />
          <Input
            type="email"
            label="Email used for booking"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <Input
          label="Last name on booking (optional)"
          placeholder="Add for extra security"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        <div>
          <Button type="submit" disabled={status === 'loading'} className="w-full md:w-auto">
            {status === 'loading' ? 'Searching…' : 'Find my booking'}
          </Button>
        </div>
      </form>

      {status === 'loading' && (
        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm">
          Verifying booking details…
        </div>
      )}

      {status === 'success' && result && lastRequest && (
        <BookingDetails booking={result} credentials={lastRequest} onRefresh={refreshBooking} />
      )}
    </div>
  );
}

