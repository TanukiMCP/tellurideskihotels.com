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

// Curated Telluride annual events (updated for 2025)
const TELLURIDE_EVENTS: Event[] = [
  {
    id: '1',
    name: 'Ice Climbing Festival',
    date: '2025-01-17',
    type: 'sports',
    description: 'Celebrate ice climbing with clinics and competitions',
  },
  {
    id: '2',
    name: 'Mountain Mardi Gras Parade',
    date: '2025-02-27',
    type: 'festival',
    description: 'Mardi Gras celebration in the mountains',
  },
  {
    id: '3',
    name: 'Telluride Mountainfilm',
    date: '2025-05-23',
    type: 'festival',
    description: 'Documentary festival celebrating mountain culture and environment',
  },
  {
    id: '4',
    name: 'Bluegrass Festival',
    date: '2025-06-18',
    type: 'concert',
    description: 'Annual bluegrass music festival in the mountains',
  },
  {
    id: '5',
    name: 'Jazz Festival',
    date: '2025-08-08',
    type: 'concert',
    description: 'World-class jazz in an intimate mountain setting',
  },
  {
    id: '6',
    name: 'Telluride Film Festival',
    date: '2025-08-29',
    type: 'festival',
    description: 'Premier film festival showcasing independent cinema',
  },
  {
    id: '7',
    name: 'New Year\'s Eve Torchlight Parade',
    date: '2025-12-31',
    type: 'festival',
    description: 'Skiers descend the mountain with torches, followed by fireworks',
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
  // Filter for upcoming events only, sort by date, and get next 3 (to show more prominently)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingEvents = [...TELLURIDE_EVENTS]
    .filter(event => new Date(event.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

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

      {/* Events List */}
      <div className="space-y-4 mb-6">
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => {
            const { month, day } = getMonthDay(event.date);
            return (
              <div
                key={event.id}
                className="group p-4 bg-white rounded-xl border border-neutral-200 hover:border-primary-300 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  {/* Date Badge */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-primary-600 flex flex-col items-center justify-center text-white shadow-sm">
                    <div className="text-xs font-bold tracking-wide">
                      {month}
                    </div>
                    <div className="text-2xl font-bold leading-none">
                      {day}
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-base text-neutral-900 group-hover:text-primary-600 transition-colors line-clamp-1 mb-1.5">
                      {event.name}
                    </h4>
                    <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">{event.description}</p>
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

