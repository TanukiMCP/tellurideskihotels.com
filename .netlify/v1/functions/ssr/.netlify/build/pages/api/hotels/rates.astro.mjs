import { searchRates } from '../../../chunks/rates_CzGC_MKG.mjs';
export { renderers } from '../../../renderers.mjs';

const prerender = false;
const GET = async ({ request }) => {
  try {
    const url = new URL(request.url);
    console.log("[API /hotels/rates] Raw URL:", request.url);
    console.log("[API /hotels/rates] Parsed URL:", url.toString());
    console.log("[API /hotels/rates] Search params:", {
      hotelId: url.searchParams.get("hotelId"),
      checkIn: url.searchParams.get("checkIn"),
      checkOut: url.searchParams.get("checkOut"),
      adults: url.searchParams.get("adults"),
      children: url.searchParams.get("children"),
      rooms: url.searchParams.get("rooms"),
      allParams: Object.fromEntries(url.searchParams.entries())
    });
    const hotelId = url.searchParams.get("hotelId");
    const checkIn = url.searchParams.get("checkIn");
    const checkOut = url.searchParams.get("checkOut");
    const adults = parseInt(url.searchParams.get("adults") || "2", 10);
    const children = parseInt(url.searchParams.get("children") || "0", 10);
    const rooms = parseInt(url.searchParams.get("rooms") || "1", 10);
    if (!hotelId || !checkIn || !checkOut) {
      console.error("[API /hotels/rates] Missing required params:", {
        hotelId: !!hotelId,
        checkIn: !!checkIn,
        checkOut: !!checkOut
      });
      return new Response(
        JSON.stringify({ error: "hotelId, checkIn, and checkOut are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    console.log("[API /hotels/rates] Request:", {
      hotelId,
      checkIn,
      checkOut,
      adults,
      children,
      rooms
    });
    const result = await searchRates({
      hotelIds: hotelId,
      checkIn,
      checkOut,
      adults,
      children,
      rooms
    });
    console.log("[API /hotels/rates] searchRates returned:", {
      hasData: !!result.data,
      dataLength: result.data?.length || 0,
      sampleHotel: result.data?.[0],
      sampleRooms: result.data?.[0]?.rooms
    });
    const rates = [];
    if (result.data && Array.isArray(result.data)) {
      for (const hotel of result.data) {
        if (hotel.rooms && Array.isArray(hotel.rooms)) {
          for (const room of hotel.rooms) {
            if (room.rates && Array.isArray(room.rates)) {
              rates.push(...room.rates);
            }
          }
        }
      }
    }
    console.log("[API /hotels/rates] After transformation:", {
      totalRates: rates.length,
      sampleRate: rates[0],
      sampleRateKeys: rates[0] ? Object.keys(rates[0]) : []
    });
    return new Response(JSON.stringify({ rates }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=600"
        // Cache 5min client, 10min CDN
      }
    });
  } catch (error) {
    console.error("Rate search error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to search rates"
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
