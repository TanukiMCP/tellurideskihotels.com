/**
 * Image Optimization Utilities
 * Provides helpers for serving optimized images in modern formats
 */

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
}

/**
 * Generates Pexels image URL with optimization parameters
 * Pexels supports automatic format selection and resizing
 */
export function optimizePexelsImage(
  url: string,
  options: ImageOptimizationOptions = {}
): string {
  const { width, height, quality = 80, format = 'auto' } = options;
  
  // Check if it's a Pexels URL
  if (!url.includes('pexels.com')) {
    return url;
  }

  // Pexels auto parameter enables WebP/AVIF based on browser support
  const params = new URLSearchParams();
  params.set('auto', 'compress,format');
  
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (quality && quality !== 80) params.set('q', quality.toString());
  
  // Add fit parameter for better cropping
  if (width || height) {
    params.set('fit', 'crop');
  }

  // Append or update query parameters
  const [baseUrl, existingParams] = url.split('?');
  const existingParamsObj = new URLSearchParams(existingParams);
  
  // Merge parameters, preferring new ones
  params.forEach((value, key) => {
    existingParamsObj.set(key, value);
  });

  return `${baseUrl}?${existingParamsObj.toString()}`;
}

/**
 * Generates srcset for responsive images
 */
export function generateSrcSet(url: string, widths: number[]): string {
  return widths
    .map(width => `${optimizePexelsImage(url, { width })} ${width}w`)
    .join(', ');
}

/**
 * Generates picture element sources for modern formats
 */
export interface PictureSource {
  srcset: string;
  type: string;
  sizes?: string;
}

export function generatePictureSources(
  url: string,
  options: {
    widths?: number[];
    sizes?: string;
  } = {}
): PictureSource[] {
  const { widths = [640, 768, 1024, 1280, 1536, 1920], sizes } = options;

  const sources: PictureSource[] = [];

  // WebP source (widely supported)
  sources.push({
    srcset: generateSrcSet(url, widths),
    type: 'image/webp',
    sizes,
  });

  return sources;
}

/**
 * Gets optimized dimensions while maintaining aspect ratio
 */
export function getOptimizedDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight?: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = Math.min(originalWidth, maxWidth);
  let height = width / aspectRatio;

  if (maxHeight && height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Preload key images
 */
export function generatePreloadLink(url: string, as: 'image' = 'image'): string {
  return `<link rel="preload" as="${as}" href="${url}" fetchpriority="high">`;
}

