import { useState, useEffect } from 'react';
import { Card } from '@tremor/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Search,
  Hotel, 
  LogOut,
  Mail,
  DollarSign,
  X,
  Download
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { formatCurrency } from '@/lib/utils';

interface Booking {
  booking_id: string;
  confirmation_number?: string;
  hotel_id: string;
  hotel_name?: string;
  checkin: string;
  checkout: string;
  guest_first_name?: string;
  guest_last_name?: string;
  guest_email?: string;
  guest_phone?: string;
  adults: number;
  children?: number;
  total?: { amount: number; currency: string };
  status: string;
  created_at?: string;
}

export function AdminBookings({ user }: { user?: any }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/bookings');
      if (response.ok) {
        const data = await response.json();
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Booking cancelled successfully');
        fetchBookings();
        setSelectedBooking(null);
      } else {
        alert('Failed to cancel booking');
      }
    } catch (error) {
      alert('Error cancelling booking');
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/admin/login';
  };

  const filteredBookings = bookings.filter(booking => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      booking.booking_id.toLowerCase().includes(query) ||
      booking.confirmation_number?.toLowerCase().includes(query) ||
      booking.hotel_name?.toLowerCase().includes(query) ||
      booking.guest_email?.toLowerCase().includes(query) ||
      `${booking.guest_first_name} ${booking.guest_last_name}`.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <a href="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
                  <Hotel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-neutral-900">Telluride Ski Hotels</h1>
                  <p className="text-xs text-neutral-500">Booking Management</p>
                </div>
              </a>
              <nav className="flex gap-4">
                <a href="/admin" className="text-sm text-neutral-600 hover:text-neutral-900 font-medium">
                  Dashboard
                </a>
                <a href="/admin/bookings" className="text-sm text-primary-600 font-semibold border-b-2 border-primary-600">
                  Bookings
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">{user?.email}</p>
                <p className="text-xs text-neutral-500">Administrator</p>
              </div>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neutral-900">All Bookings</h2>
          <div className="flex gap-3">
            <Button onClick={fetchBookings} variant="outline" size="sm">
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by booking ID, guest name, email, or hotel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Booking
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Hotel
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                        {searchQuery ? 'No bookings match your search' : 'No bookings yet'}
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.booking_id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-semibold text-neutral-900">
                            #{booking.confirmation_number || booking.booking_id.slice(0, 8)}
                          </div>
                          {booking.created_at && (
                            <div className="text-xs text-neutral-500">
                              {new Date(booking.created_at).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-neutral-900">
                            {booking.guest_first_name} {booking.guest_last_name}
                          </div>
                          {booking.guest_email && (
                            <div className="text-xs text-neutral-500">{booking.guest_email}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-neutral-900">{booking.hotel_name || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900">
                            {new Date(booking.checkin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {' - '}
                            {new Date(booking.checkout).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {booking.adults} {booking.adults === 1 ? 'adult' : 'adults'}
                            {booking.children ? `, ${booking.children} ${booking.children === 1 ? 'child' : 'children'}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-neutral-900">
                            {formatCurrency(booking.total?.amount || 0, booking.total?.currency || 'USD')}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Button
                            onClick={() => setSelectedBooking(booking)}
                            variant="outline"
                            size="sm"
                          >
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </main>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-neutral-900">Booking Details</h3>
                <p className="text-sm text-neutral-500 mt-1">
                  #{selectedBooking.confirmation_number || selectedBooking.booking_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Guest Information */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary-600" />
                  Guest Information
                </h4>
                <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500">Name</p>
                      <p className="font-medium text-neutral-900">
                        {selectedBooking.guest_first_name} {selectedBooking.guest_last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Email</p>
                      <p className="font-medium text-neutral-900">{selectedBooking.guest_email}</p>
                    </div>
                    {selectedBooking.guest_phone && (
                      <div>
                        <p className="text-xs text-neutral-500">Phone</p>
                        <p className="font-medium text-neutral-900">{selectedBooking.guest_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Hotel & Dates */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <Hotel className="w-5 h-5 text-primary-600" />
                  Reservation Details
                </h4>
                <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-neutral-500">Hotel</p>
                    <p className="font-medium text-neutral-900">{selectedBooking.hotel_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500">Check-in</p>
                      <p className="font-medium text-neutral-900">
                        {new Date(selectedBooking.checkin).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Check-out</p>
                      <p className="font-medium text-neutral-900">
                        {new Date(selectedBooking.checkout).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-neutral-500">Adults</p>
                      <p className="font-medium text-neutral-900">{selectedBooking.adults}</p>
                    </div>
                    {selectedBooking.children !== undefined && selectedBooking.children > 0 && (
                      <div>
                        <p className="text-xs text-neutral-500">Children</p>
                        <p className="font-medium text-neutral-900">{selectedBooking.children}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h4 className="font-semibold text-neutral-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary-600" />
                  Payment
                </h4>
                <div className="bg-neutral-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Total Amount</span>
                    <span className="text-2xl font-bold text-neutral-900">
                      {formatCurrency(selectedBooking.total?.amount || 0, selectedBooking.total?.currency || 'USD')}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Status</span>
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedBooking.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedBooking.status === 'confirmed' && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleCancelBooking(selectedBooking.booking_id)}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Cancel Booking
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Contact Guest
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

