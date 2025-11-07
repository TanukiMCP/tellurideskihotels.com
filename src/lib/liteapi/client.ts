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

export interface StreamChunk {
  type: 'rates' | 'hotels' | 'done';
  data: any;
}

export type StreamCallback = (chunk: StreamChunk) => void | Promise<void>;

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

/**
 * Stream hotel rates from LiteAPI using Server-Sent Events (SSE)
 * Processes chunks as they arrive instead of waiting for the full response
 */
export async function liteAPIStreamClient(
  endpoint: string,
  options: RequestInit = {},
  onChunk: StreamCallback
): Promise<void> {
  const url = `${LITEAPI_BASE_URL}${endpoint}`;
  const startTime = Date.now();
  
  console.log('[LiteAPI Stream Client] Starting stream:', {
    endpoint: endpoint.split('?')[0],
    method: options.method || 'POST',
  });
  
  const headers = new Headers(options.headers);
  headers.set('X-API-Key', LITEAPI_PRIVATE_KEY);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'text/event-stream');

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData;
      let errorText = '';
      try {
        errorText = await response.text();
        errorData = errorText ? JSON.parse(errorText) : { error: { message: response.statusText } };
      } catch (parseError) {
        console.error('[LiteAPI Stream Client] Failed to parse error response:', {
          status: response.status,
          statusText: response.statusText,
          responseText: errorText.substring(0, 200),
        });
        errorData = { error: { message: response.statusText } };
      }
      
      console.error('[LiteAPI Stream Client] API Error:', {
        endpoint: endpoint.split('?')[0],
        status: response.status,
        error: errorData.error?.message,
      });
      
      throw new LiteAPIError(
        response.status,
        errorData.error?.code,
        errorData.error?.message || response.statusText
      );
    }

    if (!response.body) {
      throw new LiteAPIError(500, 'NO_BODY', 'Response body is null');
    }

    // Process the stream
    const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
    let messageBuffer = '';
    let chunkCount = 0;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      messageBuffer += value;
      
      // Split by double newlines (SSE format)
      const messages = messageBuffer.split('\n\n');
      
      // Process all complete messages, keep incomplete one in buffer
      for (let i = 0; i < messages.length - 1; i++) {
        const message = messages[i].trim();
        if (!message) continue;
        
        if (message.startsWith('data: ')) {
          const data = message.slice(6); // Remove "data: " prefix
          
          if (data === '[DONE]') {
            console.log('[LiteAPI Stream Client] Stream complete:', {
              endpoint: endpoint.split('?')[0],
              chunks: chunkCount,
              duration: `${Date.now() - startTime}ms`,
            });
            await onChunk({ type: 'done', data: null });
            return;
          }
          
          try {
            const jsonData = JSON.parse(data);
            chunkCount++;
            
            if (jsonData.rates) {
              await onChunk({ type: 'rates', data: jsonData.rates });
            } else if (jsonData.hotels) {
              await onChunk({ type: 'hotels', data: jsonData.hotels });
            }
          } catch (parseError) {
            console.error('[LiteAPI Stream Client] Failed to parse chunk:', {
              error: parseError instanceof Error ? parseError.message : 'Unknown error',
              data: data.substring(0, 200),
            });
          }
        }
      }
      
      // Keep the last incomplete message in buffer
      messageBuffer = messages[messages.length - 1];
    }
    
    console.log('[LiteAPI Stream Client] Stream ended:', {
      endpoint: endpoint.split('?')[0],
      chunks: chunkCount,
      duration: `${Date.now() - startTime}ms`,
    });
  } catch (error) {
    if (error instanceof LiteAPIError) {
      throw error;
    }
    
    console.error('[LiteAPI Stream Client] Stream Error:', {
      endpoint: endpoint.split('?')[0],
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${Date.now() - startTime}ms`,
    });
    
    throw new LiteAPIError(
      500,
      'STREAM_ERROR',
      error instanceof Error ? error.message : 'Stream processing failed'
    );
  }
}

