import { liteAPIClient } from './client';
import { TELLURIDE_CENTER } from '@/lib/mapbox-utils';

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

export interface WeatherData {
  dailyWeather: DailyWeatherData;
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

  const searchParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    startDate,
    endDate,
    units,
  });

  const endpoint = `/data/weather?${searchParams.toString()}`;
  console.log('[Weather API] Full endpoint:', endpoint);
  
  const response = await liteAPIClient<WeatherResponse>(endpoint);
  console.log('[Weather API] Response received:', JSON.stringify(response, null, 2));
  console.log('[Weather API] Response structure check:', {
    hasWeatherData: !!response.weatherData,
    weatherDataLength: response.weatherData?.length,
    hasDetailedWeatherData: !!response.weatherData?.[0]?.detailedWeatherData,
    hasDaily: !!response.weatherData?.[0]?.detailedWeatherData?.daily,
    dailyLength: response.weatherData?.[0]?.detailedWeatherData?.daily?.length,
  });
  
  return response;
}

export function isSnowConditions(weather: DailyWeatherData): boolean {
  // Precipitation > 0.5 and temp below freezing
  return weather.temperature.max <= 32 && weather.precipitation.total >= 0.5;
}

export function getWeatherIcon(weather: DailyWeatherData): string {
  const precipitation = weather.precipitation.total;
  const cloudCover = weather.cloud_cover.afternoon;
  const temp = weather.temperature.max;
  
  // High precipitation
  if (precipitation >= 0.5) {
    return temp <= 32 ? '❄️' : '🌧️';
  }
  
  // Cloud cover based
  if (cloudCover >= 70) {
    return '☁️';
  }
  
  if (cloudCover >= 30) {
    return '⛅';
  }
  
  return '☀️';
}

export function getWeatherDescription(weather: DailyWeatherData): string {
  const precipitation = weather.precipitation.total;
  const cloudCover = weather.cloud_cover.afternoon;
  const temp = weather.temperature.max;
  
  if (precipitation >= 0.5 && temp <= 32) {
    return 'Snow expected';
  }
  
  if (precipitation >= 0.5) {
    return 'Rain expected';
  }
  
  if (cloudCover >= 70) {
    return 'Cloudy';
  }
  
  if (cloudCover >= 30) {
    return 'Partly cloudy';
  }
  
  return 'Clear';
}

export function shouldHighlightIndoorAmenities(weatherData: WeatherData[]): boolean {
  if (!weatherData.length) return false;
  
  const avgPrecipitation = weatherData.reduce((sum, w) => sum + w.dailyWeather.precipitation.total, 0) / weatherData.length;
  const avgCloudCover = weatherData.reduce((sum, w) => sum + w.dailyWeather.cloud_cover.afternoon, 0) / weatherData.length;
  
  return avgPrecipitation >= 0.4 || avgCloudCover >= 70;
}

export function shouldHighlightOutdoorAmenities(weatherData: WeatherData[]): boolean {
  if (!weatherData.length) return false;
  
  const avgPrecipitation = weatherData.reduce((sum, w) => sum + w.dailyWeather.precipitation.total, 0) / weatherData.length;
  const avgCloudCover = weatherData.reduce((sum, w) => sum + w.dailyWeather.cloud_cover.afternoon, 0) / weatherData.length;
  
  return avgPrecipitation < 0.3 && avgCloudCover < 50;
}

export function shouldHighlightHeatedAmenities(weatherData: WeatherData[]): boolean {
  if (!weatherData.length) return false;
  
  const avgMinTemp = weatherData.reduce((sum, w) => sum + w.dailyWeather.temperature.min, 0) / weatherData.length;
  
  return avgMinTemp <= 15;
}

export function getPackingRecommendations(weatherData: WeatherData[]): string[] {
  if (!weatherData.length) return [];
  
  const recommendations: string[] = [];
  const avgMinTemp = weatherData.reduce((sum, w) => sum + w.dailyWeather.temperature.min, 0) / weatherData.length;
  const avgMaxTemp = weatherData.reduce((sum, w) => sum + w.dailyWeather.temperature.max, 0) / weatherData.length;
  const maxPrecipitation = Math.max(...weatherData.map(w => w.dailyWeather.precipitation.total));
  const maxWindSpeed = Math.max(...weatherData.map(w => w.dailyWeather.wind.max.speed));
  const hasSnow = weatherData.some(w => isSnowConditions(w.dailyWeather));
  
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

