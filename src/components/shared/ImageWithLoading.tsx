import { useState, useEffect } from 'react';
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

  // Reset loading state when src changes
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [src]);

  // Timeout fallback: if image doesn't load within 30 seconds, show error
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn(`[ImageWithLoading] Image failed to load within timeout: ${src}`);
        setLoading(false);
        setError(true);
        onError?.();
      }
    }, 30000);

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

  // If no src provided or error, return null (don't render anything)
  if (!src || src.trim() === '' || error) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </div>
  );
}

