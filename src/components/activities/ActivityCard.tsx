/**
 * Activity Card Component
 * Displays a single Viator activity/tour
 */

import type { ViatorProduct } from '@/lib/viator/types';
import { buildViatorBookingUrl } from '@/lib/viator/client';

interface ActivityCardProps {
  activity: ViatorProduct;
  className?: string;
}

export function ActivityCard({ activity, className = '' }: ActivityCardProps) {
  const bookingUrl = buildViatorBookingUrl(activity);
  const mainImage = activity.images.find(img => img.isCover) || activity.images[0];
  const hasReviews = activity.reviews && activity.reviews.totalReviews > 0;

  return (
    <div className={`group bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 ${className}`}>
      {/* Image */}
      <div className="relative h-56 overflow-hidden bg-neutral-100">
        {mainImage ? (
          <img
            src={mainImage.url}
            alt={activity.productTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Duration Badge */}
        {activity.duration && (
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-semibold text-neutral-900 shadow-card">
            {activity.duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="text-lg font-bold text-neutral-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {activity.productTitle}
        </h3>

        {/* Reviews */}
        {hasReviews && (
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(activity.reviews!.combinedAverageRating)
                      ? 'text-accent-500'
                      : 'text-neutral-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm text-neutral-600">
              {activity.reviews!.combinedAverageRating.toFixed(1)} ({activity.reviews!.totalReviews.toLocaleString()})
            </span>
          </div>
        )}

        {/* Description */}
        {activity.shortDescription && (
          <p className="text-neutral-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {activity.shortDescription}
          </p>
        )}

        {/* Tags */}
        {activity.tags && activity.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {activity.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.tagId}
                className="px-2.5 py-1 bg-neutral-100 text-neutral-700 text-xs font-medium rounded-lg"
              >
                {tag.tag}
              </span>
            ))}
          </div>
        )}

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
          <div>
            <div className="text-xs text-neutral-600 mb-0.5">From</div>
            <div className="text-2xl font-bold text-primary-600">
              {activity.price.priceFormatted}
            </div>
          </div>
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold text-sm shadow-card hover:shadow-card-hover hover:bg-primary-700 transition-all duration-300"
          >
            Book on Viator
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

