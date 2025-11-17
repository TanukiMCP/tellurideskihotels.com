'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArticleBookingWidget } from '@/components/blog/ArticleBookingWidget';
import { Users, Heart, Briefcase, User, Home } from 'lucide-react';

export type GroupType = 'family' | 'couples' | 'friends' | 'solo' | 'corporate';

interface GroupTypeOption {
  id: GroupType;
  label: string;
  icon: React.ReactNode;
  description: string;
  filter?: string;
  articleSlug?: string;
}

const GROUP_TYPES: GroupTypeOption[] = [
  {
    id: 'family',
    label: 'Family Trip',
    icon: <Home className="w-5 h-5" />,
    description: 'Planning a family ski vacation with kids',
    filter: 'family-friendly',
    articleSlug: 'telluride-family-ski-vacation',
  },
  {
    id: 'couples',
    label: 'Couples Getaway',
    icon: <Heart className="w-5 h-5" />,
    description: 'Romantic trip for two',
    filter: 'luxury',
    articleSlug: 'telluride-couples-retreat',
  },
  {
    id: 'friends',
    label: 'Friends Group',
    icon: <Users className="w-5 h-5" />,
    description: 'Ski trip with friends',
    filter: undefined,
    articleSlug: 'telluride-friends-ski-trip',
  },
  {
    id: 'corporate',
    label: 'Corporate Retreat',
    icon: <Briefcase className="w-5 h-5" />,
    description: 'Team building or business event',
    filter: undefined,
    articleSlug: 'telluride-corporate-retreat',
  },
  {
    id: 'solo',
    label: 'Solo Travel',
    icon: <User className="w-5 h-5" />,
    description: 'Traveling alone',
    filter: 'budget',
    articleSlug: 'telluride-solo-travel',
  },
];

export function GroupTypeRecommender() {
  const [selectedType, setSelectedType] = useState<GroupType | null>(null);

  const selectedOption = selectedType
    ? GROUP_TYPES.find((t) => t.id === selectedType)
    : null;

  return (
    <Card className="my-8 border-2 border-primary-200">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">What Type of Trip Are You Planning?</CardTitle>
            <p className="text-neutral-600 mt-1">
              Select your trip type to get personalized recommendations
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {GROUP_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                selectedType === type.id
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-neutral-200 hover:border-primary-200 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    selectedType === type.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {type.icon}
                </div>
                <div className="font-semibold text-neutral-900">{type.label}</div>
              </div>
              <div className="text-sm text-neutral-600">{type.description}</div>
            </button>
          ))}
        </div>

        {selectedOption && (
          <div className="border-t border-neutral-200 pt-6 space-y-4">
            <div className="p-4 bg-primary-50 border-2 border-primary-200 rounded-lg">
              <h3 className="font-semibold text-lg text-neutral-900 mb-2">
                Recommended for {selectedOption.label}
              </h3>
              <p className="text-neutral-700 mb-4">
                We've curated the best accommodations and activities for your trip type. Start planning your perfect Telluride experience.
              </p>
              {selectedOption.articleSlug && (
                <a
                  href={`/blog/planning-tips/${selectedOption.articleSlug}`}
                  className="inline-block text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Read our complete {selectedOption.label.toLowerCase()} guide →
                </a>
              )}
            </div>

            <ArticleBookingWidget
              filter={selectedOption.filter}
              variant="featured"
              title={`Start Planning Your ${selectedOption.label}`}
              description="Find the perfect accommodations for your trip type"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

