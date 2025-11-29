'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2, Camera, ExternalLink, Grid3X3 } from 'lucide-react';
import { optimizeImageUrl, ImageSizes } from '@/lib/image-optimization';

/**
 * BlogImage Component
 * Unified image display widget for MDX blog posts with consistent sizing and rich content support.
 * 
 * Supports:
 * - Single, double, and triple image layouts
 * - Gallery mode with thumbnails and lightbox
 * - Portrait and landscape orientation handling
 * - Captions, credits, and alt text
 * - Fullscreen/lightbox view
 */

export interface ImageItem {
  /** Image URL */
  src: string;
  /** Alt text for accessibility (required) */
  alt: string;
  /** Optional caption displayed below the image */
  caption?: string;
  /** Photographer name for attribution */
  photographer?: string;
  /** Photographer profile URL */
  photographerUrl?: string;
  /** Image orientation hint - auto-detected if not provided */
  orientation?: 'landscape' | 'portrait' | 'square';
  /** Source platform for attribution (e.g., "Pexels", "Unsplash") */
  source?: string;
}

export interface BlogImageProps {
  /** Single image or array of images */
  images: ImageItem | ImageItem[];
  /** Display mode - auto-detected based on image count if not specified */
  mode?: 'single' | 'double' | 'triple' | 'gallery';
  /** Gallery-specific: show thumbnail strip */
  showThumbnails?: boolean;
  /** Gallery-specific: enable auto-play slideshow */
  autoPlay?: boolean;
  /** Gallery-specific: slideshow interval in ms (default: 5000) */
  autoPlayInterval?: number;
  /** Overall caption for the image group */
  groupCaption?: string;
  /** Aspect ratio for consistent sizing - default is 16:9 for landscape, 3:4 for portrait */
  aspectRatio?: '16:9' | '4:3' | '3:2' | '1:1' | '3:4' | '9:16' | 'auto';
  /** Allow clicking to open fullscreen lightbox */
  lightbox?: boolean;
  /** Container max height (default: 500px for single, 400px for grids) */
  maxHeight?: string;
  /** Show image count indicator */
  showCount?: boolean;
  /** Custom class name for styling */
  className?: string;
}

// Image loading component with placeholder
function ImageWithLoading({ 
  src, 
  alt, 
  className,
  aspectRatio,
  onLoad,
  priority = false 
}: { 
  src: string; 
  alt: string; 
  className?: string;
  aspectRatio?: string;
  onLoad?: () => void;
  priority?: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  
  // Optimize image URL for high quality
  const optimizedSrc = optimizeImageUrl(src, {
    width: ImageSizes.large.width,
    quality: 90,
  });

  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [optimizedSrc]);

  useEffect(() => {
    const checkComplete = setTimeout(() => {
      if (imgRef.current?.complete && imgRef.current?.naturalHeight !== 0) {
        setLoading(false);
        setError(false);
        onLoad?.();
      }
    }, 0);
    return () => clearTimeout(checkComplete);
  }, [optimizedSrc, onLoad]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
    onLoad?.();
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <div className={`bg-neutral-100 flex items-center justify-center ${className}`}>
        <div className="text-neutral-400 text-center p-4">
          <Camera className="w-8 h-8 mx-auto mb-2" />
          <span className="text-xs">Image unavailable</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-neutral-100 ${className}`}>
      <img
        ref={imgRef}
        src={optimizedSrc}
        alt={alt}
        className="w-full h-full object-cover"
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  );
}

// Image caption and credit component
function ImageCaption({ 
  image, 
  showSource = true 
}: { 
  image: ImageItem; 
  showSource?: boolean;
}) {
  if (!image.caption && !image.photographer) return null;

  return (
    <div className="mt-2 space-y-1">
      {image.caption && (
        <p className="text-sm text-neutral-600 leading-relaxed">
          {image.caption}
        </p>
      )}
      {image.photographer && (
        <p className="text-xs text-neutral-500 flex items-center gap-1">
          <Camera className="w-3 h-3" />
          Photo by{' '}
          {image.photographerUrl ? (
            <a 
              href={image.photographerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 hover:underline"
            >
              {image.photographer}
            </a>
          ) : (
            <span>{image.photographer}</span>
          )}
          {showSource && image.source && (
            <span> via {image.source}</span>
          )}
        </p>
      )}
    </div>
  );
}

// Single image display
function SingleImage({ 
  image, 
  aspectRatio,
  maxHeight,
  onOpenLightbox 
}: { 
  image: ImageItem;
  aspectRatio: string;
  maxHeight?: string;
  onOpenLightbox?: () => void;
}) {
  const aspectClass = getAspectClass(aspectRatio);
  
  return (
    <div className="group">
      <div 
        className={`relative overflow-hidden rounded-xl border border-neutral-200 shadow-md ${aspectClass}`}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <ImageWithLoading
          src={image.src}
          alt={image.alt}
          className="w-full h-full"
          priority={true}
        />
        
        {/* Fullscreen button */}
        {onOpenLightbox && (
          <button
            onClick={onOpenLightbox}
            className="absolute top-3 right-3 bg-neutral-900/70 backdrop-blur-sm hover:bg-neutral-900 text-white rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            aria-label="View fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <ImageCaption image={image} />
    </div>
  );
}

// Double/Triple grid layout
function ImageGrid({ 
  images, 
  aspectRatio,
  maxHeight,
  onOpenLightbox 
}: { 
  images: ImageItem[];
  aspectRatio: string;
  maxHeight?: string;
  onOpenLightbox?: (index: number) => void;
}) {
  const count = images.length;
  const gridClass = count === 2 
    ? 'grid-cols-1 sm:grid-cols-2' 
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  const aspectClass = getAspectClass(aspectRatio);
  
  return (
    <div className={`grid ${gridClass} gap-4`}>
      {images.map((image, index) => (
        <div key={index} className="group">
          <div 
            className={`relative overflow-hidden rounded-xl border border-neutral-200 shadow-md cursor-pointer ${aspectClass}`}
            onClick={() => onOpenLightbox?.(index)}
            style={maxHeight ? { maxHeight } : undefined}
          >
            <ImageWithLoading
              src={image.src}
              alt={image.alt}
              className="w-full h-full"
            />
            
            {/* Fullscreen button */}
            {onOpenLightbox && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLightbox(index);
                }}
                className="absolute top-3 right-3 bg-neutral-900/70 backdrop-blur-sm hover:bg-neutral-900 text-white rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="View fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <ImageCaption image={image} />
        </div>
      ))}
    </div>
  );
}

// Gallery with thumbnails and navigation
function GalleryView({ 
  images,
  aspectRatio,
  maxHeight,
  showThumbnails,
  showCount,
  autoPlay,
  autoPlayInterval,
  onOpenLightbox
}: {
  images: ImageItem[];
  aspectRatio: string;
  maxHeight?: string;
  showThumbnails: boolean;
  showCount: boolean;
  autoPlay: boolean;
  autoPlayInterval: number;
  onOpenLightbox?: (index: number) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const aspectClass = getAspectClass(aspectRatio);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || images.length <= 1) return;
    
    const interval = setInterval(goToNext, autoPlayInterval);
    return () => clearInterval(interval);
  }, [autoPlay, autoPlayInterval, goToNext, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  // Scroll thumbnail into view
  useEffect(() => {
    if (thumbnailRef.current && showThumbnails) {
      const thumbnail = thumbnailRef.current.children[currentIndex] as HTMLElement;
      thumbnail?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex, showThumbnails]);

  const currentImage = images[currentIndex];

  return (
    <div className="space-y-4">
      {/* Main image */}
      <div className="group relative">
        <div 
          className={`relative overflow-hidden rounded-xl border border-neutral-200 shadow-lg ${aspectClass}`}
          style={maxHeight ? { maxHeight } : undefined}
        >
          <ImageWithLoading
            src={currentImage.src}
            alt={currentImage.alt}
            className="w-full h-full"
            priority={currentIndex === 0}
          />

          {/* Image counter */}
          {showCount && images.length > 1 && (
            <div className="absolute top-3 right-14 bg-neutral-900/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm font-medium z-10">
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>{currentIndex + 1}</span>
              <span className="text-neutral-400">/</span>
              <span>{images.length}</span>
            </div>
          )}

          {/* Fullscreen button */}
          {onOpenLightbox && (
            <button
              onClick={() => onOpenLightbox(currentIndex)}
              className="absolute top-3 right-3 bg-neutral-900/70 backdrop-blur-sm hover:bg-neutral-900 text-white rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="View fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Navigation arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 text-neutral-900" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 text-neutral-900" />
              </button>
            </>
          )}
        </div>

        {/* Dot indicators (mobile-friendly alternative to thumbnails) */}
        {images.length > 1 && images.length <= 8 && !showThumbnails && (
          <div className="flex justify-center gap-2 mt-3">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-primary-600' 
                    : 'bg-neutral-300 hover:bg-neutral-400'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {showThumbnails && images.length > 1 && (
        <div className="relative">
          <div
            ref={thumbnailRef}
            className="flex gap-2 overflow-x-auto pb-2 scroll-smooth scrollbar-hide"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1d5db transparent',
              msOverflowStyle: 'none',
            }}
          >
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-primary-600 ring-2 ring-primary-200 shadow-md'
                    : 'border-neutral-200 hover:border-neutral-300'
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <img
                  src={img.src}
                  alt={`Thumbnail ${index + 1}`}
                  className={`w-20 h-20 md:w-24 md:h-24 object-cover transition-opacity ${
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

      {/* Current image caption */}
      <ImageCaption image={currentImage} />
    </div>
  );
}

// Lightbox modal for fullscreen viewing
function Lightbox({ 
  images, 
  initialIndex,
  onClose 
}: { 
  images: ImageItem[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentImage = images[currentIndex];

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [goToNext, goToPrevious, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors z-20"
        aria-label="Close fullscreen"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image counter */}
      {images.length > 1 && (
        <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium z-20">
          <span>{currentIndex + 1}</span>
          <span className="text-neutral-400">/</span>
          <span>{images.length}</span>
        </div>
      )}

      {/* Main image */}
      <div 
        className="relative max-w-[90vw] max-h-[85vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          className="max-w-full max-h-[75vh] object-contain rounded-lg"
        />

        {/* Caption in lightbox */}
        {(currentImage.caption || currentImage.photographer) && (
          <div className="mt-4 text-center max-w-2xl px-4">
            {currentImage.caption && (
              <p className="text-white/90 text-sm leading-relaxed">
                {currentImage.caption}
              </p>
            )}
            {currentImage.photographer && (
              <p className="text-white/60 text-xs mt-2 flex items-center justify-center gap-1">
                <Camera className="w-3 h-3" />
                Photo by{' '}
                {currentImage.photographerUrl ? (
                  <a 
                    href={currentImage.photographerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 hover:underline inline-flex items-center gap-1"
                  >
                    {currentImage.photographer}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span>{currentImage.photographer}</span>
                )}
                {currentImage.source && <span> via {currentImage.source}</span>}
              </p>
            )}
          </div>
        )}

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all z-20"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 text-neutral-900" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all z-20"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 text-neutral-900" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail strip in lightbox */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-xl p-2 max-w-[90vw]">
          <div 
            className="flex gap-2 overflow-x-auto scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {images.map((img, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(index);
                }}
                className={`flex-shrink-0 relative rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white ring-2 ring-white/50'
                    : 'border-transparent hover:border-white/50'
                }`}
                aria-label={`View image ${index + 1}`}
              >
                <img
                  src={img.src}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-14 h-14 object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get aspect ratio class
function getAspectClass(aspectRatio: string): string {
  switch (aspectRatio) {
    case '16:9': return 'aspect-[16/9]';
    case '4:3': return 'aspect-[4/3]';
    case '3:2': return 'aspect-[3/2]';
    case '1:1': return 'aspect-square';
    case '3:4': return 'aspect-[3/4]';
    case '9:16': return 'aspect-[9/16]';
    case 'auto': return '';
    default: return 'aspect-[16/9]';
  }
}

// Main BlogImage component
export function BlogImage({
  images: imagesProp,
  mode,
  showThumbnails = true,
  autoPlay = false,
  autoPlayInterval = 5000,
  groupCaption,
  aspectRatio = '16:9',
  lightbox = true,
  maxHeight,
  showCount = true,
  className = '',
}: BlogImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Normalize images to array
  const images: ImageItem[] = Array.isArray(imagesProp) ? imagesProp : [imagesProp];
  
  // Auto-detect mode based on image count if not specified
  const displayMode = mode || (
    images.length === 1 ? 'single' :
    images.length === 2 ? 'double' :
    images.length === 3 ? 'triple' :
    'gallery'
  );

  // Default max heights by mode
  const defaultMaxHeight = displayMode === 'single' ? '500px' : 
                           displayMode === 'gallery' ? '500px' : 
                           '400px';
  const effectiveMaxHeight = maxHeight || defaultMaxHeight;

  const handleOpenLightbox = (index: number) => {
    if (lightbox) {
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  return (
    <div className={`my-8 not-prose ${className}`}>
      {/* Render based on mode */}
      {displayMode === 'single' && (
        <SingleImage
          image={images[0]}
          aspectRatio={aspectRatio}
          maxHeight={effectiveMaxHeight}
          onOpenLightbox={lightbox ? () => handleOpenLightbox(0) : undefined}
        />
      )}

      {(displayMode === 'double' || displayMode === 'triple') && (
        <ImageGrid
          images={images.slice(0, displayMode === 'double' ? 2 : 3)}
          aspectRatio={aspectRatio}
          maxHeight={effectiveMaxHeight}
          onOpenLightbox={lightbox ? handleOpenLightbox : undefined}
        />
      )}

      {displayMode === 'gallery' && (
        <GalleryView
          images={images}
          aspectRatio={aspectRatio}
          maxHeight={effectiveMaxHeight}
          showThumbnails={showThumbnails}
          showCount={showCount}
          autoPlay={autoPlay}
          autoPlayInterval={autoPlayInterval}
          onOpenLightbox={lightbox ? handleOpenLightbox : undefined}
        />
      )}

      {/* Group caption */}
      {groupCaption && (
        <p className="text-sm text-neutral-500 text-center mt-4 italic">
          {groupCaption}
        </p>
      )}

      {/* Lightbox modal */}
      {lightboxOpen && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

export default BlogImage;

