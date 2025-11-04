import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle } from 'lucide-react';

export interface BookingConfirmationProps {
  bookingId: string;
  confirmationNumber?: string;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
}

export function BookingConfirmation({
  bookingId,
  confirmationNumber,
  hotelName,
  checkIn,
  checkOut,
}: BookingConfirmationProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl">Booking Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {confirmationNumber && (
            <div>
              <p className="text-sm text-gray-600">Confirmation Number</p>
              <p className="text-2xl font-bold text-turquoise-500">{confirmationNumber}</p>
            </div>
          )}
          {bookingId && (
            <div>
              <p className="text-sm text-gray-600">Booking ID</p>
              <p className="text-lg font-mono">{bookingId}</p>
            </div>
          )}
          {hotelName && (
            <div>
              <p className="text-sm text-gray-600">Hotel</p>
              <p className="text-lg font-semibold">{hotelName}</p>
            </div>
          )}
          {checkIn && checkOut && (
            <div>
              <p className="text-sm text-gray-600">Dates</p>
              <p className="text-lg">
                {new Date(checkIn).toLocaleDateString()} - {new Date(checkOut).toLocaleDateString()}
              </p>
            </div>
          )}
          <div className="pt-4">
            <p className="text-sm text-gray-600 mb-4">
              A confirmation email has been sent to your email address.
            </p>
            <Button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/lodging';
                }
              }} 
              className="w-full"
            >
              Search More Hotels
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

