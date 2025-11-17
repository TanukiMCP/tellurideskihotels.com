/**
 * HeroMapSearch Component
 * An all-in-one interactive hero section combining:
 * - Full-screen Mapbox map (no markers)
 * - Expandable hotel preview cards overlay
 * - Floating search panel with dates/guests
 * - Beautiful glassmorphism UI design
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import Map, { NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { format, addDays } from 'date-fns';
import { Search, Calendar, Users, X, ChevronDown, ChevronUp, Star, MapPin, ExternalLink, Hotel } from 'lucide-react';
import type { LiteAPIHotel } from '@/lib/liteapi/types';
import {
  MAPBOX_TOKEN,
  TELLURIDE_CENTER,
  calculateBounds,
  MAP_PADDING,
  MAX_BOUNDS_ZOOM,
} from '@/lib/mapbox-utils';
import { getHotelMainImage, formatHotelAddress } from '@/lib/liteapi/utils';
import { formatCurrency } from '@/lib/utils';
import { getRatingColor } from '@/lib/constants';
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
  const [hotels, setHotels] = useState<LiteAPIHotel[]>(initialHotels);
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('skiTrails');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [expandedHotelId, setExpandedHotelId] = useState<string | null>(null);
  const [hoveredHotelId, setHoveredHotelId] = useState<string | null>(null);
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
          map.addSource('telluride-ski-trails', {
            type: 'geojson',
            data: data
          });

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
                'novice', '#22c55e',
                'easy', '#22c55e',
                'intermediate', '#3b82f6',
                'advanced', '#1e1e1e',
                'expert', '#ef4444',
                'freeride', '#ef4444',
                '#3b82f6'
              ],
              'line-width': [
                'interpolate',
                ['linear'],
                ['zoom'],
                11, 3,
                13, 4,
                15, 6,
                17, 10
              ],
              'line-opacity': 0.95
            }
          });

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
                'novice', '#16a34a',
                'easy', '#16a34a',
                'intermediate', '#1e40af',
                'advanced', '#000000',
                'expert', '#b91c1c',
                'freeride', '#b91c1c',
                '#1e40af'
              ],
              'text-halo-width': 2.5,
              'text-halo-blur': 0.5
            },
            minzoom: 13
          });

          console.log(`[HeroMapSearch] ✅ Loaded ${data.features.length} ski trails`);
        })
        .catch(err => {
          console.error('[HeroMapSearch] Failed to load ski trail data:', err);
        });

      // Load lift lines
      fetch('/data/telluride-lifts.json')
        .then(response => response.json())
        .then(data => {
          map.addSource('telluride-lifts', {
            type: 'geojson',
            data: data
          });

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
                'gondola', '#f59e0b',
                'cable_car', '#f59e0b',
                'chair_lift', '#eab308',
                'mixed_lift', '#f59e0b',
                '#fbbf24'
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
              'line-dasharray': [2, 2]
            }
          });

          console.log(`[HeroMapSearch] ✅ Loaded ${data.features.length} lift lines`);
        })
        .catch(err => {
          console.error('[HeroMapSearch] Failed to load lift data:', err);
        });

      // Load POIs
      fetch('/data/telluride-pois.json')
        .then(response => response.json())
        .then(data => {
          map.addSource('telluride-pois', {
            type: 'geojson',
            data: data
          });

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
                'restaurant', '#ef4444',
                'cafe', '#f97316',
                'restroom', '#3b82f6',
                'lift-station', '#8b5cf6',
                'information', '#10b981',
                'viewpoint', '#06b6d4',
                '#6b7280'
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.9
            }
          });

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
      // Remove ski trail layers when not in ski mode
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
    
    const params = new URLSearchParams({
      location: 'Telluride',
      checkIn,
      checkOut,
      adults: guests.toString(),
    });
    
    setShowMobileSearch(false);
    
    setTimeout(() => {
      window.location.href = `/places-to-stay?${params.toString()}`;
    }, 300);
  }, [checkIn, checkOut, guests]);

  // Handle hotel card click
  const handleHotelClick = useCallback((hotelId: string) => {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults: guests.toString(),
    });
    window.location.href = `/places-to-stay/${hotelId}?${params.toString()}`;
  }, [checkIn, checkOut, guests]);

  // Toggle card expansion
  const toggleExpand = useCallback((hotelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedHotelId(expandedHotelId === hotelId ? null : hotelId);
  }, [expandedHotelId]);

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
      </Map>

      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/10 pointer-events-none" />

      {/* Map Controls - Top Left Corner */}
      <div className="absolute top-4 left-4 z-[500] pointer-events-auto">
        <div className="flex flex-col lg:flex-row gap-2 lg:items-start">
          {/* Map Style Selector & Search Form */}
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

            {/* Horizontal Search Form - Desktop Only */}
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

      {/* Hotel Cards Panel - Right Side (Desktop) / Bottom (Mobile) */}
      {hotels.length > 0 && (
        <div className="absolute bottom-0 right-0 lg:top-0 lg:bottom-auto lg:right-0 lg:w-[420px] w-full max-h-[60vh] lg:max-h-full lg:h-full z-[400] pointer-events-auto">
          <div className="backdrop-blur-xl bg-white/95 lg:bg-white/98 border-t lg:border-t-0 lg:border-l border-white/20 shadow-2xl h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Available Hotels</h3>
                <p className="text-xs text-neutral-600 mt-0.5">{hotels.length} properties</p>
              </div>
            </div>

            {/* Scrollable Cards Container */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-3">
              {hotels.map((hotel) => {
                const imageUrl = getHotelMainImage(hotel);
                const address = formatHotelAddress(hotel);
                const rating = hotel.review_score || 0;
                const ratingColor = getRatingColor(rating);
                const minPrice = minPrices[hotel.hotel_id];
                const isExpanded = expandedHotelId === hotel.hotel_id;
                const isHovered = hoveredHotelId === hotel.hotel_id;
                const isFeatured = featuredHotelIds.includes(hotel.hotel_id);

                return (
                  <div
                    key={hotel.hotel_id}
                    className={`bg-white rounded-xl shadow-md border-2 transition-all duration-300 overflow-hidden ${
                      isExpanded 
                        ? 'border-primary-600 shadow-xl' 
                        : isHovered 
                        ? 'border-primary-300 shadow-lg' 
                        : 'border-transparent hover:border-neutral-200'
                    }`}
                    onMouseEnter={() => setHoveredHotelId(hotel.hotel_id)}
                    onMouseLeave={() => setHoveredHotelId(null)}
                  >
                    {/* Compact Preview */}
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleHotelClick(hotel.hotel_id)}
                    >
                      <div className="flex gap-3 p-3">
                        {/* Image */}
                        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={hotel.name || 'Hotel'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Hotel className="w-8 h-8 text-neutral-400" />
                            </div>
                          )}
                          {/* Featured Badge */}
                          {isFeatured && (
                            <div className="absolute top-1 left-1 bg-primary-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              Featured
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Name & Rating */}
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-bold text-sm text-neutral-900 line-clamp-1 flex-1">
                              {hotel.name}
                            </h4>
                            {rating > 0 && (
                              <div className={`${ratingColor.bg} ${ratingColor.text} px-1.5 py-0.5 rounded text-xs font-bold flex-shrink-0`}>
                                {rating.toFixed(1)}
                              </div>
                            )}
                          </div>

                          {/* Star Rating */}
                          {hotel.star_rating && (
                            <div className="flex items-center gap-1 mb-1.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={10}
                                  className={i < hotel.star_rating! ? 'fill-accent-500 text-accent-500' : 'text-neutral-300'}
                                />
                              ))}
                            </div>
                          )}

                          {/* Address */}
                          {address && (
                            <div className="flex items-start gap-1 mb-2">
                              <MapPin size={12} className="text-neutral-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-neutral-600 line-clamp-1">{address}</p>
                            </div>
                          )}

                          {/* Price & Expand Button */}
                          <div className="flex items-center justify-between">
                            {minPrice && minPrice > 0 ? (
                              <div>
                                <div className="text-xs text-neutral-500 uppercase tracking-wide">From</div>
                                <div className="text-lg font-bold text-primary-600">
                                  {formatCurrency(minPrice, currency)}
                                  <span className="text-xs font-normal text-neutral-600">/night</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-neutral-600">View Rates</div>
                            )}
                            <button
                              onClick={(e) => toggleExpand(hotel.hotel_id, e)}
                              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
                              aria-label={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              {isExpanded ? (
                                <ChevronUp size={18} className="text-neutral-600" />
                              ) : (
                                <ChevronDown size={18} className="text-neutral-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-neutral-200 px-3 pb-3 pt-3 animate-expand">
                        {/* Reviews */}
                        {hotel.review_count && rating > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-neutral-600">
                              <span className="font-semibold">{hotel.review_count.toLocaleString()}</span> review{hotel.review_count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}

                        {/* Amenities Preview */}
                        {hotel.amenities && hotel.amenities.length > 0 && (
                          <div className="mb-3">
                            <div className="flex flex-wrap gap-1.5">
                              {hotel.amenities.slice(0, 4).map((amenity, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-neutral-100 text-neutral-700 px-2 py-1 rounded-md"
                                >
                                  {amenity.name || amenity.code || 'Amenity'}
                                </span>
                              ))}
                              {hotel.amenities.length > 4 && (
                                <span className="text-xs text-neutral-500 px-2 py-1">
                                  +{hotel.amenities.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* View Details Button */}
                        <button
                          onClick={() => handleHotelClick(hotel.hotel_id)}
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          View Details
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Ski Trail Legend - Bottom Right (only show in Ski Trails mode) */}
      {isMapLoaded && mapStyle === 'skiTrails' && (
        <div className="absolute bottom-4 right-4 lg:right-[460px] backdrop-blur-xl bg-white/95 rounded-xl shadow-2xl p-4 z-[500] border border-white/20">
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

      {/* Custom Styling */}
      <style>{`
        @keyframes expand {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }
        
        .animate-expand {
          animation: expand 0.3s ease-out;
        }
        
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s ease-out;
        }

        /* Smooth scrolling for cards */
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
