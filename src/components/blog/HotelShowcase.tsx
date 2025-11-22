'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Star, MapPin, ExternalLink, Image as ImageIcon } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import { getHotelMainImage, formatHotelAddress } from '@/lib/liteapi/utils';
import { getRatingColor } from '@/lib/constants';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ImageGallery } from '@/components/lodging/ImageGallery';

interface HotelShowcaseProps {
  hotelId: string;
  showGallery?: boolean;
  checkIn?: string;
  checkOut?: string;
}

export function HotelShowcase({ 
  hotelId, 
  showGallery = false,
  checkIn,
  checkOut 
}: HotelShowcaseProps) {
  const [hotel, setHotel] = useState<LiteAPIHotel | null>(null);
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHotel() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch hotel details
        const hotelResponse = await fetch(`/api/liteapi/hotel?hotelId=${hotelId}`);
        
        if (!hotelResponse.ok) {
          throw new Error('Failed to load hotel details');
        }
        
        const hotelData = await hotelResponse.json();
        setHotel(hotelData);

        // Fetch pricing if dates provided
        if (checkIn && checkOut) {
          try {
            const params = new URLSearchParams({
              hotelId,
              checkIn,
              checkOut,
              adults: '2',
              children: '0',
            });
            
            const ratesResponse = await fetch(`/api/hotels/rates?${params.toString()}`);

            if (ratesResponse.ok) {
              const ratesData = await ratesResponse.json();
              if (ratesData.rates && ratesData.rates.length > 0) {
                // Calculate per-night prices
                const checkInDate = new Date(checkIn);
                const checkOutDate = new Date(checkOut);
                const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
                
                const prices = ratesData.rates
                  .map((rate: any) => {
                    const total = rate.total?.amount || rate.net?.amount;
                    return total && nights > 0 ? total / nights : null;
                  })
                  .filter((p: number | null): p is number => p !== null && p > 0);
                
                if (prices.length > 0) {
                  setMinPrice(Math.min(...prices));
                }
              }
            }
          } catch (priceError) {
            // Pricing fetch failed, but hotel data is still available
            console.warn('Failed to fetch pricing:', priceError);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hotel');
      } finally {
        setLoading(false);
      }
    }

    if (hotelId) {
      fetchHotel();
    }
  }, [hotelId, checkIn, checkOut]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 my-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !hotel) {
    return (
      <div className="my-8 p-6 bg-neutral-50 border border-neutral-200 rounded-lg">
        <p className="text-neutral-600 text-center">
          {error || 'Unable to load hotel details. Please try again later.'}
        </p>
      </div>
    );
  }

  const imageUrl = getHotelMainImage(hotel);
  const address = formatHotelAddress(hotel);
  const rating = hotel.review_score || 0;
  const ratingColor = getRatingColor(rating);
  const allImages = hotel.images?.map(img => img.url || '').filter(Boolean) || [];

  return (
    <div className="my-8 space-y-6">
      {showGallery && allImages.length > 0 && (
        <ImageGallery images={allImages} />
      )}
      
      <Card className="overflow-hidden border-2 border-primary-200 hover:border-primary-400 transition-all duration-300 shadow-lg">
        <div className="relative h-64 md:h-80 overflow-hidden bg-neutral-100">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={hotel.name || 'Hotel'}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-500 text-sm">No image available</p>
              </div>
            </div>
          )}
          
          {/* Star Rating Badge */}
          {hotel.star_rating && (
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-white/95 backdrop-blur-sm text-neutral-800 border-0 shadow-lg">
                <Star className="h-3.5 w-3.5 mr-1 fill-accent-500 text-accent-500" />
                <span className="font-semibold">{hotel.star_rating}</span>
              </Badge>
            </div>
          )}
          
          {/* Review Score Badge */}
          {rating > 0 && (
            <div className={`absolute top-4 right-4 ${ratingColor.bg} ${ratingColor.text} backdrop-blur-sm rounded-lg px-3 py-1.5 text-sm font-bold shadow-lg`}>
              {rating.toFixed(1)}
            </div>
          )}
        </div>
        
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-2xl mb-2 text-neutral-900">
                {hotel.name}
              </h3>
              
              {address && (
                <div className="flex items-start text-sm text-neutral-600 mb-3">
                  <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0 mt-0.5" />
                  <span className="flex-1">{address}</span>
                </div>
              )}
              
              {hotel.review_count && rating > 0 && (
                <p className="text-sm text-neutral-600 mb-3">
                  <span className="font-semibold">{hotel.review_count.toLocaleString()}</span> review{hotel.review_count !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {hotel.description?.text && (
            <div className="mb-4">
              <p className="text-neutral-700 leading-relaxed line-clamp-3">
                {hotel.description.text.replace(/<[^>]*>/g, '')}
              </p>
            </div>
          )}

          {minPrice !== null && minPrice > 0 ? (
            <div className="mb-4 pb-4 border-b border-neutral-200">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-neutral-500 uppercase tracking-wide">From</span>
                <span className="text-3xl font-bold text-primary-600">
                  ${minPrice.toLocaleString()}
                </span>
                <span className="text-sm text-neutral-600">/ night</span>
              </div>
            </div>
          ) : null}
          
          <a
            href={`/places-to-stay/${hotel.hotel_id}${checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`}
            className="inline-flex items-center justify-center w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            View Hotel Details
            <ExternalLink className="w-4 h-4 ml-2" />
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
