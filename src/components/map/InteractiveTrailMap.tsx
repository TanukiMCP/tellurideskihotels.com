/**
 * InteractiveTrailMap Component
 * Uses Mapbox outdoors style with custom layer styling for ski terrain
 * Leverages OpenStreetMap ski piste data already in Mapbox
 */
import { useRef, useState } from 'react';
import Map, { NavigationControl, Popup } from 'react-map-gl/mapbox';
import type { MapRef, MapMouseEvent } from 'react-map-gl/mapbox';
import { MAPBOX_TOKEN, TELLURIDE_CENTER } from '@/lib/mapbox-utils';
import 'mapbox-gl/dist/mapbox-gl.css';

const TRAIL_MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12';

// Telluride Ski Resort bounds for better framing
const TELLURIDE_BOUNDS: [[number, number], [number, number]] = [
  [-107.85, 37.925], // Southwest coordinates
  [-107.80, 37.95]   // Northeast coordinates
];

export default function InteractiveTrailMap() {
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const [terrainEnabled, setTerrainEnabled] = useState(true);
  const [viewState, setViewState] = useState({
    longitude: TELLURIDE_CENTER[0],
    latitude: TELLURIDE_CENTER[1],
    zoom: 13.5,
    pitch: 0,
    bearing: 0
  });

  // Handle map load and apply custom styling
  const handleMapLoad = () => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Add 3D terrain with LOWER exaggeration to prevent scroll zoom conflicts
    map.addSource('mapbox-dem', {
      type: 'raster-dem',
      url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
      tileSize: 512,
      maxzoom: 14
    });
    
    // Wait for source to load before applying terrain to prevent race condition
    map.once('sourcedata', (e) => {
      if (e.sourceId === 'mapbox-dem' && e.isSourceLoaded) {
        // Use exaggeration: 1.0 instead of 1.5 to reduce camera conflicts
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.0 });
      }
    });
  };

  // Handle map clicks to show feature info
  const handleMapClick = (event: MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Query all features at the clicked point
    const features = map.queryRenderedFeatures(event.point);
    
    // Filter for interesting features (POIs, natural features, etc.)
    const relevantFeature = features.find((f: any) => 
      f.properties?.name || 
      f.layer?.id?.includes('poi') ||
      f.layer?.id?.includes('place') ||
      f.properties?.ele
    );

    if (relevantFeature && relevantFeature.properties) {
      setPopupInfo({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        properties: relevantFeature.properties,
        layer: relevantFeature.layer?.id
      });
    }
  };

  const toggle3D = () => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (terrainEnabled) {
      // Disable 3D
      map.setTerrain(null);
      map.easeTo({ pitch: 0, duration: 500 });
    } else {
      // Enable 3D - use lower exaggeration to prevent scroll zoom issues
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.0 });
      map.easeTo({ pitch: 45, duration: 500 });
    }
    setTerrainEnabled(!terrainEnabled);
  };

  const resetView = () => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    map.fitBounds(TELLURIDE_BOUNDS, {
      padding: 40,
      duration: 1000
    });
  };

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
        maxBounds={[
          [-107.90, 37.90],
          [-107.75, 37.97]
        ]}
        minZoom={11}
        maxZoom={18}
        scrollZoom={true}
        dragPan={true}
        dragRotate={false}
        doubleClickZoom={true}
        touchZoomRotate={true}
        keyboard={true}
      >
        <NavigationControl position="top-right" showCompass={true} visualizePitch={true} />

        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 space-y-3 max-w-xs">
          <h3 className="font-bold text-neutral-900 text-lg">Telluride Ski Resort</h3>
          
          {/* Quick Stats */}
          <div className="space-y-2 text-xs border-t border-neutral-200 pt-3">
            <div className="flex justify-between">
              <span className="text-neutral-600">Vertical Drop:</span>
              <span className="font-bold text-neutral-900">4,425 ft</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Summit:</span>
              <span className="font-bold text-neutral-900">13,320 ft</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Base:</span>
              <span className="font-bold text-neutral-900">8,725 ft</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Skiable Acres:</span>
              <span className="font-bold text-neutral-900">2,000+</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Lifts:</span>
              <span className="font-bold text-neutral-900">19</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-600">Trails:</span>
              <span className="font-bold text-neutral-900">148</span>
            </div>
          </div>

          {/* Trail Difficulty Legend */}
          <div className="border-t border-neutral-200 pt-3">
            <h4 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide mb-2">Trail Difficulty</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-xs text-neutral-600">23% Beginner</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-blue-600"></div>
                <span className="text-xs text-neutral-600">36% Intermediate</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rotate-45 bg-black"></div>
                <span className="text-xs text-neutral-600">41% Advanced/Expert</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="border-t border-neutral-200 pt-3 space-y-2">
            <button
              onClick={toggle3D}
              className="w-full flex items-center justify-between px-3 py-2 bg-primary-50 hover:bg-primary-100 rounded-lg text-xs font-medium text-neutral-700 transition-colors"
            >
              <span>{terrainEnabled ? '3D View' : '2D View'}</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </button>
            <button
              onClick={resetView}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg text-xs font-medium text-neutral-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset View
            </button>
          </div>
        </div>

        {/* Info Badge */}
        <div className="absolute top-4 right-16 bg-white/95 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 z-10">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-neutral-700">Click map for details</span>
          </div>
        </div>

        {/* Data Attribution */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm px-3 py-2 z-10 text-xs text-neutral-600">
          Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-600">OpenStreetMap</a> contributors
        </div>

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
              <h3 className="font-bold text-neutral-900 mb-2">
                {popupInfo.properties.name || 'Feature'}
              </h3>
              <div className="space-y-1 text-xs text-neutral-600">
                {popupInfo.properties.ele && (
                  <p><span className="font-semibold">Elevation:</span> {popupInfo.properties.ele} m</p>
                )}
                {popupInfo.properties.piste_type && (
                  <p><span className="font-semibold">Trail Type:</span> {popupInfo.properties.piste_type}</p>
                )}
                {popupInfo.properties.piste_difficulty && (
                  <p><span className="font-semibold">Difficulty:</span> {popupInfo.properties.piste_difficulty}</p>
                )}
                {popupInfo.properties.aerialway && (
                  <p><span className="font-semibold">Lift Type:</span> {popupInfo.properties.aerialway}</p>
                )}
                {popupInfo.layer && (
                  <p className="text-neutral-500 italic mt-2">Layer: {popupInfo.layer}</p>
                )}
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
