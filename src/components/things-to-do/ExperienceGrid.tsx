import React from 'react';
import { ActivityCard } from '@/components/activities/ActivityCard';
import type { ViatorProduct } from '@/lib/viator/types';

interface ExperienceGridProps {
  experiences: (ViatorProduct & { categories?: string[] })[];
  onSelectExperience?: (productCode: string) => void;
}

export default function ExperienceGrid({ experiences, onSelectExperience }: ExperienceGridProps) {
  if (experiences.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <p className="text-gray-600 text-lg mb-2">No experiences found</p>
        <p className="text-gray-500">Try adjusting your filters or selecting a different category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {experiences.map((experience) => (
        <ActivityCard key={experience.productCode} activity={experience} />
      ))}
    </div>
  );
}
