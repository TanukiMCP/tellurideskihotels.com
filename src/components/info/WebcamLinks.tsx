/**
 * Webcam Links Component
 * Provides direct links to live Telluride webcams
 */

const WEBCAM_SOURCES = [
  {
    id: 'ski-resort',
    name: 'Telluride Ski Resort Webcams',
    url: 'https://tellurideskiresort.com/webcams/',
    description: 'Multiple live cams including Revelation Bowl, Village, and terrain parks',
    icon: '⛷️',
    locations: ['Summit', 'Village', 'Base Area', 'Terrain Parks'],
  },
  {
    id: 'downtown',
    name: 'Downtown Telluride',
    url: 'https://www.telluride.com/plan-your-visit/webcams/',
    description: 'Live views of Main Street and the Box Canyon',
    icon: '🏛️',
    locations: ['Main Street', 'Box Canyon'],
  },
  {
    id: 'airport',
    name: 'Telluride Airport Webcam',
    url: 'https://tellurideairport.com/airport-webcam/',
    description: 'Airport views with surrounding mountain panoramas',
    icon: '✈️',
    locations: ['Airport', 'Mountain Views'],
  },
];

export function WebcamLinks() {
  return (
    <div className="bg-gradient-to-br from-sky-50 via-white to-sky-50 rounded-2xl p-6 border border-sky-200 shadow-card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-card">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-neutral-900">Live Webcams</h3>
          <p className="text-sm text-neutral-600">See current conditions</p>
        </div>
      </div>

      {/* Webcam Sources */}
      <div className="space-y-3">
        {WEBCAM_SOURCES.map((source) => (
          <a
            key={source.id}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block group p-4 bg-white rounded-xl border border-neutral-200 hover:border-sky-300 hover:shadow-card transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="text-3xl flex-shrink-0 mt-1">
                {source.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-bold text-neutral-900 group-hover:text-sky-600 transition-colors">
                    {source.name}
                  </h4>
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
                <p className="text-sm text-neutral-600 mb-2">
                  {source.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {source.locations.map((location) => (
                    <span
                      key={location}
                      className="px-2 py-1 bg-sky-50 text-sky-700 text-xs font-medium rounded-md"
                    >
                      {location}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg">
        <p className="text-xs text-sky-800">
          <span className="font-semibold">💡 Tip:</span> Webcams are updated every few minutes. Check conditions before heading to the mountain!
        </p>
      </div>
    </div>
  );
}

