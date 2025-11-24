/**
 * BlogMap Component
 * Lightweight, embeddable Mapbox widget for MDX blog posts
 * Features multiple presets for different content contexts
 * 
 * For hotel markers: Shows rich preview cards with image, rating, and View Details CTA
 * For other markers: Shows simple label popups
 */
import { useRef, useState, useEffect, useMemo } from 'react';
import Map, { Marker, NavigationControl, Popup, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { MAPBOX_TOKEN, TELLURIDE_CENTER, MOUNTAIN_VILLAGE_CENTER, TELLURIDE_AREA_CENTER } from '@/lib/mapbox-utils';
import { MapPin, Mountain, Building2, Cable, Trees, Info, X, ChevronRight, Star } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

// Preset configurations
const PRESETS = {
  resort: {
    center: [-107.8125, 37.9275] as [number, number],
    zoom: 13,
    showTrails: true,
    showLifts: true,
    showPOIs: false,
  },
  town: {
    center: TELLURIDE_CENTER,
    zoom: 15,
    showTrails: false,
    showLifts: false,
    showPOIs: false,
  },
  'mountain-village': {
    center: MOUNTAIN_VILLAGE_CENTER,
    zoom: 14.5,
    showTrails: true,
    showLifts: true,
    showPOIs: false,
  },
  overview: {
    center: TELLURIDE_AREA_CENTER,
    zoom: 12.5,
    showTrails: true,
    showLifts: true,
    showPOIs: false,
  },
  hotels: {
    center: TELLURIDE_AREA_CENTER,
    zoom: 13,
    showTrails: false,
    showLifts: true,
    showPOIs: false,
  },
  trails: {
    center: [-107.82, 37.935] as [number, number],
    zoom: 13.5,
    showTrails: true,
    showLifts: true,
    showPOIs: false,
  },
};

const MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

// Trail difficulty colors (matches InteractiveTrailMap)
const TRAIL_COLORS: Record<string, string> = {
  novice: '#22c55e',
  easy: '#22c55e',
  intermediate: '#3b82f6',
  advanced: '#1e1e1e',
  expert: '#ef4444',
  freeride: '#ef4444',
};

// Marker icon colors by type
const MARKER_COLORS: Record<string, string> = {
  hotel: '#4A7C59',
  restaurant: '#ef4444',
  lift: '#f59e0b',
  trail: '#3b82f6',
  viewpoint: '#06b6d4',
  parking: '#6b7280',
  gondola: '#f59e0b',
  default: '#4A7C59',
};

export interface BlogMapMarker {
  lng: number;
  lat: number;
  label: string;
  color?: string;
  icon?: 'hotel' | 'restaurant' | 'lift' | 'trail' | 'viewpoint' | 'parking' | 'gondola' | 'default';
}

export interface BlogMapProps {
  /** Map preset determines default configuration */
  preset?: 'resort' | 'town' | 'mountain-village' | 'overview' | 'hotels' | 'trails';
  /** Custom center point [lng, lat] */
  center?: [number, number];
  /** Zoom level */
  zoom?: number;
  /** Enable 3D terrain */
  terrain?: boolean;
  /** Show ski trails overlay */
  showTrails?: boolean;
  /** Show lift lines */
  showLifts?: boolean;
  /** Hotel IDs to show as markers with rich preview cards */
  hotelIds?: string[];
  /** Custom point markers (simple label popups) */
  markers?: BlogMapMarker[];
  /** Highlight specific trails by name */
  highlightTrails?: string[];
  /** Map height */
  height?: string;
  /** Optional caption */
  caption?: string;
  /** Interactive controls */
  interactive?: boolean;
  /** Show legend */
  showLegend?: boolean;
}

// Full hotel data from API for rich preview cards
interface HotelData {
  hotel_id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  // Location can come in different formats from API
  location?: {
    latitude?: number;
    longitude?: number;
  };
  // Image data
  images?: Array<{ url: string }>;
  main_photo?: string;
  // Ratings
  star_rating?: number;
  review_score?: number;
  review_count?: number;
  // Address
  address?: {
    line1?: string;
    city?: string;
  };
}

// Marker icon component
function MarkerIcon({ type, size = 24 }: { type: string; size?: number }) {
  const color = MARKER_COLORS[type] || MARKER_COLORS.default;
  
  switch (type) {
    case 'hotel':
      return <Building2 size={size} color="white" />;
    case 'restaurant':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
          <path d="M7 2v20" />
          <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
        </svg>
      );
    case 'lift':
    case 'gondola':
      return <Cable size={size} color="white" />;
    case 'trail':
      return <Trees size={size} color="white" />;
    case 'viewpoint':
      return <Mountain size={size} color="white" />;
    case 'parking':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
        </svg>
      );
    default:
      return <MapPin size={size} color="white" />;
  }
}

// Hotel Preview Card Component (shown in popup)
function HotelPreviewCard({ hotel, onViewDetails }: { hotel: HotelData; onViewDetails: () => void }) {
  // Get primary image
  const primaryImage = hotel.images?.[0]?.url || hotel.main_photo;
  
  // Get location string
  const locationString = hotel.address?.city || hotel.address?.line1 || 'Telluride, CO';
  
  return (
    <div className="w-[260px]">
      {/* Hero Image */}
      {primaryImage && (
        <div className="relative w-full h-[120px] mb-2 rounded-lg overflow-hidden">
          <img 
            src={primaryImage}
            alt={hotel.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Star Rating Badge */}
          {hotel.star_rating && hotel.star_rating > 0 && (
            <div className="absolute top-2 left-2 bg-white/95 px-1.5 py-0.5 rounded shadow-sm">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={10}
                    className={i < hotel.star_rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hotel Name */}
      <h3 className="text-sm font-bold text-neutral-900 mb-1 line-clamp-2 leading-tight">
        {hotel.name}
      </h3>

      {/* Location */}
      <div className="flex items-center gap-1 mb-2">
        <MapPin size={12} className="text-gray-400 flex-shrink-0" />
        <p className="text-xs text-gray-500 line-clamp-1">
          {locationString}
        </p>
      </div>

      {/* Guest Rating */}
      {hotel.review_score && hotel.review_score > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="bg-primary-600 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
            {hotel.review_score.toFixed(1)}
          </span>
          <span className="text-xs text-gray-500">
            {hotel.review_count ? `${hotel.review_count.toLocaleString()} reviews` : 'Guest rating'}
          </span>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={onViewDetails}
        className="w-full inline-flex items-center justify-center gap-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors"
      >
        View Details
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

export function BlogMap({
  preset = 'resort',
  center,
  zoom,
  terrain = false,
  showTrails: showTrailsProp,
  showLifts: showLiftsProp,
  hotelIds,
  markers = [],
  highlightTrails = [],
  height = '400px',
  caption,
  interactive = true,
  showLegend = true,
}: BlogMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [trailsData, setTrailsData] = useState<any>(null);
  const [liftsData, setLiftsData] = useState<any>(null);
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [simplePopupInfo, setSimplePopupInfo] = useState<{ lng: number; lat: number; label: string } | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // Get preset config
  const presetConfig = PRESETS[preset];
  
  // Merge props with preset defaults
  const mapCenter = center || presetConfig.center;
  const mapZoom = zoom ?? presetConfig.zoom;
  const showTrails = showTrailsProp ?? presetConfig.showTrails;
  const showLifts = showLiftsProp ?? presetConfig.showLifts;
  
  // Auto-enable 3D terrain for trail-focused maps (more useful/cooler for ski content)
  const enableTerrain = terrain || preset === 'trails' || highlightTrails.length > 0;

  // Load trail data
  useEffect(() => {
    if (!showTrails) return;
    
    fetch('/data/telluride-ski-trails.json')
      .then(res => res.json())
      .then(data => {
        // Filter for resort bounds
        const filtered = {
          ...data,
          features: data.features.filter((feature: any) => {
            const name = feature.properties?.name || '';
            return !name.toLowerCase().includes('unnamed trail');
          })
        };
        setTrailsData(filtered);
      })
      .catch(err => console.error('[BlogMap] Failed to load trails:', err));
  }, [showTrails]);

  // Load lift data
  useEffect(() => {
    if (!showLifts) return;
    
    fetch('/data/telluride-lifts.json')
      .then(res => res.json())
      .then(data => setLiftsData(data))
      .catch(err => console.error('[BlogMap] Failed to load lifts:', err));
  }, [showLifts]);

  // Load hotel data if hotelIds provided
  useEffect(() => {
    if (!hotelIds || hotelIds.length === 0) return;
    
    const fetchHotels = async () => {
      const hotelPromises = hotelIds.map(async (hotelId) => {
        try {
          const response = await fetch(`/api/hotels/details?hotelId=${hotelId}`);
          if (response.ok) {
            const data = await response.json();
            return data.data || data;
          }
          return null;
        } catch (err) {
          console.error(`[BlogMap] Error fetching hotel ${hotelId}:`, err);
          return null;
        }
      });
      
      const fetchedHotels = await Promise.all(hotelPromises);
      // Filter for valid hotels with coordinates
      const validHotels = fetchedHotels.filter((h): h is HotelData => {
        if (!h) return false;
        const lat = h.latitude || h.location?.latitude;
        const lng = h.longitude || h.location?.longitude;
        return lat !== undefined && lng !== undefined;
      });
      setHotels(validHotels);
    };
    
    fetchHotels();
  }, [hotelIds]);

  // Helper to get hotel coordinates
  const getHotelCoords = (hotel: HotelData) => ({
    lat: hotel.latitude || hotel.location?.latitude || 0,
    lng: hotel.longitude || hotel.location?.longitude || 0,
  });

  // Handle map load
  const handleMapLoad = () => {
    setIsMapLoaded(true);
    
    if (enableTerrain && mapRef.current) {
      const map = mapRef.current.getMap();
      
      // Add terrain source
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });
      }
      
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });
    }
  };

  // Fit bounds to hotels if showing hotel markers
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || hotels.length === 0) return;
    
    if (preset === 'hotels' && hotels.length > 0) {
      const map = mapRef.current.getMap();
      
      // Calculate bounds
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      hotels.forEach(hotel => {
        const { lat, lng } = getHotelCoords(hotel);
        if (lng && lat) {
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
        }
      });
      
      if (minLng !== Infinity) {
        // Add padding
        const lngPadding = (maxLng - minLng) * 0.3 || 0.01;
        const latPadding = (maxLat - minLat) * 0.3 || 0.01;
        
        map.fitBounds(
          [[minLng - lngPadding, minLat - latPadding], [maxLng + lngPadding, maxLat + latPadding]],
          { padding: 50, duration: 1000 }
        );
      }
    }
  }, [isMapLoaded, hotels, preset]);

  // Handle hotel marker click
  const handleHotelClick = (hotel: HotelData) => {
    setSimplePopupInfo(null); // Close any simple popup
    setSelectedHotel(hotel);
    
    // Pan to hotel
    if (mapRef.current) {
      const { lat, lng } = getHotelCoords(hotel);
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: Math.max(mapZoom, 14),
        duration: 500,
      });
    }
  };

  // Handle view details click
  const handleViewDetails = (hotelId: string) => {
    // Navigate to hotel detail page
    window.location.href = `/lodging/${hotelId}`;
  };

  // Trail layer paint configuration
  const trailLayerPaint = useMemo(() => ({
    'line-color': highlightTrails.length > 0 ? [
      'case',
      ['in', ['get', 'name'], ['literal', highlightTrails]],
      '#f59e0b', // Highlight color (amber)
      [
        'match',
        ['get', 'piste:difficulty'],
        'novice', TRAIL_COLORS.novice,
        'easy', TRAIL_COLORS.easy,
        'intermediate', TRAIL_COLORS.intermediate,
        'advanced', TRAIL_COLORS.advanced,
        'expert', TRAIL_COLORS.expert,
        'freeride', TRAIL_COLORS.freeride,
        TRAIL_COLORS.intermediate
      ]
    ] : [
      'match',
      ['get', 'piste:difficulty'],
      'novice', TRAIL_COLORS.novice,
      'easy', TRAIL_COLORS.easy,
      'intermediate', TRAIL_COLORS.intermediate,
      'advanced', TRAIL_COLORS.advanced,
      'expert', TRAIL_COLORS.expert,
      'freeride', TRAIL_COLORS.freeride,
      TRAIL_COLORS.intermediate
    ],
    'line-width': highlightTrails.length > 0 ? [
      'case',
      ['in', ['get', 'name'], ['literal', highlightTrails]],
      5,
      3
    ] : 3,
    'line-opacity': highlightTrails.length > 0 ? [
      'case',
      ['in', ['get', 'name'], ['literal', highlightTrails]],
      1,
      0.6
    ] : 0.85
  }), [highlightTrails]);

  return (
    <div className="my-8 not-prose">
      <div 
        className="relative rounded-xl overflow-hidden border border-neutral-200 shadow-md"
        style={{ height }}
      >
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: mapCenter[0],
            latitude: mapCenter[1],
            zoom: mapZoom,
            pitch: enableTerrain ? 45 : 0,
            bearing: enableTerrain ? -15 : 0,
          }}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
          onClick={() => {
            setSelectedHotel(null);
            setSimplePopupInfo(null);
          }}
          scrollZoom={interactive}
          dragPan={interactive}
          dragRotate={interactive && enableTerrain}
          touchZoomRotate={interactive}
          doubleClickZoom={interactive}
          keyboard={interactive}
          maxPitch={enableTerrain ? 85 : 0}
        >
          {interactive && (
            <NavigationControl position="top-right" showCompass={enableTerrain} visualizePitch={enableTerrain} />
          )}

          {/* Trails layer */}
          {showTrails && trailsData && (
            <Source id="trails" type="geojson" data={trailsData}>
              <Layer
                id="trails-layer"
                type="line"
                paint={trailLayerPaint as any}
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round',
                }}
              />
            </Source>
          )}

          {/* Lifts layer */}
          {showLifts && liftsData && (
            <Source id="lifts" type="geojson" data={liftsData}>
              <Layer
                id="lifts-layer"
                type="line"
                paint={{
                  'line-color': '#f59e0b',
                  'line-width': 2,
                  'line-opacity': 0.8,
                  'line-dasharray': [2, 2],
                }}
                layout={{
                  'line-join': 'round',
                  'line-cap': 'round',
                }}
              />
            </Source>
          )}

          {/* Hotel Markers (with rich preview cards) */}
          {hotels.map((hotel) => {
            const { lat, lng } = getHotelCoords(hotel);
            const isSelected = selectedHotel?.hotel_id === hotel.hotel_id;
            
            return (
              <Marker
                key={hotel.hotel_id}
                longitude={lng}
                latitude={lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  handleHotelClick(hotel);
                }}
              >
                <div 
                  className={`cursor-pointer transform transition-all duration-200 ${
                    isSelected ? 'scale-125 z-20' : 'hover:scale-110'
                  }`}
                  style={{ 
                    backgroundColor: isSelected ? '#2563eb' : MARKER_COLORS.hotel,
                    padding: '8px',
                    borderRadius: '50%',
                    boxShadow: isSelected 
                      ? '0 4px 12px rgba(37, 99, 235, 0.5)' 
                      : '0 2px 8px rgba(0,0,0,0.3)',
                    border: '2px solid white',
                  }}
                >
                  <Building2 size={18} color="white" />
                </div>
              </Marker>
            );
          })}

          {/* Custom Markers (simple label popups) */}
          {markers.map((marker, index) => (
            <Marker
              key={`${marker.label}-${index}`}
              longitude={marker.lng}
              latitude={marker.lat}
              anchor="bottom"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedHotel(null);
                setSimplePopupInfo({ lng: marker.lng, lat: marker.lat, label: marker.label });
              }}
            >
              <div 
                className="cursor-pointer transform hover:scale-110 transition-transform"
                style={{ 
                  backgroundColor: marker.color || MARKER_COLORS[marker.icon || 'default'],
                  padding: '6px',
                  borderRadius: '50%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  border: '2px solid white',
                }}
              >
                <MarkerIcon type={marker.icon || 'default'} size={18} />
              </div>
            </Marker>
          ))}

          {/* Hotel Preview Popup */}
          {selectedHotel && (
            <Popup
              longitude={getHotelCoords(selectedHotel).lng}
              latitude={getHotelCoords(selectedHotel).lat}
              anchor="bottom"
              onClose={() => setSelectedHotel(null)}
              closeButton={true}
              closeOnClick={false}
              offset={35}
              maxWidth="none"
            >
              <HotelPreviewCard 
                hotel={selectedHotel} 
                onViewDetails={() => handleViewDetails(selectedHotel.hotel_id)}
              />
            </Popup>
          )}

          {/* Simple Popup for non-hotel markers */}
          {simplePopupInfo && (
            <Popup
              longitude={simplePopupInfo.lng}
              latitude={simplePopupInfo.lat}
              anchor="bottom"
              onClose={() => setSimplePopupInfo(null)}
              closeButton={true}
              closeOnClick={false}
              offset={25}
            >
              <div className="font-semibold text-neutral-900 text-sm pr-4">
                {simplePopupInfo.label}
              </div>
            </Popup>
          )}

          {/* Compact Legend Toggle */}
          {showLegend && showTrails && (
            <div className="absolute bottom-3 left-3 z-10">
              {isLegendOpen ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-neutral-200 p-3 max-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-neutral-700 uppercase tracking-wide">Trail Difficulty</span>
                    <button 
                      onClick={() => setIsLegendOpen(false)}
                      className="text-neutral-400 hover:text-neutral-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 rounded" style={{ backgroundColor: TRAIL_COLORS.easy }} />
                      <span className="text-xs text-neutral-600">Beginner</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 rounded" style={{ backgroundColor: TRAIL_COLORS.intermediate }} />
                      <span className="text-xs text-neutral-600">Intermediate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 rounded" style={{ backgroundColor: TRAIL_COLORS.advanced }} />
                      <span className="text-xs text-neutral-600">Advanced</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-1 rounded" style={{ backgroundColor: TRAIL_COLORS.expert }} />
                      <span className="text-xs text-neutral-600">Expert</span>
                    </div>
                    {showLifts && (
                      <div className="flex items-center gap-2 pt-1 border-t border-neutral-200 mt-1">
                        <div className="w-4 h-0.5 border-t-2 border-dashed border-amber-500" />
                        <span className="text-xs text-neutral-600">Lifts</span>
                      </div>
                    )}
                    {highlightTrails.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 border-t border-neutral-200 mt-1">
                        <div className="w-4 h-1.5 rounded bg-amber-500" />
                        <span className="text-xs text-neutral-600">Highlighted</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsLegendOpen(true)}
                  className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-neutral-200 px-3 py-2 flex items-center gap-2 hover:bg-white transition-colors"
                >
                  <Info size={14} className="text-neutral-500" />
                  <span className="text-xs font-medium text-neutral-700">Legend</span>
                </button>
              )}
            </div>
          )}

          {/* Attribution override */}
          <div className="absolute bottom-1 right-1 text-[9px] text-neutral-500 bg-white/80 px-1 rounded">
            © Mapbox © OpenStreetMap
          </div>
        </Map>
      </div>

      {/* Caption */}
      {caption && (
        <p className="text-sm text-neutral-600 mt-3 text-center italic">
          {caption}
        </p>
      )}
    </div>
  );
}

export default BlogMap;
