import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import * as LucideIcons from 'lucide-react';
import { getAmenityIcon } from '@/lib/amenity-icons';
import type { WeatherData } from '@/lib/liteapi/weather';
import { shouldHighlightIndoorAmenities, shouldHighlightOutdoorAmenities, shouldHighlightHeatedAmenities } from '@/lib/liteapi/weather';

interface WeatherAwareAmenitiesProps {
  amenities: Array<{ name?: string; code?: string }>;
  checkIn: string;
  checkOut: string;
}

export function WeatherAwareAmenities({ amenities, checkIn, checkOut }: WeatherAwareAmenitiesProps) {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `/api/weather/forecast?startDate=${checkIn}&endDate=${checkOut}&units=imperial`
        );
        
        if (!response.ok) throw new Error('Failed to fetch weather');
        
        const data = await response.json();
        setWeatherData(data.weatherData || []);
      } catch (err) {
        console.error('Error fetching weather for amenities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [checkIn, checkOut]);

  const highlightIndoor = !loading && shouldHighlightIndoorAmenities(weatherData);
  const highlightOutdoor = !loading && shouldHighlightOutdoorAmenities(weatherData);
  const highlightHeated = !loading && shouldHighlightHeatedAmenities(weatherData);

  const indoorKeywords = ['pool', 'spa', 'hot tub', 'jacuzzi', 'sauna', 'gym', 'fitness', 'restaurant', 'bar', 'lounge'];
  const outdoorKeywords = ['terrace', 'patio', 'balcony', 'view', 'outdoor', 'garden', 'deck'];
  const heatedKeywords = ['heated', 'parking', 'garage', 'ski storage', 'ski locker', 'boot dryer'];

  const categorizeAmenity = (amenityName: string) => {
    const lowerName = amenityName.toLowerCase();
    
    if (highlightHeated && heatedKeywords.some(k => lowerName.includes(k))) {
      return 'heated';
    }
    if (highlightIndoor && indoorKeywords.some(k => lowerName.includes(k))) {
      return 'indoor';
    }
    if (highlightOutdoor && outdoorKeywords.some(k => lowerName.includes(k))) {
      return 'outdoor';
    }
    return 'normal';
  };

  const sortedAmenities = [...amenities].sort((a, b) => {
    const aName = a.name || a.code || '';
    const bName = b.name || b.code || '';
    const aCat = categorizeAmenity(aName);
    const bCat = categorizeAmenity(bName);
    
    const priority = { heated: 0, indoor: 1, outdoor: 2, normal: 3 };
    return priority[aCat] - priority[bCat];
  });

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-6 text-neutral-900">Hotel Amenities</h2>
        {(highlightIndoor || highlightOutdoor || highlightHeated) && (
          <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded-lg">
            <p className="text-sm text-sky-800">
              <span className="font-semibold">💡 Weather Tip:</span>{' '}
              {highlightHeated && 'Cold weather expected - heated amenities highlighted. '}
              {highlightIndoor && 'Rainy/cloudy conditions expected - indoor amenities highlighted. '}
              {highlightOutdoor && 'Great weather expected - perfect for outdoor amenities!'}
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sortedAmenities.map((amenity, index) => {
            const amenityName = amenity.name || amenity.code || '';
            const { icon: iconName, color } = getAmenityIcon(amenityName);
            const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Sparkle;
            const category = categorizeAmenity(amenityName);
            const isHighlighted = category !== 'normal';
            
            return (
              <div 
                key={index} 
                className={`flex items-center text-sm rounded-lg p-3 border transition-all ${
                  isHighlighted 
                    ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200 shadow-sm' 
                    : 'bg-neutral-50 border-neutral-200 hover:border-primary-300 hover:bg-primary-50/50'
                }`}
              >
                <div className={`mr-3 flex-shrink-0 ${isHighlighted ? 'text-sky-600' : color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className={`font-medium ${isHighlighted ? 'text-sky-900' : 'text-neutral-700'}`}>
                  {amenityName}
                </span>
                {isHighlighted && (
                  <span className="ml-auto text-xs text-sky-600">★</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

