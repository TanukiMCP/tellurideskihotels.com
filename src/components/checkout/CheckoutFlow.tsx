import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LiteAPIPayment } from './LiteAPIPayment';
import { formatCurrency, calculateNights } from '@/lib/utils';
import type { SelectedRoom, SelectedAddon, GuestInfo } from '@/lib/types';
import { Shield, Mail, CheckCircle2, Info } from 'lucide-react';

export interface CheckoutFlowProps {
  hotelId: string;
  hotelName: string;
  room: SelectedRoom;
  addons?: SelectedAddon[];
  onComplete: (bookingId: string) => void;
  hotelImage?: string;
  hotelAddress?: string;
}

export function CheckoutFlow({ hotelId, hotelName, room, addons = [], onComplete, hotelImage, hotelAddress }: CheckoutFlowProps) {
  const [step, setStep] = useState(1);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const nights = calculateNights(room.checkIn, room.checkOut);
  const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  const total = room.price + addonsTotal;

  const [isProcessing, setIsProcessing] = useState(false);
  const [prebookData, setPrebookData] = useState<any>(null);
  
  // Restore prebookData from sessionStorage if returning from payment
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tid = urlParams.get('tid');
      const pid = urlParams.get('pid');
      const returnFromPayment = urlParams.get('returnFromPayment');
      
      // Check if we're returning from payment (either returnFromPayment param or tid+pid)
      if (returnFromPayment || (tid && pid)) {
        console.log('[Checkout] Detected payment redirect return:', { tid, pid, returnFromPayment, url: window.location.href });
        const stored = sessionStorage.getItem('prebookData');
        if (stored) {
          try {
            const data = JSON.parse(stored);
            setPrebookData(data);
            setStep(2);
            console.log('[Checkout] Restored prebookData from sessionStorage:', data);
          } catch (e) {
            console.error('[Checkout] Failed to restore prebookData:', e);
          }
        } else {
          console.warn('[Checkout] No prebookData in sessionStorage, user may need to restart booking');
        }
      }
    }
  }, []);
  
  // First, do prebook when moving to payment step
  const handleGuestInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const prebookResponse = await fetch('/api/booking/prebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId: room.offerId }),
      });

      if (!prebookResponse.ok) {
        const errorData = await prebookResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to reserve room');
      }

      const data = await prebookResponse.json();
      setPrebookData(data);
      
      // Store in sessionStorage for payment redirect recovery
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('prebookData', JSON.stringify(data));
        sessionStorage.setItem('guestInfo', JSON.stringify(guestInfo));
      }
      
      setStep(2);
      setIsProcessing(false);
    } catch (error) {
      console.error('[Checkout] Prebook error:', error);
      alert(error instanceof Error ? error.message : 'Failed to reserve room');
      setIsProcessing(false);
    }
  };
  
  const handlePaymentComplete = async (transactionId: string) => {
    setIsProcessing(true);
    
    // Get prebookData and guestInfo (might be from sessionStorage if redirected)
    const currentPrebookData = prebookData || (typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('prebookData') || '{}') : null);
    const currentGuestInfo = guestInfo.firstName ? guestInfo : (typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('guestInfo') || '{}') : guestInfo);
    
    if (!currentPrebookData?.prebookId) {
      console.error('[Checkout] Missing prebookData:', { prebookData, currentPrebookData });
      alert('Booking session expired. Please start over.');
      setIsProcessing(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('prebookData');
        sessionStorage.removeItem('guestInfo');
        window.location.href = window.location.pathname.split('?')[0];
      }
      return;
    }
    
    try {
      console.log('[Checkout] Confirming booking:', {
        prebookId: currentPrebookData.prebookId,
        transactionId,
        guestInfo: currentGuestInfo,
        endpoint: '/api/booking/confirm',
        fullUrl: `${window.location.origin}/api/booking/confirm`,
      });
      
      const confirmResponse = await fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prebookId: currentPrebookData.prebookId,
          holder: {
            firstName: currentGuestInfo.firstName,
            lastName: currentGuestInfo.lastName,
            email: currentGuestInfo.email,
          },
          payment: {
            method: 'TRANSACTION_ID',
            transactionId,
          },
          hotelName,
          roomName: room.roomName,
          adults: room.adults,
          children: room.children,
        }),
      });
      
      console.log('[Checkout] Confirm response status:', confirmResponse.status, confirmResponse.statusText);

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to confirm booking');
      }

      const bookingData = await confirmResponse.json();
      
      // Clean up sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('prebookData');
        sessionStorage.removeItem('guestInfo');
      }
      
      onComplete(bookingData.bookingId);
    } catch (error) {
      console.error('[Checkout] Booking error:', error);
      alert(error instanceof Error ? error.message : 'Booking failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Branded Header */}
      <div className="mb-8 pb-6 border-b border-neutral-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/favicon-icon.png" 
              alt="Telluride Ski Hotels" 
              className="h-12 w-auto"
            />
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Secure Checkout</h1>
              <p className="text-sm text-neutral-600 mt-1">Complete your booking with TellurideSkiHotels.com</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-neutral-600">
            <a href="mailto:tellurideskihotels@gmail.com" className="flex items-center gap-2 hover:text-primary-600 transition-colors">
              <Mail className="w-4 h-4" />
              <span className="font-medium">Need Help?</span>
            </a>
          </div>
        </div>
      </div>

      {/* Trust Badges - Only show on step 1 (Guest Information) */}
      {step === 1 && (
        <div className="mb-8 bg-primary-50 border border-primary-200 rounded-xl p-4">
          <div className="flex items-center justify-center gap-8 flex-wrap text-sm">
            <div className="flex items-center gap-2 text-primary-900">
              <Shield className="w-5 h-5" />
              <span className="font-semibold">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 text-primary-900">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-2 text-primary-900">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Best Price Guarantee</span>
            </div>
            <div className="flex items-center gap-2 text-primary-900">
              <Mail className="w-5 h-5" />
              <span className="font-semibold">Email Support</span>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-10 max-w-md mx-4 text-center shadow-2xl">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-3">Processing Your Booking</h3>
            <p className="text-neutral-600 text-lg">Please wait while we confirm your reservation...</p>
          </div>
        </div>
      )}
      
      <div className="mb-10">
        <div className="flex items-center justify-center max-w-2xl mx-auto">
          <div className={`flex items-center transition-all ${step >= 1 ? 'text-primary-600' : 'text-neutral-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg transition-all ${step >= 1 ? 'bg-primary-600 text-white shadow-lg' : 'bg-neutral-200'}`}>
              1
            </div>
            <span className="ml-3 font-semibold text-base hidden sm:inline">Guest Information</span>
          </div>
          <div className={`flex-1 h-1 mx-6 transition-all ${step >= 2 ? 'bg-primary-600' : 'bg-neutral-200'}`} />
          <div className={`flex items-center transition-all ${step >= 2 ? 'text-primary-600' : 'text-neutral-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg transition-all ${step >= 2 ? 'bg-primary-600 text-white shadow-lg' : 'bg-neutral-200'}`}>
              2
            </div>
            <span className="ml-3 font-semibold text-base hidden sm:inline">Payment</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 1 && (
            <Card className="shadow-lg border-neutral-200">
              <CardHeader className="border-b border-neutral-100 bg-white pb-6">
                <CardTitle className="text-2xl">Guest Information</CardTitle>
                <p className="text-sm text-neutral-600 mt-2">Please provide your contact details for the reservation</p>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleGuestInfoSubmit} className="space-y-6" autoComplete="off">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="First Name"
                      value={guestInfo.firstName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                      required
                      placeholder="Jackson"
                      autoComplete="given-name"
                    />
                    <Input
                      label="Last Name"
                      value={guestInfo.lastName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                      required
                      placeholder="Null"
                      autoComplete="family-name"
                    />
                  </div>
                  <Input
                    type="email"
                    label="Email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                    required
                    placeholder="your.email@example.com"
                    autoComplete="email"
                  />
                  <p className="text-xs text-neutral-500">We'll send your confirmation to this email</p>
                  
                  <Input
                    type="tel"
                    label="Phone"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                    required
                    placeholder="+1 (555) 123-4567"
                    autoComplete="tel"
                  />
                  <p className="text-xs text-neutral-500">For booking updates and hotel contact</p>

                  {/* Cancellation Policy */}
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-900 mb-1">Cancellation Policy</h4>
                        <p className="text-sm text-amber-800 leading-relaxed">
                          {room.cancellationPolicy?.refundableTag === 'RFND' 
                            ? 'Free cancellation up to 24 hours before check-in. Cancel before then for a full refund.'
                            : 'This rate is non-refundable. You will be charged the full amount upon booking.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-xl">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      required
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <label htmlFor="terms" className="text-sm text-neutral-700">
                      I agree to the{' '}
                      <a href="/terms" target="_blank" className="text-primary-600 hover:text-primary-700 font-semibold underline">
                        Terms of Service
                      </a>
                      {' '}and{' '}
                      <a href="/privacy" target="_blank" className="text-primary-600 hover:text-primary-700 font-semibold underline">
                        Privacy Policy
                      </a>
                      . I understand the cancellation policy and authorize payment.
                    </label>
                  </div>

                  <div className="pt-4">
                    <Button type="submit" className="w-full" size="lg" disabled={!acceptedTerms}>
                      Continue to Payment
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 2 && prebookData && (
            <LiteAPIPayment
              secretKey={prebookData.secretKey}
              transactionId={prebookData.transactionId}
              amount={prebookData.total || room.price}
              currency={prebookData.currency || room.currency}
              prebookId={prebookData.prebookId}
              returnUrl={typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?returnFromPayment=true&tid=${prebookData.transactionId}&pid=${prebookData.prebookId}` : '/booking/checkout?returnFromPayment=true'}
              onPaymentSuccess={handlePaymentComplete}
            />
          )}
        </div>

        <div>
          <Card className="sticky top-4 shadow-lg border-neutral-200">
            <CardHeader className="border-b border-neutral-100 bg-neutral-50 pb-6">
              <CardTitle className="text-xl">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Hotel Image */}
              {hotelImage && (
                <div className="aspect-video w-full overflow-hidden rounded-xl">
                  <img 
                    src={hotelImage} 
                    alt={hotelName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-3">
                <h4 className="font-bold text-lg text-neutral-900">{hotelName}</h4>
                {hotelAddress && (
                  <p className="text-sm text-neutral-600">{hotelAddress}</p>
                )}
                <div className="bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
                  <p className="text-sm font-semibold text-primary-900">{room.roomName}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-neutral-700">
                    <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{room.checkIn}</span>
                    <span className="mx-2">→</span>
                    <span className="font-medium">{room.checkOut}</span>
                  </div>
                  <div className="flex items-center text-sm text-neutral-700">
                    <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <span>{nights} night{nights !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center text-sm text-neutral-700">
                    <svg className="w-4 h-4 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>{room.adults} guest{room.adults !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-neutral-200 pt-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-700">Room Rate</span>
                  <span className="font-semibold text-neutral-900">{formatCurrency(room.price, room.currency)}</span>
                </div>
                {addons.length > 0 && (
                  <div className="space-y-2">
                    {addons.map((addon) => (
                      <div key={addon.addonId} className="flex justify-between items-center text-sm">
                        <span className="text-neutral-700">{addon.name} (×{addon.quantity})</span>
                        <span className="font-medium text-neutral-900">{formatCurrency(addon.price, addon.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="border-t-2 border-neutral-300 pt-4 bg-neutral-50 -mx-6 px-6 py-4 rounded-b-xl">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-neutral-900">Total</span>
                  <span className="text-2xl font-bold text-primary-700">{formatCurrency(total, room.currency)}</span>
                </div>
                <p className="text-xs text-neutral-600 mt-2 text-center">All taxes and fees included</p>
              </div>

              {/* Support Contact */}
              <div className="border-t border-neutral-200 pt-4 -mx-6 px-6">
                <h5 className="font-semibold text-neutral-900 mb-3 text-sm">Need Assistance?</h5>
                <div className="space-y-2 text-sm">
                  <a href="mailto:tellurideskihotels@gmail.com" className="flex items-center gap-2 text-neutral-700 hover:text-primary-600 transition-colors">
                    <Mail className="w-4 h-4" />
                    <span>tellurideskihotels@gmail.com</span>
                  </a>
                  <p className="text-xs text-neutral-500 mt-2">We typically respond within 24 hours</p>
                </div>
                <div className="mt-4 pt-4 border-t border-neutral-100">
                  <div className="flex items-center gap-2 text-primary-700">
                    <Shield className="w-5 h-5" />
                    <span className="text-xs font-semibold">Your information is secure & encrypted</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}

