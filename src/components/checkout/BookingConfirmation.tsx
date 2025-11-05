import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Calendar, Hotel, FileText } from 'lucide-react';

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
    <div className="max-w-3xl mx-auto">
      <Card className="border-2 border-primary-200 shadow-elevated">
        <CardHeader className="text-center bg-gradient-to-br from-primary-50 to-white border-b border-primary-100 pb-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center shadow-card">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-display-sm text-neutral-900 mb-2">Booking Confirmed!</CardTitle>
          <p className="text-lg text-neutral-600">Your reservation has been successfully completed</p>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          {confirmationNumber && (
            <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-primary-600" />
                <p className="text-sm font-semibold text-neutral-900">Confirmation Number</p>
              </div>
              <p className="text-3xl font-bold text-primary-600">{confirmationNumber}</p>
            </div>
          )}
          
          {bookingId && (
            <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-200">
              <p className="text-sm font-semibold text-neutral-900 mb-2">Booking ID</p>
              <p className="text-xl font-mono text-neutral-700">{bookingId}</p>
            </div>
          )}
          
          {hotelName && (
            <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-neutral-200">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Hotel className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-600 mb-1">Hotel</p>
                <p className="text-xl font-bold text-neutral-900">{hotelName}</p>
              </div>
            </div>
          )}
          
          {checkIn && checkOut && (
            <div className="flex items-start gap-4 p-6 bg-white rounded-xl border border-neutral-200">
              <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-accent-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-600 mb-1">Dates</p>
                <p className="text-lg font-bold text-neutral-900">
                  {new Date(checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' - '}
                  {new Date(checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
          
          <div className="bg-primary-50 rounded-xl p-6 border border-primary-200">
            <p className="text-sm text-neutral-700 text-center leading-relaxed">
              A confirmation email has been sent to your email address with all booking details and check-in information.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.print();
                }
              }} 
              variant="outline"
              className="flex-1"
            >
              Print Confirmation
            </Button>
            <Button 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/lodging';
                }
              }} 
              className="flex-1 bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:opacity-90 shadow-cta"
            >
              Search More Hotels
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
