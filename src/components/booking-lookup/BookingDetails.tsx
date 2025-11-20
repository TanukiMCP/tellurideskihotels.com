import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface BookingLookupResult {
  bookingId: string;
  confirmationNumber?: string | null;
  status?: string | null;
  hotelName?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  roomName?: string | null;
  boardName?: string | null;
  total?: number | null;
  currency?: string | null;
  guests?: Array<{ firstName?: string; lastName?: string; email?: string }>;
  lastFreeCancellationDate?: string | null;
  holderFirstName?: string | null;
  holderLastName?: string | null;
  holderEmail?: string | null;
}

interface BookingDetailsProps {
  booking: BookingLookupResult;
  credentials: {
    bookingId: string;
    email: string;
    lastName?: string;
  };
  onRefresh?: () => Promise<void> | void;
}

const formatDate = (value?: string | null) => {
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
};

const formatCurrency = (amount?: number | null, currency?: string | null) => {
  if (amount == null || !currency) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export function BookingDetails({ booking, credentials, onRefresh }: BookingDetailsProps) {
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState(
    booking.holderFirstName || booking.guests?.[0]?.firstName || ''
  );
  const [lastName, setLastName] = useState(
    booking.holderLastName || booking.guests?.[0]?.lastName || ''
  );

  const runAction = async (payload: Record<string, unknown>, setter: (value: boolean) => void) => {
    setActionMessage(null);
    setActionError(null);
    setter(true);
    try {
      const response = await fetch('/api/booking/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.bookingId,
          email: credentials.email,
          lastName: credentials.lastName,
          ...payload,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Request failed');
      }

      setActionMessage(
        payload.action === 'cancel'
          ? 'Booking cancelled successfully.'
          : 'Guest details updated.'
      );

      await onRefresh?.();
      setEditMode(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setter(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this booking? This cannot be undone.')) return;
    await runAction({ action: 'cancel' }, setIsCancelling);
  };

  const handleUpdateGuest = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setActionError('First and last name are required.');
      return;
    }
    await runAction(
      {
        action: 'update-guest',
        firstName: firstName.trim(),
        newLastName: lastName.trim(),
      },
      setIsUpdating
    );
  };

  return (
    <Card className="border border-emerald-100 shadow-lg">
      <CardHeader>
        <p className="text-sm text-emerald-600 font-medium uppercase tracking-wide">
          Booking confirmed
        </p>
        <h3 className="text-2xl font-semibold text-neutral-900 mt-2">
          {booking.hotelName || 'Reservation details'}
        </h3>
        <p className="text-sm text-neutral-500 mt-1">
          Booking ID {booking.bookingId}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Confirmation number
            </p>
            <p className="text-lg font-medium text-neutral-900">
              {booking.confirmationNumber || 'Pending'}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Status
            </p>
            <p className="text-lg font-medium text-neutral-900">
              {booking.status || 'UNKNOWN'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Check-in
            </p>
            <p className="text-lg font-medium text-neutral-900">
              {formatDate(booking.checkIn)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Check-out
            </p>
            <p className="text-lg font-medium text-neutral-900">
              {formatDate(booking.checkOut)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Room
            </p>
            <p className="text-lg font-medium text-neutral-900">
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
            <p className="text-lg font-semibold text-neutral-900">
              {formatCurrency(booking.total ?? undefined, booking.currency ?? undefined)}
            </p>
          </div>
        </div>

        {booking.guests && booking.guests.length > 0 && (
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
              Guests
            </p>
            <ul className="space-y-1 text-neutral-800">
              {booking.guests.map((guest, idx) => (
                <li key={`${guest.email || idx}-${idx}`}>
                  {guest.firstName} {guest.lastName || ''}
                  {guest.email ? (
                    <span className="text-neutral-500 text-sm"> ({guest.email})</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-4">
          <p className="text-sm font-medium text-neutral-800">
            Free cancellation until
          </p>
          <p className="text-lg font-semibold text-neutral-900">
            {formatDate(booking.lastFreeCancellationDate)}
          </p>
        </div>

        {(actionMessage || actionError) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm ${
              actionMessage
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}
          >
            {actionMessage || actionError}
          </div>
        )}

        {booking.status?.toLowerCase() === 'confirmed' && (
          <div className="space-y-4 border-t border-neutral-200 pt-6">
            <div className="flex flex-wrap items-center gap-3 justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Manage booking</p>
                <p className="text-sm text-neutral-600">
                  Cancel or update the primary guest without calling support.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="border-rose-200 text-rose-700"
                  onClick={handleCancel}
                  isLoading={isCancelling}
                >
                  Cancel booking
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditMode((prev) => !prev)}
                >
                  {editMode ? 'Close form' : 'Update guest name'}
                </Button>
              </div>
            </div>

            {editMode && (
              <form
                onSubmit={handleUpdateGuest}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-50 border border-neutral-200 rounded-2xl p-4"
              >
                <Input
                  label="First name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                />
                <Input
                  label="Last name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                />
                <div className="md:col-span-2 flex justify-end">
                  <Button type="submit" isLoading={isUpdating}>
                    Save guest name
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

