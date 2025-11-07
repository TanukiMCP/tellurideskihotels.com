import { l as listBookings } from '../../../chunks/booking_BbchjKJW.mjs';
import { g as getSessionFromRequest } from '../../../chunks/auth_DNlywQiV.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ request, url }) => {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const range = url.searchParams.get("range") || "30d";
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const endDate = /* @__PURE__ */ new Date();
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - days);
    const bookingsResponse = await listBookings();
    const allBookings = bookingsResponse.data || [];
    const bookingsInRange = allBookings.filter((booking) => {
      const bookingDate = new Date(booking.created_at || booking.checkin);
      return bookingDate >= startDate && bookingDate <= endDate;
    });
    const totalBookings = bookingsInRange.length;
    const totalRevenue = bookingsInRange.reduce(
      (sum, b) => sum + (b.total?.amount || 0),
      0
    );
    const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const hotelStats = /* @__PURE__ */ new Map();
    bookingsInRange.forEach((booking) => {
      const hotelId = booking.hotel_id;
      const hotelName = booking.hotel_name || "Unknown Hotel";
      const amount = booking.total?.amount || 0;
      if (hotelStats.has(hotelId)) {
        const stats = hotelStats.get(hotelId);
        stats.bookings += 1;
        stats.revenue += amount;
      } else {
        hotelStats.set(hotelId, {
          name: hotelName,
          bookings: 1,
          revenue: amount
        });
      }
    });
    const topHotels = Array.from(hotelStats.entries()).map(([hotelId, stats]) => ({ hotelId, ...stats })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const recentBookings = bookingsInRange.slice(0, 20).map((booking) => ({
      id: booking.booking_id,
      hotelName: booking.hotel_name || "Unknown",
      guestName: `${booking.guest_first_name || ""} ${booking.guest_last_name || ""}`.trim() || "Guest",
      checkIn: booking.checkin,
      amount: booking.total?.amount || 0,
      status: booking.status || "confirmed"
    }));
    const weeklyRevenue = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = /* @__PURE__ */ new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayBookings = bookingsInRange.filter((b) => {
        const bookingDate = new Date(b.created_at || b.checkin).toISOString().split("T")[0];
        return bookingDate === dateStr;
      });
      weeklyRevenue.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        revenue: dayBookings.reduce((sum, b) => sum + (b.total?.amount || 0), 0),
        bookings: dayBookings.length
      });
    }
    return new Response(
      JSON.stringify({
        totalBookings,
        totalRevenue,
        averageBookingValue,
        topHotels,
        recentBookings,
        weeklyRevenue
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("[Admin Stats] Error:", error);
    return new Response(
      JSON.stringify({
        totalBookings: 0,
        totalRevenue: 0,
        averageBookingValue: 0,
        topHotels: [],
        recentBookings: [],
        weeklyRevenue: []
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
