/**
 * Maps amenity codes/names to Lucide icons
 * Industry standard approach: Use semantic icons for common amenities
 */

export const amenityIconMap: Record<string, { icon: string; color: string }> = {
  // Parking
  'parking': { icon: 'ParkingCircle', color: 'text-blue-600' },
  'free parking': { icon: 'ParkingCircle', color: 'text-green-600' },
  'valet parking': { icon: 'Car', color: 'text-blue-600' },
  
  // Wi-Fi / Internet
  'wifi': { icon: 'Wifi', color: 'text-blue-600' },
  'free wifi': { icon: 'Wifi', color: 'text-green-600' },
  'internet': { icon: 'Wifi', color: 'text-blue-600' },
  'free wired internet': { icon: 'Cable', color: 'text-green-600' },
  
  // Pool / Spa
  'pool': { icon: 'Waves', color: 'text-cyan-600' },
  'indoor pool': { icon: 'Waves', color: 'text-cyan-600' },
  'outdoor pool': { icon: 'Waves', color: 'text-sky-600' },
  'hot tub': { icon: 'Droplet', color: 'text-orange-600' },
  'jacuzzi': { icon: 'Droplet', color: 'text-orange-600' },
  'spa': { icon: 'Sparkles', color: 'text-purple-600' },
  'sauna': { icon: 'Flame', color: 'text-orange-600' },
  
  // Fitness
  'gym': { icon: 'Dumbbell', color: 'text-red-600' },
  'fitness': { icon: 'Dumbbell', color: 'text-red-600' },
  'fitness center': { icon: 'Dumbbell', color: 'text-red-600' },
  
  // Food & Beverage
  'restaurant': { icon: 'UtensilsCrossed', color: 'text-amber-600' },
  'breakfast': { icon: 'Coffee', color: 'text-amber-600' },
  'bar': { icon: 'Wine', color: 'text-purple-600' },
  'room service': { icon: 'ConciergeBell', color: 'text-amber-600' },
  'kitchen': { icon: 'ChefHat', color: 'text-amber-600' },
  'refrigerator': { icon: 'Refrigerator', color: 'text-blue-600' },
  
  // Services
  'concierge': { icon: 'Headset', color: 'text-blue-600' },
  'reception': { icon: 'Hotel', color: 'text-blue-600' },
  '24-hour front desk': { icon: 'Clock', color: 'text-blue-600' },
  'luggage storage': { icon: 'Briefcase', color: 'text-gray-600' },
  'laundry': { icon: 'Shirt', color: 'text-blue-600' },
  
  // Family
  'family rooms': { icon: 'Users', color: 'text-green-600' },
  'cribs': { icon: 'Baby', color: 'text-pink-600' },
  'playground': { icon: 'TreePine', color: 'text-green-600' },
  
  // Safety & Accessibility
  'wheelchair accessible': { icon: 'Accessibility', color: 'text-blue-600' },
  'elevator': { icon: 'MoveVertical', color: 'text-gray-600' },
  'smoke alarms': { icon: 'BellRing', color: 'text-red-600' },
  'fire extinguisher': { icon: 'Flame', color: 'text-red-600' },
  'safety deposit box': { icon: 'Lock', color: 'text-gray-600' },
  
  // Room Features
  'air conditioning': { icon: 'Wind', color: 'text-sky-600' },
  'heating': { icon: 'Thermometer', color: 'text-orange-600' },
  'tv': { icon: 'Tv', color: 'text-gray-600' },
  'balcony': { icon: 'Home', color: 'text-green-600' },
  'terrace': { icon: 'Palmtree', color: 'text-green-600' },
  'fireplace': { icon: 'Flame', color: 'text-orange-600' },
  
  // Pets
  'pets allowed': { icon: 'Dog', color: 'text-amber-600' },
  
  // Business
  'business center': { icon: 'Briefcase', color: 'text-gray-600' },
  'meeting rooms': { icon: 'Presentation', color: 'text-blue-600' },
  
  // Ski Amenities
  'ski storage': { icon: 'Box', color: 'text-blue-600' },
  'ski locker': { icon: 'Lock', color: 'text-blue-600' },
  'boot dryer': { icon: 'Wind', color: 'text-orange-600' },
  'ski shop': { icon: 'Store', color: 'text-blue-600' },
  'ski rental': { icon: 'Store', color: 'text-blue-600' },
  'ski pass': { icon: 'Ticket', color: 'text-green-600' },
  
  // Transportation
  'shuttle': { icon: 'Bus', color: 'text-blue-600' },
  'free shuttle': { icon: 'Bus', color: 'text-green-600' },
  'airport shuttle': { icon: 'Plane', color: 'text-blue-600' },
  'gondola': { icon: 'Cable', color: 'text-blue-600' },
  
  // View & Location
  'mountain view': { icon: 'Mountain', color: 'text-blue-600' },
  'city view': { icon: 'Building', color: 'text-gray-600' },
  'garden view': { icon: 'TreePine', color: 'text-green-600' },
  'sea view': { icon: 'Waves', color: 'text-blue-600' },
  
  // Additional Amenities
  'smoking rooms': { icon: 'Cigarette', color: 'text-gray-600' },
  'non-smoking': { icon: 'BanIcon', color: 'text-green-600' },
  'soundproof': { icon: 'Volume2', color: 'text-blue-600' },
  'minibar': { icon: 'Wine', color: 'text-purple-600' },
  'coffee maker': { icon: 'Coffee', color: 'text-amber-600' },
  'dishwasher': { icon: 'Utensils', color: 'text-gray-600' },
  'washing machine': { icon: 'WashingMachine', color: 'text-blue-600' },
  'dryer': { icon: 'Wind', color: 'text-blue-600' },
  'iron': { icon: 'Sparkles', color: 'text-gray-600' },
  'hair dryer': { icon: 'Wind', color: 'text-orange-600' },
  'bathtub': { icon: 'Bath', color: 'text-blue-600' },
  'shower': { icon: 'Droplet', color: 'text-blue-600' },
  
  // Default - use a more neutral icon instead of checkmark
  'default': { icon: 'Sparkle', color: 'text-primary-600' },
};

export function getAmenityIcon(amenityName: string): { icon: string; color: string } {
  const normalized = amenityName.toLowerCase().trim();
  
  // Check for exact match first
  if (amenityIconMap[normalized]) {
    return amenityIconMap[normalized];
  }
  
  // Check for partial matches
  for (const [key, value] of Object.entries(amenityIconMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  return amenityIconMap['default'];
}

