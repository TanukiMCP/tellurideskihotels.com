/**
 * RoomCard Component
 * Professional room display card matching industry-standard hotel booking UX
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Camera, Check, Info, Wifi, BedDouble, Users, Square } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { LiteAPIRate } from '@/lib/liteapi/types';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

interface RoomCardProps {
  rate: LiteAPIRate;
  nights: number;
  onReserve: (rate: LiteAPIRate) => void;
  available?: number;
  hotel?: {
    id: string;
    name: string;
    address: string;
    image: string;
    reviewScore?: number;
  };
  booking?: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
  };
}

export function RoomCard({ rate, nights, onReserve, available, hotel, booking }: RoomCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Extract room details
  const roomName = rate.room_name || 'Standard Room';
  // Extract room images from rate data (if available)
  const images: string[] = (rate as any).images?.map((img: any) => img.url || img).filter(Boolean) || [];
  
  // Pricing: Display retailRate.total (what customer pays)
  // rate.total.amount = Retail total for entire stay (includes 15% commission + taxes)
  // rate.net.amount = Retail per night
  // Commission is already included in these prices via LiteAPI's margin parameter
  const displayTotalPrice = rate.total?.amount || 0;
  const displayPricePerNight = rate.net?.amount || 0;
  const currency = rate.total?.currency || 'USD';
  
  // Check for excluded fees (pay at property)
  const hasExcludedFees = rate.taxes_and_fees && rate.taxes_and_fees.excluded > 0;
  const excludedFeesAmount = rate.taxes_and_fees?.excluded || 0;
  
  // Parse room features from description or use defaults
  const sqFt = 400;
  const maxOccupancy = rate.max_occupancy || 2;
  const bedConfig = rate.bed_types?.[0]?.type || 'Standard Bed';
  
  // Determine refund policy from cancellationPolicies
  const cancellationPolicy = rate.cancellation_policy;
  const isRefundable = cancellationPolicy?.refundableTag === 'RFN' || 
                       rate.cancellation_policy?.free_cancellation_until != null;
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
      <div className="grid md:grid-cols-[400px_1fr] gap-0">
        {/* Image Carousel */}
        <div className="relative h-64 md:h-full bg-neutral-100 group">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImageIndex]}
                alt={`${roomName} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Image Counter Badge */}
              <div className="absolute bottom-4 right-4 bg-neutral-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-semibold">
                <Camera className="w-4 h-4" />
                {images.length}
              </div>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 text-neutral-900" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5 text-neutral-900" />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              <Camera className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Room Details */}
        <div className="p-6 flex flex-col">
          {/* Room Title */}
          <h3 className="text-xl font-bold text-neutral-900 mb-4">
            {roomName}
          </h3>

          {/* Room Features */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <Square className="w-4 h-4 text-neutral-500" />
              <span>{sqFt} sq ft</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <Users className="w-4 h-4 text-neutral-500" />
              <span>Sleeps {maxOccupancy}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <BedDouble className="w-4 h-4 text-neutral-500" />
              <span>{bedConfig}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-neutral-700">
              <Wifi className="w-4 h-4 text-neutral-500" />
              <span>Free WiFi</span>
            </div>
          </div>

          {/* Cancellation Policy */}
          <div className="flex items-center gap-2 mb-3">
            {isRefundable ? (
              <span className="text-sm text-green-700 font-medium">Free cancellation</span>
            ) : (
              <span className="text-sm text-red-700 font-medium">Non-refundable</span>
            )}
            <button className="text-neutral-500 hover:text-neutral-700">
              <Info className="w-4 h-4" />
            </button>
          </div>

          {/* More Details Link */}
          <button className="text-sm text-primary-600 hover:text-primary-700 font-semibold mb-6 text-left">
            More details →
          </button>

          {/* Spacer */}
          <div className="flex-grow"></div>

          {/* Pricing and Reserve Section */}
          <div className="border-t border-neutral-200 pt-4 mt-4">
            {/* Price Display */}
            <div className="mb-4">
              <div className="text-2xl font-bold text-neutral-900 mb-1">
                {formatCurrency(displayPricePerNight, currency)} <span className="text-base font-normal text-neutral-600">nightly</span>
              </div>
              <div className="text-lg font-semibold text-neutral-900">
                {formatCurrency(displayTotalPrice, currency)} <span className="text-sm font-normal text-neutral-600">total</span>
              </div>
              
              {/* Tax & Fee Information */}
              <div className="flex items-center gap-1 text-xs text-neutral-600 mt-2">
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span>Total includes all taxes and fees</span>
              </div>
              
              {available && available <= 3 && (
                <div className="text-sm text-red-600 font-medium mt-2">
                  We have {available} left
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {hotel && booking && (
                <AddToCartButton
                  hotel={hotel}
                  room={{
                    name: roomName,
                    rateId: rate.rate_id,
                    rate,
                  }}
                  booking={{
                    ...booking,
                    nights,
                  }}
                  pricing={{
                    total: displayTotalPrice,
                    perNight: displayPricePerNight,
                    currency,
                  }}
                  className="w-full"
                />
              )}
              <button
                onClick={() => onReserve(rate)}
                className="w-full bg-white border-2 border-[#1a2b49] hover:bg-neutral-50 text-[#1a2b49] py-3 rounded-xl font-bold text-base transition-all"
              >
                Reserve Now
              </button>
            </div>
            <p className="text-xs text-center text-neutral-600 mt-2">
              You will not be charged yet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

