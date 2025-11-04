import { LITEAPI_BASE_URL, LITEAPI_PUBLIC_KEY, LITEAPI_PRIVATE_KEY } from './config';

export class LiteAPIError extends Error {
  constructor(
    public status: number,
    public code?: string,
    message?: string
  ) {
    super(message || `LiteAPI error: ${status}`);
    this.name = 'LiteAPIError';
  }
}

export async function liteAPIClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${LITEAPI_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  headers.set('X-API-Key', LITEAPI_PRIVATE_KEY);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
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

