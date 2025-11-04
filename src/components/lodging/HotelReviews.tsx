import { Star } from 'lucide-react';
import { getRatingColor } from '@/lib/constants';

export interface Review {
  rating?: number;
  comment?: string;
  author?: string;
  date?: string;
}

export interface HotelReviewsProps {
  reviews?: Review[];
  averageRating?: number;
  reviewCount?: number;
}

export function HotelReviews({ reviews, averageRating, reviewCount }: HotelReviewsProps) {
  if (!averageRating && (!reviews || reviews.length === 0)) {
    return null;
  }

  const ratingColor = averageRating ? getRatingColor(averageRating) : null;

  return (
    <div className="space-y-6">
      {averageRating && (
        <div className="flex items-center gap-4">
          <div className={`${ratingColor?.bg} ${ratingColor?.text} ${ratingColor?.border} border rounded-lg px-4 py-2`}>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 fill-current" />
              <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
            </div>
          </div>
          {reviewCount && (
            <div>
              <p className="text-lg font-semibold">{reviewCount} Review{reviewCount !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}

      {reviews && reviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Guest Reviews</h3>
          {reviews.map((review, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                {review.rating && (
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.round(review.rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="ml-2 font-medium">{review.rating}</span>
                  </div>
                )}
                {review.author && (
                  <span className="text-sm text-gray-600">by {review.author}</span>
                )}
                {review.date && (
                  <span className="text-sm text-gray-500">{review.date}</span>
                )}
              </div>
              {review.comment && (
                <p className="text-gray-700">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

