'use client';

/**
 * Selectable Card Components for Trip Planner
 * These wrap existing card designs with "Add to Trip" functionality
 */

import { useState } from 'react';
import { 
  Check, Plus, X, Star, Clock, MapPin, Calendar,
  ExternalLink, ShoppingBag
} from 'lucide-react';
import { useTripPlannerStore, type SelectedHotel, type SelectedActivity, type SelectedEvent } from '@/stores/tripPlannerStore';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import type { ViatorProductSummary } from '@/lib/viator/types';
import type { TellurideEvent } from '@/data/telluride-events';
import { format, parseISO } from 'date-fns';

// ============================================
// SELECTABLE HOTEL CARD
// ============================================

interface SelectableHotelCardProps {
  hotel: LiteAPIHotel;
  price?: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
}

export function SelectableHotelCard({ 
  hotel, 
  price, 
  checkIn, 
  checkOut, 
  nights,
  guests 
}: SelectableHotelCardProps) {
  const { selectedHotel, selectHotel, removeHotel } = useTripPlannerStore();
  const isSelected = selectedHotel?.id === hotel.hotel_id;
  
  const imageUrl = hotel.images?.[0]?.url || hotel.images?.[0]?.variants?.[0]?.url;
  const rating = hotel.review_score || 0;
  const address = hotel.address?.line1 || hotel.address?.full || '';
  const totalPrice = price ? price * nights : 0;
  
  const handleSelect = () => {
    if (isSelected) {
      removeHotel();
    } else {
      const selectedData: SelectedHotel = {
        id: hotel.hotel_id,
        name: hotel.name || 'Unknown Hotel',
        image: imageUrl || '',
        pricePerNight: price || 0,
        totalPrice,
        address,
        rating,
        checkIn,
        checkOut,
        nights,
        bookingUrl: `/places-to-stay/${hotel.hotel_id}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}&rooms=1`,
      };
      selectHotel(selectedData);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`relative bg-white rounded-xl border-2 overflow-hidden transition-all duration-300 ${
      isSelected 
        ? 'border-primary-500 shadow-lg ring-2 ring-primary-200' 
        : 'border-neutral-200 hover:border-primary-300 hover:shadow-md'
    }`}>
      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-600 text-white text-sm font-bold shadow-lg">
          <Check className="w-4 h-4" />
          Selected
        </div>
      )}

      {/* Image */}
      <div className="relative h-48 bg-neutral-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={hotel.name || 'Hotel'}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
            <span className="text-neutral-400 text-sm">No image</span>
          </div>
        )}
        
        {/* Price Badge */}
        {price && price > 0 && (
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-neutral-900">{formatCurrency(price)}</span>
              <span className="text-xs text-neutral-500">/night</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-neutral-900 text-lg mb-1 line-clamp-1">{hotel.name}</h3>
        
        <div className="flex items-center gap-3 text-sm text-neutral-600 mb-3">
          {rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
            </div>
          )}
          {address && (
            <div className="flex items-center gap-1 text-neutral-500">
              <MapPin className="w-3.5 h-3.5" />
              <span className="line-clamp-1 text-xs">{address}</span>
            </div>
          )}
        </div>

        {/* Total for stay */}
        {totalPrice > 0 && (
          <p className="text-sm text-neutral-500 mb-3">
            {formatCurrency(totalPrice)} total for {nights} night{nights > 1 ? 's' : ''}
          </p>
        )}

        {/* Action Button */}
        <button
          onClick={handleSelect}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
            isSelected
              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isSelected ? (
            <>
              <X className="w-4 h-4" />
              Remove from Trip
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Select This Hotel
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// SELECTABLE ACTIVITY CARD
// ============================================

interface SelectableActivityCardProps {
  activity: ViatorProductSummary;
  guests: number;
}

export function SelectableActivityCard({ activity, guests }: SelectableActivityCardProps) {
  const { selectedActivities, addActivity, removeActivity, isActivitySelected } = useTripPlannerStore();
  const isSelected = isActivitySelected(activity.productCode);
  
  const price = activity.pricing?.summary?.fromPrice || 0;
  const totalPrice = price * guests;
  const rating = activity.reviews?.combinedAverageRating;
  const reviewCount = activity.reviews?.totalReviews;
  const duration = activity.duration?.fixedDurationInMinutes;
  const imageUrl = activity.images?.[0]?.variants?.find(v => v.width >= 400)?.url || 
                   activity.images?.[0]?.variants?.[0]?.url;

  const handleToggle = () => {
    if (isSelected) {
      removeActivity(activity.productCode);
    } else {
      const selectedData: SelectedActivity = {
        id: activity.productCode,
        name: activity.title,
        image: imageUrl || '',
        price,
        totalPrice,
        duration: duration ? formatDuration(duration) : undefined,
        rating,
        bookingUrl: activity.productUrl || `https://www.viator.com/tours/${activity.productCode}`,
      };
      addActivity(selectedData);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  return (
    <div className={`relative bg-white rounded-xl border-2 overflow-hidden transition-all duration-300 ${
      isSelected 
        ? 'border-secondary-500 shadow-lg ring-2 ring-secondary-200' 
        : 'border-neutral-200 hover:border-secondary-300 hover:shadow-md'
    }`}>
      {/* Selected Badge */}
      {isSelected && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary-600 text-white text-sm font-bold shadow-lg">
          <Check className="w-4 h-4" />
          Added
        </div>
      )}

      {/* Image */}
      <div className="relative h-40 bg-neutral-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={activity.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
            <span className="text-neutral-400 text-sm">No image</span>
          </div>
        )}
        
        {/* Price Badge */}
        {price > 0 && (
          <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur px-3 py-1.5 rounded-lg shadow-lg">
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-neutral-500">from</span>
              <span className="font-bold text-neutral-900">{formatCurrency(price)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-neutral-900 text-base mb-2 line-clamp-2 min-h-[2.5rem]">{activity.title}</h3>
        
        <div className="flex items-center gap-3 text-xs text-neutral-600 mb-3">
          {rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{rating.toFixed(1)}</span>
              {reviewCount && <span className="text-neutral-400">({reviewCount})</span>}
            </div>
          )}
          {duration && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{formatDuration(duration)}</span>
            </div>
          )}
        </div>

        {/* Total for group */}
        {totalPrice > 0 && guests > 1 && (
          <p className="text-xs text-neutral-500 mb-3">
            {formatCurrency(totalPrice)} for {guests} people
          </p>
        )}

        {/* External booking note */}
        <div className="flex items-center gap-1 text-xs text-neutral-400 mb-3">
          <ExternalLink className="w-3 h-3" />
          <span>Books on Viator</span>
        </div>

        {/* Action Button */}
        <button
          onClick={handleToggle}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
            isSelected
              ? 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
              : 'bg-secondary-600 text-white hover:bg-secondary-700'
          }`}
        >
          {isSelected ? (
            <>
              <X className="w-4 h-4" />
              Remove
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add to Trip
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================
// SELECTABLE EVENT CARD
// ============================================

interface SelectableEventCardProps {
  event: TellurideEvent;
}

export function SelectableEventCard({ event }: SelectableEventCardProps) {
  const { addEvent, removeEvent, isEventSelected } = useTripPlannerStore();
  const isSelected = isEventSelected(event.id);

  const handleToggle = () => {
    if (isSelected) {
      removeEvent(event.id);
    } else {
      const selectedData: SelectedEvent = {
        id: event.id,
        name: event.name,
        date: event.date,
        description: event.description,
        type: event.type,
        url: event.url,
        isFree: true, // Most Telluride community events are free
      };
      addEvent(selectedData);
    }
  };

  const eventDate = parseISO(event.date);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'festival': return 'bg-purple-100 text-purple-700';
      case 'concert': return 'bg-pink-100 text-pink-700';
      case 'sports': return 'bg-blue-100 text-blue-700';
      case 'art': return 'bg-amber-100 text-amber-700';
      case 'community': return 'bg-green-100 text-green-700';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  return (
    <div className={`relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
      isSelected 
        ? 'border-purple-500 bg-purple-50 shadow-md' 
        : 'border-neutral-200 bg-white hover:border-purple-300 hover:bg-purple-50/50'
    }`}>
      {/* Date Badge */}
      <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
        isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
      }`}>
        <span className="text-xs font-semibold uppercase">
          {format(eventDate, 'MMM')}
        </span>
        <span className="text-2xl font-bold leading-none">
          {format(eventDate, 'd')}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-semibold text-neutral-900 line-clamp-1">{event.name}</h4>
          <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium capitalize ${getTypeColor(event.type)}`}>
            {event.type}
          </span>
        </div>
        
        <p className="text-sm text-neutral-600 line-clamp-2 mb-2">{event.description}</p>
        
        <div className="flex items-center gap-3">
          <span className="text-xs text-green-600 font-medium">Free Event</span>
          <a 
            href={event.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            Details <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Selection Toggle */}
      <button
        onClick={handleToggle}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isSelected
            ? 'bg-purple-600 text-white hover:bg-purple-700'
            : 'bg-neutral-100 text-neutral-500 hover:bg-purple-100 hover:text-purple-600'
        }`}
      >
        {isSelected ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
      </button>
    </div>
  );
}

