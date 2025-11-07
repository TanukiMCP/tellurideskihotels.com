import { readFileSync } from 'fs';
import { join } from 'path';

let imageLibraryData = { images: [] };
try {
  const libraryPath = join(process.cwd(), "public", "images", "image-library.json");
  const libraryContent = readFileSync(libraryPath, "utf-8");
  imageLibraryData = JSON.parse(libraryContent);
} catch (error) {
  console.warn("Could not load image library:", error);
}
const library = imageLibraryData;
function getImagesByCategory(category) {
  return library.images.filter((img) => img.category === category);
}
function getHomepageHeroImage() {
  const resortImages = getImagesByCategory("resort");
  return resortImages[0] || null;
}

export { getHomepageHeroImage as a, getImagesByCategory as g };
