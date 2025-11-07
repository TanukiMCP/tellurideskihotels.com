import { l as listBookings } from '../../../chunks/booking_BbchjKJW.mjs';
import { g as getSessionFromRequest } from '../../../chunks/auth_DNlywQiV.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    const response = await listBookings();
    const bookings = response.data || [];
    return new Response(
      JSON.stringify({ bookings }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("[Admin Bookings] Error:", error);
    return new Response(
      JSON.stringify({ bookings: [] }),
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
