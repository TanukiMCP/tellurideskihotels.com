/**
 * RoomCard Component
 * Professional room display card matching industry-standard hotel booking UX
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Camera, Check, Info, Wifi, BedDouble, Users, Square, Shield } from 'lucide-react';
import { formatCurrency, formatRoomTitle } from '@/lib/utils';
import type { LiteAPIRate } from '@/lib/liteapi/types';
import { useCartStore } from '@/stores/cartStore';

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
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const addItem = useCartStore((state) => state.addItem);
  
  // Extract room details
  const originalRoomName = rate.room_name || 'Standard Room';
  const roomName = formatRoomTitle(originalRoomName);
  // Extract room images from rate data (if available)
  // Images can be either an array of URL strings or an array of objects with url property
  const images: string[] = (rate as any).images?.map((img: any) => {
    if (typeof img === 'string') return img;
    return img?.url || img;
  }).filter(Boolean) || [];
  
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

  // Format price for screen readers
  const formatPriceForAria = (amount: number, currency: string): string => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const formatted = formatter.format(amount);
    // Convert "$1,234.56" to "One thousand two hundred thirty-four dollars and fifty-six cents"
    // Simplified version - just read the number
    return `${formatted} ${currency}`;
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
                loading="lazy"
                style={{
                  imageRendering: 'crisp-edges',
                }}
              />
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="text-white font-semibold text-sm bg-black/50 px-4 py-2 rounded-lg">
                  View all photos
                </span>
              </div>
              
              {/* Image Counter Badge */}
              <div className="absolute bottom-4 right-4 bg-neutral-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-semibold">
                <Camera className="w-4 h-4" aria-hidden="true" />
                <span>{images.length}</span>
              </div>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#2D5F4F]"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 text-neutral-900" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-[#2D5F4F]"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5 text-neutral-900" />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400">
              <Camera className="w-12 h-12" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Room Details */}
        <div className="p-6 flex flex-col">
          {/* Room Title */}
          <div className="mb-4">
            <h3 
              className="text-[28px] leading-[32px] font-bold text-[#2C2C2C] mb-3"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {roomName}
            </h3>
            
            {/* Non-Refundable Badge - Prominent */}
            {!isRefundable && (
              <div 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border-2 mb-3"
                style={{
                  borderColor: '#D14343',
                  backgroundColor: '#FFF5F5',
                }}
                role="alert"
                aria-label="Non-refundable rate - This rate cannot be cancelled or refunded"
              >
                <Info className="w-4 h-4" style={{ color: '#D14343' }} aria-hidden="true" />
                <span className="text-sm font-semibold" style={{ color: '#D14343' }}>
                  Non-refundable
                </span>
                <div 
                  className="group relative"
                  role="tooltip"
                >
                  <Info 
                    className="w-3.5 h-3.5 cursor-help" 
                    style={{ color: '#D14343' }}
                    aria-label="This rate cannot be cancelled or refunded"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Room Features - 2x2 Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Square 
                className="w-6 h-6" 
                style={{ color: '#2D5F4F', strokeWidth: 2 }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-neutral-700">{sqFt} sq ft</span>
            </div>
            <div className="flex items-center gap-2">
              <Users 
                className="w-6 h-6" 
                style={{ color: '#2D5F4F', strokeWidth: 2 }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-neutral-700">Sleeps {maxOccupancy}</span>
            </div>
            <div className="flex items-center gap-2">
              <BedDouble 
                className="w-6 h-6" 
                style={{ color: '#2D5F4F', strokeWidth: 2 }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-neutral-700">{bedConfig}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi 
                className="w-6 h-6" 
                style={{ color: '#2D5F4F', strokeWidth: 2 }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-neutral-700">Free WiFi</span>
            </div>
          </div>

          {/* Cancellation Policy - Only show if refundable */}
          {isRefundable && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-green-700 font-medium">Free cancellation</span>
              <button 
                className="text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] rounded"
                aria-label="Cancellation policy information"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* More Details Link */}
          <button 
            className="text-sm text-[#2D5F4F] hover:text-[#255040] font-semibold mb-6 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] rounded"
            aria-label="View more room details"
          >
            More details →
          </button>

          {/* Spacer */}
          <div className="flex-grow"></div>

          {/* Pricing and Reserve Section */}
          <div 
            className="border-t border-neutral-200 pt-6 mt-4"
            style={{ backgroundColor: '#F8F6F3' }}
          >
            <div className="p-4 rounded-lg">
              {/* Price Display - Total is HERO */}
              <div className="mb-6">
                <div 
                  className="text-[32px] font-bold mb-2"
                  style={{ color: '#2D5F4F' }}
                  aria-label={`Total price: ${formatPriceForAria(displayTotalPrice, currency)}`}
                >
                  {formatCurrency(displayTotalPrice, currency)}
                </div>
                <div className="text-lg font-normal text-neutral-600 mb-3">
                  {formatCurrency(displayPricePerNight, currency)} per night
                </div>
                
                {/* Tax & Fee Information */}
                <div className="flex items-center gap-1 text-xs text-neutral-500 italic mb-3">
                  <Check className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
                  <span>Total includes all taxes and fees</span>
                </div>
                
                {available && available <= 3 && (
                  <div className="text-sm text-red-600 font-medium mt-2">
                    We have {available} left
                  </div>
                )}
              </div>

              {/* Primary CTA - Reserve Now */}
              <div className="space-y-3">
                <button
                  onClick={() => onReserve(rate)}
                  className="w-full h-[52px] rounded-lg font-semibold text-base text-white transition-all duration-200 hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] focus:ring-offset-2"
                  style={{
                    backgroundColor: '#2D5F4F',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#255040';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(45, 95, 79, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2D5F4F';
                    e.currentTarget.style.boxShadow = '';
                  }}
                  aria-label={`Reserve ${roomName} for ${formatPriceForAria(displayTotalPrice, currency)}`}
                >
                  Reserve Now
                </button>
                
                {/* Secondary Option - Add to Cart as text link */}
                {hotel && booking && (
                  <div className="text-center">
                    <button
                      onClick={() => {
                        addItem({
                          hotel,
                          room: {
                            name: roomName,
                            rateId: rate.rate_id,
                            rate,
                          },
                          booking: {
                            ...booking,
                            nights,
                          },
                          pricing: {
                            total: displayTotalPrice,
                            perNight: displayPricePerNight,
                            currency,
                          },
                        });
                        setIsAddedToCart(true);
                        setTimeout(() => setIsAddedToCart(false), 3000);
                      }}
                      disabled={isAddedToCart}
                      className="text-sm text-[#2D5F4F] hover:text-[#255040] font-medium underline transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] rounded disabled:opacity-50"
                    >
                      {isAddedToCart ? 'Added to cart' : 'Or add to cart'}
                    </button>
                  </div>
                )}
              </div>
              
              {/* Prominent "You will not be charged yet" Message */}
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <div className="flex items-center justify-center gap-2 text-sm font-medium" style={{ color: '#2D5F4F' }}>
                  <Shield className="w-4 h-4" aria-hidden="true" />
                  <span>You will not be charged yet</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

