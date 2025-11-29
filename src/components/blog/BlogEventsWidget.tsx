'use client';

import React, { useState, useEffect } from 'react';

interface Event {
  id: string;
  name: string;
  date: string;
  type: 'festival' | 'concert' | 'sports' | 'art' | 'community';
  description: string;
  url: string;
}

// Import events from the main EventsWidget
// This ensures consistency across the site
const TELLURIDE_EVENTS: Event[] = [
  {
    id: '67',
    name: 'Telluride Bluegrass Festival',
    date: '2026-06-18',
    type: 'festival',
    description: 'Every June, Festivarians make the annual pilgrimage to Telluride for the Telluride Bluegrass Festival. Nestled in the box canyon, it\'s a magical experience.',
    url: 'https://www.telluride.com/event/telluride-bluegrass-festival/',
  },
  {
    id: 'telluride-film-festival',
    name: 'Telluride Film Festival',
    date: '2026-09-02',
    type: 'festival',
    description: 'The Telluride Film Festival over Labor Day weekend rivals Sundance and Cannes for industry importance. Major films premiere here, celebrities and filmmakers descend on the town.',
    url: 'https://www.telluridefilmfestival.org',
  },
  {
    id: '63',
    name: 'Mountainfilm',
    date: '2026-05-21',
    type: 'festival',
    description: 'Mountainfilm is a documentary film festival that showcases nonfiction stories about environmental, cultural, climbing, and adventure themes.',
    url: 'https://www.telluride.com/event/mountainfilm/',
  },
  {
    id: '66',
    name: 'Telluride Food + Vine',
    date: '2026-06-11',
    type: 'festival',
    description: 'Telluride Food + Vine is the area\'s premier food and wine weekend, providing the ultimate epicurean experience in the mountains.',
    url: 'https://www.telluride.com/event/telluride-food-vine/',
  },
  {
    id: '68',
    name: 'Telluride Yoga Festival',
    date: '2026-06-25',
    type: 'festival',
    description: 'The longest running yoga festival in the country, the Telluride Yoga Festival is a four-day yoga and wellness gathering in the mountains.',
    url: 'https://www.telluride.com/event/telluride-yoga-festival/',
  },
  {
    id: '69',
    name: 'Telluride Plein Air',
    date: '2026-06-29',
    type: 'art',
    description: 'The Telluride Plein Air Festival is an essential fundraiser for the Sheridan Arts Foundation, a 501 (c) (3) nonprofit organization.',
    url: 'https://www.telluride.com/event/telluride-plein-air/',
  },
  {
    id: '70',
    name: 'Red, White & Blues',
    date: '2026-07-03',
    type: 'festival',
    description: 'Celebrate the Fourth of July with the whole family this year at Mountain Village\'s Red, White & Blues celebration.',
    url: 'https://www.telluride.com/event/red-white-and-blues/',
  },
  {
    id: '71',
    name: 'Telluride Fourth of July Parade',
    date: '2026-07-04',
    type: 'community',
    description: 'The Telluride 4th of July Parade is the longest running event in the Town\'s history. The parade celebrates our community and independence.',
    url: 'https://www.telluride.com/event/telluride-4th-of-july-parade/',
  },
  {
    id: '64',
    name: 'Telluride Balloon Festival',
    date: '2026-06-05',
    type: 'festival',
    description: 'Get high at the Telluride Balloon Festival! Weather permitting, watch hot air balloons lift off from Telluride Town Park.',
    url: 'https://www.telluride.com/event/telluride-balloon-festival/',
  },
];

interface BlogEventsWidgetProps {
  /** Manually curated event IDs to display (if not provided, shows all upcoming festivals) */
  eventIds?: string[];
  /** Filter by event type */
  type?: 'festival' | 'concert' | 'sports' | 'art' | 'community';
  /** Number of events to display (default: 3) */
  limit?: number;
  /** Optional title */
  title?: string;
  /** Show only upcoming events (default: true) */
  upcomingOnly?: boolean;
}

export function BlogEventsWidget({
  eventIds,
  type,
  limit = 3,
  title,
  upcomingOnly = true,
}: BlogEventsWidgetProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Filter events based on props
  let filteredEvents = [...TELLURIDE_EVENTS];

  // Filter by event IDs if provided (manual curation)
  if (eventIds && eventIds.length > 0) {
    filteredEvents = filteredEvents.filter(event => eventIds.includes(event.id));
  }

  // Filter by type if provided
  if (type) {
    filteredEvents = filteredEvents.filter(event => event.type === type);
  }

  // Filter for upcoming events if requested
  if (upcomingOnly) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filteredEvents = filteredEvents.filter(event => new Date(event.date) >= today);
  }

  // Sort by date
  filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Apply limit
  const displayEvents = filteredEvents.slice(0, limit);

  const getMonthDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString()
    };
  };

  if (displayEvents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#E8E8E8] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
      {title && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-[#2C2C2C] mb-2">{title}</h3>
        </div>
      )}

      <div className="space-y-4">
        {displayEvents.map((event) => {
          const { month, day } = getMonthDay(event.date);
          return (
            <a
              key={event.id}
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-4 p-4 bg-transparent rounded-lg hover:bg-[#F8F9F8] transition-all duration-150 cursor-pointer"
            >
              {/* Date Badge */}
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-[#E8F2ED] border border-[#2D5F4F] flex flex-col items-center justify-center">
                <div className="text-xs font-semibold text-[#2D5F4F] tracking-wide uppercase" style={{ letterSpacing: '0.5px' }}>
                  {month}
                </div>
                <div className="text-2xl font-bold text-[#2D5F4F] leading-none mt-0.5">
                  {day}
                </div>
              </div>

              {/* Event Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-base font-semibold text-[#2C2C2C] group-hover:text-[#2D5F4F] transition-colors">
                    {event.name}
                  </h4>
                  <svg 
                    className="w-4 h-4 text-[#999] group-hover:text-[#2D5F4F] transition-all duration-150 flex-shrink-0 mt-0.5 group-hover:translate-x-0.5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24" 
                    strokeWidth="2"
                    style={{ minWidth: '16px' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <p className="text-sm text-[#666] leading-relaxed line-clamp-2">
                  {event.description}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      {/* View All Button */}
      <div className="mt-6">
        <a
          href="https://www.telluride.com/festivals-events/events/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center border-2 border-[#2D5F4F] bg-transparent text-[#2D5F4F] px-6 py-3.5 rounded-lg font-semibold text-[15px] hover:bg-[#2D5F4F] hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
        >
          <span>View All Events</span>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}

