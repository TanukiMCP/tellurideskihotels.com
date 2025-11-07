import { L as LITEAPI_PRIVATE_KEY, c as LITEAPI_BASE_URL } from './config_CSQRX8el.mjs';

class LiteAPIError extends Error {
  constructor(status, code, message) {
    super(message || `LiteAPI error: ${status}`);
    this.status = status;
    this.code = code;
    this.name = "LiteAPIError";
  }
}
async function liteAPIClient(endpoint, options = {}) {
  const url = `${LITEAPI_BASE_URL}${endpoint}`;
  const startTime = Date.now();
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
      let errorData;
      let errorText = "";
      try {
        errorText = await response.text();
        errorData = errorText ? JSON.parse(errorText) : { error: { message: response.statusText } };
      } catch (parseError) {
        console.error("[LiteAPI Client] Failed to parse error response:", {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText.substring(0, 200)
        });
        errorData = { error: { message: response.statusText } };
      }
      console.error("[LiteAPI Client] API Error:", {
        endpoint: endpoint.split("?")[0],
        status: response.status,
        duration: `${duration}ms`,
        error: errorData.error?.message
      });
      throw new LiteAPIError(
        response.status,
        errorData.error?.code,
        errorData.error?.message || response.statusText
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof LiteAPIError) {
      throw error;
    }
    console.error("[LiteAPI Client] Network or Parse Error:", {
      endpoint: endpoint.split("?")[0],
      error: error instanceof Error ? error.message : "Unknown error",
      duration: `${Date.now() - startTime}ms`
    });
    throw new LiteAPIError(
      500,
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Network request failed"
    );
  }
}

export { liteAPIClient as l };
