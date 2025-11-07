import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Star, ThumbsUp, ThumbsDown, User } from 'lucide-react';

interface Review {
  rating: number;
  title?: string;
  text?: string;
  pros?: string;
  cons?: string;
  date?: string;
  author?: string;
  helpful?: number;
}

interface HotelReviewsListProps {
  hotelId: string;
  averageRating?: number;
  reviewCount?: number;
}

export function HotelReviewsList({ hotelId, averageRating = 0, reviewCount = 0 }: HotelReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch(`/api/hotels/reviews?hotelId=${hotelId}&limit=20`);
        if (response.ok) {
          const data = await response.json();
          console.log('[HotelReviewsList] Full API response:', data);
          console.log('[HotelReviewsList] First review:', data.data?.[0]);
          setReviews(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReviews();
  }, [hotelId]);

  const displayedReviews = showAll ? reviews : reviews.slice(0, 3);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Guest Reviews</h2>
            {reviewCount > 0 && (
              <p className="text-neutral-600 mt-1">
                {reviewCount.toLocaleString()} review{reviewCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          {averageRating > 0 && (
            <div className="flex items-center gap-3 bg-primary-50 px-6 py-3 rounded-xl border border-primary-200">
              <div>
                <div className="text-xs text-neutral-600 mb-1">Average Rating</div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-primary-600">{averageRating.toFixed(1)}</span>
                  <span className="text-neutral-500">/ 10</span>
                </div>
              </div>
              <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(averageRating / 2)
                        ? 'fill-accent-500 text-accent-500'
                        : 'text-neutral-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 rounded-lg border border-neutral-200">
            <User className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-600">No reviews available yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {displayedReviews.map((review, index) => {
                const hasTextContent = review.text || review.title || review.pros || review.cons;
                
                return (
                  <div
                    key={index}
                    className="bg-neutral-50 rounded-lg p-5 border border-neutral-200 hover:border-primary-300 transition-colors"
                  >
                    {/* Rating & Date */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary-600 text-white px-3 py-1 rounded-lg font-bold text-sm">
                          {review.rating ? `${review.rating}/10` : 'N/A'}
                        </div>
                        {review.author && (
                          <span className="text-sm font-medium text-neutral-700">{review.author}</span>
                        )}
                      </div>
                      {review.date && (
                        <span className="text-xs text-neutral-500">
                          {new Date(review.date).toLocaleDateString('en-US', {
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    {review.title && (
                      <h4 className="font-semibold text-neutral-900 mb-3 text-base">{review.title}</h4>
                    )}

                    {/* Review Text */}
                    {review.text && (
                      <p className="text-neutral-700 leading-loose text-sm mb-4 whitespace-pre-line">{review.text}</p>
                    )}

                    {/* Rating-only state */}
                    {!hasTextContent && (
                      <p className="text-neutral-500 text-sm italic">Guest provided a rating without written feedback.</p>
                    )}

                    {/* Pros & Cons */}
                    {(review.pros || review.cons) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-neutral-200">
                        {review.pros && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <ThumbsUp className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-semibold text-neutral-900">Pros</span>
                            </div>
                            <p className="text-sm text-neutral-700 leading-loose whitespace-pre-line">{review.pros}</p>
                          </div>
                        )}
                        {review.cons && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <ThumbsDown className="w-4 h-4 text-red-600" />
                              <span className="text-sm font-semibold text-neutral-900">Cons</span>
                            </div>
                            <p className="text-sm text-neutral-700 leading-loose whitespace-pre-line">{review.cons}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Show More Button */}
            {reviews.length > 3 && (
              <div className="text-center mt-6">
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="px-6 py-2 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                >
                  {showAll ? 'Show Less' : `Show All ${reviews.length} Reviews`}
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

