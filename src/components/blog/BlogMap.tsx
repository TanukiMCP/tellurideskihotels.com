/**
 * BlogMap Component
 * Embeddable Mapbox widget for MDX blog posts with 2D hotel markers and 3D trail visualization
 * 
 * 2D Mode: Clickable hotel markers with preview card tooltips positioned to the right
 * 3D Mode: Highlighted trails/bowls with auto-focus camera and Reset View button
 */
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Map, { Marker, NavigationControl, Popup, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef, ViewStateChangeEvent } from 'react-map-gl/mapbox';
import { MAPBOX_TOKEN, TELLURIDE_CENTER, MOUNTAIN_VILLAGE_CENTER, TELLURIDE_AREA_CENTER } from '@/lib/mapbox-utils';
import { MapPin, Mountain, Building2, Cable, Trees, Info, X, ChevronRight, Star, RotateCcw } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

// Trail area definitions for bowl/zone focusing
const TRAIL_AREAS: Record<string, { trails: string[]; center: [number, number]; zoom: number; pitch?: number; bearing?: number }> = {
  'gold-hill': {
    trails: ['Gold Hill 1', 'Gold Hill 2', 'Gold Hill 6', 'Gold Hill 7', 'Gold Hill 8', 'Gold Hill 9', 'Gold Hill 10', 'Palmyra', 'Palmyra Basin', 'The Plunge', 'Lower Plunge'],
    center: [-107.795, 37.935],
    zoom: 14.5,
    pitch: 60,
    bearing: 45,
  },
  'prospect': {
    trails: ['Prospect', 'Prospect Creek', 'Prospect Loop', 'Prospect Woods', 'Prospect Creek Hike Back'],
    center: [-107.84, 37.92],
    zoom: 14,
    pitch: 50,
    bearing: -30,
  },
  'revelation': {
    trails: ['Bald Mountain Hike Too', 'East Drain', 'West Drain', 'Nice Chute', 'North Chute', 'Easy Chute', 'Dihedral Face', 'Dihedral Chute'],
    center: [-107.79, 37.94],
    zoom: 14.5,
    pitch: 55,
    bearing: 20,
  },
  'front-side': {
    trails: ['See Forever', 'Kant-Mak-M', 'Mammoth', 'Bushwacker', 'Spiral Stairs', 'The Plunge', 'Misty Maiden'],
    center: [-107.815, 37.93],
    zoom: 13.5,
    pitch: 50,
    bearing: -15,
  },
  'beginner': {
    trails: ['Meadows', 'Galloping Goose', 'Lower Galloping Goose', 'Village', 'Double Cabins', 'Teddy\'s Way', 'Ute Park'],
    center: [-107.835, 37.935],
    zoom: 14,
    pitch: 45,
    bearing: 0,
  },
};

// Preset configurations
const PRESETS = {
  resort: {
    center: [-107.8125, 37.9275] as [number, number],
    zoom: 13,
    pitch: 0,
    bearing: 0,
    showTrails: true,
    showLifts: true,
  },
  town: {
    center: TELLURIDE_CENTER,
    zoom: 15,
    pitch: 0,
    bearing: 0,
    showTrails: false,
    showLifts: false,
  },
  'mountain-village': {
    center: MOUNTAIN_VILLAGE_CENTER,
    zoom: 14.5,
    pitch: 0,
    bearing: 0,
    showTrails: true,
    showLifts: true,
  },
  overview: {
    center: TELLURIDE_AREA_CENTER,
    zoom: 12.5,
    pitch: 0,
    bearing: 0,
    showTrails: false,
    showLifts: false,
  },
  hotels: {
    center: TELLURIDE_AREA_CENTER,
    zoom: 13,
    pitch: 0,
    bearing: 0,
    showTrails: false,
    showLifts: false,
  },
  trails: {
    center: [-107.82, 37.935] as [number, number],
    zoom: 13.5,
    pitch: 45,
    bearing: -15,
    showTrails: true,
    showLifts: true,
  },
};

const MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

// Trail difficulty colors
const TRAIL_COLORS: Record<string, string> = {
  novice: '#22c55e',
  easy: '#22c55e',
  intermediate: '#3b82f6',
  advanced: '#1e1e1e',
  expert: '#ef4444',
  freeride: '#ef4444',
};

// Marker colors
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
  preset?: 'resort' | 'town' | 'mountain-village' | 'overview' | 'hotels' | 'trails';
  center?: [number, number];
  zoom?: number;
  /** Enable 3D terrain visualization */
  terrain?: boolean;
  showTrails?: boolean;
  showLifts?: boolean;
  /** Hotel IDs for clickable markers with preview cards */
  hotelIds?: string[];
  /** Custom point markers */
  markers?: BlogMapMarker[];
  /** Highlight specific trails by name */
  highlightTrails?: string[];
  /** Focus on a predefined area (gold-hill, prospect, revelation, front-side, beginner) */
  focusArea?: keyof typeof TRAIL_AREAS;
  height?: string;
  caption?: string;
  interactive?: boolean;
  showLegend?: boolean;
}

interface HotelData {
  hotel_id: string;
  name: string;
  latitude?: number;
  longitude?: number;
  location?: { latitude?: number; longitude?: number };
  images?: Array<{ url: string }>;
  main_photo?: string;
  star_rating?: number;
  review_score?: number;
  review_count?: number;
  address?: { line1?: string; city?: string };
}

// Marker icon component
function MarkerIcon({ type, size = 24 }: { type: string; size?: number }) {
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

// Hotel Preview Card - positioned to the right of marker
function HotelPreviewCard({ hotel, onViewDetails, onClose }: { 
  hotel: HotelData; 
  onViewDetails: () => void;
  onClose: () => void;
}) {
  const primaryImage = hotel.images?.[0]?.url || hotel.main_photo;
  const locationString = hotel.address?.city || hotel.address?.line1 || 'Telluride, CO';
  
  return (
    <div className="w-[240px] bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden">
      {/* Close button */}
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 z-10 bg-white/90 rounded-full p-1 hover:bg-white transition-colors shadow-sm"
      >
        <X size={14} className="text-neutral-500" />
      </button>
      
      {/* Image */}
      {primaryImage && (
        <div className="relative w-full h-[100px]">
          <img 
            src={primaryImage}
            alt={hotel.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {hotel.star_rating && hotel.star_rating > 0 && (
            <div className="absolute bottom-2 left-2 bg-white/95 px-1.5 py-0.5 rounded shadow-sm">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={9}
                    className={i < hotel.star_rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-3">
        {/* Name */}
        <h3 className="text-sm font-bold text-neutral-900 mb-1 line-clamp-2 leading-tight">
          {hotel.name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 mb-2">
          <MapPin size={11} className="text-gray-400 flex-shrink-0" />
          <p className="text-xs text-gray-500 line-clamp-1">{locationString}</p>
        </div>

        {/* Rating */}
        {hotel.review_score && hotel.review_score > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <span className="bg-primary-600 text-white px-1.5 py-0.5 rounded text-xs font-semibold">
              {hotel.review_score.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">
              {hotel.review_count ? `${hotel.review_count.toLocaleString()} reviews` : 'Guest rating'}
            </span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onViewDetails}
          className="w-full inline-flex items-center justify-center gap-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors"
        >
          View Details
          <ChevronRight size={14} />
        </button>
      </div>
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
  focusArea,
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
  const [hasMovedFromDefault, setHasMovedFromDefault] = useState(false);

  // Get preset config
  const presetConfig = PRESETS[preset];
  
  // Determine area config if focusArea is set
  const areaConfig = focusArea ? TRAIL_AREAS[focusArea] : null;
  
  // Get all trails to highlight (from highlightTrails prop + area trails)
  const allHighlightedTrails = useMemo(() => {
    const trails = [...highlightTrails];
    if (areaConfig) {
      trails.push(...areaConfig.trails);
    }
    return [...new Set(trails)]; // dedupe
  }, [highlightTrails, areaConfig]);
  
  // Compute initial view state
  const initialViewState = useMemo(() => {
    // If area is specified, use area config
    if (areaConfig) {
      return {
        longitude: areaConfig.center[0],
        latitude: areaConfig.center[1],
        zoom: areaConfig.zoom,
        pitch: areaConfig.pitch || 45,
        bearing: areaConfig.bearing || 0,
      };
    }
    
    // Otherwise use preset/props
    const mapCenter = center || presetConfig.center;
    const mapZoom = zoom ?? presetConfig.zoom;
    const enableTerrain = terrain || preset === 'trails' || allHighlightedTrails.length > 0;
    
    return {
      longitude: mapCenter[0],
      latitude: mapCenter[1],
      zoom: mapZoom,
      pitch: enableTerrain ? (presetConfig.pitch || 45) : 0,
      bearing: enableTerrain ? (presetConfig.bearing || -15) : 0,
    };
  }, [center, zoom, presetConfig, terrain, preset, allHighlightedTrails.length, areaConfig]);

  // Store default view for reset
  const defaultViewRef = useRef(initialViewState);
  
  // Merge props with preset defaults
  const showTrails = showTrailsProp ?? presetConfig.showTrails;
  const showLifts = showLiftsProp ?? presetConfig.showLifts;
  
  // Auto-enable 3D terrain for trail-focused maps
  const enableTerrain = terrain || preset === 'trails' || allHighlightedTrails.length > 0 || focusArea !== undefined;

  // Reset view handler
  const handleResetView = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [defaultViewRef.current.longitude, defaultViewRef.current.latitude],
        zoom: defaultViewRef.current.zoom,
        pitch: defaultViewRef.current.pitch,
        bearing: defaultViewRef.current.bearing,
        duration: 1000,
      });
      setHasMovedFromDefault(false);
      setSelectedHotel(null);
      setSimplePopupInfo(null);
    }
  }, []);

  // Track if user has moved from default view
  const handleMove = useCallback((evt: ViewStateChangeEvent) => {
    const vs = evt.viewState;
    const diff = 
      Math.abs(vs.longitude - defaultViewRef.current.longitude) > 0.001 ||
      Math.abs(vs.latitude - defaultViewRef.current.latitude) > 0.001 ||
      Math.abs(vs.zoom - defaultViewRef.current.zoom) > 0.5;
    setHasMovedFromDefault(diff);
  }, []);

  // Load trail data
  useEffect(() => {
    if (!showTrails && allHighlightedTrails.length === 0) return;
    
    fetch('/data/telluride-ski-trails.json')
      .then(res => res.json())
      .then(data => {
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
  }, [showTrails, allHighlightedTrails.length]);

  // Load lift data
  useEffect(() => {
    if (!showLifts) return;
    
    fetch('/data/telluride-lifts.json')
      .then(res => res.json())
      .then(data => setLiftsData(data))
      .catch(err => console.error('[BlogMap] Failed to load lifts:', err));
  }, [showLifts]);

  // Load hotel data
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
        } catch {
          return null;
        }
      });
      
      const fetchedHotels = await Promise.all(hotelPromises);
      const validHotels = fetchedHotels.filter((h): h is HotelData => {
        if (!h) return false;
        const lat = h.latitude || h.location?.latitude;
        const lng = h.longitude || h.location?.longitude;
        return lat !== undefined && lat !== 0 && lng !== undefined && lng !== 0;
      });
      
      setHotels(validHotels);
    };
    
    fetchHotels();
  }, [hotelIds]);

  // Get hotel coords helper
  const getHotelCoords = (hotel: HotelData) => ({
    lat: hotel.latitude || hotel.location?.latitude || 0,
    lng: hotel.longitude || hotel.location?.longitude || 0,
  });

  // Handle map load
  const handleMapLoad = () => {
    setIsMapLoaded(true);
    
    if (enableTerrain && mapRef.current) {
      const map = mapRef.current.getMap();
      
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

  // Fit bounds to hotels
  useEffect(() => {
    if (!isMapLoaded || !mapRef.current || hotels.length === 0) return;
    
    if (preset === 'hotels' && hotels.length > 0 && !focusArea) {
      const map = mapRef.current.getMap();
      
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
        const lngPadding = (maxLng - minLng) * 0.3 || 0.01;
        const latPadding = (maxLat - minLat) * 0.3 || 0.01;
        
        map.fitBounds(
          [[minLng - lngPadding, minLat - latPadding], [maxLng + lngPadding, maxLat + latPadding]],
          { padding: 50, duration: 1000 }
        );
      }
    }
  }, [isMapLoaded, hotels, preset, focusArea]);

  // Handle hotel marker click - center and show popup
  const handleHotelClick = (hotel: HotelData) => {
    setSimplePopupInfo(null);
    setSelectedHotel(hotel);
    
    if (mapRef.current) {
      const { lat, lng } = getHotelCoords(hotel);
      // Offset center slightly left so popup appears to the right and is visible
      mapRef.current.flyTo({
        center: [lng - 0.003, lat],
        zoom: Math.max(initialViewState.zoom, 14),
        duration: 500,
      });
    }
  };

  // Navigate to hotel detail
  const handleViewDetails = (hotelId: string) => {
    window.location.href = `/lodging/${hotelId}`;
  };

  // Trail layer paint
  const trailLayerPaint = useMemo(() => {
    const hasHighlights = allHighlightedTrails.length > 0;
    
    return {
      'line-color': hasHighlights ? [
        'case',
        ['in', ['get', 'name'], ['literal', allHighlightedTrails]],
        '#f59e0b', // Highlighted trails in amber
        [
          'match',
          ['get', 'piste:difficulty'],
          'novice', TRAIL_COLORS.novice,
          'easy', TRAIL_COLORS.easy,
          'intermediate', TRAIL_COLORS.intermediate,
          'advanced', TRAIL_COLORS.advanced,
          'expert', TRAIL_COLORS.expert,
          'freeride', TRAIL_COLORS.freeride,
          '#94a3b8' // Non-highlighted get muted
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
      'line-width': hasHighlights ? [
        'case',
        ['in', ['get', 'name'], ['literal', allHighlightedTrails]],
        5, // Highlighted trails thicker
        2  // Others thinner
      ] : 3,
      'line-opacity': hasHighlights ? [
        'case',
        ['in', ['get', 'name'], ['literal', allHighlightedTrails]],
        1,   // Highlighted fully visible
        0.4  // Others faded
      ] : 0.85
    };
  }, [allHighlightedTrails]);

  // Show reset button when terrain is enabled or when moved from default
  const showResetButton = enableTerrain || hasMovedFromDefault;

  return (
    <div className="my-8 not-prose">
      <div 
        className="relative rounded-xl overflow-hidden border border-neutral-200 shadow-md"
        style={{ height }}
      >
        <Map
          ref={mapRef}
          initialViewState={initialViewState}
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
          onLoad={handleMapLoad}
          onMove={handleMove}
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

          {/* Reset View Button */}
          {showResetButton && (
            <div className="absolute top-3 left-3 z-10">
              <button
                onClick={handleResetView}
                className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-neutral-200 px-3 py-2 flex items-center gap-2 hover:bg-white transition-colors"
                title="Reset view to default"
              >
                <RotateCcw size={14} className="text-neutral-600" />
                <span className="text-xs font-medium text-neutral-700">Reset View</span>
              </button>
            </div>
          )}

          {/* Trails layer */}
          {(showTrails || allHighlightedTrails.length > 0) && trailsData && (
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

          {/* Hotel Markers */}
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

          {/* Custom Markers */}
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

          {/* Hotel Preview Popup - anchored to left so it appears to the right of marker */}
          {selectedHotel && (
            <Popup
              longitude={getHotelCoords(selectedHotel).lng}
              latitude={getHotelCoords(selectedHotel).lat}
              anchor="left"
              onClose={() => setSelectedHotel(null)}
              closeButton={false}
              closeOnClick={false}
              offset={15}
              maxWidth="none"
              className="hotel-preview-popup"
            >
              <HotelPreviewCard 
                hotel={selectedHotel} 
                onViewDetails={() => handleViewDetails(selectedHotel.hotel_id)}
                onClose={() => setSelectedHotel(null)}
              />
            </Popup>
          )}

          {/* Simple Popup for markers */}
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

          {/* Legend */}
          {showLegend && (showTrails || allHighlightedTrails.length > 0) && trailsData && (
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
                    {allHighlightedTrails.length > 0 && (
                      <div className="flex items-center gap-2 pt-1 border-t border-neutral-200 mt-1">
                        <div className="w-4 h-1.5 rounded bg-amber-500" />
                        <span className="text-xs text-neutral-600">Featured</span>
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

          {/* Attribution */}
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
