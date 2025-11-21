/**
 * Gondola Information Widget
 * Free gondola connecting Town and Mountain Village
 * Redesigned with sophisticated styling and clear visual hierarchy
 */

export function GondolaWidget() {
  const currentHour = new Date().getHours();
  const isOperating = currentHour >= 7 && currentHour < 24;

  return (
    <article className="bg-white rounded-2xl p-8 border border-[#E8E8E8] shadow-[0_4px_20px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-200 flex flex-col h-full">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-[#E8F2ED] flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-[#2D5F4F]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          
          {/* Title and Subtitle */}
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-[#2C2C2C] mb-1">Free Gondola</h3>
            <p className="text-sm font-medium text-[#666]">Town ↔ Mountain Village</p>
          </div>
        </div>

        {/* Status Indicator */}
        {isOperating && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 bg-[#8BA888] rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-[#666]">Operating Now</span>
          </div>
        )}
      </div>

      {/* Quick Stats Section */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-4 bg-[#F8F9F8] rounded-lg border border-[#E8E8E8]">
          <div className="text-[28px] font-bold text-[#2C2C2C] mb-1 leading-none">FREE</div>
          <div className="text-xs text-[#666] font-medium">No Ticket</div>
        </div>
        <div className="text-center p-4 bg-[#F8F9F8] rounded-lg border border-[#E8E8E8]">
          <div className="text-[28px] font-bold text-[#2C2C2C] mb-1 leading-none">13min</div>
          <div className="text-xs text-[#666] font-medium">Ride Time</div>
        </div>
        <div className="text-center p-4 bg-[#F8F9F8] rounded-lg border border-[#E8E8E8]">
          <div className="text-[28px] font-bold text-[#2C2C2C] mb-1 leading-none">24/7</div>
          <div className="text-xs text-[#666] font-medium">Year-Round</div>
        </div>
      </div>

      {/* Operating Details Section */}
      <div className="space-y-4 mb-6">
        {/* Operating Hours */}
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[#2D5F4F] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <div className="text-sm font-medium text-[#666]">Operating Hours</div>
            <div className="text-sm font-semibold text-[#2C2C2C]">6:30 AM - Midnight</div>
          </div>
        </div>

        {/* Frequency */}
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[#2D5F4F] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <div className="text-sm font-medium text-[#666]">Frequency</div>
            <div className="text-sm font-semibold text-[#2C2C2C]">Every 3-5 minutes</div>
          </div>
        </div>

        {/* Capacity */}
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-[#2D5F4F] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <div className="flex-1">
            <div className="text-sm font-medium text-[#666]">Capacity</div>
            <div className="text-sm font-semibold text-[#2C2C2C]">Up to 12 people</div>
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="mb-6">
        <h4 className="text-base font-semibold text-[#2C2C2C] mb-3">Key Features</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[#2D5F4F] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-[#666] leading-relaxed">Completely free to ride - no ticket required</span>
          </div>
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[#2D5F4F] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-[#666] leading-relaxed">Scenic 13-minute ride with mountain views</span>
          </div>
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[#2D5F4F] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-[#666] leading-relaxed">Wheelchair & bike accessible</span>
          </div>
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-[#2D5F4F] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-[#666] leading-relaxed">Runs in all weather conditions</span>
          </div>
        </div>
      </div>

      {/* Button */}
      <a
        href="https://www.telluride.com/discover/the-gondola/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto w-full text-center border-2 border-[#2D5F4F] bg-transparent text-[#2D5F4F] px-6 py-3.5 rounded-lg font-semibold text-[15px] hover:bg-[#2D5F4F] hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] focus:ring-offset-2"
      >
        View Full Gondola Info
      </a>
    </article>
  );
}
