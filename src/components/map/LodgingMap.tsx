/**
 * LodgingMap Component
 * Displays hotels on an interactive Mapbox GL map
 * Features: marker clustering, popup previews, map/list sync
 */
import { useEffect, useRef, useState, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import HotelMapPopup from './HotelMapPopup';
import {
  MAPBOX_TOKEN,
  MAPBOX_STYLE,
  TELLURIDE_CENTER,
  calculateBounds,
  getHotelMarkerColor,
  getMarkerSize,
  getIconSize,
  MAP_PADDING,
  MAX_BOUNDS_ZOOM,
  findClosestTrail,
} from '@/lib/mapbox-utils';
import 'mapbox-gl/dist/mapbox-gl.css';

// Map style configurations
const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  terrain: 'mapbox://styles/mapbox/outdoors-v12'
};

interface LodgingMapProps {
  hotels: LiteAPIHotel[];
  height?: string;
  selectedHotelId?: string | null;
  hoveredHotelId?: string | null;
  onHotelClick?: (hotelId: string) => void;
  onHotelHover?: (hotelId: string | null) => void;
  onViewDetails?: (hotelId: string) => void;
  className?: string;
  minPrices?: Record<string, number>;
  currency?: string;
  checkInDate?: string;
}

export default function LodgingMap({
  hotels,
  height = '100%',
  selectedHotelId = null,
  hoveredHotelId = null,
  onHotelClick,
  onHotelHover,
  onViewDetails,
  className = '',
  minPrices = {},
  currency = 'USD',
  checkInDate,
}: LodgingMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapActive, setIsMapActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [popupHotel, setPopupHotel] = useState<LiteAPIHotel | null>(null);
  const [showSkiTrails, setShowSkiTrails] = useState(false);
  const [trailFilters, setTrailFilters] = useState({
    green: true,
    blue: true,
    black: true,
    expert: true,
    lifts: true
  });
  const [trailOpacity, setTrailOpacity] = useState(0.8);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite' | 'terrain'>('streets');
  const [selectedTrail, setSelectedTrail] = useState<any | null>(null);
  const [trailData, setTrailData] = useState<any[]>([]);
  const [viewState, setViewState] = useState({
    longitude: TELLURIDE_CENTER[0],
    latitude: TELLURIDE_CENTER[1],
    zoom: 13,
  });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fit bounds to show all hotels
  useEffect(() => {
    if (!mapRef.current || hotels.length === 0 || isLoading) return;

    const coordinates = hotels
      .filter((h): h is LiteAPIHotel & { location: { latitude: number; longitude: number } } => 
        h.location?.latitude !== undefined && h.location?.longitude !== undefined
      )
      .map(h => ({ lng: h.location.longitude, lat: h.location.latitude }));

    if (coordinates.length === 0) return;

    const bounds = calculateBounds(coordinates);
    if (!bounds) return;

    setTimeout(() => {
      if (coordinates.length === 1) {
        mapRef.current?.flyTo({
          center: [coordinates[0].lng, coordinates[0].lat],
          zoom: 13,
          duration: 1000,
        });
      } else {
        mapRef.current?.fitBounds(bounds, {
          padding: MAP_PADDING,
          maxZoom: MAX_BOUNDS_ZOOM,
          duration: 1000,
        });
      }
    }, 100);
  }, [hotels, isLoading]);

  // Handle selected hotel changes
  useEffect(() => {
    if (!selectedHotelId || !mapRef.current) {
      setPopupHotel(null);
      return;
    }

    const hotel = hotels.find(h => h.hotel_id === selectedHotelId);
    if (hotel && hotel.location?.latitude && hotel.location?.longitude) {
      setPopupHotel(hotel);
      
      // Fly to selected hotel
      mapRef.current.flyTo({
        center: [hotel.location.longitude, hotel.location.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 13),
        duration: 800,
      });
    }
  }, [selectedHotelId, hotels]);

  // Handle marker click
  const handleMarkerClick = useCallback((hotel: LiteAPIHotel) => {
    if (onHotelClick) {
      onHotelClick(hotel.hotel_id);
    }
    setPopupHotel(hotel);
  }, [onHotelClick]);

  // Handle marker hover
  const handleMarkerMouseEnter = useCallback((hotelId: string) => {
    if (onHotelHover) {
      onHotelHover(hotelId);
    }
  }, [onHotelHover]);

  const handleMarkerMouseLeave = useCallback(() => {
    if (onHotelHover) {
      onHotelHover(null);
    }
  }, [onHotelHover]);

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setPopupHotel(null);
    if (onHotelClick) {
      onHotelClick('');
    }
  }, [onHotelClick]);

  // Handle popup view details
  const handleViewDetails = useCallback(() => {
    if (popupHotel) {
      if (onViewDetails) {
        onViewDetails(popupHotel.hotel_id);
      } else if (onHotelClick) {
        onHotelClick(popupHotel.hotel_id);
      }
    }
  }, [popupHotel, onViewDetails, onHotelClick]);

  // Mobile map activation
  const handleMapClick = useCallback(() => {
    if (isMobile && !isMapActive) {
      setIsMapActive(true);
    }
  }, [isMobile, isMapActive]);

  const handleDeactivate = useCallback(() => {
    if (isMobile && isMapActive) {
      setIsMapActive(false);
    }
  }, [isMobile, isMapActive]);

  // Handle map load
  const handleMapLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Add/remove ski trail layer with enhanced filtering
  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    const map = mapRef.current.getMap();

    if (showSkiTrails) {
      // Add ski trail source if it doesn't exist
      if (!map.getSource('ski-trails')) {
        // Try enhanced data first, fall back to original
        fetch('/data/telluride-ski-trails-enhanced.json')
          .then(response => {
            if (!response.ok) {
              return fetch('/data/telluride-ski-trails.json').then(r => r.json());
            }
            return response.json();
          })
          .then(geoJsonData => {
            // Store trail data for proximity calculations
            setTrailData(geoJsonData.features || []);
            
            try {
              map.addSource('ski-trails', {
                type: 'geojson',
                data: geoJsonData
              });

              // Add trails layer with enhanced styling and glow effect
              map.addLayer({
                id: 'ski-trails-glow',
                type: 'line',
                source: 'ski-trails',
                filter: ['==', ['get', 'type'], 'trail'],
                paint: {
                  'line-color': [
                    'match',
                    ['get', 'difficulty'],
                    'GREEN', '#22c55e',
                    'BLUE', '#3b82f6',
                    'BLACK', '#000000',
                    'DOUBLE BLACK', '#dc2626',
                    '#6b7280'
                  ],
                  'line-width': 8,
                  'line-opacity': 0.3,
                  'line-blur': 4
                }
              });

              // Add main trails layer
              map.addLayer({
                id: 'ski-trails-fill',
                type: 'line',
                source: 'ski-trails',
                filter: ['==', ['get', 'type'], 'trail'],
                paint: {
                  'line-color': [
                    'match',
                    ['get', 'difficulty'],
                    'GREEN', '#22c55e',
                    'BLUE', '#3b82f6',
                    'BLACK', '#000000',
                    'DOUBLE BLACK', '#dc2626',
                    '#6b7280'
                  ],
                  'line-width': [
                    'match',
                    ['get', 'difficulty'],
                    'GREEN', 3,
                    'BLUE', 4,
                    'BLACK', 5,
                    'DOUBLE BLACK', 6,
                    3
                  ],
                  'line-opacity': trailOpacity
                }
              });

              // Add lifts layer
              map.addLayer({
                id: 'ski-lifts',
                type: 'line',
                source: 'ski-trails',
                filter: ['==', ['get', 'type'], 'lift'],
                paint: {
                  'line-color': '#f59e0b',
                  'line-width': 3,
                  'line-dasharray': [2, 2],
                  'line-opacity': trailOpacity
                }
              });

              // Add lift symbols/icons
              map.addLayer({
                id: 'ski-lifts-symbols',
                type: 'symbol',
                source: 'ski-trails',
                filter: ['==', ['get', 'type'], 'lift'],
                layout: {
                  'symbol-placement': 'line',
                  'symbol-spacing': 100,
                  'icon-image': 'marker-15',
                  'icon-size': 0.8
                }
              });

              // Add trail name labels
              map.addLayer({
                id: 'ski-trails-labels',
                type: 'symbol',
                source: 'ski-trails',
                filter: ['==', ['get', 'type'], 'trail'],
                layout: {
                  'text-field': ['get', 'name'],
                  'text-size': 11,
                  'text-anchor': 'center',
                  'text-justify': 'center',
                  'symbol-placement': 'line-center',
                  'text-allow-overlap': false,
                  'text-ignore-placement': false,
                  'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold']
                },
                paint: {
                  'text-color': '#FFFFFF',
                  'text-halo-color': [
                    'match',
                    ['get', 'difficulty'],
                    'GREEN', '#15803d',
                    'BLUE', '#1e40af',
                    'BLACK', '#000000',
                    'DOUBLE BLACK', '#7f1d1d',
                    '#374151'
                  ],
                  'text-halo-width': 2,
                  'text-halo-blur': 1
                }
              });

              // Add lift labels
              map.addLayer({
                id: 'ski-lifts-labels',
                type: 'symbol',
                source: 'ski-trails',
                filter: ['==', ['get', 'type'], 'lift'],
                layout: {
                  'text-field': ['get', 'name'],
                  'text-size': 10,
                  'text-anchor': 'center',
                  'symbol-placement': 'line-center',
                  'text-font': ['DIN Pro Italic', 'Arial Unicode MS Regular']
                },
                paint: {
                  'text-color': '#f59e0b',
                  'text-halo-color': '#000000',
                  'text-halo-width': 2
                }
              });

              // Add click handlers for trails
              map.on('click', 'ski-trails-fill', (e) => {
                if (e.features && e.features.length > 0) {
                  const feature = e.features[0];
                  setSelectedTrail(feature.properties);
                }
              });

              // Change cursor on hover
              map.on('mouseenter', 'ski-trails-fill', () => {
                map.getCanvas().style.cursor = 'pointer';
              });
              map.on('mouseleave', 'ski-trails-fill', () => {
                map.getCanvas().style.cursor = '';
              });

            } catch (mapError) {
              console.error('Failed to add ski trail layers to map:', mapError);
            }
          })
          .catch(error => {
            console.error('Failed to load ski trail data:', error);
          });
      } else {
        // Source exists, update visibility
        updateTrailLayerVisibility(map);
      }
    } else {
      // Hide all ski trail layers
      try {
        const layers = ['ski-trails-glow', 'ski-trails-fill', 'ski-lifts', 'ski-lifts-symbols', 'ski-trails-labels', 'ski-lifts-labels'];
        layers.forEach(layerId => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', 'none');
          }
        });
      } catch (visibilityError) {
        console.error('Failed to hide ski trail layers:', visibilityError);
      }
    }
  }, [showSkiTrails, isLoading]);

  // Update trail layer visibility based on filters
  const updateTrailLayerVisibility = useCallback((map: any) => {
    if (!map) return;

    try {
      // Build filter expression for trails
      const difficultyFilters: any[] = ['any'];
      if (trailFilters.green) difficultyFilters.push(['==', ['get', 'difficulty'], 'GREEN']);
      if (trailFilters.blue) difficultyFilters.push(['==', ['get', 'difficulty'], 'BLUE']);
      if (trailFilters.black) difficultyFilters.push(['==', ['get', 'difficulty'], 'BLACK']);
      if (trailFilters.expert) difficultyFilters.push(['==', ['get', 'difficulty'], 'DOUBLE BLACK']);

      const trailFilter = ['all', ['==', ['get', 'type'], 'trail'], difficultyFilters];

      // Apply filters to trail layers
      if (map.getLayer('ski-trails-glow')) {
        map.setFilter('ski-trails-glow', trailFilter);
        map.setLayoutProperty('ski-trails-glow', 'visibility', 'visible');
      }
      if (map.getLayer('ski-trails-fill')) {
        map.setFilter('ski-trails-fill', trailFilter);
        map.setLayoutProperty('ski-trails-fill', 'visibility', 'visible');
      }
      if (map.getLayer('ski-trails-labels')) {
        map.setFilter('ski-trails-labels', trailFilter);
        map.setLayoutProperty('ski-trails-labels', 'visibility', 'visible');
      }

      // Apply lift filter
      const liftVisibility = trailFilters.lifts ? 'visible' : 'none';
      if (map.getLayer('ski-lifts')) {
        map.setLayoutProperty('ski-lifts', 'visibility', liftVisibility);
      }
      if (map.getLayer('ski-lifts-symbols')) {
        map.setLayoutProperty('ski-lifts-symbols', 'visibility', liftVisibility);
      }
      if (map.getLayer('ski-lifts-labels')) {
        map.setLayoutProperty('ski-lifts-labels', 'visibility', liftVisibility);
      }
    } catch (error) {
      console.error('Failed to update trail layer visibility:', error);
    }
  }, [trailFilters]);

  // Update filters when they change
  useEffect(() => {
    if (!mapRef.current || isLoading || !showSkiTrails) return;
    const map = mapRef.current.getMap();
    updateTrailLayerVisibility(map);
  }, [trailFilters, isLoading, showSkiTrails, updateTrailLayerVisibility]);

  // Update opacity when it changes
  useEffect(() => {
    if (!mapRef.current || isLoading || !showSkiTrails) return;
    const map = mapRef.current.getMap();
    
    try {
      if (map.getLayer('ski-trails-fill')) {
        map.setPaintProperty('ski-trails-fill', 'line-opacity', trailOpacity);
      }
      if (map.getLayer('ski-lifts')) {
        map.setPaintProperty('ski-lifts', 'line-opacity', trailOpacity);
      }
    } catch (error) {
      console.error('Failed to update trail opacity:', error);
    }
  }, [trailOpacity, isLoading, showSkiTrails]);

  // Fallback for when hotels.length === 0
  if (hotels.length === 0) {
    return (
      <div
        className={`rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-sm font-medium text-gray-900">No hotels to display</p>
          <p className="text-xs text-gray-500 mt-1">Search for hotels to see them on the map</p>
        </div>
      </div>
    );
  }

  // Error boundary wrapper
  try {
    return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-[999]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Mobile Interaction Overlay */}
      {isMobile && !isMapActive && !isLoading && (
        <div 
          className="absolute inset-0 bg-black/5 backdrop-blur-[2px] rounded-lg z-[998] flex items-center justify-center cursor-pointer"
          onClick={handleMapClick}
        >
          <div className="bg-white rounded-xl shadow-xl px-6 py-4 flex items-center gap-3 max-w-[280px] mx-4">
            <svg className="w-6 h-6 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">Tap to Activate Map</p>
              <p className="text-xs text-gray-600">Pinch to zoom, drag to explore</p>
            </div>
          </div>
        </div>
      )}

      {/* Mapbox Map */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt: any) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLES[mapStyle]}
        style={{ width: '100%', height: '100%', borderRadius: '0.75rem' }}
        onLoad={handleMapLoad}
        scrollZoom={!isMobile || isMapActive}
        dragPan={!isMobile || isMapActive}
        dragRotate={false}
        pitchWithRotate={false}
        touchZoomRotate={isMobile && isMapActive}
        doubleClickZoom={true}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" showCompass={false} />

        {/* Enhanced Ski Trail Controls */}
        <div className="absolute top-2 left-2 z-[500] flex flex-col gap-2 max-w-[240px]">
          {/* Main Toggle Button */}
          <button
            onClick={() => setShowSkiTrails(!showSkiTrails)}
            className={`bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 transition-all ${showSkiTrails ? 'ring-2 ring-primary-500' : ''}`}
            title={showSkiTrails ? 'Hide ski trails' : 'Show ski trails'}
          >
            <svg className="w-4 h-4 text-gray-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">
              {showSkiTrails ? 'Hide Trails' : 'Show Trails'}
            </span>
          </button>

          {/* Advanced Controls Panel - Compact */}
          {showSkiTrails && (
            <div className="bg-white border border-gray-300 rounded-lg p-2.5 shadow-lg space-y-2.5 max-h-[400px] overflow-y-auto">
              {/* Difficulty Filters - Compact */}
              <div>
                <h4 className="text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Difficulty</h4>
                <div className="space-y-1">
                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-0.5 rounded text-xs">
                    <input
                      type="checkbox"
                      checked={trailFilters.green}
                      onChange={(e) => setTrailFilters({...trailFilters, green: e.target.checked})}
                      className="w-3.5 h-3.5 text-green-600 rounded flex-shrink-0"
                    />
                    <div className="w-4 h-1.5 bg-green-500 rounded flex-shrink-0"></div>
                    <span className="text-[11px] text-gray-700">Easy</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-0.5 rounded text-xs">
                    <input
                      type="checkbox"
                      checked={trailFilters.blue}
                      onChange={(e) => setTrailFilters({...trailFilters, blue: e.target.checked})}
                      className="w-3.5 h-3.5 text-blue-600 rounded flex-shrink-0"
                    />
                    <div className="w-4 h-1.5 bg-blue-500 rounded flex-shrink-0"></div>
                    <span className="text-[11px] text-gray-700">Intermediate</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-0.5 rounded text-xs">
                    <input
                      type="checkbox"
                      checked={trailFilters.black}
                      onChange={(e) => setTrailFilters({...trailFilters, black: e.target.checked})}
                      className="w-3.5 h-3.5 text-gray-900 rounded flex-shrink-0"
                    />
                    <div className="w-4 h-1.5 bg-black rounded flex-shrink-0"></div>
                    <span className="text-[11px] text-gray-700">Advanced</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-0.5 rounded text-xs">
                    <input
                      type="checkbox"
                      checked={trailFilters.expert}
                      onChange={(e) => setTrailFilters({...trailFilters, expert: e.target.checked})}
                      className="w-3.5 h-3.5 text-red-600 rounded flex-shrink-0"
                    />
                    <div className="w-4 h-1.5 bg-red-600 rounded flex-shrink-0"></div>
                    <span className="text-[11px] text-gray-700">Expert</span>
                  </label>
                </div>
              </div>

              {/* Lift Toggle - Compact */}
              <div className="border-t border-gray-200 pt-2">
                <label className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-0.5 rounded">
                  <input
                    type="checkbox"
                    checked={trailFilters.lifts}
                    onChange={(e) => setTrailFilters({...trailFilters, lifts: e.target.checked})}
                    className="w-3.5 h-3.5 text-amber-600 rounded flex-shrink-0"
                  />
                  <div className="w-4 h-1.5 bg-amber-500 rounded border border-dashed border-amber-600 flex-shrink-0"></div>
                  <span className="text-[11px] text-gray-700 font-medium">Lifts</span>
                </label>
              </div>

              {/* Opacity Slider - Compact */}
              <div className="border-t border-gray-200 pt-2">
                <label className="block">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide">Opacity</span>
                    <span className="text-[10px] text-gray-500 font-medium">{Math.round(trailOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={trailOpacity}
                    onChange={(e) => setTrailOpacity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </label>
              </div>

              {/* Map Style Selector - Integrated */}
              <div className="border-t border-gray-200 pt-2">
                <h4 className="text-[10px] font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Map Style</h4>
                <div className="flex rounded-md overflow-hidden border border-gray-300">
                  <button
                    onClick={() => setMapStyle('streets')}
                    className={`flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors ${
                      mapStyle === 'streets' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    title="Street Map"
                  >
                    Streets
                  </button>
                  <button
                    onClick={() => setMapStyle('terrain')}
                    className={`flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors border-l border-gray-300 ${
                      mapStyle === 'terrain' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    title="Terrain Map"
                  >
                    Terrain
                  </button>
                  <button
                    onClick={() => setMapStyle('satellite')}
                    className={`flex-1 px-2 py-1.5 text-[10px] font-medium transition-colors border-l border-gray-300 ${
                      mapStyle === 'satellite' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    title="Satellite Map"
                  >
                    Satellite
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hotel Markers */}
        {hotels.map((hotel) => {
          if (!hotel.location?.latitude || !hotel.location?.longitude) return null;

          const isSelected = hotel.hotel_id === selectedHotelId;
          const isHovered = hotel.hotel_id === hoveredHotelId;
          const state = isSelected ? 'selected' : isHovered ? 'hover' : 'default';
          const color = getHotelMarkerColor(state);
          const size = getMarkerSize(state);

          return (
            <Marker
              key={hotel.hotel_id}
              longitude={hotel.location.longitude}
              latitude={hotel.location.latitude}
              anchor="center"
            >
              <div
                className="cursor-pointer transition-all duration-200"
                onClick={() => handleMarkerClick(hotel)}
                onMouseEnter={() => handleMarkerMouseEnter(hotel.hotel_id)}
                onMouseLeave={handleMarkerMouseLeave}
                style={{
                  backgroundColor: color,
                  width: `${size}px`,
                  height: `${size}px`,
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: isSelected ? 1000 : isHovered ? 900 : 500,
                }}
              >
                <svg 
                  style={{ width: `${getIconSize(size)}px`, height: `${getIconSize(size)}px`, color: 'white' }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </Marker>
          );
        })}

        {/* Popup */}
        {popupHotel && popupHotel.location?.latitude && popupHotel.location?.longitude && (
          <Popup
            longitude={popupHotel.location.longitude}
            latitude={popupHotel.location.latitude}
            anchor="left"
            onClose={handlePopupClose}
            closeButton={true}
            closeOnClick={false}
            maxWidth="320px"
            offset={20}
            className="hotel-map-popup"
          >
            <HotelMapPopup 
              hotel={popupHotel} 
              minPrice={minPrices[popupHotel.hotel_id]}
              currency={currency}
              checkInDate={checkInDate}
              onViewDetails={handleViewDetails}
              nearestTrail={
                showSkiTrails && trailData.length > 0
                  ? findClosestTrail(
                      popupHotel.location.latitude,
                      popupHotel.location.longitude,
                      trailData
                    )
                  : null
              }
            />
          </Popup>
        )}
      </Map>

      {/* Hotel Count Badge - Repositioned to top-right */}
      {!isLoading && hotels.length > 0 && (
        <div className="absolute top-2 right-14 bg-white rounded-lg shadow-md px-2.5 py-1.5 z-[500] pointer-events-none">
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-xs font-semibold text-gray-900">
              {hotels.length} {hotels.length === 1 ? 'Hotel' : 'Hotels'}
            </span>
          </div>
        </div>
      )}

      {/* Trail Detail Popup */}
      {selectedTrail && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-xl p-4 z-[1001] max-w-sm border-2 border-primary-500">
          <button
            onClick={() => setSelectedTrail(null)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="space-y-3">
            {/* Trail Name & Difficulty */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-8 h-3 rounded ${
                  selectedTrail.difficulty === 'GREEN' ? 'bg-green-500' :
                  selectedTrail.difficulty === 'BLUE' ? 'bg-blue-500' :
                  selectedTrail.difficulty === 'BLACK' ? 'bg-black' :
                  selectedTrail.difficulty === 'DOUBLE BLACK' ? 'bg-red-600' :
                  'bg-gray-500'
                }`}></div>
                <h3 className="font-bold text-lg text-gray-900">{selectedTrail.name}</h3>
              </div>
              {selectedTrail.description && (
                <p className="text-sm text-gray-600">{selectedTrail.description}</p>
              )}
            </div>

            {/* Trail Stats */}
            {selectedTrail.type === 'trail' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                {selectedTrail.vertical_drop && (
                  <div>
                    <div className="text-xs text-gray-500">Vertical Drop</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedTrail.vertical_drop.toLocaleString()} ft</div>
                  </div>
                )}
                {selectedTrail.length_miles && (
                  <div>
                    <div className="text-xs text-gray-500">Length</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedTrail.length_miles} mi</div>
                  </div>
                )}
                {selectedTrail.area && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500">Area</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedTrail.area}</div>
                  </div>
                )}
                {selectedTrail.status && (
                  <div className="col-span-2">
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      {selectedTrail.status.toUpperCase()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Lift Stats */}
            {selectedTrail.type === 'lift' && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                {selectedTrail.capacity && (
                  <div>
                    <div className="text-xs text-gray-500">Capacity</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedTrail.capacity} passengers</div>
                  </div>
                )}
                {selectedTrail.vertical_rise && (
                  <div>
                    <div className="text-xs text-gray-500">Vertical Rise</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedTrail.vertical_rise.toLocaleString()} ft</div>
                  </div>
                )}
                {selectedTrail.length_miles && (
                  <div className="col-span-2">
                    <div className="text-xs text-gray-500">Length</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedTrail.length_miles} mi</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Done Button - Mobile Only When Active */}
      {isMobile && isMapActive && (
        <div className="absolute top-4 right-4 z-[1000]">
          <button
            onClick={handleDeactivate}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Done
          </button>
        </div>
      )}

      {/* Custom Popup Styling */}
      <style>{`
        .hotel-map-popup .mapboxgl-popup-content {
          padding: 12px 20px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        }
        .hotel-map-popup .mapboxgl-popup-close-button {
          font-size: 20px;
          padding: 8px;
          color: #64748b;
          right: 8px;
          top: 8px;
        }
        .hotel-map-popup .mapboxgl-popup-close-button:hover {
          background-color: #f1f5f9;
          border-radius: 4px;
        }
        .hotel-map-popup .mapboxgl-popup-tip {
          border-top-color: white;
        }
      `}</style>
    </div>
    );
  } catch (error) {
    console.error('LodgingMap component error:', error);
    // Fallback UI for when the map fails to load
    return (
      <div
        className={`rounded-lg border-2 border-red-200 bg-red-50 flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm font-medium text-red-900">Map temporarily unavailable</p>
          <p className="text-xs text-red-600 mt-1">Please refresh the page to try again</p>
        </div>
      </div>
    );
  }
}
