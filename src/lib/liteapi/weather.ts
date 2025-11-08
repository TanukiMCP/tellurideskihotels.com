import { LITEAPI_BASE_URL, LITEAPI_PRIVATE_KEY } from './config';
import { TELLURIDE_CENTER } from '@/lib/mapbox-utils';

// Weather API Error class
class WeatherAPIError extends Error {
  constructor(
    public status: number,
    public code?: string,
    message?: string
  ) {
    super(message || `Weather API error: ${status}`);
    this.name = 'WeatherAPIError';
  }
}

// Dedicated weather API client that uses PUBLIC key
async function weatherAPIClient<T>(endpoint: string): Promise<T> {
  const url = `${LITEAPI_BASE_URL}${endpoint}`;
  const startTime = Date.now();
  
  console.log('[Weather API Client] Request:', {
    url,
    usingPrivateKey: true,
  });
  
  const headers = new Headers();
  headers.set('X-API-Key', LITEAPI_PRIVATE_KEY); // Weather endpoint requires PRIVATE key despite being a data endpoint
  headers.set('Accept', 'application/json');

  try {
    const response = await fetch(url, { headers });
    const duration = Date.now() - startTime;

    if (!response.ok) {
      let errorData;
      let errorText = '';
      try {
        errorText = await response.text();
        errorData = errorText ? JSON.parse(errorText) : { error: { message: response.statusText } };
      } catch (parseError) {
        errorData = { error: { message: response.statusText } };
      }
      
      console.error('[Weather API Client] Error:', {
        endpoint,
        fullUrl: url,
        status: response.status,
        duration: `${duration}ms`,
        errorData,
        responseText: errorText,
        headers: Object.fromEntries(response.headers.entries()),
      });
      
      throw new WeatherAPIError(
        response.status,
        errorData.error?.code,
        errorData.error?.message || response.statusText
      );
    }

    const data = await response.json();
    console.log('[Weather API Client] Success:', {
      endpoint: endpoint.split('?')[0],
      duration: `${duration}ms`,
    });

    return data;
  } catch (error) {
    if (error instanceof WeatherAPIError) {
      throw error;
    }
    throw new WeatherAPIError(
      500,
      'NETWORK_ERROR',
      error instanceof Error ? error.message : 'Network request failed'
    );
  }
}

// Actual liteAPI weather response structure from documentation
// https://docs.liteapi.travel/docs/weather-data-api-endpoint
export interface DailyWeatherData {
  date: string;
  units: 'metric' | 'imperial';
  cloud_cover: {
    afternoon: number;
  };
  humidity: {
    afternoon: number;
  };
  precipitation: {
    total: number;
  };
  temperature: {
    min: number;
    max: number;
    afternoon: number;
    night: number;
    evening: number;
    morning: number;
  };
  pressure: {
    afternoon: number;
  };
  wind: {
    max: {
      speed: number;
      direction: number;
    };
  };
}

// Actual API response structure (different from documentation!)
export interface DetailedDaily {
  date: string;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  wind_speed: number;
  wind_deg: number;
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  clouds: number;
  pop: number; // Probability of precipitation
  summary: string;
}

export interface DetailedWeatherData {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  daily: DetailedDaily[];
}

export interface WeatherData {
  detailedWeatherData: DetailedWeatherData;
}

export interface WeatherResponse {
  weatherData: WeatherData[];
}

export interface WeatherParams {
  latitude?: number;
  longitude?: number;
  startDate: string;
  endDate: string;
  units?: 'metric' | 'imperial';
}

export async function getWeather(params: WeatherParams): Promise<WeatherResponse> {
  const {
    latitude = TELLURIDE_CENTER[1], // 37.9375
    longitude = TELLURIDE_CENTER[0], // -107.8123
    startDate,
    endDate,
    units = 'imperial',
  } = params;

  console.log('[Weather API] Fetching weather:', {
    latitude,
    longitude,
    startDate,
    endDate,
    units,
  });

  // liteAPI weather API expects startDate/endDate in YYYY-MM-DD format
  const searchParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    startDate,
    endDate,
    units,
  });

  const endpoint = `/data/weather?${searchParams.toString()}`;
  console.log('[Weather API] Full endpoint:', endpoint);
  
  const response = await weatherAPIClient<WeatherResponse>(endpoint);
  console.log('[Weather API] Response received:', JSON.stringify(response, null, 2));
  console.log('[Weather API] Response structure check:', {
    hasWeatherData: !!response.weatherData,
    weatherDataLength: response.weatherData?.length,
    hasDetailedWeatherData: !!response.weatherData?.[0]?.detailedWeatherData,
    hasDaily: !!response.weatherData?.[0]?.detailedWeatherData?.daily,
    firstItem: response.weatherData?.[0],
  });
  
  return response;
}

// Utility functions updated for DetailedDaily structure
export function isSnowConditions(weather: DetailedDaily): boolean {
  const hasSnow = weather.weather.some(w => w.main === 'Snow' || w.description.includes('snow'));
  return hasSnow || (weather.pop >= 0.5 && weather.temp.max <= 32);
}

export function getWeatherIcon(weather: DetailedDaily): string {
  const mainWeather = weather.weather[0]?.main;
  
  switch (mainWeather) {
    case 'Snow':
      return '❄️';
    case 'Rain':
    case 'Drizzle':
      return '🌧️';
    case 'Clouds':
      return weather.clouds >= 70 ? '☁️' : '⛅';
    case 'Clear':
      return '☀️';
    case 'Thunderstorm':
      return '⛈️';
    case 'Mist':
    case 'Fog':
      return '🌫️';
    default:
      return weather.clouds >= 50 ? '☁️' : '☀️';
  }
}

export function getWeatherDescription(weather: DetailedDaily): string {
  if (weather.summary) {
    return weather.summary.replace(/^Date: \d{4}-\d{2}-\d{2}, Summary: /, '');
  }
  return weather.weather[0]?.description || 'Weather unavailable';
}

export function shouldHighlightIndoorAmenities(weatherData: WeatherData[]): boolean {
  if (!weatherData.length) return false;
  
  // Flatten all daily forecasts from all weather data items
  const allDaily = weatherData.flatMap(w => w.detailedWeatherData?.daily || []);
  if (!allDaily.length) return false;
  
  const avgPrecipitation = allDaily.reduce((sum, d) => sum + (d.pop || 0), 0) / allDaily.length;
  const avgCloudCover = allDaily.reduce((sum, d) => sum + (d.clouds || 0), 0) / allDaily.length;
  
  return avgPrecipitation >= 0.4 || avgCloudCover >= 70;
}

export function shouldHighlightOutdoorAmenities(weatherData: WeatherData[]): boolean {
  if (!weatherData.length) return false;
  
  // Flatten all daily forecasts from all weather data items
  const allDaily = weatherData.flatMap(w => w.detailedWeatherData?.daily || []);
  if (!allDaily.length) return false;
  
  const avgPrecipitation = allDaily.reduce((sum, d) => sum + (d.pop || 0), 0) / allDaily.length;
  const avgCloudCover = allDaily.reduce((sum, d) => sum + (d.clouds || 0), 0) / allDaily.length;
  
  return avgPrecipitation < 0.3 && avgCloudCover < 50;
}

export function shouldHighlightHeatedAmenities(weatherData: WeatherData[]): boolean {
  if (!weatherData.length) return false;
  
  // Flatten all daily forecasts from all weather data items
  const allDaily = weatherData.flatMap(w => w.detailedWeatherData?.daily || []);
  if (!allDaily.length) return false;
  
  const avgMinTemp = allDaily.reduce((sum, d) => sum + d.temp.min, 0) / allDaily.length;
  
  return avgMinTemp <= 15;
}

export function getPackingRecommendations(weatherData: WeatherData[]): string[] {
  if (!weatherData.length) return [];
  
  // Flatten all daily forecasts from all weather data items
  const allDaily = weatherData.flatMap(w => w.detailedWeatherData?.daily || []);
  if (!allDaily.length) return [];
  
  const recommendations: string[] = [];
  const avgMinTemp = allDaily.reduce((sum, d) => sum + d.temp.min, 0) / allDaily.length;
  const avgMaxTemp = allDaily.reduce((sum, d) => sum + d.temp.max, 0) / allDaily.length;
  const maxPrecipitation = Math.max(...allDaily.map(d => d.pop || 0));
  const maxWindSpeed = Math.max(...allDaily.map(d => d.wind_speed || 0));
  const hasSnow = allDaily.some(d => isSnowConditions(d));
  
  if (avgMinTemp <= 10) {
    recommendations.push('Pack heavy thermal layers and insulated gear');
  } else if (avgMinTemp <= 25) {
    recommendations.push('Bring warm base layers and mid-weight insulation');
  }
  
  if (maxPrecipitation >= 0.5) {
    recommendations.push('Waterproof outer layers essential');
  }
  
  if (hasSnow) {
    recommendations.push('Quality goggles and face protection recommended');
  }
  
  if (maxWindSpeed >= 20) {
    recommendations.push('Wind-resistant gear and face protection advised');
  }
  
  if (avgMaxTemp >= 35) {
    recommendations.push('Consider lighter layers for afternoon skiing');
  }
  
  return recommendations.slice(0, 5);
}

