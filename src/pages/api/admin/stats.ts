import type { APIRoute } from 'astro';
import { liteAPIClient } from '@/lib/liteapi/client';
import { auth } from '@/lib/auth';

export const GET: APIRoute = async ({ request, url }) => {
  // Verify admin session
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const range = url.searchParams.get('range') || '30d';
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all bookings from LiteAPI
    const bookingsResponse = await liteAPIClient<any>('/bookings', {
      method: 'GET',
    });

    const allBookings = bookingsResponse.data || [];

    // Filter bookings by date range
    const bookingsInRange = allBookings.filter((booking: any) => {
      const bookingDate = new Date(booking.created_at || booking.checkin);
      return bookingDate >= startDate && bookingDate <= endDate;
    });

    // Calculate stats
    const totalBookings = bookingsInRange.length;
    const totalRevenue = bookingsInRange.reduce((sum: number, b: any) => 
      sum + (b.total?.amount || 0), 0
    );
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Top hotels
    const hotelStats = new Map<string, { name: string; bookings: number; revenue: number }>();
    bookingsInRange.forEach((booking: any) => {
      const hotelId = booking.hotel_id;
      const hotelName = booking.hotel_name || 'Unknown Hotel';
      const amount = booking.total?.amount || 0;

      if (hotelStats.has(hotelId)) {
        const stats = hotelStats.get(hotelId)!;
        stats.bookings += 1;
        stats.revenue += amount;
      } else {
        hotelStats.set(hotelId, {
          name: hotelName,
          bookings: 1,
          revenue: amount,
        });
      }
    });

    const topHotels = Array.from(hotelStats.entries())
      .map(([hotelId, stats]) => ({ hotelId, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Recent bookings
    const recentBookings = bookingsInRange
      .slice(0, 20)
      .map((booking: any) => ({
        id: booking.booking_id,
        hotelName: booking.hotel_name || 'Unknown',
        guestName: `${booking.guest_first_name || ''} ${booking.guest_last_name || ''}`.trim() || 'Guest',
        checkIn: booking.checkin,
        amount: booking.total?.amount || 0,
        status: booking.status || 'confirmed',
      }));

    // Weekly revenue for chart
    const weeklyRevenue: Array<{ date: string; revenue: number; bookings: number }> = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayBookings = bookingsInRange.filter((b: any) => {
        const bookingDate = new Date(b.created_at || b.checkin).toISOString().split('T')[0];
        return bookingDate === dateStr;
      });

      weeklyRevenue.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: dayBookings.reduce((sum: number, b: any) => sum + (b.total?.amount || 0), 0),
        bookings: dayBookings.length,
      });
    }

    return new Response(
      JSON.stringify({
        totalBookings,
        totalRevenue,
        averageBookingValue,
        topHotels,
        recentBookings,
        weeklyRevenue,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    
    // Return empty stats on error
    return new Response(
      JSON.stringify({
        totalBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0,
        topHotels: [],
        recentBookings: [],
        weeklyRevenue: [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

