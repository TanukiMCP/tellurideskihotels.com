import { useEffect, useState } from 'react';
import { CheckoutFlow } from '@/components/checkout/CheckoutFlow';
import type { SelectedRoom, SelectedAddon } from '@/lib/types';

interface CheckoutContext {
  hotelId: string;
  hotelName: string;
  hotelImage?: string;
  hotelAddress?: string;
  room: SelectedRoom;
  addons?: SelectedAddon[];
}

export function CheckoutPage() {
  const [context, setContext] = useState<CheckoutContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem('checkoutContext');

      if (stored) {
        const parsed: CheckoutContext = JSON.parse(stored);

        // Basic validation – ensure we have required booking data
        if (parsed?.room?.offerId && parsed.hotelId && parsed.hotelName) {
          setContext(parsed);
        } else {
          console.error('[CheckoutPage] Invalid checkout context:', parsed);
          setContext(null);
        }
      } else {
        console.warn('[CheckoutPage] No checkout context found in sessionStorage.');
        setContext(null);
      }
    } catch (error) {
      console.error('[CheckoutPage] Failed to parse checkout context:', error);
      setContext(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBookingComplete = (bookingId: string) => {
    if (!bookingId) {
      alert('Booking confirmed but missing booking ID. Please contact support.');
      return;
    }

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('checkoutContext');
      window.location.replace(`/booking/confirmation/${bookingId}`);
    }
  };

  const handleBackToSearch = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('checkoutContext');
      window.location.href = '/places-to-stay';
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="mx-auto h-12 w-12 border-b-4 border-primary-600 rounded-full animate-spin" />
        <p className="text-lg text-neutral-600">Loading your secure checkout...</p>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-6">
        <h1 className="text-3xl font-bold text-neutral-900">No Active Booking</h1>
        <p className="text-neutral-600 text-lg">
          We couldn’t find an active booking session. Please return to the hotel listings to start a new reservation.
        </p>
        <button
          onClick={handleBackToSearch}
          className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
        >
          Back to Places to Stay
        </button>
      </div>
    );
  }

  return (
    <CheckoutFlow
      hotelId={context.hotelId}
      hotelName={context.hotelName}
      hotelImage={context.hotelImage}
      hotelAddress={context.hotelAddress}
      room={context.room}
      addons={context.addons || []}
      onComplete={handleBookingComplete}
    />
  );
}


