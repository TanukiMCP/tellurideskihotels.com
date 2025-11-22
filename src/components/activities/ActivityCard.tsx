/**
 * Activity Card Component
 * Displays a single Viator activity/tour
 * Pixel-perfect implementation per design audit
 */

import type { ViatorProductSummary } from '@/lib/viator/types';
import { formatDuration, formatPrice } from '@/lib/viator/client';
import { getExperienceCategoriesSync, getCategoryLabel } from '@/lib/category-mapper';

interface ActivityCardProps {
  activity: ViatorProductSummary;
  className?: string;
}

export function ActivityCard({ activity, className = '' }: ActivityCardProps) {
  const detailsUrl = `/things-to-do/${activity.productCode}`;
  const images = activity.images || [];
  const mainImage = images.find(img => img.isCover) || images[0];
  const imageUrl = mainImage?.variants?.find(v => v.width >= 400)?.url || mainImage?.variants?.[0]?.url;
  const hasReviews = activity.reviews && activity.reviews.totalReviews > 0;
  const durationText = formatDuration(activity.duration);
  const priceText = formatPrice(activity.pricing);
  const categories = getExperienceCategoriesSync(activity.productCode);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Cache pricing data for details page
    if (activity.pricing) {
      try {
        sessionStorage.setItem(`viator-pricing-${activity.productCode}`, JSON.stringify(activity.pricing));
      } catch (err) {
        console.warn('Failed to cache pricing:', err);
      }
    }
  };

  // Get rating for star display
  const rating = hasReviews && activity.reviews 
    ? activity.reviews.combinedAverageRating 
    : 0;
  const fullStars = Math.round(rating);

  return (
    <div 
      className={`group bg-white rounded-xl overflow-hidden border border-[#E5E5E5] shadow-[0_2px_12px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 hover:border-[#D5D5D5] transition-all duration-200 flex flex-col cursor-pointer ${className}`}
    >
      {/* Image - BUG #2: Fixed aspect ratio */}
      <a href={detailsUrl} onClick={handleClick} className="block">
        <div className="relative w-full h-[200px] overflow-hidden bg-neutral-100 flex-shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={activity.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
          {/* Duration Badge - BUG #1: Pixel-perfect positioning and styling */}
          <div 
            className="absolute top-4 left-4 bg-[rgba(255,255,255,0.95)] px-2 py-1.5 rounded-[20px] text-[13px] font-semibold text-[#2C2C2C] shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
            style={{ top: '16px', left: '16px' }}
          >
          {durationText}
        </div>
      </div>
      </a>

      {/* Content */}
      <div className="p-5 flex flex-col">
        {/* Title - BUG #3: 2-line clamping */}
        <a href={detailsUrl} onClick={handleClick} className="block">
          <h3 className="text-[18px] font-bold text-[#2C2C2C] mb-3 group-hover:text-[#2D5F4F] transition-colors leading-[1.3] line-clamp-2">
            {activity.title}
          </h3>
        </a>

        {/* Reviews - BUG #4: Star rating alignment */}
        {hasReviews && activity.reviews && (
          <div className="flex items-center gap-2 mb-4 flex-shrink-0">
            <div className="flex items-center gap-[3px]">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < fullStars ? 'text-[#F4A460]' : 'text-[#E5E5E5]'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[15px] font-semibold text-[#2C2C2C] leading-none">
              {activity.reviews.combinedAverageRating.toFixed(1)}
            </span>
            <span className="text-[15px] font-normal text-[#999999] leading-none">
              ({activity.reviews.totalReviews.toLocaleString()})
            </span>
          </div>
        )}

        {/* Categories - Display category badges */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
            {categories.slice(0, 2).map(category => (
              <span
                key={category}
                className="px-3 py-1 bg-[#E8F2ED] text-[#2D5F4F] text-[11px] font-semibold uppercase rounded-[4px] border border-[#D5E8DD] tracking-[0.5px] leading-none"
              >
                {getCategoryLabel(category)}
              </span>
            ))}
          </div>
        )}

        {/* Description - BUG #5: 3-line clamping */}
        {activity.description && (
          <p className="text-[14px] font-normal text-[#666666] mb-4 leading-[1.6] line-clamp-3">
            {activity.description}
          </p>
        )}

        {/* Feature Tags - BUG #6: Brand colors */}
        {activity.flags && activity.flags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5 flex-shrink-0">
            {activity.flags.slice(0, 3).map((flag) => (
              <span
                key={flag}
                className="px-3 py-1.5 bg-[#E8F2ED] text-[#2D5F4F] text-[11px] font-semibold uppercase rounded-[4px] border border-[#D5E8DD] tracking-[0.5px] leading-none"
              >
                {flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Spacer to push footer to bottom - only grow if needed */}
        <div className="flex-grow"></div>

        {/* Price and CTA - BUG #7: Perfect layout */}
        <div className="flex items-center justify-between gap-4 pt-5 border-t border-[#E5E5E5] mt-5 flex-shrink-0">
          <div className="flex flex-col items-start min-w-0 flex-shrink">
            <div className="text-[13px] font-normal text-[#999999] mb-1 leading-none">From</div>
            <div className="text-[24px] font-bold text-[#2D5F4F] leading-none">
              {priceText}
            </div>
          </div>
          <a
            href={detailsUrl}
            onClick={(e) => {
              e.stopPropagation();
              handleClick(e);
            }}
            className="inline-flex items-center gap-1.5 bg-[#2D5F4F] hover:bg-[#1F4436] text-white px-4 py-2.5 rounded-md font-semibold text-[14px] shadow-[0_4px_8px_rgba(45,95,79,0.2)] hover:shadow-[0_4px_12px_rgba(45,95,79,0.3)] hover:-translate-y-[1px] active:scale-[0.98] transition-all duration-200 whitespace-nowrap flex-shrink-0"
          >
            View Details
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

    </div>
  );
}
