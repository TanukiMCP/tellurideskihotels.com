import { liteAPIClient } from './client';
import { TELLURIDE_CENTER } from '@/lib/mapbox-utils';

export interface WeatherTemperature {
  min: number;
  max: number;
  afternoon: number;
  night: number;
  evening: number;
  morning: number;
}

export interface WeatherWind {
  max: {
    speed: number;
    direction: number;
  };
}

export interface WeatherPrecipitation {
  total: number;
}

export interface DailyWeather {
  date: string;
  units: 'metric' | 'imperial';
  cloud_cover: {
    afternoon: number;
  };
  humidity: {
    afternoon: number;
  };
  precipitation: WeatherPrecipitation;
  temperature: WeatherTemperature;
  pressure: {
    afternoon: number;
  };
  wind: WeatherWind;
}

export interface WeatherData {
  dailyWeather: DailyWeather;
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
    latitude = TELLURIDE_CENTER[1],
    longitude = TELLURIDE_CENTER[0],
    startDate,
    endDate,
    units = 'imperial',
  } = params;

  const searchParams = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    startDate,
    endDate,
    units,
  });

  const endpoint = `/data/weather?${searchParams.toString()}`;
  return await liteAPIClient<WeatherResponse>(endpoint);
}

export function isSnowConditions(weather: DailyWeather): boolean {
  return weather.temperature.max <= 32 && weather.precipitation.total >= 50;
}

export function getWeatherIcon(weather: DailyWeather): string {
  const { precipitation, cloud_cover, temperature } = weather;
  
  if (precipitation.total >= 50) {
    return temperature.max <= 32 ? '❄️' : '🌧️';
  }
  
  if (cloud_cover.afternoon >= 70) {
    return '☁️';
  }
  
  if (cloud_cover.afternoon >= 30) {
    return '⛅';
  }
  
  return '☀️';
}

export function getWeatherDescription(weather: DailyWeather): string {
  const { precipitation, cloud_cover, temperature } = weather;
  
  if (precipitation.total >= 50 && temperature.max <= 32) {
    return 'Snow expected';
  }
  
  if (precipitation.total >= 50) {
    return 'Rain expected';
  }
  
  if (cloud_cover.afternoon >= 70) {
    return 'Cloudy';
  }
  
  if (cloud_cover.afternoon >= 30) {
    return 'Partly cloudy';
  }
  
  return 'Clear';
}

export function shouldHighlightIndoorAmenities(weatherData: WeatherData[]): boolean {
  if (!weatherData.length) return false;
  
  const avgPrecipitation = weatherData.reduce((sum, w) => sum + w.dailyWeather.precipitation.total, 0) / weatherData.length;
  const avgCloudCover = weatherData.reduce((sum, w) => sum + w.dailyWeather.cloud_cover.afternoon, 0) / weatherData.length;
  
  return avgPrecipitation >= 40 || avgCloudCover >= 70;
}

export function shouldHighlightOutdoorAmenities(weatherData: WeatherData[]): boolean {
  if (!weatherData.length) return false;
  
  const avgPrecipitation = weatherData.reduce((sum, w) => sum + w.dailyWeather.precipitation.total, 0) / weatherData.length;
  const avgCloudCover = weatherData.reduce((sum, w) => sum + w.dailyWeather.cloud_cover.afternoon, 0) / weatherData.length;
  
  return avgPrecipitation < 30 && avgCloudCover < 50;
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
  
  if (maxPrecipitation >= 50) {
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

