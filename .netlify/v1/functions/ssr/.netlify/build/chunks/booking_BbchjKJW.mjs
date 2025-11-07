import { L as LITEAPI_PRIVATE_KEY, a as LITEAPI_BOOKING_BASE_URL } from './config_CSQRX8el.mjs';

class LiteAPIBookingError extends Error {
  constructor(status, code, message) {
    super(message || `LiteAPI Booking error: ${status}`);
    this.status = status;
    this.code = code;
    this.name = "LiteAPIBookingError";
  }
}
async function liteAPIBookingClient(endpoint, options = {}) {
  const url = `${LITEAPI_BOOKING_BASE_URL}${endpoint}`;
  const startTime = Date.now();
  console.log("[LiteAPI Booking] Request:", {
    endpoint: endpoint.split("?")[0],
    method: options.method || "GET"
  });
  const headers = new Headers(options.headers);
  headers.set("X-API-Key", LITEAPI_PRIVATE_KEY);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    const duration = Date.now() - startTime;
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error("[LiteAPI Booking] Error:", {
        endpoint: endpoint.split("?")[0],
        status: response.status,
        duration: `${duration}ms`,
        error: errorData.error?.message
      });
      throw new LiteAPIBookingError(
        response.status,
        errorData.error?.code,
        errorData.error?.message || response.statusText
      );
    }
    const data = await response.json();
    console.log("[LiteAPI Booking] Success:", {
      endpoint: endpoint.split("?")[0],
      duration: `${duration}ms`
    });
    return data;
  } catch (error) {
    if (error instanceof LiteAPIBookingError) {
      throw error;
    }
    throw new LiteAPIBookingError(
      500,
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Network request failed"
    );
  }
}

async function prebook(request) {
  return liteAPIBookingClient("/rates/prebook", {
    method: "POST",
    body: JSON.stringify(request)
  });
}
async function confirmBooking(request) {
  return liteAPIBookingClient("/rates/book", {
    method: "POST",
    body: JSON.stringify(request)
  });
}
async function getBooking(bookingId) {
  return liteAPIBookingClient(`/bookings/${bookingId}`, {
    method: "GET"
  });
}
async function listBookings() {
  return liteAPIBookingClient("/bookings", {
    method: "GET"
  });
}
async function cancelBooking(bookingId) {
  return liteAPIBookingClient(`/bookings/${bookingId}`, {
    method: "PUT",
    body: JSON.stringify({ status: "cancelled" })
  });
}

export { confirmBooking as a, cancelBooking as c, getBooking as g, listBookings as l, prebook as p };
