import { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface ImageWithLoadingProps {
  src: string;
  alt: string;
  className?: string;
  onError?: () => void;
}

export function ImageWithLoading({ src, alt, className, onError }: ImageWithLoadingProps) {
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
  };

  const handleError = () => {
    console.error(`[ImageWithLoading] Image failed to load: ${src}`);
    setLoading(false);
    setError(true);
    onError?.();
  };

  // If no src provided, show error immediately
  if (!src || src.trim() === '') {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 ${className}`}>
        <p className="text-gray-500 text-sm font-medium">This hotel has no images provided</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 ${className}`}>
        <p className="text-gray-500 text-sm font-medium">This hotel has no images provided</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <LoadingSpinner size="sm" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

