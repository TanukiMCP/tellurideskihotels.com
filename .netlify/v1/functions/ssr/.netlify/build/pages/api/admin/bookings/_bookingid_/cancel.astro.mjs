import { c as cancelBooking } from '../../../../../chunks/booking_BbchjKJW.mjs';
import { g as getSessionFromRequest } from '../../../../../chunks/auth_DNlywQiV.mjs';
export { renderers } from '../../../../../renderers.mjs';

const prerender = false;
const POST = async ({ params, request }) => {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  const { bookingId } = params;
  if (!bookingId) {
    return new Response(
      JSON.stringify({ error: "Booking ID required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const result = await cancelBooking(bookingId);
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("[Admin Cancel Booking] Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to cancel booking"
      }),
      {
        status: error.status || 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
