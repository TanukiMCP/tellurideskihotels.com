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

// Static images for marketing/content pages (NOT for hotel listings)
// Use these for About page, hero sections, etc.
export function getStaticContentImages(count: number = 3): ImageLibraryImage[] {
  const resortImages = getImagesByCategory('resort');
  const luxuryImages = getImagesByCategory('luxury');
  const exteriorImages = getImagesByCategory('exterior');
  
  const images: ImageLibraryImage[] = [];
  if (resortImages[2]) images.push(resortImages[2]);
  if (luxuryImages[2]) images.push(luxuryImages[2]);
  if (exteriorImages[2]) images.push(exteriorImages[2]);
  
  return images.slice(0, count);
}

