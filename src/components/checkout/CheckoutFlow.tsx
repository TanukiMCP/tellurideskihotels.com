import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckoutPayment } from './CheckoutPayment';
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
    specialRequests: '',
  });

  const nights = calculateNights(room.checkIn, room.checkOut);
  const addonsTotal = addons.reduce((sum, addon) => sum + addon.price, 0);
  const total = room.price + addonsTotal;

  const handleGuestInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePaymentComplete = async (paymentIntentId: string) => {
    try {
      // Prebook
      const prebookResponse = await fetch('/api/booking/prebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotel_id: hotelId,
          rate_id: room.rateId,
          checkin: room.checkIn,
          checkout: room.checkOut,
          adults: room.adults,
          children: room.children || 0,
          guest_info: {
            first_name: guestInfo.firstName,
            last_name: guestInfo.lastName,
            email: guestInfo.email,
            phone: guestInfo.phone,
          },
          addons: addons.map((a) => ({
            addon_id: a.addonId,
            quantity: a.quantity,
          })),
        }),
      });

      if (!prebookResponse.ok) {
        throw new Error('Prebook failed');
      }

      const prebookData = await prebookResponse.json();

      // Confirm booking
      const confirmResponse = await fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prebook_id: prebookData.prebook_id,
          payment: {
            method: 'stripe',
            transaction_id: paymentIntentId,
          },
        }),
      });

      if (!confirmResponse.ok) {
        throw new Error('Booking confirmation failed');
      }

      const bookingData = await confirmResponse.json();
      onComplete(bookingData.booking_id);
    } catch (error) {
      console.error('Booking error:', error);
      alert('Booking failed. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step >= 1 ? 'text-turquoise-500' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-turquoise-500 text-white' : 'bg-gray-200'}`}>
              1
            </div>
            <span className="ml-2 font-medium">Guest Information</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4" />
          <div className={`flex items-center ${step >= 2 ? 'text-turquoise-500' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-turquoise-500 text-white' : 'bg-gray-200'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Payment</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Guest Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGuestInfoSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={guestInfo.firstName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, firstName: e.target.value })}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={guestInfo.lastName}
                      onChange={(e) => setGuestInfo({ ...guestInfo, lastName: e.target.value })}
                      required
                    />
                  </div>
                  <Input
                    type="email"
                    label="Email"
                    value={guestInfo.email}
                    onChange={(e) => setGuestInfo({ ...guestInfo, email: e.target.value })}
                    required
                  />
                  <Input
                    type="tel"
                    label="Phone"
                    value={guestInfo.phone}
                    onChange={(e) => setGuestInfo({ ...guestInfo, phone: e.target.value })}
                  />
                  <Input
                    label="Special Requests"
                    value={guestInfo.specialRequests}
                    onChange={(e) => setGuestInfo({ ...guestInfo, specialRequests: e.target.value })}
                    placeholder="Optional"
                  />
                  <Button type="submit" className="w-full" size="lg">
                    Continue to Payment
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <CheckoutPayment
              amount={total}
              currency={room.currency}
              onComplete={handlePaymentComplete}
            />
          )}
        </div>

        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{hotelName}</h4>
                <p className="text-sm text-gray-600">
                  {room.checkIn} - {room.checkOut}
                </p>
                <p className="text-sm text-gray-600">
                  {nights} night{nights !== 1 ? 's' : ''} • {room.adults} guest{room.adults !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room</span>
                  <span className="font-medium">{formatCurrency(room.price, room.currency)}</span>
                </div>
                {addons.length > 0 && (
                  <div className="space-y-1">
                    {addons.map((addon) => (
                      <div key={addon.addonId} className="flex justify-between text-sm">
                        <span className="text-gray-600">{addon.name} (x{addon.quantity})</span>
                        <span>{formatCurrency(addon.price, addon.currency)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total, room.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

