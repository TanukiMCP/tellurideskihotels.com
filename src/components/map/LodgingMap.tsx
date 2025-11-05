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
} from '@/lib/mapbox-utils';
import 'mapbox-gl/dist/mapbox-gl.css';

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

  // Add/remove ski trail layer
  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    const map = mapRef.current.getMap();

    if (showSkiTrails) {
      // Add ski trail source if it doesn't exist
      if (!map.getSource('ski-trails')) {
        // Use official Telluride Ski Resort data from ArcGIS
        fetch('https://services3.arcgis.com/Nefdxa42x2DnAd5Z/arcgis/rest/services/TSG_Ski_Runs/FeatureServer/0/query?where=1%3D1&outFields=*&f=json&returnGeometry=true')
          .then(response => {
            if (!response.ok) {
              throw new Error(`ArcGIS request failed: ${response.status}`);
            }
            return response.json();
          })
          .then(data => {
            console.log('ArcGIS ski trail data loaded:', data);
            if (!data || !data.features || data.features.length === 0) {
              console.warn('No ski trail features found in ArcGIS data');
              // Fall back to sample data
              return fetch('/data/telluride-ski-trails.json').then(r => r.json());
            }

            // Convert Esri JSON to GeoJSON format
            const geoJsonData = {
              type: 'FeatureCollection',
              features: data.features.map((feature: any) => ({
                type: 'Feature',
                properties: feature.attributes,
                geometry: {
                  type: feature.geometry ? 'LineString' : null,
                  coordinates: feature.geometry?.paths?.[0] || []
                }
              })).filter((f: any) => f.geometry.coordinates.length > 0)
            };

            console.log('Converted to GeoJSON:', geoJsonData.features.length, 'features');
            return geoJsonData;
          })
          .then(geoJsonData => {
            map.addSource('ski-trails', {
              type: 'geojson',
              data: geoJsonData
            });

            // Add fill layer for trails - try multiple possible field names
            map.addLayer({
              id: 'ski-trails-fill',
              type: 'line',
              source: 'ski-trails',
              paint: {
                'line-color': [
                  'match',
                  ['coalesce', ['get', 'DIFFICULTY'], ['get', 'CLASS'], ['get', 'piste:difficulty'], ['get', 'difficulty'], ''],
                  'EASY', '#00FF00',        // Green
                  'GREEN', '#00FF00',       // Green
                  'BEGINNER', '#00FF00',    // Green
                  'easy', '#00FF00',        // Green
                  'INTERMEDIATE', '#0000FF', // Blue
                  'BLUE', '#0000FF',        // Blue
                  'intermediate', '#0000FF', // Blue
                  'ADVANCED', '#000000',     // Black
                  'BLACK', '#000000',        // Black
                  'advanced', '#000000',     // Black
                  'EXPERT', '#FF0000',       // Red
                  'DOUBLE BLACK', '#FF0000', // Red
                  'expert', '#FF0000',       // Red
                  '#808080'                  // Default gray
                ],
                'line-width': [
                  'match',
                  ['coalesce', ['get', 'DIFFICULTY'], ['get', 'CLASS'], ['get', 'piste:difficulty'], ['get', 'difficulty'], ''],
                  'EASY', 3,
                  'GREEN', 3,
                  'BEGINNER', 3,
                  'easy', 3,
                  'INTERMEDIATE', 4,
                  'BLUE', 4,
                  'intermediate', 4,
                  'ADVANCED', 5,
                  'BLACK', 5,
                  'advanced', 5,
                  'EXPERT', 6,
                  'DOUBLE BLACK', 6,
                  'expert', 6,
                  3
                ],
                'line-opacity': 0.8
              }
            });

            // Add trail name labels - try multiple possible field names
            map.addLayer({
              id: 'ski-trails-labels',
              type: 'symbol',
              source: 'ski-trails',
              layout: {
                'text-field': ['coalesce', ['get', 'NAME'], ['get', 'TRAIL_NAME'], ['get', 'name'], ['get', 'trail_name'], ''],
                'text-size': 12,
                'text-anchor': 'center',
                'text-justify': 'center',
                'symbol-placement': 'line-center',
                'text-allow-overlap': false,
                'text-ignore-placement': false
              },
              paint: {
                'text-color': '#FFFFFF',
                'text-halo-color': '#000000',
                'text-halo-width': 2
              }
            });
          })
          .catch(error => {
            console.error('Failed to load ski trail data:', error);
          });
      } else {
        // Source exists, just show layers
        map.setLayoutProperty('ski-trails-fill', 'visibility', 'visible');
        map.setLayoutProperty('ski-trails-labels', 'visibility', 'visible');
      }
    } else {
      // Hide ski trail layers
      if (map.getLayer('ski-trails-fill')) {
        map.setLayoutProperty('ski-trails-fill', 'visibility', 'none');
      }
      if (map.getLayer('ski-trails-labels')) {
        map.setLayoutProperty('ski-trails-labels', 'visibility', 'none');
      }
    }
  }, [showSkiTrails, isLoading]);

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
        mapStyle={MAPBOX_STYLE}
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

        {/* Ski Trail Toggle */}
        <div className="absolute top-2 left-2 z-[1000]">
          <button
            onClick={() => setShowSkiTrails(!showSkiTrails)}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 shadow-md flex items-center gap-2 transition-colors"
            title={showSkiTrails ? 'Hide ski trails' : 'Show ski trails'}
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              {showSkiTrails ? 'Hide Slopes' : 'Show Slopes'}
            </span>
          </button>
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
            />
          </Popup>
        )}
      </Map>

      {/* Hotel Count Badge */}
      {!isLoading && hotels.length > 0 && !isMapActive && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 z-[1000] pointer-events-none">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm font-semibold text-gray-900">
              {hotels.length} {hotels.length === 1 ? 'Hotel' : 'Hotels'}
            </span>
          </div>
        </div>
      )}

      {/* Ski Trail Legend */}
      {showSkiTrails && !isLoading && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 z-[1000] pointer-events-none">
          <h4 className="font-semibold text-sm mb-2 text-gray-900">Trail Difficulty</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-700">Green (Easy)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-700">Blue (Intermediate)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-black rounded"></div>
              <span className="text-xs text-gray-700">Black (Advanced)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-2 bg-red-600 rounded"></div>
              <span className="text-xs text-gray-700">Double Black (Expert)</span>
            </div>
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
}

