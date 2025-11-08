/**
 * Gondola Information Widget
 * Free gondola connecting Town and Mountain Village
 */

export function GondolaWidget() {
  const currentHour = new Date().getHours();
  const isOperating = currentHour >= 7 && currentHour < 24;

  return (
    <div className="bg-gradient-to-br from-accent-50 via-white to-accent-50 rounded-2xl p-6 border border-accent-200 shadow-card hover:shadow-card-hover transition-all duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-card">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-neutral-900">Free Gondola</h3>
          <p className="text-sm text-neutral-600">Town ↔ Mountain Village</p>
        </div>
        {isOperating && (
          <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-card">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            OPERATING
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-4 bg-white rounded-xl border border-accent-100 shadow-sm">
          <div className="text-2xl font-bold text-accent-600 mb-1">FREE</div>
          <div className="text-xs text-neutral-600 font-medium">No Ticket</div>
        </div>
        <div className="text-center p-4 bg-white rounded-xl border border-accent-100 shadow-sm">
          <div className="text-2xl font-bold text-accent-600 mb-1">13min</div>
          <div className="text-xs text-neutral-600 font-medium">Ride Time</div>
        </div>
        <div className="text-center p-4 bg-white rounded-xl border border-accent-100 shadow-sm">
          <div className="text-2xl font-bold text-accent-600 mb-1">24/7</div>
          <div className="text-xs text-neutral-600 font-medium">Year-Round</div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-neutral-900">Operating Hours</span>
          </div>
          <span className="text-sm font-bold text-accent-600">7:00 AM - 12:00 AM</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
            <span className="font-semibold text-neutral-900">Frequency</span>
          </div>
          <span className="text-sm font-bold text-primary-600">Every 3-5 minutes</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-neutral-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="font-semibold text-neutral-900">Capacity</span>
          </div>
          <span className="text-sm font-bold text-secondary-600">Up to 12 people</span>
        </div>
      </div>

      {/* Key Features */}
      <div className="space-y-2 mb-6">
        <h4 className="text-sm font-bold text-neutral-900 mb-3">Key Features</h4>
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Completely free to ride - no ticket required</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Scenic 13-minute ride with mountain views</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Wheelchair & bike accessible</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-700">
          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Runs in all weather conditions</span>
        </div>
      </div>

      {/* Learn More CTA */}
      <a
        href="https://www.telluride-co.gov/gondola"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-accent-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-accent-700 transition-colors shadow-card hover:shadow-card-hover"
      >
        View Gondola Schedule
      </a>
    </div>
  );
}

