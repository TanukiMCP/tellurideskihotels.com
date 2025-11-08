/**
 * Activities Grid Component
 * Main grid for displaying and filtering activities on the Things to Do page
 */

import { useState, useEffect } from 'react';
import type { ViatorProduct, ActivityCategory } from '@/lib/viator/types';
import { ActivityCard } from './ActivityCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

interface ActivitiesGridProps {
  initialActivities?: ViatorProduct[];
}

const CATEGORIES: { value: ActivityCategory; label: string; icon: string }[] = [
  { value: 'all', label: 'All Activities', icon: '🎯' },
  { value: 'winter', label: 'Winter Sports', icon: '⛷️' },
  { value: 'summer', label: 'Summer Adventures', icon: '🏔️' },
  { value: 'adventure', label: 'Adventure', icon: '🧗' },
  { value: 'family', label: 'Family Friendly', icon: '👨‍👩‍👧‍👦' },
  { value: 'tours', label: 'Tours & Sightseeing', icon: '🎫' },
  { value: 'experiences', label: 'Experiences', icon: '🎨' },
];

const SORT_OPTIONS = [
  { value: 'TOP_SELLERS', label: 'Most Popular' },
  { value: 'REVIEW_AVG_RATING_D', label: 'Highest Rated' },
  { value: 'PRICE_FROM_LOW', label: 'Price: Low to High' },
  { value: 'PRICE_FROM_HIGH', label: 'Price: High to Low' },
];

export function ActivitiesGrid({ initialActivities = [] }: ActivitiesGridProps) {
  const [activities, setActivities] = useState<ViatorProduct[]>(initialActivities);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<ActivityCategory>('all');
  const [sortBy, setSortBy] = useState('TOP_SELLERS');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '20',
        sortOrder: sortBy,
      });

      // Add search term
      let search = 'Telluride Colorado';
      if (searchTerm) {
        search += ` ${searchTerm}`;
      }
      if (category !== 'all') {
        search += ` ${category}`;
      }
      params.append('searchTerm', search);

      const response = await fetch(`/api/viator/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to load activities');
      }

      const data = await response.json();
      setActivities(data.products || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [category, sortBy, currentPage, searchTerm]);

  const handleCategoryChange = (newCategory: ActivityCategory) => {
    setCategory(newCategory);
    setCurrentPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchActivities();
  };

  const totalPages = Math.ceil(totalCount / 20);

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-card">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search activities..."
                className="w-full pl-12 pr-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Category Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  category === cat.value
                    ? 'bg-primary-600 text-white shadow-card'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <span className="mr-2">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            {totalCount > 0 && (
              <span>
                Showing {activities.length} of {totalCount.toLocaleString()} activities
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="sort" className="text-sm font-medium text-neutral-700">
              Sort by:
            </label>
            <select
              id="sort"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-4 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : activities.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activities.map((activity) => (
              <ActivityCard key={activity.productCode} activity={activity} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
              >
                Previous
              </button>
              
              <div className="flex gap-2">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = currentPage <= 3 
                    ? i + 1 
                    : currentPage >= totalPages - 2
                    ? totalPages - 4 + i
                    : currentPage - 2 + i;
                  
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-xl transition-colors ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'border border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-100 mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-neutral-600 text-lg mb-2">No activities found</p>
          <p className="text-neutral-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}

