/**
 * InteractiveTrailMap Component
 * Full-featured ski trail map for Telluride with offline PWA support
 * Displays trails, lifts, restaurants, and terrain zones
 */
import { useEffect, useRef, useState } from 'react';
import Map, { Source, Layer, NavigationControl, Popup } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { MAPBOX_TOKEN, TELLURIDE_CENTER } from '@/lib/mapbox-utils';
import 'mapbox-gl/dist/mapbox-gl.css';

const TRAIL_MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

// Trail difficulty colors matching ski industry standards
const TRAIL_COLORS = {
  easy: '#22c55e',       // Green circle
  intermediate: '#3b82f6', // Blue square
  advanced: '#1e1e1e',   // Black diamond
  expert: '#dc2626',     // Double black diamond
};

// Lift type colors
const LIFT_COLORS = {
  gondola: '#f59e0b',    // Orange
  'high-speed quad': '#f59e0b',
  'high-speed six': '#f59e0b',
  quad: '#d97706',
  triple: '#92400e',
  double: '#78350f',
};

interface POIFeature {
  type: string;
  name: string;
  category: string;
  elevation?: string;
  amenities?: string[];
}

interface TrailFeature {
  type: string;
  name: string;
  difficulty: string;
  grooming: string;
  length?: string;
  vertical?: string;
}

interface LiftFeature {
  type: string;
  name: string;
  lift_type: string;
  capacity?: string;
  vertical?: string;
  status?: string;
}

export default function InteractiveTrailMap() {
  const mapRef = useRef<MapRef>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trailData, setTrailData] = useState<any>(null);
  const [selectedFeature, setSelectedFeature] = useState<any>(null);
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showPOI, setShowPOI] = useState(true);
  const [viewState, setViewState] = useState({
    longitude: TELLURIDE_CENTER[0],
    latitude: TELLURIDE_CENTER[1],
    zoom: 13,
  });

  // Load trail map data
  useEffect(() => {
    fetch('/data/telluride-trail-map.geojson')
      .then(res => res.json())
      .then(data => {
        setTrailData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Failed to load trail map data:', err);
        setIsLoading(false);
      });
  }, []);

  // Handle map load
  const handleMapLoad = () => {
    setIsLoading(false);
  };

  // Handle feature click
  const handleMapClick = (event: any) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const features = map.queryRenderedFeatures(event.point, {
      layers: ['trails-layer', 'lifts-layer', 'poi-layer']
    });

    if (features.length > 0) {
      const feature = features[0];
      setSelectedFeature(feature);
      setPopupInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        properties: feature.properties
      });
    }
  };

  // Layer styles
  const trailsLayerStyle: any = {
    id: 'trails-layer',
    type: 'line',
    paint: {
      'line-color': [
        'match',
        ['get', 'difficulty'],
        'easy', TRAIL_COLORS.easy,
        'intermediate', TRAIL_COLORS.intermediate,
        'advanced', TRAIL_COLORS.advanced,
        'expert', TRAIL_COLORS.expert,
        '#3b82f6' // default
      ],
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12, 3,
        14, 6,
        16, 10
      ],
      'line-opacity': 0.9
    }
  };

  const liftsLayerStyle: any = {
    id: 'lifts-layer',
    type: 'line',
    paint: {
      'line-color': '#f59e0b',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12, 2,
        14, 4,
        16, 6
      ],
      'line-dasharray': [2, 2],
      'line-opacity': 0.9
    }
  };

  const zonesLayerStyle: any = {
    id: 'zones-layer',
    type: 'fill',
    paint: {
      'fill-color': '#3b82f6',
      'fill-opacity': 0.1,
      'fill-outline-color': '#3b82f6'
    }
  };

  const poiLayerStyle: any = {
    id: 'poi-layer',
    type: 'circle',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        12, 6,
        16, 12
      ],
      'circle-color': [
        'match',
        ['get', 'category'],
        'restaurant', '#ef4444',
        'services', '#3b82f6',
        'safety', '#eab308',
        '#6b7280' // default
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#ffffff',
      'circle-opacity': showPOI ? 1 : 0
    }
  };

  // Get filtered GeoJSON by feature type
  const getFeaturesByType = (type: string): GeoJSON.FeatureCollection => {
    if (!trailData) return { type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection;
    return {
      type: 'FeatureCollection',
      features: trailData.features.filter((f: any) => f.properties.type === type)
    } as GeoJSON.FeatureCollection;
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-sm text-neutral-600">Loading Trail Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={TRAIL_MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleMapLoad}
        onClick={handleMapClick}
        interactiveLayerIds={['trails-layer', 'lifts-layer', 'poi-layer']}
      >
        <NavigationControl position="top-right" showCompass={true} />

        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-10 bg-white rounded-xl shadow-xl p-4 space-y-3 max-w-xs">
          <h3 className="font-bold text-neutral-900 text-lg mb-3">Telluride Trail Map</h3>
          
          {/* Legend */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">Trail Difficulty</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: TRAIL_COLORS.easy }}>
                  <span className="text-white font-bold text-xs">●</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-900">Green Circle</span>
                  <span className="text-[10px] text-neutral-600">Easiest</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ backgroundColor: TRAIL_COLORS.intermediate }}>
                  <span className="text-white font-bold text-sm">■</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-900">Blue Square</span>
                  <span className="text-[10px] text-neutral-600">More Difficult</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rotate-45 flex items-center justify-center" style={{ backgroundColor: TRAIL_COLORS.advanced }}>
                  <span className="text-white font-bold -rotate-45 text-lg leading-none">◆</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-900">Black Diamond</span>
                  <span className="text-[10px] text-neutral-600">Most Difficult</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  <div className="w-5 h-5 rotate-45 flex items-center justify-center" style={{ backgroundColor: TRAIL_COLORS.expert }}>
                    <span className="text-white font-bold -rotate-45 text-sm leading-none">◆</span>
                  </div>
                  <div className="w-5 h-5 rotate-45 flex items-center justify-center" style={{ backgroundColor: TRAIL_COLORS.expert }}>
                    <span className="text-white font-bold -rotate-45 text-sm leading-none">◆</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-neutral-900">Double Black</span>
                  <span className="text-[10px] text-neutral-600">Experts Only</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-3">
            <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">Features</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 rounded border-t-2 border-dashed" style={{ borderColor: '#f59e0b' }}></div>
                <span className="text-xs text-neutral-600">Lifts & Gondolas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
                <span className="text-xs text-neutral-600">Restaurants</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
                <span className="text-xs text-neutral-600">Services</span>
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="border-t border-neutral-200 pt-3 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-neutral-700">Show Labels</span>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={(e) => setShowLabels(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-neutral-700">Show POIs</span>
              <input
                type="checkbox"
                checked={showPOI}
                onChange={(e) => setShowPOI(e.target.checked)}
                className="w-4 h-4 text-primary-600 rounded"
              />
            </label>
          </div>
        </div>

        {/* Info Badge */}
        <div className="absolute top-4 right-16 bg-white rounded-lg shadow-md px-3 py-2 z-10">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-neutral-700">Click features for details</span>
          </div>
        </div>

        {/* Render Zones */}
        {trailData && (
          <Source id="zones-source" type="geojson" data={getFeaturesByType('zone')}>
            <Layer {...zonesLayerStyle} />
          </Source>
        )}

        {/* Render Trails */}
        {trailData && (
          <Source id="trails-source" type="geojson" data={getFeaturesByType('trail')}>
            <Layer {...trailsLayerStyle} />
            {showLabels && (
              <Layer
                id="trail-labels"
                type="symbol"
                layout={{
                  'text-field': ['get', 'name'],
                  'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                  'text-size': 11,
                  'symbol-placement': 'line',
                  'text-rotation-alignment': 'map',
                  'text-pitch-alignment': 'viewport',
                }}
                paint={{
                  'text-color': '#ffffff',
                  'text-halo-color': '#000000',
                  'text-halo-width': 2,
                }}
              />
            )}
          </Source>
        )}

        {/* Render Lifts */}
        {trailData && (
          <Source id="lifts-source" type="geojson" data={getFeaturesByType('lift')}>
            <Layer {...liftsLayerStyle} />
            {showLabels && (
              <Layer
                id="lift-labels"
                type="symbol"
                layout={{
                  'text-field': ['get', 'name'],
                  'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                  'text-size': 10,
                  'symbol-placement': 'line',
                  'text-rotation-alignment': 'map',
                }}
                paint={{
                  'text-color': '#f59e0b',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 2,
                }}
              />
            )}
          </Source>
        )}

        {/* Render POIs */}
        {trailData && (
          <Source id="poi-source" type="geojson" data={getFeaturesByType('poi')}>
            <Layer {...poiLayerStyle} />
            {showLabels && showPOI && (
              <Layer
                id="poi-labels"
                type="symbol"
                layout={{
                  'text-field': ['get', 'name'],
                  'text-font': ['Open Sans Semibold', 'Arial Unicode MS Regular'],
                  'text-size': 10,
                  'text-offset': [0, 1.5],
                  'text-anchor': 'top',
                }}
                paint={{
                  'text-color': '#1f2937',
                  'text-halo-color': '#ffffff',
                  'text-halo-width': 1.5,
                }}
              />
            )}
          </Source>
        )}

        {/* Feature Popup */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeButton={true}
            closeOnClick={false}
            maxWidth="300px"
          >
            <div className="p-2">
              <h3 className="font-bold text-neutral-900 mb-2">{popupInfo.properties.name}</h3>
              {popupInfo.properties.type === 'trail' && (
                <div className="space-y-1 text-sm">
                  <p className="text-neutral-600">
                    <span className="font-semibold">Difficulty:</span> {popupInfo.properties.difficulty}
                  </p>
                  {popupInfo.properties.length && (
                    <p className="text-neutral-600">
                      <span className="font-semibold">Length:</span> {popupInfo.properties.length}
                    </p>
                  )}
                  {popupInfo.properties.vertical && (
                    <p className="text-neutral-600">
                      <span className="font-semibold">Vertical:</span> {popupInfo.properties.vertical}
                    </p>
                  )}
                  <p className="text-neutral-600">
                    <span className="font-semibold">Grooming:</span> {popupInfo.properties.grooming}
                  </p>
                </div>
              )}
              {popupInfo.properties.type === 'lift' && (
                <div className="space-y-1 text-sm">
                  <p className="text-neutral-600">
                    <span className="font-semibold">Type:</span> {popupInfo.properties.lift_type}
                  </p>
                  {popupInfo.properties.capacity && (
                    <p className="text-neutral-600">
                      <span className="font-semibold">Capacity:</span> {popupInfo.properties.capacity}
                    </p>
                  )}
                  {popupInfo.properties.vertical && (
                    <p className="text-neutral-600">
                      <span className="font-semibold">Vertical:</span> {popupInfo.properties.vertical}
                    </p>
                  )}
                  <p className="text-neutral-600">
                    <span className="font-semibold">Status:</span> {popupInfo.properties.status || 'Operating'}
                  </p>
                </div>
              )}
              {popupInfo.properties.type === 'poi' && (
                <div className="space-y-1 text-sm">
                  <p className="text-neutral-600">
                    <span className="font-semibold">Category:</span> {popupInfo.properties.category}
                  </p>
                  {popupInfo.properties.elevation && (
                    <p className="text-neutral-600">
                      <span className="font-semibold">Elevation:</span> {popupInfo.properties.elevation}
                    </p>
                  )}
                  {popupInfo.properties.amenities && (
                    <div className="mt-2">
                      <p className="font-semibold text-neutral-700 mb-1">Amenities:</p>
                      <div className="flex flex-wrap gap-1">
                        {JSON.parse(popupInfo.properties.amenities).map((amenity: string, i: number) => (
                          <span key={i} className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

