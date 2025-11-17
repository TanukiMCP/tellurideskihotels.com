import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Star, MapPin, MessageSquare, Home, TrendingUp, Award, Users } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { RoomSelectorCard } from './RoomSelectorCard';
import { HotelReviewsList } from './HotelReviewsList';
import { CheckoutFlow } from '@/components/checkout/CheckoutFlow';
import { ImageGallery } from './ImageGallery';
import type { LiteAPIHotel, LiteAPIRate } from '@/lib/liteapi/types';
import { formatHotelAddress, getHotelImages } from '@/lib/liteapi/utils';
import { getRatingColor } from '@/lib/constants';
import { getAmenityIcon } from '@/lib/amenity-icons';
import type { SelectedRoom } from '@/lib/types';
import { WeatherWidget } from '@/components/weather/WeatherWidget';
import { WeatherAwareAmenities } from './WeatherAwareAmenities';

export interface HotelDetailViewProps {
  hotel: LiteAPIHotel;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
}

export function HotelDetailView({ hotel, checkIn, checkOut, adults, children = 0, rooms = 1 }: HotelDetailViewProps) {
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoom | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const rating = hotel.review_score || 0;
  const ratingColor = getRatingColor(rating);
  
  // Get images from LiteAPI only - no fallbacks
  const allImages = getHotelImages(hotel).filter(url => {
    // Filter out invalid URLs
    if (!url || url.trim() === '') return false;
    // Ensure URL is valid (starts with http:// or https://)
    return url.startsWith('http://') || url.startsWith('https://');
  });
  const hasImages = allImages.length > 0;

  const handleBookingReady = (bookingData: {
    rateId: string;
    roomData: LiteAPIRate;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  }) => {
    // Pass retail rate to checkout - this is what customer will pay
    // rate.total contains retailRate.total (base + margin + taxes) from LiteAPI
    const price = bookingData.roomData.total?.amount || bookingData.roomData.net?.amount || 0;
    const currency = bookingData.roomData.total?.currency || bookingData.roomData.net?.currency || 'USD';

    setSelectedRoom({
      rateId: bookingData.rateId,
      roomId: bookingData.roomData.room_id,
      roomName: bookingData.roomData.room_name,
      offerId: bookingData.roomData.offer_id,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      adults: bookingData.adults,
      children: bookingData.children,
      price,
      currency,
    });

      setShowCheckout(true);
  };

  const handleBookingComplete = (bookingId: string) => {
    setShowCheckout(false);
    if (typeof window !== 'undefined') {
      window.location.href = `/booking/confirmation/${bookingId}`;
    }
  };

  if (showCheckout && selectedRoom) {
    return (
      <CheckoutFlow
        hotelId={hotel.hotel_id}
        hotelName={hotel.name || ''}
        room={selectedRoom}
        addons={[]}
        onComplete={handleBookingComplete}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{hotel.name}</h1>
            {formatHotelAddress(hotel) && (
              <div className="flex items-center text-gray-600 mb-2">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{formatHotelAddress(hotel)}</span>
              </div>
            )}
            <div className="flex items-center gap-4">
              {hotel.star_rating && (
                <Badge variant="secondary">
                  <Star className="h-4 w-4 mr-1 fill-yellow-400 text-yellow-400" />
                  {hotel.star_rating} Stars
                </Badge>
              )}
              {rating > 0 && (
                <div className={`${ratingColor.bg} ${ratingColor.text} ${ratingColor.border} border rounded-full px-3 py-1 text-sm font-semibold`}>
                  {rating.toFixed(1)} / 10
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery - Full Featured Gallery */}
      {hasImages && (
        <ImageGallery images={allImages} alt={hotel.name || 'Hotel'} />
      )}

      {/* Description */}
      {hotel.description?.text && (() => {
        const descriptionText = hotel.description.text;
        
        // Parse description into structured sections (SSR-safe)
        const parseDescription = (text: string) => {
          // Check if HTML
          const isHTML = /<[a-z][\s\S]*>/i.test(text);
          
          if (isHTML) {
            // Extract headings and paragraphs from HTML using regex
            const sections: Array<{ title?: string; content: string }> = [];
            
            // Match headings: <h1>, <h2>, <h3>, or <p><strong>...</strong></p>
            const headingPattern = /<(h[1-3]|p)>(.*?)<\/\1>/gi;
            const strongPattern = /<p><strong>(.*?)<\/strong><\/p>/gi;
            
            // First, extract strong paragraphs as headings
            let processedText = text;
            const strongMatches = [...text.matchAll(strongPattern)];
            strongMatches.forEach(match => {
              const title = match[1].replace(/<[^>]*>/g, '').trim();
              if (title) {
                sections.push({ title, content: '' });
                processedText = processedText.replace(match[0], '');
              }
            });
            
            // Then process remaining content
            const paragraphs = processedText
              .split(/<\/?p[^>]*>/i)
              .map(p => p.replace(/<[^>]*>/g, '').trim())
              .filter(p => p.length > 0);
            
            if (sections.length === 0) {
              // No headings found, create sections from paragraphs
              paragraphs.forEach((para, idx) => {
                if (idx === 0 && para.length > 100) {
                  // First long paragraph might be intro
                  sections.push({ content: para });
                } else {
                  sections.push({ content: para });
                }
              });
            } else {
              // Add paragraphs to last section or create new ones
              let currentSectionIdx = sections.length - 1;
              paragraphs.forEach(para => {
                if (currentSectionIdx >= 0 && !sections[currentSectionIdx].content) {
                  sections[currentSectionIdx].content = para;
                } else {
                  sections.push({ content: para });
                  currentSectionIdx = sections.length - 1;
                }
              });
            }
            
            return sections.length > 0 ? sections : [{ content: text.replace(/<[^>]*>/g, '') }];
          } else {
            // Plain text - split by double newlines or common patterns
            const paragraphs = text
              .split(/\n\s*\n/)
              .map(p => p.trim())
              .filter(p => p.length > 0);
            
            // Try to identify section headers (short lines, often ending with colon)
            const sections: Array<{ title?: string; content: string }> = [];
            paragraphs.forEach(para => {
              if (para.length < 80 && (para.endsWith(':') || /^[A-Z][^.!?]*:$/.test(para))) {
                sections.push({ title: para.replace(':', ''), content: '' });
              } else {
                if (sections.length > 0 && !sections[sections.length - 1].content) {
                  sections[sections.length - 1].content = para;
                } else {
                  sections.push({ content: para });
                }
              }
            });
            
            return sections.length > 0 ? sections : [{ content: text }];
          }
        };
        
        const sections = parseDescription(descriptionText);
        
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
        const roomCount = hotel.rooms?.length || 0;
        const reviewCount = hotel.review_count || 0;
        
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
          <Card className="border-neutral-200 shadow-lg bg-white overflow-hidden">
            <CardContent className="p-10">
              <h2 className="text-4xl font-bold mb-8 text-neutral-900 border-b-2 border-neutral-200 pb-6">About This Hotel</h2>
              
              {/* Stats Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {/* Guest Rating */}
                <div className="bg-gradient-to-br from-neutral-50 to-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2 text-neutral-500">
                    <Star className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Guest Rating</span>
                  </div>
                  <div className={`text-3xl font-bold ${ratingColor.text} mb-1`}>
                    {rating > 0 ? rating.toFixed(1) : 'N/A'}
                  </div>
                  <div className="text-xs text-neutral-600 font-medium">
                    {rating >= 9 ? 'Exceptional' : rating >= 8 ? 'Excellent' : rating >= 7 ? 'Very Good' : rating > 0 ? 'Good' : 'No rating yet'}
                  </div>
                </div>
                
                {/* Review Count */}
                <div className="bg-gradient-to-br from-neutral-50 to-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2 text-neutral-500">
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Reviews</span>
                  </div>
                  <div className="text-3xl font-bold text-neutral-900 mb-1">
                    {reviewCount > 0 ? reviewCount.toLocaleString() : 'New'}
                  </div>
                  {popularityTier && (
                    <div className={`text-xs font-semibold px-2 py-1 rounded-full inline-flex items-center gap-1 ${popularityTier.color}`}>
                      <popularityTier.icon className="w-3 h-3" />
                      {popularityTier.label}
                    </div>
                  )}
                </div>
                
                {/* Star Classification */}
                <div className="bg-gradient-to-br from-neutral-50 to-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2 text-neutral-500">
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Classification</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1 h-8">
                    {hotel.star_rating && hotel.star_rating > 0 ? (
                      <>
                        {Array.from({ length: hotel.star_rating }).map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                        ))}
                      </>
                    ) : (
                      <span className="text-3xl font-bold text-neutral-400">—</span>
                    )}
                  </div>
                  <div className="text-xs text-neutral-600 font-medium">
                    {hotel.star_rating && hotel.star_rating > 0 ? `${hotel.star_rating}-Star ${propertyType.label}` : 'Unrated Property'}
                  </div>
                </div>
                
                {/* Ski Access */}
                {(() => {
                  // Dynamic ski access display
                  const amenityStrings = hotel.amenities?.map(a => 
                    `${a.name || ''} ${a.code || ''}`.toLowerCase()
                  ) || [];
                  
                  // Check for explicit ski-in/ski-out
                  const hasSkiInSkiOut = amenityStrings.some(str => 
                    str.includes('ski-in') ||
                    str.includes('ski-out') ||
                    (str.includes('ski') && str.includes('in') && str.includes('out')) ||
                    str.includes('direct slope access') ||
                    str.includes('slope-side')
                  );
                  
                  // Check for ski amenities/storage (slope access)
                  const hasSkiAmenities = amenityStrings.some(str => 
                    str.includes('ski') ||
                    str.includes('slope') ||
                    str.includes('gondola') ||
                    str.includes('lift access')
                  );
                  
                  // Check if near gondola
                  const nearGondola = amenityStrings.some(str => 
                    str.includes('gondola') ||
                    str.includes('free shuttle')
                  ) || hotel.name?.toLowerCase().includes('mountain village');
                  
                  let IconComponent, bgColor, textColor, title, subtitle;
                  
                  if (hasSkiInSkiOut) {
                    IconComponent = () => (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    );
                    bgColor = 'from-green-50 to-white';
                    textColor = 'text-green-600';
                    title = 'Ski In / Ski Out';
                    subtitle = 'Direct slope access';
                  } else if (hasSkiAmenities || nearGondola) {
                    IconComponent = () => (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    );
                    bgColor = 'from-blue-50 to-white';
                    textColor = 'text-blue-600';
                    title = 'Slope Access';
                    subtitle = nearGondola ? 'Free gondola to slopes' : 'Short distance to lifts';
                  } else {
                    IconComponent = () => (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    );
                    bgColor = 'from-neutral-50 to-white';
                    textColor = 'text-neutral-600';
                    title = 'Resort Area';
                    subtitle = 'Gondola or shuttle access';
                  }
                  
                  return (
                    <div className={`bg-gradient-to-br ${bgColor} rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-all`}>
                      <div className="flex items-center gap-2 mb-2 text-neutral-500">
                        <IconComponent />
                        <span className="text-xs font-semibold uppercase tracking-wider">Ski Access</span>
                      </div>
                      <div className={`text-lg font-bold ${textColor} mb-1`}>
                        {title}
                      </div>
                      <div className="text-xs text-neutral-600 font-medium">
                        {subtitle}
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Description Sections */}
              <div className="border-t border-neutral-200 pt-8">
                <div className="space-y-8">
                  {sections.map((section, idx) => (
                    <div key={idx} className="space-y-4">
                      {section.title && (
                        <h3 className="text-2xl font-bold text-neutral-900 mb-4">{section.title}</h3>
                      )}
                      <div className="text-neutral-700 text-lg leading-relaxed">
                        {section.content.split('\n').map((para, pIdx) => (
                          para.trim() && (
                            <p key={pIdx} className="mb-4">
                              {para.trim()}
                            </p>
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Weather Widget */}
      <WeatherWidget startDate={checkIn} endDate={checkOut} title="Weather During Your Stay" />

      {/* Amenities - Weather Aware */}
      {hotel.amenities && hotel.amenities.length > 0 && (
        <WeatherAwareAmenities 
          amenities={hotel.amenities} 
          checkIn={checkIn} 
          checkOut={checkOut}
        />
      )}

      {/* Room Selection */}
      <RoomSelectorCard
        hotelId={hotel.hotel_id}
        hotelName={hotel.name || ''}
        hotelAddress={formatHotelAddress(hotel)}
        hotelImage={hasImages ? allImages[0] : ''}
        hotelReviewScore={rating}
        initialCheckIn={checkIn}
        initialCheckOut={checkOut}
        initialAdults={adults}
        initialChildren={children}
        initialRooms={rooms}
        onBookingReady={handleBookingReady}
      />

      {/* Guest Reviews */}
      <div id="guest-reviews">
      <HotelReviewsList
        hotelId={hotel.hotel_id}
        averageRating={rating}
        reviewCount={hotel.review_count}
      />
      </div>
    </div>
  );
}

