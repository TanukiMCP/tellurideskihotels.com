import { LITEAPI_BASE_URL, LITEAPI_PRIVATE_KEY } from './config';

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
  const startTime = Date.now();
  
  // Disabled verbose logging to reduce log noise
  // console.log('[LiteAPI Client] Request:', {
  //   endpoint: endpoint.split('?')[0],
  //   method: options.method || 'GET',
  //   hasParams: endpoint.includes('?'),
  // });
  
  const headers = new Headers(options.headers);
  headers.set('X-API-Key', LITEAPI_PRIVATE_KEY);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      let errorData;
      let errorText = '';
      try {
        errorText = await response.text();
        errorData = errorText ? JSON.parse(errorText) : { error: { message: response.statusText } };
      } catch (parseError) {
        console.error('[LiteAPI Client] Failed to parse error response:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText.substring(0, 200),
        });
        errorData = { error: { message: response.statusText } };
      }
      
      console.error('[LiteAPI Client] API Error:', {
        endpoint: endpoint.split('?')[0],
        status: response.status,
        duration: `${duration}ms`,
        error: errorData.error?.message,
      });
      
      throw new LiteAPIError(
        response.status,
        errorData.error?.code,
        errorData.error?.message || response.statusText
      );
    }

    const data = await response.json();
    
    // Disabled verbose logging to reduce log noise
    // console.log('[LiteAPI Client] Success:', {
    //   endpoint: endpoint.split('?')[0],
    //   duration: `${duration}ms`,
    //   dataSize: JSON.stringify(data).length + ' bytes',
    // });

    return data;
  } catch (error) {
    if (error instanceof LiteAPIError) {
      throw error;
    }
    
    console.error('[LiteAPI Client] Network or Parse Error:', {
      endpoint: endpoint.split('?')[0],
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${Date.now() - startTime}ms`,
    });
    
    throw new LiteAPIError(
      500,
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network request failed'
    );
  }
}

