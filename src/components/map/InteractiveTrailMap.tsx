/**
 * InteractiveTrailMap Component
 * Uses Mapbox outdoors style with custom layer styling for ski terrain
 * Leverages OpenStreetMap ski piste data already in Mapbox
 * Integrates Threebox for 3D POI models
 */
import { useRef, useState, useEffect } from 'react';
import Map, { NavigationControl, Popup } from 'react-map-gl/mapbox';
import type { MapRef, MapMouseEvent } from 'react-map-gl/mapbox';
import { MAPBOX_TOKEN, TELLURIDE_CENTER } from '@/lib/mapbox-utils';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAP_STYLES = {
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
};

// Telluride Ski Resort bounds for better framing
const TELLURIDE_BOUNDS: [[number, number], [number, number]] = [
  [-107.85, 37.925], // Southwest coordinates
  [-107.80, 37.95]   // Northeast coordinates
];

// Expanded bounds with ~5 mile buffer to prevent cutting off trails when zooming
// This allows users to zoom in without hitting the boundary
const TELLURIDE_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-107.95, 37.88],  // Southwest with ~5mi buffer
  [-107.70, 38.00]   // Northeast with ~5mi buffer
];

// Dramatic 3D viewpoint focusing on the summit area
// Camera positioned south of resort looking north at the peaks
const SUMMIT_3D_VIEWPOINT = {
  longitude: -107.8125,  // Centered on the main ski resort area
  latitude: 37.9275,     // Positioned to capture the full mountain range
  zoom: 13.5,            // Optimal zoom to show entire resort with dramatic peaks
  pitch: 65,             // Steep angle to emphasize vertical relief and terrain
  bearing: 15            // Slight rotation to show mountain profile and peak areas
};

// Zoom constraints to prevent camera clipping through terrain
const MIN_ZOOM_2D = 11;   // Allow more zoom out in 2D
const MIN_ZOOM_3D = 13;   // Prevent clipping through terrain in 3D (safer threshold)


export default function InteractiveTrailMap() {
  const mapRef = useRef<MapRef>(null);
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const [terrainEnabled, setTerrainEnabled] = useState(false);
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('outdoors');
  const [showTrails, setShowTrails] = useState(true);
  const [showLifts, setShowLifts] = useState(true);
  const [showPOIs, setShowPOIs] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showLegendPanel, setShowLegendPanel] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle map load and apply 3D terrain
  const handleMapLoad = () => {
    setIsMapLoaded(true);
  };

  // Initial view setup - runs once after map loads
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;
    
    const map = mapRef.current.getMap();
    
    // Wait for initial style load, then fit to resort bounds
    const initialSetup = () => {
      setTimeout(() => {
        map.fitBounds(TELLURIDE_BOUNDS, {
          padding: { top: 100, bottom: 100, left: 450, right: 450 },
          pitch: 0,
          bearing: 0,
          duration: 1500
        });
      }, 500);
    };
    
    if (map.isStyleLoaded()) {
      initialSetup();
    } else {
      map.once('style.load', initialSetup);
    }
  }, [isMapLoaded]); // Only run once when map loads

  // Load all map data (trails, lifts, POIs) after map is loaded and on style/visibility changes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    const map = mapRef.current.getMap();

    // Wait for style to be fully loaded before adding sources
    const addTerrainAndLayers = () => {
      // Re-add terrain sources if they don't exist (e.g., after style change)
      if (!map.getSource('local-terrain')) {
        map.addSource('local-terrain', {
          type: 'raster-dem',
          tiles: [window.location.origin + '/tiles/terrain/{z}/{x}/{y}.png'],
          tileSize: 256,
          minzoom: 10,
          maxzoom: 14,
          encoding: 'terrarium'
        });
      }
      
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });
      }
      
      // Don't automatically re-apply terrain here - let the toggle function handle it
      // Re-applying terrain during style.load causes infinite recursion

    // Hide default Mapbox trail layers
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

    // Remove existing custom layers if they exist (for style changes)
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

        // Add color-coded ski trails layer
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

        // Add trail name labels with color-matched halos (only if glyphs available)
        try {
          // Check if style has glyphs before adding text layers
          const style = map.getStyle();
          if (style && style.glyphs) {
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
          } else {
            console.log('[InteractiveTrailMap] Style does not have glyphs, skipping trail labels');
          }
        } catch (err) {
          console.log('[InteractiveTrailMap] Trail labels not available for this style:', err);
        }

        // Toggle trail visibility based on state
        map.setLayoutProperty('telluride-ski-trails', 'visibility', showTrails ? 'visible' : 'none');
        try {
          if (map.getLayer('telluride-ski-trails-labels')) {
            map.setLayoutProperty('telluride-ski-trails-labels', 'visibility', showTrails ? 'visible' : 'none');
          }
        } catch {}

        console.log(`[InteractiveTrailMap] ✅ Loaded ${data.features.length} ski trails`);
      })
      .catch(err => {
        console.error('[InteractiveTrailMap] Failed to load ski trail data:', err);
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
            'line-cap': 'round',
            'visibility': showLifts ? 'visible' : 'none'
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

        console.log(`[InteractiveTrailMap] ✅ Loaded ${data.features.length} lift lines`);
      })
      .catch(err => {
        console.error('[InteractiveTrailMap] Failed to load lift data:', err);
      });

    // Load POIs (restaurants, restrooms, lift stations, etc.)
    fetch('/data/telluride-pois.json')
      .then(response => response.json())
      .then(data => {
        map.addSource('telluride-pois', {
          type: 'geojson',
          data: data
        });

        // Add POI markers as text symbols (classic ski map style - square badges)
        try {
          // Check if style has glyphs before adding text layers
          const style = map.getStyle();
          if (style && style.glyphs) {
            map.addLayer({
              id: 'telluride-pois',
              type: 'symbol',
              source: 'telluride-pois',
              layout: {
                'visibility': showPOIs ? 'visible' : 'none',
                // Use letter abbreviations like classic ski maps
                'text-field': [
                  'match',
                  ['get', 'type'],
                  'restaurant', 'R',
                  'cafe', 'C',
                  'restroom', 'WC',
                  'lift-station', 'L',
                  'information', 'i',
                  'viewpoint', 'V',
                  'M' // default marker
                ],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  12, 12,
                  15, 14,
                  17, 16
                ],
                'text-allow-overlap': true,
                'text-ignore-placement': false,
                // Key for 3D: always face the viewport (billboard effect)
                'text-rotation-alignment': 'viewport',
                'text-pitch-alignment': 'viewport',
                'text-offset': [0, 0]
              },
              paint: {
                'text-color': '#ffffff',
                'text-opacity': 1,
                // Colored background effect with thick border (classic ski map style)
                'text-halo-color': [
                  'match',
                  ['get', 'type'],
                  'restaurant', '#ef4444',      // Red
                  'cafe', '#f97316',            // Orange
                  'restroom', '#3b82f6',        // Blue
                  'lift-station', '#fbbf24',    // Yellow/gold
                  'information', '#10b981',     // Green
                  'viewpoint', '#06b6d4',       // Cyan
                  '#6b7280'                      // Gray default
                ],
                'text-halo-width': 4,
                'text-halo-blur': 0
              }
            });

            // Add POI labels (billboard-style like FR 641 - always readable)
            map.addLayer({
              id: 'telluride-pois-labels',
              type: 'symbol',
              source: 'telluride-pois',
              layout: {
                'text-field': ['get', 'name'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  13, 11,
                  15, 13,
                  17, 16
                ],
                'text-offset': [0, 2],
                'text-anchor': 'top',
                'visibility': showPOIs ? 'visible' : 'none',
                // Billboard effect - always face camera (like FR 641)
                'text-rotation-alignment': 'viewport',
                'text-pitch-alignment': 'viewport',
                'text-allow-overlap': false
              },
              paint: {
                'text-color': '#000000',
                // Strong white halo for maximum visibility (like FR 641)
                'text-halo-color': '#ffffff',
                'text-halo-width': 3,
                'text-halo-blur': 1
              },
              minzoom: 14
            });
          } else {
            console.log('[InteractiveTrailMap] Style does not have glyphs, skipping POI text layers');
          }
        } catch (err) {
          console.log('[InteractiveTrailMap] POI markers/labels not available for this style:', err);
        }

        console.log(`[InteractiveTrailMap] ✅ Loaded ${data.features.length} POIs`);
      })
      .catch(err => {
        console.error('[InteractiveTrailMap] Failed to load POI data:', err);
      });
    };

    // Call the function to add terrain and layers
    if (map.isStyleLoaded()) {
      addTerrainAndLayers();
    } else {
      map.once('style.load', addTerrainAndLayers);
    }
  }, [isMapLoaded, mapStyle, showTrails, showLifts, showPOIs]);

  // Note: POI markers are now symbol-based and automatically billboard in 3D
  // No need for dynamic updates - they always face the camera!

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
    if (!map || !map.isStyleLoaded()) return;

    const newTerrainState = !terrainEnabled;
    
    if (newTerrainState) {
      // Enable 3D terrain - ensure source exists first
      const demSource = map.getSource('mapbox-dem');
      if (!demSource) {
        console.warn('[InteractiveTrailMap] mapbox-dem source not found');
        return;
      }
      
      // Set camera position first (no animation, instant)
      map.jumpTo({
        center: [SUMMIT_3D_VIEWPOINT.longitude, SUMMIT_3D_VIEWPOINT.latitude],
        zoom: SUMMIT_3D_VIEWPOINT.zoom,
        pitch: SUMMIT_3D_VIEWPOINT.pitch,
        bearing: SUMMIT_3D_VIEWPOINT.bearing
      });
      
      // Then enable terrain
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 2.0 });
      setTerrainEnabled(true);
      
    } else {
      // Disable 3D terrain first
      map.setTerrain(null);
      
      // Reset to flat view
      const padding = isFullscreen 
        ? { top: 100, bottom: 100, left: 100, right: 100 }
        : { top: 100, bottom: 100, left: 450, right: 450 };
      
      map.fitBounds(TELLURIDE_BOUNDS, {
        padding,
        pitch: 0,
        bearing: 0,
        duration: 1000
      });
      
      setTerrainEnabled(false);
    }
  };

  const resetView = () => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    
    map.fitBounds(TELLURIDE_BOUNDS, {
      padding: 40,
      duration: 1000
    });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      // Enter fullscreen
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Listen for fullscreen changes (user pressing ESC, etc.)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${isFullscreen ? 'bg-neutral-900' : ''}`}>
      {/* Hide default Mapbox attribution */}
      <style>{`
        .mapboxgl-ctrl-bottom-left,
        .mapboxgl-ctrl-bottom-right {
          display: none !important;
        }
      `}</style>
      
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: TELLURIDE_CENTER[0],
          latitude: TELLURIDE_CENTER[1],
          zoom: 12.5,
          pitch: 0,
          bearing: 0
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_STYLES[mapStyle]}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleMapLoad}
        onClick={handleMapClick}
        maxBounds={TELLURIDE_MAX_BOUNDS}
        minZoom={terrainEnabled ? MIN_ZOOM_3D : MIN_ZOOM_2D}
        maxZoom={18}
        maxPitch={85}
        scrollZoom={true}
        dragPan={true}
        dragRotate={true}
        doubleClickZoom={true}
        touchZoomRotate={true}
        touchPitch={true}
        keyboard={true}
      >
        <NavigationControl position="top-right" showCompass={true} visualizePitch={true} />

        {/* Fullscreen Toggle Button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-32 right-4 z-20 bg-white hover:bg-neutral-50 rounded shadow-lg transition-all border border-neutral-300 p-2.5"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        >
          {isFullscreen ? (
            <svg className="w-5 h-5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>

         {/* Map Controls - Left Panel (Classic Ski Map Style) */}
        {showLeftPanel ? (
          <div className="absolute top-4 left-4 z-10 bg-white rounded-xl shadow-2xl border-2 border-neutral-800 max-w-sm flex flex-col max-h-[calc(100vh-2rem)]" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
            <div className="bg-white z-10 p-5 pb-3 border-b-2 border-neutral-800 rounded-t-xl flex-shrink-0">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-black text-neutral-900 uppercase tracking-wider flex-1">
                  Telluride Ski Resort
                </h3>
                <button
                  onClick={() => setShowLeftPanel(false)}
                  className="text-neutral-600 hover:text-neutral-900 transition-colors ml-2 -mr-1"
                  aria-label="Collapse panel"
                  title="Hide controls"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-5 pt-4 overflow-y-auto flex-1">
            {/* Map Style Toggle */}
            <div className="mb-4 pb-4 border-b border-neutral-300">
              <h4 className="text-sm font-black text-neutral-900 mb-3 uppercase tracking-wide">Map Style</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setMapStyle('outdoors')}
                  className={`flex-1 px-3 py-2 text-xs font-black uppercase tracking-wide transition-all border-2 ${
                    mapStyle === 'outdoors'
                      ? 'bg-primary-600 text-white border-neutral-800'
                      : 'bg-white text-neutral-700 border-neutral-400 hover:border-neutral-800'
                  }`}
                >
                  <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Terrain
                </button>
                <button
                  onClick={() => setMapStyle('satellite')}
                  className={`flex-1 px-3 py-2 text-xs font-black uppercase tracking-wide transition-all border-2 ${
                    mapStyle === 'satellite'
                      ? 'bg-primary-600 text-white border-neutral-800'
                      : 'bg-white text-neutral-700 border-neutral-400 hover:border-neutral-800'
                  }`}
                >
                  <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Satellite
                </button>
              </div>
            </div>

            {/* Resort Stats */}
            <div className="mb-4 pb-4 border-b border-neutral-300">
              <h4 className="text-sm font-black text-neutral-900 mb-3 uppercase tracking-wide">Resort Stats</h4>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-600 font-semibold">Vertical Drop:</span>
                  <span className="font-black text-neutral-900">4,425 ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 font-semibold">Summit:</span>
                  <span className="font-black text-neutral-900">13,320 ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 font-semibold">Base:</span>
                  <span className="font-black text-neutral-900">8,725 ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 font-semibold">Skiable Acres:</span>
                  <span className="font-black text-neutral-900">2,000+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 font-semibold">Lifts:</span>
                  <span className="font-black text-neutral-900">19</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 font-semibold">Trails:</span>
                  <span className="font-black text-neutral-900">148</span>
                </div>
              </div>
            </div>

            {/* 3D Terrain Toggle */}
            <div className="mb-4 pb-4 border-b border-neutral-300">
              <h4 className="text-sm font-black text-neutral-900 mb-3 uppercase tracking-wide">Terrain View</h4>
              <button
                onClick={toggle3D}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-black uppercase tracking-wide transition-all border-2 ${
                  terrainEnabled
                    ? 'bg-primary-600 text-white border-neutral-800'
                    : 'bg-white text-neutral-700 border-neutral-400 hover:border-neutral-800'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {terrainEnabled ? '3D Terrain Active' : 'Enable 3D Terrain'}
              </button>
            </div>
            
            {/* Reset View Button */}
            <button
              onClick={resetView}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-900 text-sm font-black text-white uppercase tracking-wide transition-all border-2 border-neutral-800"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset View
            </button>
            </div>
          </div>
         ) : (
          <button
            onClick={() => setShowLeftPanel(true)}
            className="absolute top-4 left-4 z-10 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-2xl transition-all border-2 border-neutral-800 px-3 py-2"
            aria-label="Show controls"
            title="Show controls"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Control Instructions */}
        {showControls && (
          <div className="absolute top-24 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl px-4 py-3 z-10 border border-neutral-200 max-w-xs">
            <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
                <span className="text-sm font-black text-neutral-900">Map Controls</span>
              </div>
              <button 
                onClick={() => setShowControls(false)}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-xs text-neutral-700">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <div>
                  <span className="font-bold">Click & Drag</span> to pan
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
                <div>
                  <span className="font-bold">Scroll</span> to zoom in/out
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <div>
                  <span className="font-bold">Right-Click & Drag</span> to rotate
                </div>
              </div>
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <div>
                  <span className="font-bold">Click trails/POIs</span> for info
                </div>
              </div>
          </div>
        </div>
        )}
        
        {!showControls && (
          <button
            onClick={() => setShowControls(true)}
            className="absolute top-24 right-4 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 shadow-xl z-10 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}

        {/* Classic Ski Map Legend - Bottom Right */}
        {showLegendPanel ? (
          <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-2xl border-2 border-neutral-800 max-w-xs max-h-[calc(100vh-180px)] z-10 flex flex-col" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
            <div className="bg-white z-10 p-5 pb-3 border-b-2 border-neutral-800 rounded-t-xl flex-shrink-0">
              <div className="flex items-start justify-between">
                <h3 className="text-base font-black text-neutral-900 uppercase tracking-wider flex-1">
                  Trail Map Legend
                </h3>
                <button
                  onClick={() => setShowLegendPanel(false)}
                  className="text-neutral-600 hover:text-neutral-900 transition-colors ml-2 -mr-1"
                  aria-label="Collapse legend"
                  title="Hide legend"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-5 pt-4 overflow-y-auto flex-1">
          
          {/* Layer Toggles - Integrated with Legend */}
          <div className="mb-4 pb-4 border-b-2 border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-neutral-900 uppercase tracking-wide">Map Layers</h4>
              <button
                onClick={() => {
                  const allOn = showTrails && showLifts && showPOIs;
                  setShowTrails(!allOn);
                  setShowLifts(!allOn);
                  setShowPOIs(!allOn);
                }}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wide transition-colors"
              >
                {(showTrails && showLifts && showPOIs) ? 'Hide All' : 'Show All'}
              </button>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showTrails}
                  onChange={(e) => setShowTrails(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-neutral-800 text-primary-600 focus:ring-2 focus:ring-primary-600 cursor-pointer"
                />
                <span className="text-sm text-neutral-900 font-bold flex-1">Ski Trails</span>
                <span className="text-xs font-black text-neutral-600">(448)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showLifts}
                  onChange={(e) => setShowLifts(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-neutral-800 text-primary-600 focus:ring-2 focus:ring-primary-600 cursor-pointer"
                />
                <span className="text-sm text-neutral-900 font-bold flex-1">Lifts & Gondolas</span>
                <span className="text-xs font-black text-neutral-600">(18)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={showPOIs}
                  onChange={(e) => setShowPOIs(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-neutral-800 text-primary-600 focus:ring-2 focus:ring-primary-600 cursor-pointer"
                />
                <span className="text-sm text-neutral-900 font-bold flex-1">Facilities</span>
                <span className="text-xs font-black text-neutral-600">(65)</span>
              </label>
            </div>
          </div>
          
          {/* Trail Difficulty Legend - Always visible */}
          <div className="mb-4 pb-4 border-b border-neutral-300">
            <h4 className="text-sm font-black text-neutral-900 mb-3 uppercase tracking-wide">Trail Difficulty</h4>
            <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#22c55e] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-xs">●</span>
                  </div>
                  <div>
                    <div className="text-sm font-black text-neutral-900">Green Circle</div>
                    <div className="text-xs text-neutral-600 font-semibold">Easiest • Beginner</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#3b82f6] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-xs">■</span>
                  </div>
                  <div>
                    <div className="text-sm font-black text-neutral-900">Blue Square</div>
                    <div className="text-xs text-neutral-600 font-semibold">More Difficult • Intermediate</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1e1e1e] border-2 border-neutral-800 rotate-45 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-xs -rotate-45">◆</span>
                  </div>
                  <div>
                    <div className="text-sm font-black text-neutral-900">Black Diamond</div>
                    <div className="text-xs text-neutral-600 font-semibold">Most Difficult • Advanced</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#ef4444] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm relative">
                    <span className="text-white font-black text-xs absolute">◆</span>
                    <span className="text-white font-black text-xs absolute translate-x-1">◆</span>
                </div>
                  <div>
                    <div className="text-sm font-black text-neutral-900">Double Black</div>
                    <div className="text-xs text-neutral-600 font-semibold">Experts Only • Extreme</div>
                </div>
                </div>
              </div>
            </div>

          {/* Lifts & Gondolas - Always visible for reference */}
          <div className="mb-4 pb-4 border-b border-neutral-300">
            <h4 className="text-sm font-black text-neutral-900 mb-3 uppercase tracking-wide">Lifts & Gondolas</h4>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-2 border-2 border-[#f59e0b] bg-white flex items-center justify-center flex-shrink-0" style={{borderStyle: 'dashed'}}>
                  </div>
                  <div>
                    <div className="text-sm font-black text-neutral-900">Gondolas</div>
                    <div className="text-xs text-neutral-600 font-semibold">Enclosed lift</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-2 border-2 border-[#eab308] bg-white flex items-center justify-center flex-shrink-0" style={{borderStyle: 'dashed'}}>
                  </div>
                  <div>
                    <div className="text-sm font-black text-neutral-900">Chairlifts</div>
                    <div className="text-xs text-neutral-600 font-semibold">Open-air lift</div>
                </div>
                </div>
              </div>
            </div>

          {/* Facilities Legend - Always visible */}
          <div className="mb-4">
            <h4 className="text-sm font-black text-neutral-900 mb-3 uppercase tracking-wide">Facilities</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#ef4444] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-xs">R</span>
                  </div>
                  <span className="text-xs text-neutral-900 font-bold">Restaurant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#f97316] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-xs">C</span>
                  </div>
                  <span className="text-xs text-neutral-900 font-bold">Cafe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#3b82f6] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-[10px]">WC</span>
                  </div>
                  <span className="text-xs text-neutral-900 font-bold">Restroom</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#fbbf24] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-xs">L</span>
                </div>
                  <span className="text-xs text-neutral-900 font-bold">Lift Station</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#10b981] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-xs">i</span>
                </div>
                  <span className="text-xs text-neutral-900 font-bold">Information</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-[#06b6d4] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-xs">V</span>
                </div>
                  <span className="text-xs text-neutral-900 font-bold">Viewpoint</span>
                </div>
              </div>
            </div>

          <div className="mt-4 pt-4 border-t-2 border-neutral-800">
            <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wide">
              Map Data © OpenStreetMap
            </p>
          </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowLegendPanel(true)}
            className="absolute bottom-4 right-4 z-10 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-2xl transition-all border-2 border-neutral-800 px-3 py-2"
            aria-label="Show legend"
            title="Show legend"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Data Attribution - Only show when left panel is closed */}
        {!showLeftPanel && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm px-3 py-2 z-10 text-xs text-neutral-600 border border-neutral-300">
            Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-600">OpenStreetMap</a> contributors
          </div>
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
