import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LiteAPIPayment } from './LiteAPIPayment';
import { formatCurrency, calculateNights } from '@/lib/utils';
import type { SelectedRoom, SelectedAddon, GuestInfo } from '@/lib/types';

export interface CheckoutFlowProps {
  hotelId: string;
  hotelName: string;
  room: SelectedRoom;
  addons?: SelectedAddon[];
  onComplete: (bookingId: string) => void;
}

export function CheckoutFlow({ hotelId, hotelName, room, addons = [], onComplete }: CheckoutFlowProps) {
  const [step, setStep] = useState(1);
  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const nights = calculateNights(room.checkIn, room.checkOut);
  const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  const total = room.price + addonsTotal;

  const [isProcessing, setIsProcessing] = useState(false);
  const [prebookData, setPrebookData] = useState<any>(null);
  
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
    try {
      const confirmResponse = await fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prebookId: prebookData.prebookId,
          holder: {
            firstName: guestInfo.firstName,
            lastName: guestInfo.lastName,
            email: guestInfo.email,
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

      if (!confirmResponse.ok) {
        const errorData = await confirmResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to confirm booking');
      }

      const bookingData = await confirmResponse.json();
      onComplete(bookingData.bookingId);
    } catch (error) {
      console.error('[Checkout] Booking error:', error);
      alert(error instanceof Error ? error.message : 'Booking failed');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {step === 1 && (
            <Card className="shadow-lg border-neutral-200">
              <CardHeader className="border-b border-neutral-100 bg-white pb-6">
                <CardTitle className="text-2xl">Guest Information</CardTitle>
                <p className="text-sm text-neutral-600 mt-2">Please provide your contact details for the reservation</p>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleGuestInfoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="First Name"
                      value={guestInfo.firstName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                      required
                      placeholder="Jackson"
                    />
                    <Input
                      label="Last Name"
                      value={guestInfo.lastName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                      required
                      placeholder="Null"
                    />
                  </div>
                  <Input
                    type="email"
                    label="Email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                    required
                    placeholder="your.email@example.com"
                  />
                  <Input
                    type="tel"
                    label="Phone"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                    required
                    placeholder="+1 (555) 123-4567"
                  />
                  <div className="pt-4">
                    <Button type="submit" className="w-full" size="lg">
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
              amount={prebookData.total}
              currency={prebookData.currency}
              returnUrl={typeof window !== 'undefined' ? `${window.location.origin}/booking/checkout?returnFromPayment=true` : '/booking/checkout?returnFromPayment=true'}
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
              <div className="space-y-3">
                <h4 className="font-bold text-lg text-neutral-900">{hotelName}</h4>
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

