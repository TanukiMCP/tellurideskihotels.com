import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ImageWithLoading } from '@/components/shared/ImageWithLoading';
import { Star, MapPin } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { RoomSelectorCard } from './RoomSelectorCard';
import { HotelReviewsList } from './HotelReviewsList';
import { CheckoutFlow } from '@/components/checkout/CheckoutFlow';
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
  const [fullImageView, setFullImageView] = useState<string | null>(null);

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

      {/* Full Image Viewer Modal */}
      {fullImageView && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setFullImageView(null)}
        >
          <button
            onClick={() => setFullImageView(null)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img 
            src={fullImageView} 
            alt={hotel.name || 'Hotel'} 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Images - Adaptive Layout */}
      {hasImages ? (
        <div className="space-y-2">
          {allImages.length === 1 ? (
          // Single image - full width hero
            <div className="relative w-full group">
            <ImageWithLoading
              src={allImages[0]}
              alt={hotel.name || 'Hotel'}
              className="w-full h-[500px] object-cover rounded-xl shadow-lg"
            />
              <button
                onClick={() => setFullImageView(allImages[0])}
                className="absolute bottom-4 right-4 bg-white text-neutral-900 px-4 py-2 rounded-lg font-semibold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                View Full Image
              </button>
          </div>
        ) : (
          // Multiple images - grid layout
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={allImages.length === 2 ? "md:col-span-1" : "md:col-span-2"}>
                <div className="relative group">
              <ImageWithLoading
                src={allImages[0]}
                alt={hotel.name || 'Hotel'}
                    className="w-full h-96 object-cover rounded-lg shadow-md cursor-pointer"
              />
                  <button
                    onClick={() => setFullImageView(allImages[0])}
                    className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <span className="bg-white text-neutral-900 px-4 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      View Full Image
                    </span>
                  </button>
                </div>
            </div>
            {allImages.slice(1, 5).map((imgUrl, index) => (
                <div key={index} className="relative group">
              <ImageWithLoading
                src={imgUrl}
                alt={`${hotel.name} - Image ${index + 2}`}
                    className="w-full h-48 object-cover rounded-lg shadow-md cursor-pointer"
              />
                  <button
                    onClick={() => setFullImageView(imgUrl)}
                    className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
                  >
                    <span className="bg-white text-neutral-900 px-3 py-2 rounded-lg font-semibold shadow-lg text-sm flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                      View
                    </span>
                  </button>
                </div>
            ))}
          </div>
          )}
        </div>
      ) : (
        // No images - show placeholder
        <div className="w-full h-96 bg-gradient-to-br from-primary-50 to-neutral-100 rounded-xl flex items-center justify-center shadow-md">
          <div className="text-center">
            <div className="w-24 h-24 bg-primary-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-neutral-700">{hotel.name}</p>
            <p className="text-sm text-neutral-500 mt-1">Photos coming soon</p>
          </div>
        </div>
      )}

      {/* Weather Widget */}
      <WeatherWidget startDate={checkIn} endDate={checkOut} title="Weather During Your Stay" />

      {/* Hotel Info Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {hotel.star_rating && (
          <Card className="border-neutral-200">
            <CardContent className="p-6 text-center">
              <Star className="h-8 w-8 mx-auto mb-3 text-accent-500 fill-accent-500" />
              <div className="text-3xl font-bold text-neutral-900 mb-1">{hotel.star_rating} Stars</div>
              <div className="text-xs font-semibold text-neutral-900 uppercase tracking-wide mb-1">Hotel Classification</div>
              <div className="text-xs text-neutral-600 leading-relaxed">Based on amenities & services</div>
            </CardContent>
          </Card>
        )}
        
        {rating > 0 && (
          <Card 
            className="border-neutral-200 cursor-pointer hover:border-primary-300 hover:shadow-card-hover transition-all"
            onClick={() => {
              const reviewsSection = document.getElementById('guest-reviews');
              if (reviewsSection) {
                reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            <CardContent className="p-6 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${ratingColor.bg} mb-3`}>
                <span className={`text-2xl font-bold ${ratingColor.text}`}>{rating.toFixed(1)}</span>
              </div>
              <div className="text-xs font-semibold text-neutral-900 uppercase tracking-wide mb-1">Guest Reviews</div>
              <div className="text-xs text-neutral-600">
                {hotel.review_count ? `${hotel.review_count.toLocaleString()} reviews` : 'Click to view'}
              </div>
            </CardContent>
          </Card>
        )}
        
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
          
          let icon, bgColor, textColor, title, subtitle;
          
          if (hasSkiInSkiOut) {
            icon = <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
            bgColor = 'bg-green-100';
            textColor = 'text-green-600';
            title = 'Ski In / Ski Out';
            subtitle = 'Direct slope access';
          } else if (hasSkiAmenities || nearGondola) {
            icon = <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-600';
            title = 'Slope Access';
            subtitle = nearGondola ? 'Free gondola to slopes' : 'Short distance to lifts';
          } else {
            icon = <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
            bgColor = 'bg-neutral-100';
            textColor = 'text-neutral-600';
            title = 'Resort Area';
            subtitle = 'Gondola or shuttle access';
          }
          
          return (
            <Card className="border-neutral-200">
              <CardContent className="p-6 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${bgColor} mb-3 ${textColor}`}>
                  {icon}
                </div>
                <div className="text-xs font-semibold text-neutral-900 uppercase tracking-wide mb-1">{title}</div>
                <div className="text-xs text-neutral-600 leading-relaxed">{subtitle}</div>
              </CardContent>
            </Card>
          );
        })()}
      </div>

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
        
        return (
          <Card className="border-neutral-200 shadow-lg bg-white">
            <CardContent className="p-10">
              <h2 className="text-4xl font-bold mb-8 text-neutral-900 border-b-2 border-neutral-200 pb-6">About This Hotel</h2>
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
            </CardContent>
          </Card>
        );
      })()}

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

