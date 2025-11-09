/**
 * Product Details Component
 * Displays comprehensive product information from Viator API
 * All browsing and research happens on-site, only final booking redirects to Viator
 */

import { useState, useEffect } from 'react';
import type { ViatorProduct } from '@/lib/viator/types';
import { formatDuration, formatPrice, buildViatorBookingUrl } from '@/lib/viator/client';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface ProductDetailsProps {
  productCode: string;
}

export function ProductDetails({ productCode }: ProductDetailsProps) {
  const [product, setProduct] = useState<ViatorProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/viator/product/${productCode}`);
        
        if (!response.ok) {
          throw new Error('Failed to load product details');
        }
        
        const data = await response.json();
        setProduct(data.product);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productCode]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Unable to Load Activity</h2>
        <p className="text-neutral-600 mb-6">{error || 'This activity could not be found.'}</p>
        <a
          href="/things-to-do"
          className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Activities
        </a>
      </div>
    );
  }

  const images = product.images || [];
  const mainImage = images.find(img => img.isCover) || images[0];
  const selectedImage = images[selectedImageIndex] || mainImage;
  const imageUrl = selectedImage?.variants?.find(v => v.width >= 800)?.url || selectedImage?.variants?.[0]?.url;
  const hasReviews = product.reviews && product.reviews.totalReviews > 0;
  const durationText = formatDuration(product.duration);
  const priceText = formatPrice(product.pricing);
  const bookingUrl = buildViatorBookingUrl(product);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-neutral-600">
        <a href="/things-to-do" className="hover:text-primary-600 transition-colors">Things to Do</a>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-neutral-900 font-medium">{product.title}</span>
      </nav>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Images and Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-card">
            {/* Main Image */}
            <div className="relative h-96 bg-neutral-100">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={selectedImage.caption || product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="p-4 bg-neutral-50">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {images.map((image, index) => {
                    const thumbUrl = image.variants?.find(v => v.width >= 200)?.url || image.variants?.[0]?.url;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index
                            ? 'border-primary-600 ring-2 ring-primary-200'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {thumbUrl && (
                          <img
                            src={thumbUrl}
                            alt={image.caption || `View ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Overview */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-card">
            <h1 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              {product.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-6 pb-6 border-b border-neutral-200">
              {/* Reviews */}
              {hasReviews && product.reviews && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(product.reviews!.combinedAverageRating)
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
                  <span className="font-semibold text-neutral-900">
                    {product.reviews.combinedAverageRating.toFixed(1)}
                  </span>
                  <span className="text-neutral-600">
                    ({product.reviews.totalReviews.toLocaleString()} reviews)
                  </span>
                </div>
              )}

              {/* Duration */}
              <div className="flex items-center gap-2 text-neutral-700">
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{durationText}</span>
              </div>

              {/* Confirmation Type */}
              {product.confirmationType && (
                <div className="flex items-center gap-2 text-neutral-700">
                  <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">
                    {product.confirmationType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </div>
              )}
            </div>

            {/* Flags/Features */}
            {product.flags && product.flags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-6">
                {product.flags.map((flag) => (
                  <span
                    key={flag}
                    className="px-3 py-1.5 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg"
                  >
                    {flag.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-card">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">About This Activity</h2>
            <div className="prose prose-neutral max-w-none">
              <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          </div>

          {/* Itinerary Type */}
          {product.itineraryType && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-card">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Tour Type</h2>
              <p className="text-neutral-700">
                {product.itineraryType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
              </p>
            </div>
          )}

          {/* Cancellation Policy */}
          {product.cancellationPolicy && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-card">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Cancellation Policy</h2>
              <p className="text-neutral-700 mb-4">{product.cancellationPolicy.description}</p>
              
              {(product.cancellationPolicy.cancelIfBadWeather || product.cancellationPolicy.cancelIfInsufficientTravelers) && (
                <div className="space-y-2 pt-4 border-t border-neutral-200">
                  {product.cancellationPolicy.cancelIfBadWeather && (
                    <div className="flex items-start gap-2 text-sm text-neutral-700">
                      <svg className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Cancellations due to bad weather are eligible for a full refund</span>
                    </div>
                  )}
                  {product.cancellationPolicy.cancelIfInsufficientTravelers && (
                    <div className="flex items-start gap-2 text-sm text-neutral-700">
                      <svg className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Cancellations due to insufficient travelers are eligible for a full refund</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Supplier Information */}
          {product.supplier && (
            <div className="bg-white rounded-2xl border border-neutral-200 p-8 shadow-card">
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">Tour Operator</h2>
              <p className="text-neutral-700 font-medium">{product.supplier.name}</p>
            </div>
          )}
        </div>

        {/* Right Column - Booking Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-card sticky top-24">
            {/* Price */}
            <div className="mb-6 pb-6 border-b border-neutral-200">
              <div className="text-sm text-neutral-600 mb-1">From</div>
              <div className="text-4xl font-bold text-primary-600 mb-2">{priceText}</div>
              <div className="text-sm text-neutral-600">per person</div>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-6 pb-6 border-b border-neutral-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-neutral-700">Best Price Guarantee</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-neutral-700">Free Cancellation</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-neutral-700">Instant Confirmation</span>
              </div>
              {hasReviews && product.reviews && (
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-accent-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm text-neutral-700">
                    {product.reviews.totalReviews.toLocaleString()} Verified Reviews
                  </span>
                </div>
              )}
            </div>

            {/* Book on Viator CTA */}
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-card hover:shadow-card-hover hover:bg-primary-700 transition-all duration-300"
            >
              Book on Viator
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            <p className="text-xs text-neutral-500 text-center mt-4">
              You will be redirected to Viator to complete your booking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

