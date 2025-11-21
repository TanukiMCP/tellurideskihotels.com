/**
 * HeroMapSearch Component
 * An all-in-one interactive hero section combining:
 * - Full-screen Mapbox map (no markers)
 * - Expandable hotel preview cards overlay
 * - Floating search panel with dates/guests
 * - Beautiful glassmorphism UI design
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { format, addDays } from 'date-fns';
import { Search, Calendar, Users, X, ChevronDown, ChevronUp, ChevronRight, Star, MapPin, ExternalLink, Hotel } from 'lucide-react';
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
  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  
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

  // Handle card click - show marker and pan to hotel
  const handleCardClick = useCallback((hotel: LiteAPIHotel, e: React.MouseEvent) => {
    // Don't trigger if clicking the expand button or view details button
    const target = e.target as HTMLElement;
    if (target.closest('button')) {
      return;
    }
    
    if (hotel.location?.latitude && hotel.location?.longitude && mapRef.current) {
      setHoveredHotelId(hotel.hotel_id);
      
      // Smoothly pan to hotel location
      mapRef.current.easeTo({
        center: [hotel.location.longitude, hotel.location.latitude],
        zoom: Math.max(viewState.zoom, 14.5),
        duration: 500,
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
      });
    }
  }, [viewState.zoom]);

  // Get marker styling
  const getMarkerStyle = (hotelId: string) => {
    const isHovered = hotelId === hoveredHotelId;
    const isFeatured = featuredHotelIds.includes(hotelId);
    
    return {
      size: isHovered ? 44 : isFeatured ? 36 : 32,
      color: isHovered ? '#059669' : isFeatured ? '#10b981' : '#1e40af',
      zIndex: isHovered ? 1000 : isFeatured ? 600 : 500,
      glow: isHovered,
    };
  };

  return (
    <div className="relative w-full" style={{ minHeight: '70vh', height: '85vh' }} aria-label="Telluride ski trail map background">
      {/* Map Background - De-emphasized */}
      <div className="absolute inset-0 w-full h-full">
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
        
        {/* Map Overlay - De-emphasize map */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(2px)',
          }}
        />
      </div>

      {/* Hero Content - Foreground */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Headline */}
        <h1 
          className="text-4xl md:text-5xl lg:text-[52px] font-bold text-[#2C2C2C] text-center mb-4 max-w-4xl leading-tight"
          style={{ 
            fontFamily: 'Playfair Display, serif',
            letterSpacing: '-0.5px',
            lineHeight: '1.2',
          }}
        >
          Your Home Base for Telluride Adventures
        </h1>
        
        {/* Subheadline */}
        <p 
          className="text-base md:text-lg text-[#666] text-center mb-8 max-w-[600px] leading-relaxed"
          style={{ lineHeight: '24px' }}
        >
          Book the perfect accommodation for your ski getaway, from cozy studios to luxury penthouses
        </p>

        {/* Prominent Search Module */}
        <div className="w-full max-w-[900px] bg-white rounded-xl shadow-2xl p-4 md:p-6 border border-neutral-200">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 md:gap-4">
            {/* Check-in Date */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 border border-[#E5E5E5] rounded-lg focus-within:border-[#2D5F4F] focus-within:ring-2 focus-within:ring-[#2D5F4F]/20 transition-all">
              <Calendar className="w-5 h-5 text-[#2D5F4F] flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <label htmlFor="checkin-hero" className="block text-xs font-medium text-neutral-600 mb-1">
                  Check-in
                </label>
                <input
                  id="checkin-hero"
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full text-base text-neutral-900 bg-transparent border-0 p-0 focus:outline-none"
                  required
                  aria-label="Check-in date"
                />
              </div>
            </div>

            {/* Check-out Date */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 border border-[#E5E5E5] rounded-lg focus-within:border-[#2D5F4F] focus-within:ring-2 focus-within:ring-[#2D5F4F]/20 transition-all">
              <Calendar className="w-5 h-5 text-[#2D5F4F] flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <label htmlFor="checkout-hero" className="block text-xs font-medium text-neutral-600 mb-1">
                  Check-out
                </label>
                <input
                  id="checkout-hero"
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn}
                  className="w-full text-base text-neutral-900 bg-transparent border-0 p-0 focus:outline-none"
                  required
                  aria-label="Check-out date"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="flex-1 flex items-center gap-3 px-4 py-3 border border-[#E5E5E5] rounded-lg focus-within:border-[#2D5F4F] focus-within:ring-2 focus-within:ring-[#2D5F4F]/20 transition-all">
              <Users className="w-5 h-5 text-[#2D5F4F] flex-shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <label htmlFor="guests-hero" className="block text-xs font-medium text-neutral-600 mb-1">
                  Guests
                </label>
                <input
                  id="guests-hero"
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                  min="1"
                  max="20"
                  className="w-full text-base text-neutral-900 bg-transparent border-0 p-0 focus:outline-none"
                  required
                  aria-label="Number of guests"
                />
              </div>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              disabled={isSearching}
              className="h-[48px] md:h-auto px-8 py-3 bg-[#2D5F4F] text-white rounded-lg font-semibold text-base shadow-lg hover:bg-[#255040] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] focus:ring-offset-2"
              aria-label={`Search hotels in Telluride for ${guests} guests from ${checkIn} to ${checkOut}`}
            >
              {isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={20} />
                  Search
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Trail Difficulty Legend - Bottom Left, Collapsible */}
      {isMapLoaded && mapStyle === 'skiTrails' && (
        <div className="absolute bottom-4 left-4 z-[500] pointer-events-auto">
          <div 
            className={`bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 transition-all duration-200 overflow-hidden ${
              isLegendExpanded ? 'p-4' : 'p-2'
            }`}
          >
            <button
              onClick={() => setIsLegendExpanded(!isLegendExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 transition-colors focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] rounded"
              aria-label={isLegendExpanded ? 'Collapse trail difficulty legend' : 'Expand trail difficulty legend'}
            >
              <svg className="w-4 h-4 text-[#2D5F4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Trail Difficulty</span>
              {isLegendExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
            
            {isLegendExpanded && (
              <div className="mt-3 space-y-2 animate-expand">
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
            )}
          </div>
        </div>
      )}

      {/* Mapbox Attribution - Styled */}
      <div 
        className="absolute bottom-2 right-2 z-[100] text-[10px] text-neutral-500 opacity-50 pointer-events-none"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        Mapbox © OpenStreetMap
      </div>


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

        @keyframes pulse-marker {
          0%, 100% {
            box-shadow: 0 4px 20px rgba(5, 150, 105, 0.8), 0 0 0 0 rgba(5, 150, 105, 0.4);
          }
          50% {
            box-shadow: 0 4px 20px rgba(5, 150, 105, 1), 0 0 0 12px rgba(5, 150, 105, 0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translate(-50%, 10px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out;
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
    </div>
  );
}
