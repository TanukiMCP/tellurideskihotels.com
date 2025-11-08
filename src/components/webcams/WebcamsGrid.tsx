/**
 * Webcams Grid Component
 * Displays live webcam feeds from Telluride
 */

const TELLURIDE_WEBCAMS = [
  {
    id: 'summit',
    name: 'Summit Cam',
    url: 'https://www.tellurideskiresort.com/the-mountain/mountain-conditions/mountain-cams.aspx',
    imageUrl: 'https://images.tellurideskiresort.com/webcams/MarkSteve.jpg',
    description: 'View from the summit',
    elevation: '12,570 ft',
    icon: '🏔️',
  },
  {
    id: 'village',
    name: 'Mountain Village',
    url: 'https://www.tellurideskiresort.com/the-mountain/mountain-conditions/mountain-cams.aspx',
    imageUrl: 'https://images.tellurideskiresort.com/webcams/MarketSquare.jpg',
    description: 'Mountain Village Plaza',
    elevation: '9,540 ft',
    icon: '🏘️',
  },
  {
    id: 'base',
    name: 'Base Area',
    url: 'https://www.tellurideskiresort.com/the-mountain/mountain-conditions/mountain-cams.aspx',
    imageUrl: 'https://images.tellurideskiresort.com/webcams/TellurideStation.jpg',
    description: 'Gondola base station',
    elevation: '8,750 ft',
    icon: '🎿',
  },
  {
    id: 'town',
    name: 'Town of Telluride',
    url: 'https://www.telluride-co.gov/webcam',
    imageUrl: 'https://www.telluridegateway.com/webcams/colorado.jpg',
    description: 'Historic downtown',
    elevation: '8,750 ft',
    icon: '🏛️',
  },
];

interface WebcamsGridProps {
  className?: string;
}

export function WebcamsGrid({ className = '' }: WebcamsGridProps) {
  const handleWebcamClick = (webcam: typeof TELLURIDE_WEBCAMS[0]) => {
    window.open(webcam.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {TELLURIDE_WEBCAMS.map((webcam) => (
        <div
          key={webcam.id}
          onClick={() => handleWebcamClick(webcam)}
          className="group bg-white rounded-2xl overflow-hidden border border-neutral-200 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer hover:-translate-y-1"
        >
          {/* Image */}
          <div className="relative h-48 bg-neutral-100 overflow-hidden">
            <img
              src={webcam.imageUrl}
              alt={webcam.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                // Fallback if image fails to load
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" x="50" y="50" text-anchor="middle" dy=".3em" font-family="Arial" font-size="14"%3ELive Webcam%3C/text%3E%3C/svg%3E';
              }}
            />
            {/* Live Badge */}
            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-card animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              LIVE
            </div>
            {/* Emoji Icon */}
            <div className="absolute top-3 left-3 text-3xl drop-shadow-lg">
              {webcam.icon}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="text-lg font-bold text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
              {webcam.name}
            </h3>
            <p className="text-sm text-neutral-600 mb-2">{webcam.description}</p>
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                <span>{webcam.elevation}</span>
              </div>
              <div className="text-primary-600 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                View
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

