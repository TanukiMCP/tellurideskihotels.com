import { useState, useEffect, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface ImageWithLoadingProps {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
  onLoadSuccess?: () => void;
  priority?: boolean; // If true, load eagerly instead of lazy
}

export function ImageWithLoading({ src, alt, className, onError, onLoadSuccess, priority = false }: ImageWithLoadingProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset loading state when src changes
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  // Check if image is already loaded (cached) - onLoad won't fire for cached images
  useEffect(() => {
    // Use setTimeout to ensure the img element is rendered first
    const checkComplete = setTimeout(() => {
      if (imgRef.current && imgRef.current.complete && imgRef.current.naturalHeight !== 0) {
        setLoading(false);
        setError(false);
        onLoadSuccess?.();
      }
    }, 0);

    return () => clearTimeout(checkComplete);
  }, [src, onLoadSuccess]);

  // Timeout fallback: if image doesn't load within 15 seconds, mark as error
  // Increased timeout for slow CDN responses
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn(`[ImageWithLoading] Image failed to load within timeout: ${src}`);
        setLoading(false);
        setError(true);
        onError?.();
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [loading, src, onError]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoadSuccess?.();
  };

  const handleError = () => {
    console.error(`[ImageWithLoading] Image failed to load: ${src}`);
    setLoading(false);
    setError(true);
    onError?.();
  };

  // If no src provided, return null
  if (!src || src.trim() === '') {
    return null;
  }

  // If error, show a subtle placeholder instead of error message
  if (error) {
    return (
      <div className={`bg-gray-100 ${className}`} />
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        {...(priority ? { fetchpriority: 'high' as const } : {})}
      />
    </div>
  );
}

