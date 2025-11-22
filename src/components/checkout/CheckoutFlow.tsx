import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LiteAPIPayment } from './LiteAPIPayment';
import { formatCurrency, calculateNights } from '@/lib/utils';
import type { SelectedRoom, SelectedAddon, GuestInfo } from '@/lib/types';
import { Shield, Mail, CheckCircle2, Info } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

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
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [identityMode, setIdentityMode] = useState<'account' | 'guest'>('guest');

  const nights = calculateNights(room.checkIn, room.checkOut);
  const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  const total = room.price + addonsTotal;

  const [isProcessing, setIsProcessing] = useState(false);
  const [prebookData, setPrebookData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    authClient
      .session()
      .then((data) => {
        if (!mounted) return;
        if (data?.user) {
          setSessionUser(data.user);
          setIdentityMode('account');
          setGuestInfo((prev) => {
            const [first = '', ...rest] = (data.user.name || '').split(' ');
            const last = rest.join(' ') || prev.lastName || '';
            return {
              ...prev,
              firstName: prev.firstName || first,
              lastName: prev.lastName || last || data.user.name || '',
              email: prev.email || data.user.email,
            };
          });
        } else {
          setIdentityMode('guest');
        }
      })
      .finally(() => {
        if (mounted) setSessionLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);
  
  // Restore prebookData from sessionStorage if returning from payment
  useEffect(() => {
    console.log('[Checkout] Component mounted, checking for payment redirect');
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tid = urlParams.get('tid');
      const pid = urlParams.get('pid');
      const returnFromPayment = urlParams.get('returnFromPayment');
      
      console.log('[Checkout] URL params:', { 
        tid, 
        pid, 
        returnFromPayment, 
        url: window.location.href,
        hasSessionData: !!sessionStorage.getItem('prebookData')
      });
      
      // Check if we're returning from payment (either returnFromPayment param or tid+pid)
      if (returnFromPayment || (tid && pid)) {
        console.log('[Checkout] ✓ Detected payment redirect return:', { tid, pid, returnFromPayment });
        const stored = sessionStorage.getItem('prebookData');
        const storedGuest = sessionStorage.getItem('guestInfo');
        
        if (stored) {
          try {
            const data = JSON.parse(stored);
            setPrebookData(data);
            setStep(2);
            console.log('[Checkout] ✓ Restored prebookData from sessionStorage:', data);
            
            // Also restore guest info
            if (storedGuest) {
              const guestData = JSON.parse(storedGuest);
              setGuestInfo(guestData);
              console.log('[Checkout] ✓ Restored guestInfo from sessionStorage');
            }
          } catch (e) {
            console.error('[Checkout] ❌ Failed to restore prebookData:', e);
          }
        } else {
          console.error('[Checkout] ❌ No prebookData in sessionStorage after payment redirect!');
          alert('Booking session lost. Please start over.');
        }
      } else {
        console.log('[Checkout] No payment redirect detected, starting fresh checkout');
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
    console.log('[Checkout] ========== PAYMENT COMPLETE HANDLER CALLED ==========');
    console.log('[Checkout] Transaction ID:', transactionId);
    
    setIsProcessing(true);
    
    // Get prebookData and guestInfo (might be from sessionStorage if redirected)
    const currentPrebookData = prebookData || (typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('prebookData') || '{}') : null);
    const currentGuestInfo = guestInfo.firstName ? guestInfo : (typeof window !== 'undefined' ? JSON.parse(sessionStorage.getItem('guestInfo') || '{}') : guestInfo);
    
    console.log('[Checkout] Current state:', {
      hasPrebookData: !!prebookData,
      hasCurrentPrebookData: !!currentPrebookData,
      prebookId: currentPrebookData?.prebookId,
      hasGuestInfo: !!currentGuestInfo,
      guestName: currentGuestInfo ? `${currentGuestInfo.firstName} ${currentGuestInfo.lastName}` : 'none',
    });
    
    if (!currentPrebookData?.prebookId) {
      console.error('[Checkout] ❌ Missing prebookData - Cannot confirm booking!', { 
        prebookData, 
        currentPrebookData,
        sessionStorageKeys: typeof window !== 'undefined' ? Object.keys(sessionStorage) : []
      });
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
      const confirmPayload = {
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
      };
      
      console.log('[Checkout] 📤 Calling booking confirm API:', {
        endpoint: '/api/booking/confirm',
        fullUrl: `${window.location.origin}/api/booking/confirm`,
        payload: confirmPayload,
      });
      
      const confirmResponse = await fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmPayload),
      });
      
      console.log('[Checkout] 📥 Confirm response received:', {
        status: confirmResponse.status,
        statusText: confirmResponse.statusText,
        ok: confirmResponse.ok,
      });

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json().catch(() => ({}));
        console.error('[Checkout] ❌ Booking confirmation failed:', errorData);
        throw new Error(errorData.error || 'Failed to confirm booking');
      }

      const bookingData = await confirmResponse.json();
      console.log('[Checkout] ✓ Booking confirmed successfully:', {
        bookingId: bookingData.bookingId,
        confirmationNumber: bookingData.confirmationNumber,
      });
      
      // Clean up sessionStorage
      if (typeof window !== 'undefined') {
        console.log('[Checkout] Cleaning up sessionStorage');
        sessionStorage.removeItem('prebookData');
        sessionStorage.removeItem('guestInfo');
      }
      
      console.log('[Checkout] 🎉 Booking confirmed! Redirecting to confirmation page...');
      console.log('[Checkout] Booking data:', {
        bookingId: bookingData.bookingId,
        confirmationNumber: bookingData.confirmationNumber,
        status: bookingData.status,
      });
      
      // Ensure we have a valid bookingId
      if (!bookingData.bookingId) {
        console.error('[Checkout] ❌ No bookingId in response!', bookingData);
        throw new Error('Booking confirmed but no booking ID received. Please contact support.');
      }
      
      // Clean up sessionStorage before redirect
      if (typeof window !== 'undefined') {
        console.log('[Checkout] Cleaning up sessionStorage before redirect');
        sessionStorage.removeItem('prebookData');
        sessionStorage.removeItem('guestInfo');
        
        // Clear URL params to prevent re-processing
        const cleanUrl = window.location.pathname.split('?')[0];
        window.history.replaceState({}, '', cleanUrl);
      }
      
      console.log('[Checkout] 🎉 Calling onComplete with bookingId:', bookingData.bookingId);
      onComplete(bookingData.bookingId);
    } catch (error) {
      console.error('[Checkout] ❌ Booking confirmation error:', error);
      console.error('[Checkout] Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      alert(error instanceof Error ? error.message : 'Booking failed. Please try again or contact support.');
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
        <div className="flex flex-col items-center justify-center max-w-2xl mx-auto">
          <div className="flex items-center justify-center w-full">
            <div className={`flex items-center transition-all ${step >= 1 ? 'text-[#2D5F4F]' : 'text-neutral-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg transition-all ${step >= 1 ? 'bg-[#2D5F4F] text-white shadow-lg' : 'bg-neutral-200'}`}>
                {step > 1 ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  '1'
                )}
              </div>
              <span className="ml-3 font-semibold text-base hidden sm:inline">Guest Information</span>
            </div>
            <div className={`flex-1 h-1 mx-6 transition-all ${step >= 2 ? 'bg-[#2D5F4F]' : 'bg-neutral-200'}`} />
            <div className={`flex items-center transition-all ${step >= 2 ? 'text-[#2D5F4F]' : 'text-neutral-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg transition-all ${step >= 2 ? 'bg-[#2D5F4F] text-white shadow-lg' : 'bg-neutral-200'}`}>
                2
              </div>
              <span className="ml-3 font-semibold text-base hidden sm:inline">Payment</span>
            </div>
          </div>
          {step === 2 && (
            <p className="text-sm text-[#666] mt-3 font-medium">Step 2 of 2 - Final Step</p>
          )}
        </div>
      </div>

      {step === 1 && sessionUser && (
        <div className="mb-8">
          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Signed in as</p>
                <p className="text-base font-semibold text-neutral-900">{sessionUser.email}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  await authClient.signOut();
                  window.location.reload();
                }}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {step === 1 && (
            <Card className="shadow-lg border-neutral-200">
              <CardHeader className="border-b border-neutral-100 bg-white pb-6">
                <CardTitle className="text-2xl">Guest Information</CardTitle>
                <p className="text-sm text-neutral-600 mt-2">Please provide your contact details for the reservation</p>
              </CardHeader>
              <CardContent className="pt-8">
                {/* Sign in link for account holders */}
                {!sessionUser && !sessionLoading && (
                  <div className="mb-8 text-center">
                    <p className="text-sm text-neutral-600">
                      Already have an account?{' '}
                      <a
                        href="/account/login?redirect=/booking/checkout"
                        className="text-[#2D5F4F] hover:text-[#255040] font-medium underline transition-colors"
                      >
                        Sign in
                      </a>
                    </p>
                  </div>
                )}

                <form onSubmit={handleGuestInfoSubmit} className="space-y-6" autoComplete="off">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={guestInfo.firstName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                      required
                      placeholder="Jackson"
                      autoComplete="given-name"
                      className="focus:border-[#2D5F4F] focus:ring-2 focus:ring-[#2D5F4F]/20"
                    />
                    <Input
                      label="Last Name"
                      value={guestInfo.lastName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                      required
                      placeholder="Null"
                      autoComplete="family-name"
                      className="focus:border-[#2D5F4F] focus:ring-2 focus:ring-[#2D5F4F]/20"
                    />
                  </div>
                  
                  <div>
                    <Input
                      type="email"
                      label="Email"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                      required
                      placeholder="your.email@example.com"
                      autoComplete="email"
                      className="focus:border-[#2D5F4F] focus:ring-2 focus:ring-[#2D5F4F]/20"
                    />
                    <p className="text-xs text-neutral-500 mt-2">We'll send your confirmation to this email</p>
                  </div>
                  
                  <div>
                    <Input
                      type="tel"
                      label="Phone"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                      required
                      placeholder="+1 (555) 123-4567"
                      autoComplete="tel"
                      className="focus:border-[#2D5F4F] focus:ring-2 focus:ring-[#2D5F4F]/20"
                    />
                    <p className="text-xs text-neutral-500 mt-2">For booking updates and hotel contact</p>
                  </div>

                  {/* Cancellation Policy */}
                  <div 
                    className="rounded-md p-4 border-l-[3px]"
                    style={{
                      backgroundColor: '#FEF9F5',
                      borderLeftColor: '#C87859',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#C87859' }} />
                      <div>
                        <h4 className="font-semibold mb-1" style={{ color: '#4A4A4A' }}>Cancellation Policy</h4>
                        <p className="text-sm leading-relaxed" style={{ color: '#4A4A4A' }}>
                          {room.cancellationPolicy?.refundableTag === 'RFND' 
                            ? 'Free cancellation up to 24 hours before check-in. Cancel before then for a full refund.'
                            : 'This rate is non-refundable. You will be charged the full amount upon booking.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      required
                      className="mt-1 h-5 w-5 border-neutral-300 focus:ring-2 focus:ring-[#2D5F4F]/20 transition-all duration-200 cursor-pointer"
                      style={{
                        accentColor: '#2D5F4F',
                        borderRadius: '3px',
                      }}
                    />
                    <label htmlFor="terms" className="text-sm text-neutral-700 leading-relaxed cursor-pointer">
                      I agree to the{' '}
                      <a 
                        href="/terms" 
                        target="_blank" 
                        className="text-[#2D5F4F] hover:text-[#2D5F4F]/80 font-medium underline transition-colors"
                      >
                        Terms of Service
                      </a>
                      {' '}and{' '}
                      <a 
                        href="/privacy" 
                        target="_blank" 
                        className="text-[#2D5F4F] hover:text-[#2D5F4F]/80 font-medium underline transition-colors"
                      >
                        Privacy Policy
                      </a>
                      . I understand the cancellation policy.
                    </label>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={!acceptedTerms || isProcessing}
                      className="w-full h-[52px] rounded-lg font-semibold text-base text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                      style={{
                        backgroundColor: '#2D5F4F',
                      }}
                      onMouseEnter={(e) => {
                        if (!e.currentTarget.disabled) {
                          e.currentTarget.style.backgroundColor = '#255040';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 95, 79, 0.2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2D5F4F';
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      {isProcessing ? 'Processing...' : 'Continue to Payment'}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 2 && prebookData && (
            <LiteAPIPayment
              secretKey={prebookData.secretKey}
              transactionId={prebookData.transactionId}
              amount={prebookData.total || total}
              currency={prebookData.currency || room.currency}
              prebookId={prebookData.prebookId}
              returnUrl={typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?returnFromPayment=true` : '/booking/checkout?returnFromPayment=true'}
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
                <div className="aspect-video w-full overflow-hidden rounded-xl" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                  <img 
                    src={hotelImage} 
                    alt={hotelName}
                    className="w-full h-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                    style={{
                      imageRendering: 'crisp-edges',
                    }}
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

