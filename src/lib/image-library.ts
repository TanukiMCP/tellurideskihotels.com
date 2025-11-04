// Import image library data - loaded at build time
import { readFileSync } from 'fs';
import { join } from 'path';

let imageLibraryData: any = { images: [] };

try {
  const libraryPath = join(process.cwd(), 'public', 'images', 'image-library.json');
  const libraryContent = readFileSync(libraryPath, 'utf-8');
  imageLibraryData = JSON.parse(libraryContent);
} catch (error) {
  console.warn('Could not load image library:', error);
}

export interface ImageLibraryImage {
  id: string;
  url: string;
  thumbnail: string;
  photographer: string;
  query: string;
  category: string;
}

export interface ImageLibrary {
  generated: string;
  total: number;
  images: ImageLibraryImage[];
}

const library = imageLibraryData as ImageLibrary;

export function getImagesByCategory(category: string): ImageLibraryImage[] {
  return library.images.filter(img => img.category === category);
}

export function getImageById(id: string): ImageLibraryImage | null {
  return library.images.find(img => img.id === id) || null;
}

// Static homepage hero image - always use first resort image
export function getHomepageHeroImage(): ImageLibraryImage | null {
  const resortImages = getImagesByCategory('resort');
  return resortImages[0] || null;
}

// Static featured gallery images - specific curated images for homepage
export function getFeaturedImages(): ImageLibraryImage[] {
  const resortImages = getImagesByCategory('resort');
  const luxuryImages = getImagesByCategory('luxury');
  const exteriorImages = getImagesByCategory('exterior');
  
  // Return specific images in order: resort, luxury, exterior, resort, luxury, exterior
  const featured: ImageLibraryImage[] = [];
  
  if (resortImages[0]) featured.push(resortImages[0]);
  if (luxuryImages[0]) featured.push(luxuryImages[0]);
  if (exteriorImages[0]) featured.push(exteriorImages[0]);
  if (resortImages[1]) featured.push(resortImages[1]);
  if (luxuryImages[1]) featured.push(luxuryImages[1]);
  if (exteriorImages[1]) featured.push(exteriorImages[1]);
  
  return featured;
}

// Static fallback images for hotels - uses hotel ID hash for consistent selection
export function getHotelFallbackImages(hotel?: any): ImageLibraryImage[] {
  const images: ImageLibraryImage[] = [];
  
  // Get all category images
  const resortImages = getImagesByCategory('resort');
  const exteriorImages = getImagesByCategory('exterior');
  const interiorImages = getImagesByCategory('interior');
  const roomImages = getImagesByCategory('rooms');
  
  // Use hotel ID to determine which images to use (consistent per hotel)
  let hash = 0;
  if (hotel?.hotel_id) {
    for (let i = 0; i < hotel.hotel_id.length; i++) {
      hash = ((hash << 5) - hash) + hotel.hotel_id.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
  }
  
  // Select specific images based on hash (consistent per hotel)
  if (resortImages.length > 0) {
    images.push(resortImages[Math.abs(hash) % resortImages.length]);
  }
  if (exteriorImages.length > 0 && images.length < 3) {
    images.push(exteriorImages[(Math.abs(hash) + 1) % exteriorImages.length]);
  }
  const combinedInterior = [...interiorImages, ...roomImages];
  if (combinedInterior.length > 0 && images.length < 3) {
    images.push(combinedInterior[(Math.abs(hash) + 2) % combinedInterior.length]);
  }
  
  // Fill remaining slots with first images from categories
  if (images.length < 5 && resortImages.length > 0) {
    const nextResort = resortImages.find(img => !images.find(e => e.id === img.id));
    if (nextResort) images.push(nextResort);
  }
  if (images.length < 5 && exteriorImages.length > 0) {
    const nextExterior = exteriorImages.find(img => !images.find(e => e.id === img.id));
    if (nextExterior) images.push(nextExterior);
  }
  
  return images;
}

