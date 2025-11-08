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
  icon: string;
}

// Curated Telluride events
const TELLURIDE_EVENTS: Event[] = [
  {
    id: '1',
    name: 'New Year\'s Eve Torchlight Parade',
    date: '2024-12-31',
    type: 'festival',
    description: 'Skiers descend the mountain with torches, followed by fireworks',
    icon: '🎆',
  },
  {
    id: '2',
    name: 'Telluride Film Festival',
    date: '2025-08-29',
    type: 'festival',
    description: 'Premier film festival showcasing independent cinema',
    icon: '🎬',
  },
  {
    id: '3',
    name: 'Bluegrass Festival',
    date: '2025-06-19',
    type: 'concert',
    description: 'Annual bluegrass music festival in the mountains',
    icon: '🎸',
  },
  {
    id: '4',
    name: 'Ice Climbing Festival',
    date: '2025-01-15',
    type: 'sports',
    description: 'Celebrate ice climbing with clinics and competitions',
    icon: '🧗',
  },
  {
    id: '5',
    name: 'Mountain Mardi Gras Parade',
    date: '2025-02-28',
    type: 'festival',
    description: 'Mardi Gras celebration in the mountains',
    icon: '🎭',
  },
  {
    id: '6',
    name: 'Jazz Festival',
    date: '2025-08-01',
    type: 'concert',
    description: 'World-class jazz in an intimate mountain setting',
    icon: '🎺',
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
  // Sort events by date and get next 4
  const sortedEvents = [...TELLURIDE_EVENTS].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const upcomingEvents = sortedEvents.slice(0, 4);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined 
    });
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-purple-50 rounded-2xl p-6 border border-purple-200 shadow-card hover:shadow-card-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-card">
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
      <div className="space-y-3 mb-6">
        {upcomingEvents.map((event) => (
          <div
            key={event.id}
            className="group p-4 bg-white rounded-xl border border-neutral-100 hover:border-purple-200 hover:shadow-card transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start gap-3">
              {/* Date Badge */}
              <div className={`flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br ${EVENT_COLORS[event.type]} flex flex-col items-center justify-center text-white shadow-sm`}>
                <div className="text-xs font-semibold">
                  {formatDate(event.date).split(' ')[0]}
                </div>
                <div className="text-lg font-bold leading-none">
                  {formatDate(event.date).split(' ')[1]}
                </div>
              </div>

              {/* Event Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-bold text-neutral-900 group-hover:text-purple-600 transition-colors line-clamp-1">
                    {event.name}
                  </h4>
                  <span className="text-2xl flex-shrink-0">{event.icon}</span>
                </div>
                <p className="text-sm text-neutral-600 line-clamp-2">{event.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View All CTA */}
      <a
        href="https://www.telluride.com/events"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors shadow-card hover:shadow-card-hover"
      >
        View Full Events Calendar
      </a>
    </div>
  );
}

