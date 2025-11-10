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
  TELLURIDE_CENTER,
  calculateBounds,
  getHotelMarkerColor,
  getMarkerSize,
  getIconSize,
  MAP_PADDING,
  MAX_BOUNDS_ZOOM,
} from '@/lib/mapbox-utils';
import 'mapbox-gl/dist/mapbox-gl.css';

// Map style configurations
const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  terrain: 'mapbox://styles/mapbox/outdoors-v12',
  ski: 'mapbox://styles/mapbox/outdoors-v12' // Outdoors style has ski trails built-in
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
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('streets');
  const [showSkiTrails, setShowSkiTrails] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [trailOpacity, setTrailOpacity] = useState(0.9);
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

  // Auto-show legend when switching to ski or terrain view
  useEffect(() => {
    if (mapStyle === 'ski' || mapStyle === 'terrain') {
      setShowLegend(true);
    }
  }, [mapStyle]);

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

  // Simple ski trail layer enhancement using Mapbox's built-in data
  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    const map = mapRef.current.getMap();

    if (showSkiTrails) {
      // Mapbox Outdoors style already has piste/ski trail layers
      // We just need to enhance their visibility and styling
      try {
        // Find and enhance existing piste layers
        const style = map.getStyle();
        if (!style || !style.layers) return;

        // Look for piste/ski-related layers in the current style
        const pisteLayerIds = style.layers
          .filter((layer: any) => 
            layer.id.includes('piste') || 
            layer.id.includes('aerialway') ||
            layer.source === 'composite' && layer['source-layer'] === 'landuse'
          )
          .map((layer: any) => layer.id);

        console.log('Found piste layers:', pisteLayerIds);

        // Enhance piste line styling
        pisteLayerIds.forEach((layerId: string) => {
          if (layerId.includes('piste')) {
            try {
              // Increase line width and opacity for better visibility
              if (map.getLayer(layerId)) {
                // Make trails thicker and more visible
                map.setPaintProperty(layerId, 'line-width', [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  12, 3,     // Thicker at zoom 12
                  14, 5,     // Even thicker at zoom 14
                  16, 8      // Very thick at zoom 16
                ]);
                map.setPaintProperty(layerId, 'line-opacity', trailOpacity);
                
                // Add a white outline for better contrast
                map.setPaintProperty(layerId, 'line-gap-width', 0);
                
                // Enhanced color coding by difficulty with more vivid colors
                map.setPaintProperty(layerId, 'line-color', [
                  'match',
                  ['get', 'piste:difficulty'],
                  'novice', '#22c55e',     // Green for easy
                  'easy', '#22c55e',       // Green for easy
                  'intermediate', '#3b82f6', // Blue for intermediate
                  'advanced', '#1e1e1e',   // Dark black for advanced
                  'expert', '#dc2626',     // Red for expert/double black
                  'freeride', '#dc2626',   // Red for expert terrain
                  '#3b82f6' // default blue for unmarked trails
                ]);
              }
            } catch (e) {
              console.log('Could not style layer:', layerId, e);
            }
          }
          
          // Enhance aerialway (lift) styling
          if (layerId.includes('aerialway')) {
            try {
              if (map.getLayer(layerId)) {
                map.setPaintProperty(layerId, 'line-width', 2.5);
                map.setPaintProperty(layerId, 'line-color', '#f59e0b');
                map.setPaintProperty(layerId, 'line-opacity', trailOpacity);
              }
            } catch (e) {
              console.log('Could not style aerialway:', layerId, e);
            }
          }
        });

      } catch (error) {
        console.error('Failed to enhance ski trail layers:', error);
      }
    } else {
      // Reset to default styling when trails are hidden
      try {
        const style = map.getStyle();
        if (!style || !style.layers) return;

        style.layers.forEach((layer: any) => {
          if (layer.id.includes('piste') || layer.id.includes('aerialway')) {
            try {
              if (map.getLayer(layer.id)) {
                // Reset to original subtle styling
                if (layer.id.includes('piste')) {
                  map.setPaintProperty(layer.id, 'line-opacity', 0.3);
                  map.setPaintProperty(layer.id, 'line-width', 1);
                }
                if (layer.id.includes('aerialway')) {
                  map.setPaintProperty(layer.id, 'line-opacity', 0.3);
                }
              }
            } catch (e) {
              // Layer might not exist, that's ok
            }
          }
        });
      } catch (error) {
        console.error('Failed to reset trail layers:', error);
      }
    }
  }, [showSkiTrails, isLoading, trailOpacity]);

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
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" showCompass={false} />

        {/* Map View Toggles */}
        <div className="absolute top-2 left-2 z-[500] flex flex-col gap-2">
          {/* View Style Selector */}
          <div className="bg-white border border-neutral-300 rounded-xl shadow-xl p-2">
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setMapStyle('streets')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mapStyle === 'streets'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
                title="Standard map view"
              >
                <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="block">Map</span>
              </button>
              <button
                onClick={() => setMapStyle('satellite')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mapStyle === 'satellite'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
                title="Satellite imagery view"
              >
                <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="block">Satellite</span>
              </button>
              <button
                onClick={() => setMapStyle('ski')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mapStyle === 'ski'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
                title="Ski trails and winter terrain"
              >
                <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="block">Ski Trails</span>
              </button>
              <button
                onClick={() => setMapStyle('terrain')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  mapStyle === 'terrain'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                }`}
                title="Outdoor/hiking trails"
              >
                <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
                <span className="block">Terrain</span>
              </button>
            </div>
          </div>

          {/* Legend Toggle */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="bg-white hover:bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 transition-all"
            title="Toggle map legend"
          >
            <svg className="w-4 h-4 flex-shrink-0 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-neutral-700">
              {showLegend ? 'Hide' : 'Show'} Legend
            </span>
          </button>
        </div>

        {/* Map Legend */}
        {showLegend && (
          <div className="absolute bottom-4 right-4 z-[500] bg-white border border-neutral-300 rounded-xl shadow-2xl p-4 max-w-xs">
            <h4 className="text-sm font-bold text-neutral-900 mb-3 flex items-center justify-between">
              Map Legend
              <button
                onClick={() => setShowLegend(false)}
                className="text-neutral-400 hover:text-neutral-600"
                title="Close legend"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </h4>
            <div className="space-y-3">
              {/* Hotel Markers */}
              <div>
                <h5 className="text-xs font-semibold text-neutral-700 mb-2">Hotel Types</h5>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary-600 border-2 border-white shadow-md flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                    </div>
                    <span className="text-xs text-neutral-600">Available Hotels</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent-500 border-2 border-white shadow-md flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                      </svg>
                    </div>
                    <span className="text-xs text-neutral-600">Selected/Featured</span>
                  </div>
                </div>
              </div>

              {/* Ski Trail Difficulty Colors */}
              {(mapStyle === 'ski' || mapStyle === 'terrain') && (
                <div>
                  <h5 className="text-xs font-semibold text-neutral-700 mb-2">Ski Trail Difficulty</h5>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
                      <span className="text-xs text-neutral-600">Green Circle - Easy/Beginner</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                      <span className="text-xs text-neutral-600">Blue Square - Intermediate</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#1e1e1e' }}></div>
                      <span className="text-xs text-neutral-600">Black Diamond - Advanced</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
                      <span className="text-xs text-neutral-600">Double Black - Expert</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-1 rounded-full" style={{ backgroundColor: '#f59e0b', borderTop: '1px dashed #000' }}></div>
                      <span className="text-xs text-neutral-600">Lifts & Gondolas</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Map Features */}
              <div>
                <h5 className="text-xs font-semibold text-neutral-700 mb-2">Map Features</h5>
                <div className="space-y-1.5 text-xs text-neutral-600">
                  <div className="flex items-start gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>Click markers for hotel details</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>Zoom in to see individual properties</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-neutral-400">•</span>
                    <span>Use view toggles to explore terrain</span>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="pt-3 border-t border-neutral-200">
                <a
                  href="/places-to-stay"
                  className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  View All Hotels
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Opacity Control - Show for non-streets views */}
        {mapStyle !== 'streets' && (
          <div className="absolute bottom-4 left-4 z-[500]">
            <div className="bg-white border border-neutral-300 rounded-lg p-2.5 shadow-lg">
              <label className="block">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wide">Overlay Opacity</span>
                  <span className="text-[10px] text-primary-600 font-bold">{Math.round(trailOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.1"
                  value={trailOpacity}
                  onChange={(e) => setTrailOpacity(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  style={{ width: '160px' }}
                />
              </label>
            </div>
          </div>
        )}

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
