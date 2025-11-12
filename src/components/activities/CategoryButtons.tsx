/**
 * Category Buttons Component
 * Category selection buttons with Lucide React icons
 */

import { Snowflake, Sun, Zap, Users, Map, Sparkles, Grid3x3 } from 'lucide-react';

interface CategoryButtonsProps {
  onCategoryClick?: (category: string) => void;
}

const categories = [
  { id: 'winter', label: 'Winter Sports', icon: Snowflake, color: 'sky' },
  { id: 'summer', label: 'Summer', icon: Sun, color: 'green' },
  { id: 'adventure', label: 'Adventure', icon: Zap, color: 'orange' },
  { id: 'family', label: 'Family', icon: Users, color: 'pink' },
  { id: 'tours', label: 'Tours', icon: Map, color: 'purple' },
  { id: 'experiences', label: 'Experiences', icon: Sparkles, color: 'indigo' },
  { id: 'all', label: 'All Activities', icon: Grid3x3, color: 'primary' },
];

export function CategoryButtons({ onCategoryClick }: CategoryButtonsProps) {
  const handleClick = (categoryId: string) => {
    if (onCategoryClick) {
      onCategoryClick(categoryId);
    }
    // Also call the global function for backward compatibility
    if (typeof window !== 'undefined' && (window as any).scrollToActivities) {
      (window as any).scrollToActivities(categoryId);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {categories.map((category) => {
        const Icon = category.icon;
        const colorClasses = {
          sky: 'bg-sky-100 text-sky-600 hover:border-sky-500 hover:bg-sky-50',
          green: 'bg-green-100 text-green-600 hover:border-green-500 hover:bg-green-50',
          orange: 'bg-orange-100 text-orange-600 hover:border-orange-500 hover:bg-orange-50',
          pink: 'bg-pink-100 text-pink-600 hover:border-pink-500 hover:bg-pink-50',
          purple: 'bg-purple-100 text-purple-600 hover:border-purple-500 hover:bg-purple-50',
          indigo: 'bg-indigo-100 text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50',
          primary: 'bg-primary-100 text-primary-600 hover:border-primary-500 hover:bg-primary-50',
        }[category.color];

        return (
          <button
            key={category.id}
            onClick={() => handleClick(category.id)}
            className="text-center group cursor-pointer border-2 border-neutral-200 bg-white hover:border-current rounded-xl p-4 transition-all duration-300 hover:shadow-card"
            data-category={category.id}
          >
            <div className={`w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${colorClasses}`}>
              <Icon className="w-8 h-8" strokeWidth={2} />
            </div>
            <div className="text-sm font-semibold text-neutral-900">{category.label}</div>
          </button>
        );
      })}
    </div>
  );
}

