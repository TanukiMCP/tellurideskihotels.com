const LITEAPI_BASE_URL = "https://api.liteapi.travel/v3.0";
const LITEAPI_PRIVATE_KEY = "prod_b6b03dde-18d7-47cb-88ca-fc40347d02ab";
const LITEAPI_MARKUP_PERCENT = parseInt("15", 10);

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
  const headers = new Headers(options.headers);
  headers.set("X-API-Key", LITEAPI_PRIVATE_KEY);
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");
  const response = await fetch(url, {
    ...options,
    headers
  });
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { error: { message: response.statusText } };
    }
    throw new LiteAPIError(
      response.status,
      errorData.error?.code,
      errorData.error?.message || response.statusText
    );
  }
  return response.json();
}

export { LITEAPI_MARKUP_PERCENT as L, liteAPIClient as l };
