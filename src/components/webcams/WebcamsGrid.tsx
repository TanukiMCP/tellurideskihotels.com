/**
 * Webcams Grid Component
 * Displays live webcam feeds from Telluride
 */

const TELLURIDE_WEBCAMS = [
  {
    id: 'summit',
    name: 'Summit Cam',
    url: 'https://www.tellurideskiresort.com/the-mountain/mountain-conditions/mountain-cams.aspx',
    imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="sky" x1="0%25" y1="0%25" x2="0%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2387CEEB;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23E0F6FF;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23sky)"/%3E%3Cpolygon points="200,80 300,200 100,200" fill="%23FFFFFF"/%3E%3Cpolygon points="150,140 250,140 200,80" fill="%23F0F8FF"/%3E%3Ctext x="200" y="250" font-family="Arial, sans-serif" font-size="18" fill="%23333" text-anchor="middle" font-weight="bold"%3ESummit View%3C/text%3E%3Ctext x="200" y="270" font-family="Arial, sans-serif" font-size="14" fill="%23666" text-anchor="middle"%3E12,570 ft%3C/text%3E%3C/svg%3E',
    description: 'View from the summit',
    elevation: '12,570 ft',
    icon: '🏔️',
  },
  {
    id: 'village',
    name: 'Mountain Village',
    url: 'https://www.tellurideskiresort.com/the-mountain/mountain-conditions/mountain-cams.aspx',
    imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="sky2" x1="0%25" y1="0%25" x2="0%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2387CEEB;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23E0F6FF;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23sky2)"/%3E%3Crect x="80" y="180" width="60" height="80" fill="%23A0826D"/%3E%3Cpolygon points="110,180 80,150 140,150" fill="%238B4513"/%3E%3Crect x="260" y="180" width="60" height="80" fill="%23A0826D"/%3E%3Cpolygon points="290,180 260,150 320,150" fill="%238B4513"/%3E%3Crect x="170" y="200" width="60" height="60" fill="%23D2691E"/%3E%3Cpolygon points="200,200 170,170 230,170" fill="%23A0522D"/%3E%3Ctext x="200" y="280" font-family="Arial, sans-serif" font-size="18" fill="%23333" text-anchor="middle" font-weight="bold"%3EMountain Village%3C/text%3E%3C/svg%3E',
    description: 'Mountain Village Plaza',
    elevation: '9,540 ft',
    icon: '🏘️',
  },
  {
    id: 'base',
    name: 'Base Area',
    url: 'https://www.tellurideskiresort.com/the-mountain/mountain-conditions/mountain-cams.aspx',
    imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="sky3" x1="0%25" y1="0%25" x2="0%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2387CEEB;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23E0F6FF;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23sky3)"/%3E%3Cpolygon points="100,120 200,60 300,120 300,220 100,220" fill="%234A7C59"/%3E%3Crect x="160" y="150" width="80" height="70" fill="%23333"/%3E%3Ccircle cx="200" cy="100" r="30" fill="%23FFD700"/%3E%3Cline x1="140" y1="100" x2="260" y2="100" stroke="%23333" stroke-width="3"/%3E%3Ctext x="200" y="260" font-family="Arial, sans-serif" font-size="18" fill="%23333" text-anchor="middle" font-weight="bold"%3EBase Gondola%3C/text%3E%3C/svg%3E',
    description: 'Gondola base station',
    elevation: '8,750 ft',
    icon: '🎿',
  },
  {
    id: 'town',
    name: 'Town of Telluride',
    url: 'https://www.telluride-co.gov/',
    imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="sky4" x1="0%25" y1="0%25" x2="0%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2387CEEB;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23E0F6FF;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23sky4)"/%3E%3Cpolygon points="0,150 100,80 200,100 300,90 400,140 400,300 0,300" fill="%238B7355"/%3E%3Crect x="50" y="200" width="40" height="60" fill="%23D2691E"/%3E%3Crect x="56" y="215" width="12" height="15" fill="%23FFD700"/%3E%3Crect x="72" y="215" width="12" height="15" fill="%23FFD700"/%3E%3Crect x="150" y="190" width="50" height="70" fill="%23A0522D"/%3E%3Crect x="158" y="205" width="15" height="18" fill="%2387CEEB"/%3E%3Crect x="177" y="205" width="15" height="18" fill="%2387CEEB"/%3E%3Crect x="310" y="210" width="35" height="50" fill="%23CD853F"/%3E%3Crect x="316" y="225" width="10" height="12" fill="%23ADD8E6"/%3E%3Ctext x="200" y="280" font-family="Arial, sans-serif" font-size="18" fill="%23333" text-anchor="middle" font-weight="bold"%3EDowntown%3C/text%3E%3C/svg%3E',
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
            />
            {/* Click to View Badge */}
            <div className="absolute top-3 right-3 bg-primary-600 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-card">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              VIEW LIVE
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

