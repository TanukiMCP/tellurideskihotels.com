import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { ImageWithLoading } from '@/components/shared/ImageWithLoading';

// Hide scrollbar styles
const scrollbarHideStyles: React.CSSProperties = {
  scrollbarWidth: 'thin',
  scrollbarColor: '#d1d5db transparent',
  msOverflowStyle: 'none',
} as React.CSSProperties & { WebkitScrollbar?: { display: string } };

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageGallery({ images, alt, className = '' }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFullscreen) {
        if (e.key === 'Escape') {
          setIsFullscreen(false);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToPrevious();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, goToNext, goToPrevious]);

  // Scroll thumbnail into view when current index changes
  useEffect(() => {
    if (thumbnailRef.current) {
      const thumbnail = thumbnailRef.current.children[currentIndex] as HTMLElement;
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  return (
    <>
      <div className={`space-y-4 ${className}`}>
        {/* Main Image Display */}
        <div className="relative w-full group">
          <div className="relative w-full h-[500px] md:h-[600px] rounded-xl overflow-hidden bg-neutral-100 shadow-lg">
            <ImageWithLoading
              src={currentImage}
              alt={`${alt} - Image ${currentIndex + 1}`}
              className="w-full h-full object-cover"
              priority={currentIndex === 0}
            />

            {/* Image Counter */}
            <div className="absolute top-4 right-4 bg-neutral-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold">
              <span>{currentIndex + 1}</span>
              <span className="text-neutral-400">/</span>
              <span>{images.length}</span>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute top-4 left-4 bg-neutral-900/80 backdrop-blur-sm hover:bg-neutral-900 text-white rounded-lg p-2.5 transition-all opacity-0 group-hover:opacity-100"
              aria-label="View fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-neutral-900" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-neutral-900" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="relative">
            <div
              ref={thumbnailRef}
              className="flex gap-2 overflow-x-auto pb-2 scroll-smooth [&::-webkit-scrollbar]:hidden"
              style={scrollbarHideStyles}
            >
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-primary-600 ring-2 ring-primary-200 shadow-md'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <img
                    src={img}
                    alt={`${alt} thumbnail ${index + 1}`}
                    className={`w-24 h-24 md:w-28 md:h-28 object-cover transition-opacity ${
                      index === currentIndex ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                    }`}
                    loading="lazy"
                  />
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-primary-600/20 pointer-events-none" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsFullscreen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 transition-colors z-10"
            aria-label="Close fullscreen"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Image Counter in Fullscreen */}
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold z-10">
            <span>{currentIndex + 1}</span>
            <span className="text-neutral-400">/</span>
            <span>{images.length}</span>
          </div>

          {/* Main Image */}
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={currentImage}
              alt={`${alt} - Image ${currentIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />

            {/* Navigation Arrows in Fullscreen */}
            {images.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-neutral-900" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-neutral-900" />
                </button>
              </>
            )}

            {/* Thumbnail Strip in Fullscreen */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
                <div 
                  className="flex gap-2 overflow-x-auto max-w-[90vw] [&::-webkit-scrollbar]:hidden"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#ffffff transparent',
                    msOverflowStyle: 'none',
                  }}
                >
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`flex-shrink-0 relative rounded overflow-hidden border-2 transition-all ${
                        index === currentIndex
                          ? 'border-white ring-2 ring-white/50'
                          : 'border-transparent hover:border-white/50'
                      }`}
                      aria-label={`View image ${index + 1}`}
                    >
                      <img
                        src={img}
                        alt={`${alt} thumbnail ${index + 1}`}
                        className="w-16 h-16 object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

