import { l as liteAPIClient } from '../../../chunks/client_z1fk82NB.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const hotelId = url.searchParams.get("hotelId");
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);
    if (!hotelId) {
      return new Response(
        JSON.stringify({ error: "hotelId is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const params = new URLSearchParams({ hotelId });
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());
    const reviews = await liteAPIClient(`/data/reviews?${params.toString()}`, {
      method: "GET"
    });
    return new Response(JSON.stringify(reviews), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("[Hotel Reviews] Error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to fetch reviews",
        data: []
      }),
      {
        status: error.status || 500,
        headers: {
          "Content-Type": "application/json"
        }
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
