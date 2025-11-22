export type TellurideExperienceCategory =
  | 'winter-sports'
  | 'summer-adventures'
  | 'adventure'
  | 'family-friendly'
  | 'tours-sightseeing'
  | 'experiences'
  | 'water-activities'
  | 'land-activities'
  | 'climbing'
  | 'driving-tours';

export interface CategoryInfo {
  label: string;
  description: string;
  keywords: string[];
}

export const CATEGORY_INFO: Record<TellurideExperienceCategory, CategoryInfo> = {
  'winter-sports': {
    label: 'Winter Sports',
    description: 'Skiing, snowboarding, ice climbing, and winter activities',
    keywords: ['ski', 'snowboard', 'ice climbing', 'snowshoe', 'winter'],
  },
  'summer-adventures': {
    label: 'Summer Adventures',
    description: 'Rafting, hiking, mountain biking, and summer activities',
    keywords: ['rafting', 'hiking', 'mountain bike', 'summer', 'river'],
  },
  'adventure': {
    label: 'Adventure',
    description: 'High-adrenaline and extreme sports activities',
    keywords: ['adventure', 'extreme', 'thrill', 'adrenaline'],
  },
  'family-friendly': {
    label: 'Family Friendly',
    description: 'Activities suitable for families with children',
    keywords: ['family', 'kids', 'children', 'all ages'],
  },
  'tours-sightseeing': {
    label: 'Tours & Sightseeing',
    description: 'Guided tours, scenic drives, and sightseeing experiences',
    keywords: ['tour', 'sightseeing', 'guided', 'scenic', 'audio tour'],
  },
  'experiences': {
    label: 'Experiences',
    description: 'Unique cultural and local experiences',
    keywords: ['experience', 'cultural', 'local', 'unique'],
  },
  'water-activities': {
    label: 'Water Activities',
    description: 'Rafting, paddleboarding, kayaking, and water sports',
    keywords: ['rafting', 'paddleboard', 'kayak', 'water', 'river'],
  },
  'land-activities': {
    label: 'Land Activities',
    description: 'Jeep tours, hiking, biking, and land-based adventures',
    keywords: ['jeep', 'hiking', 'biking', 'land', 'trail'],
  },
  'climbing': {
    label: 'Climbing',
    description: 'Rock climbing and ice climbing adventures',
    keywords: ['climbing', 'rock climb', 'ice climb', 'climb'],
  },
  'driving-tours': {
    label: 'Driving Tours',
    description: 'Self-guided driving tours and scenic routes',
    keywords: ['driving tour', 'self-guided', 'scenic drive', 'audio tour'],
  },
};

export function getCategoryLabel(category: TellurideExperienceCategory): string {
  return CATEGORY_INFO[category]?.label || category;
}

export function getCategoryDescription(category: TellurideExperienceCategory): string {
  return CATEGORY_INFO[category]?.description || '';
}

// Load category mappings from JSON file
let categoryMap: Map<string, TellurideExperienceCategory[]> | null = null;
let categoryMapPromise: Promise<Map<string, TellurideExperienceCategory[]>> | null = null;

async function loadCategoryMap(): Promise<Map<string, TellurideExperienceCategory[]>> {
  if (categoryMap) {
    return categoryMap;
  }

  if (categoryMapPromise) {
    return categoryMapPromise;
  }

  categoryMapPromise = (async () => {
    categoryMap = new Map();
    
    try {
      // Load from public data file (client-side compatible)
      const response = await fetch('/data/telluride-experience-categories.json');
      if (response.ok) {
        const categoriesData = await response.json();
        if (Array.isArray(categoriesData)) {
          console.log('[Category Mapper] Loading categories for', categoriesData.length, 'experiences');
          categoriesData.forEach((exp: any) => {
            if (exp.categories && Array.isArray(exp.categories) && exp.categories.length > 0) {
              categoryMap!.set(exp.productCode, exp.categories as TellurideExperienceCategory[]);
            }
          });
          console.log('[Category Mapper] Loaded', categoryMap.size, 'category mappings');
        }
      } else {
        console.warn('[Category Mapper] Failed to fetch categories file:', response.status, response.statusText);
      }
    } catch (error) {
      // File doesn't exist yet or is invalid - that's okay, will be empty map
      console.error('[Category Mapper] Could not load category mappings:', error);
    }

    return categoryMap;
  })();

  return categoryMapPromise;
}

export async function getExperienceCategories(productCode: string): Promise<TellurideExperienceCategory[]> {
  const map = await loadCategoryMap();
  const categories = map.get(productCode) || [];
  if (categories.length === 0 && productCode) {
    console.warn('[Category Mapper] No categories found for product code:', productCode);
  }
  return categories;
}

// Synchronous version for use in components (will return empty array until loaded)
export function getExperienceCategoriesSync(productCode: string): TellurideExperienceCategory[] {
  if (!categoryMap) {
    // Trigger async load
    loadCategoryMap();
    return [];
  }
  return categoryMap.get(productCode) || [];
}

