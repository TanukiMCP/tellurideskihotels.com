/**
 * HeroMapSearch Component
 * An all-in-one interactive hero section combining:
 * - Full-screen Mapbox map with hotel markers
 * - Floating search panel with dates/guests
 * - Real-time search and map interaction
 * - Beautiful glassmorphism UI design
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { format, addDays } from 'date-fns';
import { Search, MapPin, Calendar, Users, Hotel, X } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import HotelMapPopup from '@/components/map/HotelMapPopup';
import {
  MAPBOX_TOKEN,
  TELLURIDE_CENTER,
  calculateBounds,
  MAP_PADDING,
  MAX_BOUNDS_ZOOM,
} from '@/lib/mapbox-utils';
import 'mapbox-gl/dist/mapbox-gl.css';

interface HeroMapSearchProps {
  initialHotels?: LiteAPIHotel[];
  featuredHotelIds?: string[];
  minPrices?: Record<string, number>;
  currency?: string;
}

const MAP_STYLES = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  skiTrails: 'mapbox://styles/mapbox/outdoors-v12',
};

export default function HeroMapSearch({
  initialHotels = [],
  featuredHotelIds = [],
  minPrices = {},
  currency = 'USD',
}: HeroMapSearchProps) {
  const mapRef = useRef<MapRef>(null);
  
  // Search state
  const [checkIn, setCheckIn] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [guests, setGuests] = useState(2);
  const [isSearching, setIsSearching] = useState(false);
  
  // Map state
  const [hotels] = useState<LiteAPIHotel[]>(initialHotels);
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('skiTrails');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [popupHotel, setPopupHotel] = useState<LiteAPIHotel | null>(null);
  const [hoveredHotelId, setHoveredHotelId] = useState<string | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  // View state
  const [viewState, setViewState] = useState({
    longitude: TELLURIDE_CENTER[0],
    latitude: TELLURIDE_CENTER[1],
    zoom: 13,
  });

  // Fit bounds to show all hotels
  useEffect(() => {
    if (!mapRef.current || hotels.length === 0 || !isMapLoaded) return;

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
          duration: 1500,
        });
      } else {
        mapRef.current?.fitBounds(bounds, {
          padding: MAP_PADDING,
          maxZoom: MAX_BOUNDS_ZOOM,
          duration: 1500,
        });
      }
    }, 300);
  }, [hotels, isMapLoaded]);

  // Load and style real Telluride ski trails from OpenStreetMap
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    
    const map = mapRef.current.getMap();
    const isSkiMode = mapStyle === 'skiTrails';

    if (isSkiMode) {
      // Hide all default Mapbox trail/piste layers to show only our custom data
      try {
        const style = map.getStyle();
        if (style && style.layers) {
          style.layers.forEach((layer: any) => {
            // Hide default piste, aerialway, and trail labels from Mapbox
            if (layer.id.includes('piste') || 
            layer.id.includes('aerialway') ||
                layer.id.includes('poi-label') && layer.id.includes('ski')) {
              try {
                if (map.getLayer(layer.id)) {
                  map.setLayoutProperty(layer.id, 'visibility', 'none');
                }
              } catch {}
            }
          });
        }
      } catch (err) {
        console.log('Could not hide Mapbox base trail layers:', err);
      }

      // Remove existing custom layers if they exist
      const layersToRemove = [
        'telluride-ski-trails-labels',
        'telluride-ski-trails',
        'telluride-lifts',
        'telluride-pois',
        'telluride-pois-labels'
      ];
      const sourcesToRemove = [
        'telluride-ski-trails',
        'telluride-lifts',
        'telluride-pois'
      ];

      layersToRemove.forEach(layerId => {
        try {
          if (map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
        } catch {}
      });

      sourcesToRemove.forEach(sourceId => {
        try {
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        } catch {}
      });

      // Load real Telluride ski trail data from OpenStreetMap
      fetch('/data/telluride-ski-trails.json')
        .then(response => response.json())
        .then(data => {
          // Add the ski trails as a custom GeoJSON source
          map.addSource('telluride-ski-trails', {
            type: 'geojson',
            data: data
          });

          // Add color-coded ski trails layer matching ski resort map conventions
          map.addLayer({
            id: 'telluride-ski-trails',
            type: 'line',
            source: 'telluride-ski-trails',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': [
                'match',
                ['get', 'piste:difficulty'],
                'novice', '#22c55e',      // Bright green - beginner
                'easy', '#22c55e',        // Bright green - easy  
                'intermediate', '#3b82f6', // Bright blue - intermediate
                'advanced', '#1e1e1e',    // Black - advanced
                'expert', '#ef4444',      // Bright red - expert/double black
                'freeride', '#ef4444',    // Bright red - extreme terrain
                '#3b82f6'                 // Default to blue
              ],
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                11, 3,    // Thin at low zoom
                13, 4,    // Medium 
                15, 6,    // Thicker when zoomed in
                17, 10    // Very thick up close
              ],
              'line-opacity': 0.95
            }
          });

          // Add trail name labels with color-matched halos
          map.addLayer({
            id: 'telluride-ski-trails-labels',
            type: 'symbol',
            source: 'telluride-ski-trails',
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                13, 11,
                15, 13,
                17, 15
              ],
              'symbol-placement': 'line',
              'text-rotation-alignment': 'map',
              'text-pitch-alignment': 'viewport',
              'text-max-angle': 30,
              'symbol-spacing': 200
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': [
                'match',
                ['get', 'piste:difficulty'],
                'novice', '#16a34a',      // Dark green halo
                'easy', '#16a34a',        
                'intermediate', '#1e40af', // Dark blue halo
                'advanced', '#000000',    // Black halo
                'expert', '#b91c1c',      // Dark red halo
                'freeride', '#b91c1c',    
                '#1e40af'                 
              ],
              'text-halo-width': 2.5,
              'text-halo-blur': 0.5
            },
            minzoom: 13 // Show labels when zoomed in
          });

          console.log(`[HeroMapSearch] ✅ Loaded ${data.features.length} ski trails`);
        })
        .catch(err => {
          console.error('[HeroMapSearch] Failed to load ski trail data:', err);
        });

      // Load lift lines (gondolas and chairlifts)
      fetch('/data/telluride-lifts.json')
        .then(response => response.json())
        .then(data => {
          map.addSource('telluride-lifts', {
            type: 'geojson',
            data: data
          });

          // Add lift lines with dashed style
          map.addLayer({
            id: 'telluride-lifts',
            type: 'line',
            source: 'telluride-lifts',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': [
                'match',
                ['get', 'aerialway'],
                'gondola', '#f59e0b',      // Orange for gondolas
                'cable_car', '#f59e0b',    // Orange for cable cars
                'chair_lift', '#eab308',   // Yellow for chairlifts
                'mixed_lift', '#f59e0b',   // Orange for mixed
                '#fbbf24'                   // Default yellow
              ],
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                11, 2,
                15, 3.5,
                17, 5
              ],
              'line-opacity': 0.9,
              'line-dasharray': [2, 2] // Dashed line for lifts
            }
          });

          console.log(`[HeroMapSearch] ✅ Loaded ${data.features.length} lift lines`);
        })
        .catch(err => {
          console.error('[HeroMapSearch] Failed to load lift data:', err);
        });

      // Load POIs (restaurants, restrooms, lift stations, etc.)
      fetch('/data/telluride-pois.json')
        .then(response => response.json())
        .then(data => {
          map.addSource('telluride-pois', {
            type: 'geojson',
            data: data
          });

          // Add POI markers
          map.addLayer({
            id: 'telluride-pois',
            type: 'circle',
            source: 'telluride-pois',
            paint: {
              'circle-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12, 4,
                15, 6,
                17, 8
              ],
              'circle-color': [
                'match',
                ['get', 'type'],
                'restaurant', '#ef4444',      // Red for restaurants
                'cafe', '#f97316',            // Orange for cafes
                'restroom', '#3b82f6',        // Blue for restrooms
                'lift-station', '#8b5cf6',    // Purple for lift stations
                'information', '#10b981',     // Green for info
                'viewpoint', '#06b6d4',       // Cyan for viewpoints
                '#6b7280'                      // Gray default
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.9
            }
          });

          // Add POI labels
          map.addLayer({
            id: 'telluride-pois-labels',
            type: 'symbol',
            source: 'telluride-pois',
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
              'text-size': 11,
              'text-offset': [0, 1.2],
              'text-anchor': 'top'
            },
            paint: {
              'text-color': '#1f2937',
              'text-halo-color': '#ffffff',
              'text-halo-width': 2,
              'text-halo-blur': 0.5
            },
            minzoom: 14
          });

          console.log(`[HeroMapSearch] ✅ Loaded ${data.features.length} POIs`);
        })
        .catch(err => {
          console.error('[HeroMapSearch] Failed to load POI data:', err);
        });
    } else {
      // Remove ski trail layers, lifts, and POIs when not in ski mode
      try {
        const layersToRemove = [
          'telluride-ski-trails-labels',
          'telluride-ski-trails',
          'telluride-lifts',
          'telluride-pois',
          'telluride-pois-labels'
        ];
        const sourcesToRemove = [
          'telluride-ski-trails',
          'telluride-lifts',
          'telluride-pois'
        ];

        layersToRemove.forEach(layerId => {
          try {
            if (map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
          } catch {}
        });

        sourcesToRemove.forEach(sourceId => {
          try {
            if (map.getSource(sourceId)) {
              map.removeSource(sourceId);
            }
          } catch {}
        });

        // Restore Mapbox base trail layers
        const style = map.getStyle();
        if (style && style.layers) {
          style.layers.forEach((layer: any) => {
            if (layer.id.includes('piste') || 
                layer.id.includes('aerialway') ||
                layer.id.includes('poi-label') && layer.id.includes('ski')) {
              try {
                if (map.getLayer(layer.id)) {
                  map.setLayoutProperty(layer.id, 'visibility', 'visible');
                }
              } catch {}
            }
          });
        }
      } catch (err) {
        console.log('Could not remove/restore trail layers:', err);
      }
    }
  }, [mapStyle, isMapLoaded]);

  // Handle search submission
  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSearching(true);
    
    // Navigate to search results page
    const params = new URLSearchParams({
      location: 'Telluride',
      checkIn,
      checkOut,
      adults: guests.toString(),
    });
    
    // Close mobile search panel
    setShowMobileSearch(false);
    
    // Redirect after brief animation
    setTimeout(() => {
      window.location.href = `/places-to-stay?${params.toString()}`;
    }, 300);
  }, [checkIn, checkOut, guests]);

  // Handle marker click
  const handleMarkerClick = useCallback((hotel: LiteAPIHotel) => {
    setSelectedHotelId(hotel.hotel_id);
    setPopupHotel(hotel);
    
    if (hotel.location?.latitude && hotel.location?.longitude) {
      mapRef.current?.flyTo({
        center: [hotel.location.longitude, hotel.location.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 14),
        duration: 800,
      });
    }
  }, []);

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setPopupHotel(null);
    setSelectedHotelId(null);
  }, []);

  // Handle view details
  const handleViewDetails = useCallback(() => {
    if (popupHotel) {
      window.location.href = `/places-to-stay/${popupHotel.hotel_id}?checkIn=${checkIn}&checkOut=${checkOut}&adults=${guests}`;
    }
  }, [popupHotel, checkIn, checkOut, guests]);

  // Get marker styling - Using theme colors (emerald/teal greens)
  const getMarkerStyle = (hotelId: string) => {
    const isSelected = hotelId === selectedHotelId;
    const isHovered = hotelId === hoveredHotelId;
    const isFeatured = featuredHotelIds.includes(hotelId);
    
    return {
      size: isSelected ? 44 : isHovered ? 38 : isFeatured ? 36 : 34,
      color: isSelected ? '#059669' : isHovered ? '#14b8a6' : isFeatured ? '#10b981' : '#1e40af',
      zIndex: isSelected ? 1000 : isHovered ? 900 : isFeatured ? 600 : 500,
      glow: isFeatured && !isSelected && !isHovered,
    };
  };

  return (
    <div className="relative h-[650px] lg:h-[750px] w-full overflow-hidden">
      {/* Mapbox Background */}
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLES[mapStyle]}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setIsMapLoaded(true)}
        dragRotate={false}
        pitchWithRotate={false}
        scrollZoom={true}
        dragPan={true}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" showCompass={false} />

        {/* Hotel Markers */}
        {hotels.map((hotel) => {
          if (!hotel.location?.latitude || !hotel.location?.longitude) return null;

          const style = getMarkerStyle(hotel.hotel_id);
          const minPrice = minPrices[hotel.hotel_id];
          const hasPrice = minPrice && minPrice > 0;
          const isHovered = hotel.hotel_id === hoveredHotelId;

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
                onMouseEnter={() => setHoveredHotelId(hotel.hotel_id)}
                onMouseLeave={() => setHoveredHotelId(null)}
                style={{ zIndex: style.zIndex }}
              >
                {/* Main Marker Circle */}
                <div
                  className="hover:scale-110 transition-transform duration-200"
                  style={{
                    backgroundColor: style.color,
                    width: `${style.size}px`,
                    height: `${style.size}px`,
                    borderRadius: '50%',
                    border: '3px solid white',
                    boxShadow: style.glow 
                      ? '0 4px 20px rgba(16, 185, 129, 0.6), 0 0 0 0 rgba(16, 185, 129, 0.4)'
                      : '0 4px 12px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: style.glow ? 'pulse-featured 2s ease-in-out infinite' : 'none',
                  }}
                >
                  <Hotel 
                    size={style.size * 0.5}
                    color="white"
                    strokeWidth={2.5}
                  />
                </div>
                
                {/* Price Label - always shows for featured hotels with prices */}
                {hasPrice && (
                  <div 
                    className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white px-2.5 py-1.5 rounded-lg shadow-xl border border-neutral-200 whitespace-nowrap"
                    style={{
                      transform: isHovered ? 'translateX(-50%) scale(1.1)' : 'translateX(-50%) scale(1)',
                      transition: 'transform 0.2s ease-in-out',
                    }}
                  >
                    <div className="text-[10px] text-neutral-500 uppercase tracking-wide">From</div>
                    <div className="text-xs font-bold text-primary-600">
                      ${Math.round(minPrice)}
                    </div>
                    <div className="text-[10px] text-neutral-600">per night</div>
                  </div>
                )}
              </div>
            </Marker>
          );
        })}

        {/* Hotel Popup */}
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
            className="hero-map-popup"
          >
            <HotelMapPopup 
              hotel={popupHotel} 
              minPrice={minPrices[popupHotel.hotel_id]}
              currency={currency}
              checkInDate={checkIn}
              onViewDetails={handleViewDetails}
            />
          </Popup>
        )}
      </Map>

      {/* Subtle vignette only */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 pointer-events-none" />

      {/* Map Controls - Top Left Corner */}
      <div className="absolute top-4 left-4 z-[500] pointer-events-auto">
        <div className="flex flex-col lg:flex-row gap-2 lg:items-start">
          {/* Map Style Selector & Search Form - Single Row on Desktop */}
          <div className="flex flex-col lg:flex-row gap-2">
            {/* Map Style Selector */}
            <div className="backdrop-blur-xl bg-white/95 border border-white/20 rounded-xl shadow-xl p-2 flex-shrink-0 w-fit">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMapStyle('streets')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    mapStyle === 'streets'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white/50 text-neutral-700 hover:bg-white'
                  }`}
                  title="Street map view"
                >
                  Map
                </button>
                <button
                  onClick={() => setMapStyle('satellite')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    mapStyle === 'satellite'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white/50 text-neutral-700 hover:bg-white'
                  }`}
                  title="Satellite imagery view"
                >
                  Satellite
                </button>
                <button
                  onClick={() => setMapStyle('skiTrails')}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    mapStyle === 'skiTrails'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-white/50 text-neutral-700 hover:bg-white'
                  }`}
                  title="Colorful ski trails and lifts"
                >
                  Ski Trails
                </button>
              </div>
            </div>

            {/* Horizontal Search Form - Desktop Only - Adjacent to View Toggle */}
            <form onSubmit={handleSearch} className="hidden lg:flex backdrop-blur-xl bg-white/95 rounded-xl shadow-xl p-2 border border-white/20 items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 px-2">
                <Calendar size={14} className="text-primary-600 flex-shrink-0" />
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-[130px] px-2 py-1.5 border border-neutral-300 rounded-lg focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all text-xs bg-white"
                  required
                />
              </div>
              <div className="flex items-center gap-1 px-2">
                <Calendar size={14} className="text-primary-600 flex-shrink-0" />
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn}
                  className="w-[130px] px-2 py-1.5 border border-neutral-300 rounded-lg focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all text-xs bg-white"
                  required
                />
              </div>
              <div className="flex items-center gap-1 px-2">
                <Users size={14} className="text-primary-600 flex-shrink-0" />
                <input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                  min="1"
                  max="20"
                  className="w-[70px] px-2 py-1.5 border border-neutral-300 rounded-lg focus:border-primary-600 focus:ring-2 focus:ring-primary-600/20 outline-none transition-all text-xs bg-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-bold text-xs shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 flex-shrink-0"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={14} />
                    Search
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Mobile Search Button */}
          <button
            onClick={() => setShowMobileSearch(true)}
            className="lg:hidden backdrop-blur-xl bg-primary-600 text-white rounded-xl shadow-xl px-4 py-2.5 flex items-center justify-center gap-2 font-bold text-sm hover:bg-primary-700 transition-all"
          >
            <Search size={16} />
            Search Hotels
          </button>
        </div>
      </div>

      {/* Mobile Search Modal */}
      {showMobileSearch && (
        <div className="lg:hidden absolute inset-0 bg-black/50 backdrop-blur-sm z-[600] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-neutral-900">Search Hotels</h3>
              <button
                onClick={() => setShowMobileSearch(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-neutral-600" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-neutral-800 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-primary-600" />
                  Check-in
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-600 focus:ring-4 focus:ring-primary-600/20 outline-none transition-all font-semibold text-neutral-900 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-800 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-primary-600" />
                  Check-out
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn}
                  className="w-full px-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-600 focus:ring-4 focus:ring-primary-600/20 outline-none transition-all font-semibold text-neutral-900 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-800 mb-2 flex items-center gap-2">
                  <Users size={16} className="text-primary-600" />
                  Guests
                </label>
                <input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                  min="1"
                  max="20"
                  className="w-full px-4 py-3 border-2 border-neutral-300 rounded-xl focus:border-primary-600 focus:ring-4 focus:ring-primary-600/20 outline-none transition-all font-semibold text-neutral-900 bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSearching}
                className="w-full px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3"
              >
                {isSearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Search Hotels
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* Ski Trail Legend - Bottom Right (only show in Ski Trails mode) */}
      {isMapLoaded && mapStyle === 'skiTrails' && (
        <div className="absolute bottom-4 right-4 backdrop-blur-xl bg-white/95 rounded-xl shadow-2xl p-4 z-[500] border border-white/20">
          <h3 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Trail Difficulty
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-1 rounded-full bg-[#22c55e]"></div>
              <span className="text-xs text-neutral-700 font-medium">Green Circle - Easy</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-1 rounded-full bg-[#3b82f6]"></div>
              <span className="text-xs text-neutral-700 font-medium">Blue Square - Intermediate</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-1 rounded-full bg-[#1e1e1e]"></div>
              <span className="text-xs text-neutral-700 font-medium">Black Diamond - Advanced</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-1 rounded-full bg-[#ef4444]"></div>
              <span className="text-xs text-neutral-700 font-medium">Double Black - Expert</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-neutral-200">
            <p className="text-[10px] text-neutral-500">
              448 trails from OpenStreetMap
            </p>
          </div>
        </div>
      )}

      {/* Hotel Count Badge - Bottom Left */}
      {isMapLoaded && hotels.length > 0 && (
        <div className="absolute bottom-4 left-4 backdrop-blur-xl bg-white/90 rounded-xl shadow-xl px-4 py-2.5 z-[500] border border-white/20 pointer-events-none">
          <div className="flex items-center gap-2">
            <MapPin className="text-primary-600" size={18} />
            <span className="text-sm font-bold text-neutral-900">
              {hotels.length} Hotels
            </span>
          </div>
        </div>
      )}

      {/* Custom Styling */}
      <style>{`
        @keyframes pulse-featured {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(245, 158, 11, 0.6), 0 0 0 0 rgba(245, 158, 11, 0.4);
          }
          50% {
            box-shadow: 0 4px 20px rgba(245, 158, 11, 0.8), 0 0 0 8px rgba(245, 158, 11, 0);
          }
        }
        
        .hero-map-popup .mapboxgl-popup-content {
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .hero-map-popup .mapboxgl-popup-close-button {
          font-size: 18px;
          padding: 4px;
          color: #64748b;
          right: 12px;
          top: 12px;
          z-index: 10;
          background: white;
          border-radius: 6px;
          width: 28px;
          height: 28px;
          line-height: 1;
        }
        .hero-map-popup .mapboxgl-popup-close-button:hover {
          background-color: #f1f5f9;
        }
        .hero-map-popup .mapboxgl-popup-tip {
          border-top-color: white;
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate(-50%, 10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out;
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

