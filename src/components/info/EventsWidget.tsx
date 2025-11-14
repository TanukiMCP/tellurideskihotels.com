/**
 * Events Widget
 * Upcoming events in Telluride
 */

interface Event {
  id: string;
  name: string;
  date: string;
  type: 'festival' | 'concert' | 'sports' | 'art' | 'community';
  description: string;
}

// Telluride Events Hopper - Add new events here as they're announced
// Past events are automatically filtered out based on current date
// Widget always shows the next 4 upcoming events
// Last updated: November 14, 2025
const TELLURIDE_EVENTS: Event[] = [
  {
    id: '1',
    name: 'The War and Treaty',
    date: '2025-11-15',
    type: 'concert',
    description: 'Founded by husband-and-wife duo Michael and Tanya Trotter, an evening of soul and Americana music',
  },
  {
    id: '2',
    name: 'Mountainfilm for Locals: Seasons of Stoke',
    date: '2025-11-19',
    type: 'festival',
    description: 'Free community screening at the Sheridan Opera House',
  },
  {
    id: '3',
    name: 'Gondola Re-Opens for Winter Season',
    date: '2025-11-21',
    type: 'community',
    description: 'The gondola reopens at 6:30 AM for the winter season',
  },
  {
    id: '4',
    name: 'Turkey Trot 5K',
    date: '2025-11-27',
    type: 'sports',
    description: 'Annual family holiday tradition fun run/walk, free admission',
  },
  {
    id: '5',
    name: 'Telluride Ski Resort Opening Day',
    date: '2025-12-06',
    type: 'sports',
    description: 'Opening weekend with plenty to do on and off the mountain',
  },
  {
    id: '6',
    name: 'Noel Night',
    date: '2025-12-10',
    type: 'festival',
    description: 'Lighting of the ceremonial Ski Tree and holiday shopping downtown',
  },
  {
    id: '7',
    name: 'Mountain Village Holiday Prelude',
    date: '2025-12-13',
    type: 'festival',
    description: 'Mountain Village transforms into the North Pole for holiday celebration',
  },
  {
    id: '8',
    name: 'Christmas Eve Torchlight Parade',
    date: '2025-12-24',
    type: 'festival',
    description: 'Torchlight parade from the top of the Gondola down into Telluride',
  },
  {
    id: '9',
    name: 'New Year\'s Eve Torchlight Parade',
    date: '2025-12-31',
    type: 'festival',
    description: 'Ski instructors descend the mountain with torches followed by fireworks',
  },
  {
    id: '10',
    name: 'Telluride Bluegrass Festival',
    date: '2026-06-18',
    type: 'concert',
    description: 'Annual pilgrimage for Festivarians to celebrate bluegrass in the mountains',
  },
  {
    id: '11',
    name: 'Telluride Yoga Festival',
    date: '2026-06-25',
    type: 'festival',
    description: 'Longest running yoga festival in the country, four-day wellness gathering',
  },
  {
    id: '12',
    name: 'Telluride Blues & Brews Festival',
    date: '2026-09-18',
    type: 'concert',
    description: 'One of the most scenic and intimate music festivals in the country',
  },
];

const EVENT_COLORS = {
  festival: 'from-purple-500 to-purple-600',
  concert: 'from-pink-500 to-pink-600',
  sports: 'from-blue-500 to-blue-600',
  art: 'from-accent-500 to-accent-600',
  community: 'from-primary-500 to-primary-600',
};

export function EventsWidget() {
  // Automatically filter for upcoming events only, sort by date, and get next 4
  // Past events are automatically excluded based on current date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingEvents = [...TELLURIDE_EVENTS]
    .filter(event => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
    });
  };

  const getMonthDay = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: date.getDate().toString()
    };
  };

  return (
    <div className="bg-primary-50 rounded-2xl p-6 border border-primary-200 shadow-card hover:shadow-card-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-card">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-neutral-900">Upcoming Events</h3>
          <p className="text-sm text-neutral-600">Festivals & Activities</p>
        </div>
      </div>

      {/* Events List - Shows next 4 upcoming events */}
      <div className="space-y-3 mb-6">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => {
            const { month, day } = getMonthDay(event.date);
            return (
              <div
                key={event.id}
                className="group p-3.5 bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  {/* Date Badge */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary-600 flex flex-col items-center justify-center text-white shadow-sm">
                    <div className="text-xs font-bold tracking-wide">
                      {month}
                    </div>
                    <div className="text-xl font-bold leading-none">
                      {day}
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-1">
                      {event.name}
                    </h4>
                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">{event.description}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-neutral-600">
            <p className="text-sm font-medium">Check back soon for upcoming events!</p>
          </div>
        )}
      </div>

      {/* View All CTA */}
      <a
        href="https://www.telluride.com/festivals-events/events/"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-primary-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
      >
        <span>View Full Events Calendar</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}

