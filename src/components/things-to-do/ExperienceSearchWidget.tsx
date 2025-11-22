import React, { useState, useEffect, useCallback } from 'react';
import ExperienceGrid from './ExperienceGrid';
import ExperienceMap from './ExperienceMap';
import type { ViatorProduct } from '@/lib/viator/types';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { getExperienceCategories, getExperienceCategoriesSync, getCategoryLabel, type TellurideExperienceCategory } from '@/lib/category-mapper';
import PriceRangeFilter from '@/components/shared/PriceRangeFilter';

interface ExperienceSearchWidgetProps {
  onExperienceSelect?: (productCode: string) => void;
}

function ExperienceSearchWidgetContent({ onExperienceSelect }: ExperienceSearchWidgetProps) {
  const [allExperiences, setAllExperiences] = useState<(ViatorProduct & { categories?: TellurideExperienceCategory[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  
  const [selectedCategories, setSelectedCategories] = useState<TellurideExperienceCategory[]>([]);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'popularity'>('popularity');
  const [minRating, setMinRating] = useState<number>(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 20;

  const parseUrlParams = useCallback(() => {
    if (typeof window === 'undefined') return {};
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    const categories = categoryParam 
      ? (categoryParam.includes(',') ? categoryParam.split(',') : [categoryParam])
      : [];
    
    return {
      categories: categories.filter(c => c) as TellurideExperienceCategory[],
      minPrice: urlParams.get('minPrice') ? parseFloat(urlParams.get('minPrice')!) : undefined,
      maxPrice: urlParams.get('maxPrice') ? parseFloat(urlParams.get('maxPrice')!) : undefined,
      minRating: urlParams.get('minRating') ? parseFloat(urlParams.get('minRating')!) : undefined,
      sortBy: (urlParams.get('sortBy') || 'popularity') as 'price' | 'rating' | 'popularity',
    };
  }, []);

  useEffect(() => {
    const loadExperiences = async () => {
      setLoading(true);
      setError('');
      
      const urlParams = parseUrlParams();
      if (urlParams.categories && urlParams.categories.length > 0) {
        setSelectedCategories(urlParams.categories);
      }
      if (urlParams.minPrice !== undefined) {
        setPriceRange([urlParams.minPrice, priceRange[1]]);
      }
      if (urlParams.maxPrice !== undefined) {
        setPriceRange([priceRange[0], urlParams.maxPrice]);
      }
      if (urlParams.minRating !== undefined) {
        setMinRating(urlParams.minRating);
      }
      if (urlParams.sortBy) {
        setSortBy(urlParams.sortBy);
      }

      try {
        // Load the manually categorized experiences directly from JSON
        const response = await fetch('/data/telluride-experience-categories.json');
        
        if (response.ok) {
          const categorizedExperiences = await response.json();
          
          // Fetch full details from Viator API for each experience
          const apiResponse = await fetch('/api/things-to-do/search-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          });
          
          const apiData = await apiResponse.json();
          
          if (apiData.success && apiData.experiences) {
            // Match API experiences with our categorized data
            const productsWithCategories = apiData.experiences.map((exp: ViatorProduct) => {
              const categorized = categorizedExperiences.find((cat: any) => cat.productCode === exp.productCode);
              return {
                ...exp,
                categories: categorized?.categories || [],
              };
            });
            
            setAllExperiences(productsWithCategories);
            setCategoriesLoaded(true);
          } else {
            setError(apiData.error?.message || 'Failed to load experiences');
          }
        } else {
          setError('Failed to load category data');
        }
      } catch (err) {
        console.error('[Experience Widget] Load error:', err);
        setError('Failed to load experiences');
      } finally {
        setLoading(false);
      }
    };
    loadExperiences();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams();
    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories.join(','));
    }
    if (priceRange[0] > 0) {
      params.set('minPrice', priceRange[0].toString());
    }
    if (priceRange[1] < 500) {
      params.set('maxPrice', priceRange[1].toString());
    }
    if (minRating > 0) {
      params.set('minRating', minRating.toString());
    }
    if (sortBy !== 'popularity') {
      params.set('sortBy', sortBy);
    }
    
    const newUrl = params.toString() ? `${window.location.pathname}?${params}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [selectedCategories, priceRange, minRating, sortBy]);

  const handleExperienceSelect = (productCode: string) => {
    if (onExperienceSelect) {
      onExperienceSelect(productCode);
    } else {
      window.location.href = `/things-to-do/${productCode}`;
    }
  };

  const filteredAndSortedExperiences = React.useMemo(() => {
    let filtered = [...allExperiences];
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(exp => {
        const expCategories = exp.categories || [];
        return selectedCategories.some(cat => expCategories.includes(cat));
      });
    }

    if (minRating > 0) {
      filtered = filtered.filter(exp => {
        const rating = exp.reviews?.combinedAverageRating || 0;
        return rating >= minRating / 2;
      });
    }

    filtered = filtered.filter(exp => {
      const price = exp.pricing?.summary?.fromPrice || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          const priceA = a.pricing?.summary?.fromPrice || 0;
          const priceB = b.pricing?.summary?.fromPrice || 0;
          return priceA - priceB;
        case 'rating':
          const ratingA = a.reviews?.combinedAverageRating || 0;
          const ratingB = b.reviews?.combinedAverageRating || 0;
          return ratingB - ratingA;
        default:
          return 0;
      }
    });

    return filtered;
  }, [allExperiences, selectedCategories, sortBy, priceRange, minRating]);

  const paginatedExperiences = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedExperiences.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedExperiences, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedExperiences.length / itemsPerPage);

  const availableCategories = React.useMemo(() => {
    const categoryCounts = new Map<TellurideExperienceCategory, number>();
    
    allExperiences.forEach(exp => {
      const expCategories = exp.categories || [];
      expCategories.forEach(cat => {
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
      });
    });
    
    return Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }, [allExperiences]);

  const toggleCategory = (category: TellurideExperienceCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setMinRating(0);
    setPriceRange([0, 500]);
    setCurrentPage(1);
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-semibold">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-primary-50 to-sky-50 border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {filteredAndSortedExperiences.length} Experience{filteredAndSortedExperiences.length !== 1 ? 's' : ''} Found
            </h2>
            {(selectedCategories.length > 0 || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 500) && (
              <p className="text-sm text-gray-600 mt-1">
                {selectedCategories.length + (minRating > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0)} filter{(selectedCategories.length + (minRating > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 500 ? 1 : 0)) !== 1 ? 's' : ''} active
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-medium">Filters</span>
            </button>
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Grid View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-2 rounded-md transition-all ${
                  viewMode === 'map'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Map View"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[600px]">
        <aside className={`
          ${showFilters ? 'block' : 'hidden'} lg:block
          w-full lg:w-80 xl:w-96 
          border-b lg:border-b-0 lg:border-r border-gray-200 
          bg-gray-50 overflow-y-auto
          max-h-[600px] lg:max-h-[800px]
        `}>
          <div className="p-4 sm:p-6 space-y-6">
            {(selectedCategories.length > 0 || minRating > 0 || priceRange[0] > 0 || priceRange[1] < 500) && (
              <div className="pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Active Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {getCategoryLabel(category)}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Activity Type</h3>
              {!categoriesLoaded && availableCategories.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">Loading categories...</div>
              ) : availableCategories.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">No categories available</div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableCategories.map(({ category, count }) => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`w-full text-left px-4 py-2.5 rounded-lg border-2 transition-all ${
                        selectedCategories.includes(category)
                          ? 'bg-primary-50 border-primary-500 text-primary-900 font-semibold'
                          : 'bg-white border-gray-200 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{getCategoryLabel(category)}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          selectedCategories.includes(category)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {count}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Sort By</h3>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <option value="popularity">Most Popular</option>
                <option value="price">Price: Low to High</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Minimum Rating</h3>
              <select
                value={minRating}
                onChange={(e) => setMinRating(parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              >
                <option value="0">All Ratings</option>
                <option value="8">4+ Stars</option>
                <option value="9">4.5+ Stars</option>
              </select>
            </div>

            <PriceRangeFilter
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              minPrice={0}
              maxPrice={500}
              label="Price Range (per person)"
            />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <svg className="animate-spin h-12 w-12 text-primary-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-gray-600 font-medium">Loading experiences...</p>
              </div>
            </div>
          )}

          {!loading && (
            <>
              {viewMode === 'grid' ? (
                <div className="p-4 sm:p-6">
                  <ExperienceGrid
                    experiences={paginatedExperiences}
                    onSelectExperience={handleExperienceSelect}
                  />
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8 pt-8 border-t border-gray-200">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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
                        className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full w-full">
                  <ExperienceMap
                    experiences={filteredAndSortedExperiences}
                    onSelectExperience={handleExperienceSelect}
                  />
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default function ExperienceSearchWidget(props: ExperienceSearchWidgetProps) {
  return (
    <ErrorBoundary>
      <ExperienceSearchWidgetContent {...props} />
    </ErrorBoundary>
  );
}

