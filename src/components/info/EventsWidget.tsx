/**
 * Events Widget
 * Upcoming events in Telluride
 * Redesigned with cleaner layout and refined styling
 */

import React, { useState, useEffect } from 'react';

interface Event {
  id: string;
  name: string;
  date: string;
  type: 'festival' | 'concert' | 'sports' | 'art' | 'community';
  description: string;
  url: string; // Link to full event details on official Telluride site
}

// Telluride Events Hopper - Add new events here as they're announced
// Past events are automatically filtered out based on current date
// Widget shows the next 2-3 featured upcoming events
const TELLURIDE_EVENTS: Event[] = [
  {
    id: '1',
    name: 'Peter and the Starcatcher',
    date: '2025-11-14',
    type: 'art',
    description: 'An apprentice Starcatcher and an orphan boy take to the high seas in this whimsical origin story',
    url: 'https://www.telluride.com/event/peter-and-the-starcatcher/',
  },
  {
    id: '2',
    name: 'The War and Treaty',
    date: '2025-11-15',
    type: 'concert',
    description: 'Founded by husband-and-wife duo Michael and Tanya Trotter, The War And Treaty has emerged as one of the most powerful voices',
    url: 'https://www.telluride.com/event/the-war-and-treaty/',
  },
  {
    id: '3',
    name: 'Mountainfilm for Locals: Seasons of Stoke',
    date: '2025-11-19',
    type: 'festival',
    description: 'Free community screening at the Sheridan Opera House at 5:30 PM',
    url: 'https://www.telluride.com/event/mountainfilm-for-locals-seasons-of-stoke/',
  },
  {
    id: '4',
    name: 'After the Snowfall',
    date: '2025-11-21',
    type: 'festival',
    description: 'The Sheridan Arts Foundation presents Matchstick\'s film. Doors open 30 minutes before showtime',
    url: 'https://www.telluride.com/event/after-the-snowfall/',
  },
  {
    id: '5',
    name: 'Gondola Re-Opens for Winter Season',
    date: '2025-11-21',
    type: 'community',
    description: 'The gondola reopens at 6:30 AM on November 21 for the winter season',
    url: 'https://www.telluride.com/event/gondola-reopens-for-the-season/',
  },
  {
    id: '6',
    name: 'Turkey Trot',
    date: '2025-11-27',
    type: 'sports',
    description: 'Annual family holiday tradition, the Turkey Trot 5K Fun Run/Walk. Admission is free',
    url: 'https://www.telluride.com/event/san-miguel-county-turkey-trot/',
  },
  {
    id: '7',
    name: 'Thanksgiving Feast at Madeline Hotel',
    date: '2025-11-27',
    type: 'community',
    description: 'Gather with family and friends for The Madeline\'s annual Thanksgiving Dinner',
    url: 'https://www.telluride.com/event/thanksgiving-feast-at-madeline-hotel-residences/',
  },
  {
    id: '8',
    name: 'Thanksgiving Buffet at The View',
    date: '2025-11-27',
    type: 'community',
    description: 'Celebrate Thanksgiving at The View at Mountain Lodge Telluride with a chef-carved buffet',
    url: 'https://www.telluride.com/event/thanksgiving-buffet-at-the-view/',
  },
  {
    id: '9',
    name: 'Sno-ciety',
    date: '2025-11-28',
    type: 'festival',
    description: 'The Sheridan Arts Foundation presents Warren Miller\'s film. Doors open 30 minutes before showtime',
    url: 'https://www.telluride.com/event/sno-ciety/',
  },
  {
    id: '10',
    name: 'Noel Night',
    date: '2025-12-03',
    type: 'community',
    description: 'The ceremonial lighting of the Ski Tree and Main Street with holiday shopping and festivities',
    url: 'https://www.telluride.com/event/noel-night/',
  },
  {
    id: '11',
    name: 'Holiday Prelude',
    date: '2025-12-06',
    type: 'festival',
    description: 'A weekend of holiday magic in Mountain Village with ice skating, Santa, and tree lighting',
    url: 'https://www.telluride.com/event/holiday-prelude/',
  },
];

export function EventsWidget() {
  // Detect screen size to show different number of events
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Automatically filter for upcoming events only, sort by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const allUpcomingEvents = [...TELLURIDE_EVENTS]
    .filter(event => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Show 5 on desktop, 3 on mobile
  const upcomingEvents = allUpcomingEvents.slice(0, isDesktop ? 5 : 3);

  const getMonthDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString()
    };
  };

  return (
    <article className="bg-white rounded-2xl p-8 border border-[#E8E8E8] shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl bg-[#E8F2ED] flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold text-[#2C2C2C] mb-1">Upcoming Events</h3>
          <p className="text-sm font-medium text-[#666]">Festivals & Activities</p>
        </div>
      </div>

      {/* Events List - Shows next 2-3 upcoming events with proper hover states */}
      <div className="space-y-4 flex-1 mb-6">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => {
            const { month, day } = getMonthDay(event.date);
            return (
              <a
                key={event.id}
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 p-4 bg-transparent rounded-lg hover:bg-[#F8F9F8] transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] focus:ring-offset-2"
              >
                {/* Date Badge - Fixed border */}
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
                    {/* Chevron - Fixed color and alignment */}
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
                  {/* Description with proper line-clamp */}
                  <p className="text-sm text-[#666] leading-relaxed" style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {event.description}
                  </p>
                </div>
              </a>
            );
          })
        ) : (
          <div className="text-center py-8 text-[#666]">
            <p className="text-sm font-medium">Check back soon for upcoming events!</p>
          </div>
        )}
      </div>

      {/* View All Button - Fixed alignment */}
      <div className="mt-auto">
        <a
          href="https://www.telluride.com/festivals-events/events/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center border-2 border-[#2D5F4F] bg-transparent text-[#2D5F4F] px-6 py-3.5 rounded-lg font-semibold text-[15px] hover:bg-[#2D5F4F] hover:text-white transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] focus:ring-offset-2 cursor-pointer"
        >
          <span>View All Events</span>
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </article>
  );
}
