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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-neutral-500">
            Confirmation: {booking.confirmationNumber || 'Pending'}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  `/booking/confirmation/${booking.bookingId}`,
                  '_blank'
                )
              }
            >
              View Confirmation
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

