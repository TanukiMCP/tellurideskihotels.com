import { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BookingDetails } from './BookingDetails';
import type { BookingLookupResult } from './BookingDetails';
import { HelpCircle, X, Mail } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export function LookupForm() {
  const [bookingId, setBookingId] = useState('');
  const [email, setEmail] = useState('');
  const [lastName, setLastName] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingLookupResult | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [lastRequest, setLastRequest] = useState<{
    bookingId: string;
    email: string;
    lastName?: string;
  } | null>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTooltip]);

  // Close tooltip on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showTooltip]);

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
    setError(null);

    // Client-side validation
    const trimmedBookingId = bookingId.trim();
    const trimmedEmail = email.trim();

    if (!trimmedBookingId || !trimmedEmail) {
      setError('Booking ID and email are required.');
      return;
    }

    // Validate booking ID format (9 characters, alphanumeric)
    if (trimmedBookingId.length !== 9 || !/^[A-Za-z0-9]+$/.test(trimmedBookingId)) {
      setError('Booking ID must be 9 characters (letters and numbers only).');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    await executeLookup({
      bookingId: trimmedBookingId,
      email: trimmedEmail,
      lastName: lastName.trim() || undefined,
    });
  };

  const refreshBooking = async () => {
    if (!lastRequest) return;
    await executeLookup(lastRequest);
  };

  return (
    <div className="space-y-8">
      {/* Lookup Card */}
      <div 
        className="bg-[#F8F9F8] border border-[#E5E8E5] rounded-xl shadow-lg p-8 md:p-10 max-w-[520px] mx-auto"
        style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      >
        {/* Card Title */}
        <h2 className="text-2xl font-semibold text-[#2C2C2C] mb-3">
          Lookup your reservation
        </h2>

        {/* Explanatory Text */}
        <p className="text-[15px] text-[#666] leading-relaxed mb-8">
          Enter your booking ID and email address to access your reservation. You'll be able to view details, modify your stay, or contact us with questions.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Booking ID Field */}
          <div>
            <label htmlFor="booking-id" className="block text-sm font-medium text-[#2C2C2C] mb-2">
              Booking ID
            </label>
            <input
              id="booking-id"
              type="text"
              placeholder="Your 9-character booking ID"
              value={bookingId}
              onChange={(e) => {
                setBookingId(e.target.value.toUpperCase());
                setError(null);
              }}
              maxLength={9}
              className="w-full h-12 px-3.5 bg-white border border-[#D5D5D5] rounded-md text-base text-[#2C2C2C] focus:outline-none focus:border-[#2D5F4F] focus:ring-2 focus:ring-[#2D5F4F]/20 transition-all duration-200"
              required
              aria-label="Booking ID - 9 characters"
            />
            <div className="relative mt-2">
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-xs text-[#2D5F4F] underline hover:text-[#255040] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] rounded"
                aria-label="Where do I find my booking ID?"
                aria-expanded={showTooltip}
              >
                Where do I find this?
              </button>
              
              {/* Tooltip */}
              {showTooltip && (
                <div
                  ref={tooltipRef}
                  className="absolute left-0 top-6 z-50 w-80 bg-white border border-[#E5E5E5] rounded-lg shadow-xl p-4 animate-fade-in"
                  role="tooltip"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#2C2C2C]">Finding Your Booking ID</h3>
                    <button
                      onClick={() => setShowTooltip(false)}
                      className="text-neutral-400 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] rounded"
                      aria-label="Close tooltip"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-[#666] mb-3 leading-relaxed">
                    Your booking ID is in the confirmation email we sent you. Look for a 9-character code near the top of the email.
                  </p>
                  <div className="bg-[#F8F6F3] border border-[#E5E8E5] rounded p-3 text-xs font-mono text-[#2C2C2C]">
                    Example: <span className="font-bold text-[#2D5F4F]">AB12CD34E</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="booking-email" className="block text-sm font-medium text-[#2C2C2C] mb-2">
              Email address
            </label>
            <input
              id="booking-email"
              type="email"
              placeholder="Email address from your confirmation"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="w-full h-12 px-3.5 bg-white border border-[#D5D5D5] rounded-md text-base text-[#2C2C2C] focus:outline-none focus:border-[#2D5F4F] focus:ring-2 focus:ring-[#2D5F4F]/20 transition-all duration-200"
              required
              aria-label="Email address used for booking"
            />
          </div>

          {/* Last Name Field */}
          <div>
            <label htmlFor="booking-lastname" className="block text-sm font-medium text-[#2C2C2C] mb-2">
              Last name <span className="text-[#666] font-normal">(optional)</span>
            </label>
            <input
              id="booking-lastname"
              type="text"
              placeholder="Enter your last name"
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setError(null);
              }}
              className="w-full h-12 px-3.5 bg-white border border-[#D5D5D5] rounded-md text-base text-[#2C2C2C] focus:outline-none focus:border-[#2D5F4F] focus:ring-2 focus:ring-[#2D5F4F]/20 transition-all duration-200"
              aria-label="Last name for added security (optional)"
            />
            <p className="text-xs text-neutral-500 mt-2">For added security</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full h-[52px] bg-[#2D5F4F] text-white rounded-lg font-semibold text-base shadow-lg hover:bg-[#255040] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] focus:ring-offset-2"
            aria-busy={status === 'loading'}
            aria-label={status === 'loading' ? 'Searching for your booking...' : 'Find my booking'}
          >
            {status === 'loading' ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Searching...
              </>
            ) : (
              'Find my booking'
            )}
          </button>
        </form>

        {/* Support Section */}
        <div className="mt-8 pt-6 border-t border-[#E5E5E5] -mx-8 md:-mx-10 px-8 md:px-10">
          <div className="flex items-center justify-center gap-2 text-sm text-[#666]">
            <HelpCircle className="w-5 h-5 text-[#2D5F4F]" aria-hidden="true" />
            <span>
              Can't find your booking?{' '}
              <a
                href="mailto:tellurideskihotels@gmail.com"
                className="text-[#2D5F4F] hover:text-[#255040] font-medium underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] rounded"
              >
                Contact support
              </a>
            </span>
          </div>
        </div>
      </div>

      {status === 'loading' && (
        <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600 shadow-sm max-w-[520px] mx-auto">
          Verifying booking details…
        </div>
      )}

      {status === 'success' && result && lastRequest && (
        <BookingDetails booking={result} credentials={lastRequest} onRefresh={refreshBooking} />
      )}

      {/* Tooltip Animation Styles */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

