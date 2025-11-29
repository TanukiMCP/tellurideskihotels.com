/**
 * Image Optimization Utilities
 * Provides high-quality image URLs for all supported image sources:
 * - Unsplash
 * - Pexels
 * - LiteAPI (hotel images)
 * - Viator (activity images)
 */

/**
 * Optimize Unsplash image URL for high quality
 * @param url - Original Unsplash URL
 * @param options - Optimization options
 * @returns Optimized URL with high-quality parameters
 */
export function optimizeUnsplashUrl(
  url: string,
  options: {
    width?: number;
    quality?: number;
    format?: 'jpg' | 'webp';
  } = {}
): string {
  const { width = 1920, quality = 90, format = 'jpg' } = options;
  
  try {
    // Parse URL - handle errors gracefully
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch (error) {
      // If URL parsing fails, return original URL
      console.warn('[Image Optimization] Failed to parse Unsplash URL:', url);
      return url;
    }
    
    // Clean up invalid Pexels parameters that might have been added by mistake
    urlObj.searchParams.delete('auto'); // Unsplash doesn't use 'auto' like Pexels
    urlObj.searchParams.delete('compress'); // Not a valid Unsplash param
    urlObj.searchParams.delete('cs'); // Not a valid Unsplash param
    urlObj.searchParams.delete('tinysrgb'); // Not a valid Unsplash param
    
    // Set proper Unsplash parameters for high quality
    urlObj.searchParams.set('fm', format);
    urlObj.searchParams.set('q', quality.toString());
    urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('fit', 'max'); // 'max' preserves aspect ratio, 'crop' crops
    
    // Remove height constraint for better quality (width-only gives best quality)
    urlObj.searchParams.delete('h');
    
    // DPR handled automatically by Unsplash CDN
    urlObj.searchParams.delete('dpr');
    
    return urlObj.toString();
  } catch (error) {
    // If anything fails, return original URL so images still display
    console.error('[Image Optimization] Error optimizing Unsplash URL:', error);
    return url;
  }
}

/**
 * Optimize Pexels image URL for high quality
 * @param url - Original Pexels URL
 * @param options - Optimization options
 * @returns Optimized URL with high-quality parameters
 */
export function optimizePexelsUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    dpr?: number;
  } = {}
): string {
  const { width = 1920, height, dpr = 2 } = options;
  
  try {
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch (error) {
      // If URL parsing fails, return original URL
      console.warn('[Image Optimization] Failed to parse Pexels URL:', url);
      return url;
    }
    
    // Set high-quality parameters
    urlObj.searchParams.set('auto', 'compress');
    urlObj.searchParams.set('cs', 'tinysrgb');
    urlObj.searchParams.set('dpr', dpr.toString());
    urlObj.searchParams.set('w', width.toString());
    
    if (height) {
      urlObj.searchParams.set('h', height.toString());
    }
    
    return urlObj.toString();
  } catch (error) {
    // If anything fails, return original URL so images still display
    console.error('[Image Optimization] Error optimizing Pexels URL:', error);
    return url;
  }
}

/**
 * Get high-quality LiteAPI image URL
 * LiteAPI provides urlHd (HD) and url (standard) - prefer HD
 * @param image - LiteAPI image object with url and urlHd
 * @returns Best available image URL
 */
export function getLiteAPIImageUrl(image: {
  url?: string;
  urlHd?: string;
}): string | null {
  // Prefer HD URL, fallback to standard URL
  const imageUrl = image.urlHd || image.url || '';
  return imageUrl && imageUrl.trim() !== '' ? imageUrl : null;
}

/**
 * Get high-quality Viator image URL
 * Viator provides variants with different widths - prefer largest/highest quality
 * @param image - Viator image object with variants
 * @param minWidth - Minimum width to accept (default: 1200 for high quality)
 * @returns Best available image URL
 */
export function getViatorImageUrl(
  image: {
    variants?: Array<{
      width?: number;
      height?: number;
      url: string;
    }>;
  },
  minWidth: number = 1200
): string | null {
  if (!image?.variants || image.variants.length === 0) {
    return null;
  }
  
  // Sort variants by width (descending) to get highest quality first
  const sortedVariants = [...image.variants].sort((a, b) => {
    const widthA = a.width || 0;
    const widthB = b.width || 0;
    return widthB - widthA;
  });
  
  // Find the largest variant that meets minimum width requirement
  const bestVariant = sortedVariants.find(v => (v.width || 0) >= minWidth) || sortedVariants[0];
  
  return bestVariant?.url || null;
}

/**
 * Optimize any image URL based on its source
 * Automatically detects the source and applies appropriate optimization
 * @param url - Image URL
 * @param options - Optimization options
 * @returns Optimized URL
 */
export function optimizeImageUrl(
  url: string,
  options: {
    width?: number;
    quality?: number;
    source?: 'unsplash' | 'pexels' | 'liteapi' | 'viator' | 'auto';
  } = {}
): string {
  // If no URL provided, return empty string
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return '';
  }
  
  const { source = 'auto', width = 1920, quality = 90 } = options;
  
  // Auto-detect source if not specified
  let detectedSource: 'unsplash' | 'pexels' | 'liteapi' | 'viator' | 'unknown' = source as any;
  
  if (source === 'auto') {
    if (url.includes('images.unsplash.com') || url.includes('unsplash.com/photos')) {
      detectedSource = 'unsplash';
    } else if (url.includes('images.pexels.com') || url.includes('pexels.com')) {
      detectedSource = 'pexels';
    } else if (url.includes('liteapi') || url.includes('hotels')) {
      detectedSource = 'liteapi';
    } else if (url.includes('viator')) {
      detectedSource = 'viator';
    } else {
      // Unknown source, return as-is
      return url;
    }
  }
  
  // Apply source-specific optimization with error handling
  try {
    switch (detectedSource) {
      case 'unsplash':
        return optimizeUnsplashUrl(url, { width, quality });
      case 'pexels':
        return optimizePexelsUrl(url, { width });
      case 'liteapi':
      case 'viator':
        // These APIs return URLs directly, no optimization needed
        return url;
      default:
        return url;
    }
  } catch (error) {
    // If optimization fails, return original URL so images still display
    console.error('[Image Optimization] Error optimizing image URL:', error, url);
    return url;
  }
}

/**
 * Get optimal image dimensions for different use cases
 */
export const ImageSizes = {
  thumbnail: { width: 400, height: 300 },
  small: { width: 800, height: 600 },
  medium: { width: 1200, height: 900 },
  large: { width: 1920, height: 1080 },
  xlarge: { width: 2560, height: 1440 },
} as const;

