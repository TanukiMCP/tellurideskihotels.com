import { Star, MessageSquare, Home, TrendingUp, Award, Users } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { getRatingColor } from '@/lib/constants';

interface HotelStatsCardsProps {
  hotel: LiteAPIHotel;
}

export function HotelStatsCards({ hotel }: HotelStatsCardsProps) {
  const rating = hotel.review_score || 0;
  const reviewCount = hotel.review_count || 0;
  const starRating = hotel.star_rating || 0;
  const roomCount = hotel.rooms?.length || 0;
  
  const ratingColor = getRatingColor(rating);
  
  // Determine property type
  const getPropertyType = () => {
    const name = hotel.name?.toLowerCase() || '';
    if (name.includes('resort')) return { label: 'Resort', icon: Award };
    if (name.includes('inn')) return { label: 'Inn', icon: Home };
    if (name.includes('lodge')) return { label: 'Lodge', icon: Home };
    if (name.includes('hotel')) return { label: 'Hotel', icon: Home };
    return { label: 'Property', icon: Home };
  };
  
  const propertyType = getPropertyType();
  
  // Determine popularity tier
  const getPopularityTier = () => {
    if (reviewCount >= 300) return { label: 'Very Popular', color: 'text-primary-600 bg-primary-50', icon: TrendingUp };
    if (reviewCount >= 150) return { label: 'Popular', color: 'text-primary-600 bg-primary-50', icon: TrendingUp };
    if (reviewCount >= 50) return { label: 'Well-Reviewed', color: 'text-neutral-600 bg-neutral-50', icon: MessageSquare };
    if (reviewCount > 0) return { label: 'Boutique', color: 'text-purple-600 bg-purple-50', icon: Users };
    return null;
  };
  
  const popularityTier = getPopularityTier();
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {/* Guest Rating */}
      <div className="bg-gradient-to-br from-white to-neutral-50 rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2 text-neutral-500">
          <Star className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Guest Rating</span>
        </div>
        <div className={`text-3xl font-bold ${ratingColor.text} mb-1`}>
          {rating > 0 ? rating.toFixed(1) : 'N/A'}
        </div>
        <div className="text-xs text-neutral-500">
          {rating >= 9 ? 'Exceptional' : rating >= 8 ? 'Excellent' : rating >= 7 ? 'Very Good' : rating > 0 ? 'Good' : 'No rating yet'}
        </div>
      </div>
      
      {/* Review Count */}
      <div className="bg-gradient-to-br from-white to-neutral-50 rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2 text-neutral-500">
          <MessageSquare className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Reviews</span>
        </div>
        <div className="text-3xl font-bold text-neutral-900 mb-1">
          {reviewCount > 0 ? reviewCount.toLocaleString() : 'New'}
        </div>
        {popularityTier && (
          <div className={`text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${popularityTier.color}`}>
            <popularityTier.icon className="w-3 h-3" />
            {popularityTier.label}
          </div>
        )}
      </div>
      
      {/* Star Classification */}
      <div className="bg-gradient-to-br from-white to-neutral-50 rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2 text-neutral-500">
          <Award className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Classification</span>
        </div>
        <div className="flex items-center gap-1 mb-1">
          {starRating > 0 ? (
            <>
              {Array.from({ length: starRating }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </>
          ) : (
            <span className="text-3xl font-bold text-neutral-900">—</span>
          )}
        </div>
        <div className="text-xs text-neutral-500">
          {starRating > 0 ? `${starRating}-Star ${propertyType.label}` : 'Unrated Property'}
        </div>
      </div>
      
      {/* Room Selection */}
      <div className="bg-gradient-to-br from-white to-neutral-50 rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-2 text-neutral-500">
          <propertyType.icon className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wider">Property Type</span>
        </div>
        <div className="text-3xl font-bold text-neutral-900 mb-1">
          {roomCount > 0 ? roomCount : '—'}
        </div>
        <div className="text-xs text-neutral-500">
          {roomCount > 0 ? `${roomCount} Room ${roomCount === 1 ? 'Type' : 'Types'}` : propertyType.label}
        </div>
      </div>
    </div>
  );
}

