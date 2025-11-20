import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface AccountBooking {
  bookingId: string;
  status: string;
  hotelName?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  roomName?: string | null;
  boardName?: string | null;
  currency?: string | null;
  total?: number | null;
  confirmationNumber?: string | null;
  lastFreeCancellationDate?: string | null;
  createdAt: number;
}

const statusColorMap: Record<string, string> = {
  CONFIRMED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-rose-100 text-rose-800',
  CANCELLED_WITH_CHARGES: 'bg-amber-100 text-amber-800',
  UNAVAILABLE: 'bg-slate-100 text-slate-700',
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatCurrency(amount?: number | null, currency?: string | null) {
  if (amount == null || !currency) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function BookingCard({ booking }: { booking: AccountBooking }) {
  const statusClass =
    statusColorMap[booking.status] || 'bg-slate-100 text-slate-700';

  return (
    <Card className="shadow-sm border border-neutral-200 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-neutral-500">Booking ID</p>
          <p className="font-semibold text-neutral-900">{booking.bookingId}</p>
        </div>
        <Badge className={`${statusClass} border-0`}>
          {booking.status.replaceAll('_', ' ')}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Hotel
            </p>
            <p className="text-base font-medium text-neutral-900">
              {booking.hotelName || '—'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Check-in
            </p>
            <p className="text-base font-medium text-neutral-900">
              {formatDate(booking.checkIn)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Check-out
            </p>
            <p className="text-base font-medium text-neutral-900">
              {formatDate(booking.checkOut)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Room
            </p>
            <p className="text-base font-medium text-neutral-900">
              {booking.roomName || '—'}
            </p>
            {booking.boardName && (
              <p className="text-sm text-neutral-500">{booking.boardName}</p>
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Total
            </p>
            <p className="text-base font-semibold text-neutral-900">
              {formatCurrency(booking.total ?? undefined, booking.currency ?? undefined)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Free cancellation until
            </p>
            <p className="text-base font-medium text-neutral-900">
              {formatDate(booking.lastFreeCancellationDate)}
            </p>
          </div>
        </div>

        {booking.confirmationNumber && (
          <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-1">
              Confirmation Number
            </p>
            <p className="text-lg font-bold text-neutral-900">
              {booking.confirmationNumber}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() =>
              window.open(
                `/booking/confirmation/${booking.bookingId}`,
                '_blank'
              )
            }
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = `/find-booking?bookingId=${booking.bookingId}`}
            className="flex-1"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

