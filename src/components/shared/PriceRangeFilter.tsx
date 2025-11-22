import React from 'react';

interface PriceRangeFilterProps {
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  minPrice?: number;
  maxPrice?: number;
  label?: string;
}

export default function PriceRangeFilter({
  priceRange,
  onPriceRangeChange,
  minPrice = 0,
  maxPrice = 500,
  label = 'Price Range (per person)',
}: PriceRangeFilterProps) {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(minPrice, Math.min(parseFloat(e.target.value) || minPrice, priceRange[1]));
    onPriceRangeChange([value, priceRange[1]]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(priceRange[0], Math.min(parseFloat(e.target.value) || maxPrice, maxPrice));
    onPriceRangeChange([priceRange[0], value]);
  };

  const presetRanges = [
    { label: 'Any Price', value: [minPrice, maxPrice] },
    { label: 'Under $50', value: [minPrice, 50] },
    { label: '$50 - $100', value: [50, 100] },
    { label: '$100 - $200', value: [100, 200] },
    { label: '$200 - $500', value: [200, 500] },
    { label: '$500+', value: [500, maxPrice] },
  ];

  const isPresetActive = (preset: number[]) => {
    return preset[0] === priceRange[0] && preset[1] === priceRange[1];
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{label}</h3>
      
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presetRanges.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onPriceRangeChange(preset.value as [number, number])}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isPresetActive(preset.value)
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Custom range inputs */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 w-12">Min:</label>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              value={priceRange[0]}
              onChange={handleMinChange}
              min={minPrice}
              max={priceRange[1]}
              className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-600 w-12">Max:</label>
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              value={priceRange[1]}
              onChange={handleMaxChange}
              min={priceRange[0]}
              max={maxPrice}
              className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

