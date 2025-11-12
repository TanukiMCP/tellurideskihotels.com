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
// @ts-ignore - threebox-plugin doesn't have TypeScript definitions
import Threebox from 'threebox-plugin';
import 'threebox-plugin/dist/threebox.css';

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

// 3D Object configurations for each POI type (using simple geometric shapes)
const POI_3D_CONFIGS = {
  'lift-station': {
    type: 'sphere',
    radius: 15,
    color: '#fbbf24', // Yellow/gold for lifts
    material: 'MeshStandardMaterial'
  },
  'restaurant': {
    type: 'sphere',
    radius: 12,
    color: '#ef4444', // Red for restaurants
    material: 'MeshStandardMaterial'
  },
  'restroom': {
    type: 'sphere',
    radius: 10,
    color: '#3b82f6', // Blue for restrooms
    material: 'MeshStandardMaterial'
  },
  'information': {
    type: 'sphere',
    radius: 11,
    color: '#10b981', // Green for info
    material: 'MeshStandardMaterial'
  }
};

export default function InteractiveTrailMap() {
  const mapRef = useRef<MapRef>(null);
  const threeboxRef = useRef<any>(null);
  const poi3DModelsRef = useRef<any[]>([]);
  const [popupInfo, setPopupInfo] = useState<any>(null);
  const [terrainEnabled, setTerrainEnabled] = useState(true);
  const [mapStyle, setMapStyle] = useState<keyof typeof MAP_STYLES>('outdoors');
  const [showTrails, setShowTrails] = useState(true);
  const [showLifts, setShowLifts] = useState(true);
  const [showPOIs, setShowPOIs] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [viewState, setViewState] = useState({
    longitude: TELLURIDE_CENTER[0],
    latitude: TELLURIDE_CENTER[1],
    zoom: 13.5,
    pitch: 60,
    bearing: 0
  });

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [poiData, setPoiData] = useState<any>(null);

  // Handle map load and apply 3D terrain
  const handleMapLoad = () => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    // According to Mapbox docs, terrain should be added on 'style.load' event
    map.on('style.load', () => {
      // Add 3D terrain source with higher exaggeration for dramatic mountain visualization
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });
      }
      
      // Apply terrain with exaggeration
      if (terrainEnabled) {
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 2.5 });
        console.log('[InteractiveTrailMap] 3D terrain enabled on style load');
      }
    });

    setIsMapLoaded(true);
  };

  // Load all map data (trails, lifts, POIs) after map is loaded and on style/visibility changes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    const map = mapRef.current.getMap();

    // Wait for style to be fully loaded before adding sources
    const addTerrainAndLayers = () => {
      // Re-add terrain source if it doesn't exist (e.g., after style change)
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512,
          maxzoom: 14
        });
        
        // Re-apply terrain if it was enabled
        if (terrainEnabled) {
          map.setTerrain({ source: 'mapbox-dem', exaggeration: 2.5 });
          console.log('[InteractiveTrailMap] Terrain re-applied after style change');
        }
      }

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

        // Toggle trail visibility based on state
        map.setLayoutProperty('telluride-ski-trails', 'visibility', showTrails ? 'visible' : 'none');
        map.setLayoutProperty('telluride-ski-trails-labels', 'visibility', showTrails ? 'visible' : 'none');

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
        // Store POI data for 3D model rendering
        setPoiData(data);

        map.addSource('telluride-pois', {
          type: 'geojson',
          data: data
        });

        // Add POI markers (2D - will be hidden when 3D is active)
        map.addLayer({
          id: 'telluride-pois',
          type: 'circle',
          source: 'telluride-pois',
          layout: {
            'visibility': showPOIs ? 'visible' : 'none'
          },
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
            'text-anchor': 'top',
            'visibility': showPOIs ? 'visible' : 'none'
          },
          paint: {
            'text-color': '#1f2937',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
            'text-halo-blur': 0.5
          },
          minzoom: 14
        });

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
  }, [isMapLoaded, mapStyle, showTrails, showLifts, showPOIs, terrainEnabled]);

  // Handle 3D POI models with Threebox
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || !poiData) return;

    const map = mapRef.current.getMap();

    // Initialize Threebox if not already done
    if (!threeboxRef.current && terrainEnabled) {
      try {
        // @ts-ignore - Threebox is a default CommonJS export
        const ThreeboxConstructor = Threebox.Threebox || Threebox;
        threeboxRef.current = new ThreeboxConstructor(
          map,
          map.getCanvas().getContext('webgl'),
          {
            defaultLights: true,
            enableSelectingObjects: true,
            enableDraggingObjects: false,
            enableRotatingObjects: false,
            enableTooltips: true
          }
        );

        // Add custom 3D layer for POIs
        const customLayer = {
          id: 'custom-threebox-pois',
          type: 'custom',
          renderingMode: '3d',
          onAdd: function() {
            // Layer will be populated by loading models below
          },
          render: function() {
            if (threeboxRef.current) {
              threeboxRef.current.update();
            }
          }
        };

        if (!map.getLayer('custom-threebox-pois')) {
          // @ts-ignore
          map.addLayer(customLayer);
        }

        console.log('[InteractiveTrailMap] ✅ Threebox initialized');
      } catch (error) {
        console.error('[InteractiveTrailMap] Failed to initialize Threebox:', error);
        return;
      }
    }

    // Load 3D models for POIs when 3D is enabled
    if (terrainEnabled && threeboxRef.current && poiData && showPOIs) {
      // Clear existing 3D models
      poi3DModelsRef.current.forEach(model => {
        if (threeboxRef.current && model) {
          threeboxRef.current.remove(model);
        }
      });
      poi3DModelsRef.current = [];

      // Hide 2D POI markers
      if (map.getLayer('telluride-pois')) {
        map.setLayoutProperty('telluride-pois', 'visibility', 'none');
      }

      // Create 3D objects for each POI
      let loadedCount = 0;

      poiData.features.forEach((feature: any) => {
        const poiType = feature.properties.type;
        const config = POI_3D_CONFIGS[poiType as keyof typeof POI_3D_CONFIGS];
        
        if (!config) return; // Skip POI types without 3D configs

        const [lng, lat] = feature.geometry.coordinates;

        try {
          // Create a simple 3D sphere object with coordinates
          // @ts-ignore
          const sphere = threeboxRef.current.sphere({
            radius: config.radius,
            color: config.color,
            material: config.material,
            units: 'meters',
            coordinates: [lng, lat]
          });
          
          // Add tooltip data
          sphere.userData = {
            name: feature.properties.name,
            type: poiType
          };

          // Add to scene
          if (threeboxRef.current) {
            threeboxRef.current.add(sphere);
            poi3DModelsRef.current.push(sphere);
          }

          loadedCount++;
          if (loadedCount % 20 === 0) {
            console.log(`[InteractiveTrailMap] Created ${loadedCount} 3D POI markers`);
          }
        } catch (error) {
          console.error(`[InteractiveTrailMap] Failed to create 3D object for ${feature.properties.name}:`, error);
        }
      });

      if (loadedCount > 0) {
        console.log(`[InteractiveTrailMap] ✅ Created ${loadedCount} 3D POI markers`);
      }
    } else if (!terrainEnabled) {
      // Show 2D POI markers when 3D is disabled
      if (map.getLayer('telluride-pois')) {
        map.setLayoutProperty('telluride-pois', 'visibility', showPOIs ? 'visible' : 'none');
      }

      // Remove 3D models
      poi3DModelsRef.current.forEach(model => {
        if (threeboxRef.current && model) {
          threeboxRef.current.remove(model);
        }
      });
      poi3DModelsRef.current = [];
    }

    // Cleanup function
    return () => {
      if (!terrainEnabled && threeboxRef.current) {
        poi3DModelsRef.current.forEach(model => {
          if (threeboxRef.current && model) {
            threeboxRef.current.remove(model);
          }
        });
        poi3DModelsRef.current = [];
      }
    };
  }, [terrainEnabled, poiData, showPOIs, isMapLoaded]);

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

    const newTerrainState = !terrainEnabled;
    
    if (newTerrainState) {
      // Enable 3D with dramatic exaggeration for mountain visualization
      if (map.getSource('mapbox-dem')) {
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 2.5 });
      }
      map.easeTo({ 
        pitch: 60, 
        duration: 800,
        easing: (t) => t * (2 - t) // easeOutQuad for smooth animation
      });
    } else {
      // Disable 3D
      map.setTerrain(null);
      map.easeTo({ 
        pitch: 0, 
        bearing: 0,
        duration: 800,
        easing: (t) => t * (2 - t)
      });
    }
    setTerrainEnabled(newTerrainState);
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
        mapStyle={MAP_STYLES[mapStyle]}
        style={{ width: '100%', height: '100%' }}
        onLoad={handleMapLoad}
        onClick={handleMapClick}
        maxBounds={TELLURIDE_MAX_BOUNDS}
        minZoom={11}
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

        {/* Map Controls */}
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 space-y-3 max-w-xs">
          <h3 className="font-bold text-neutral-900 text-lg">Telluride Ski Resort</h3>
          
          {/* Map Style Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMapStyle('outdoors')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                mapStyle === 'outdoors'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Terrain
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                mapStyle === 'satellite'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <svg className="w-4 h-4 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Satellite
            </button>
          </div>

          {/* Layer Toggles */}
          <div className="border-t border-neutral-200 pt-3 space-y-2">
            <h4 className="text-xs font-bold text-neutral-700 uppercase tracking-wide mb-2">Map Layers</h4>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600"
              />
              <span className="text-sm text-neutral-700 group-hover:text-neutral-900 font-medium">Ski Trails (448)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={showLifts}
                onChange={(e) => setShowLifts(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600"
              />
              <span className="text-sm text-neutral-700 group-hover:text-neutral-900 font-medium">Lifts & Gondolas (18)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={showPOIs}
                onChange={(e) => setShowPOIs(e.target.checked)}
                className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-600"
              />
              <span className="text-sm text-neutral-700 group-hover:text-neutral-900 font-medium">Facilities (65)</span>
            </label>
          </div>

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

        {/* Control Instructions */}
        {showControls && (
          <div className="absolute top-4 right-16 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl px-4 py-3 z-10 border border-neutral-200 max-w-xs">
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
            className="absolute top-4 right-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full p-2 shadow-xl z-10 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}

        {/* Classic Ski Map Legend - Bottom Right */}
        <div className="absolute bottom-4 right-4 bg-white rounded-xl shadow-2xl p-5 z-10 border-2 border-neutral-800 max-w-xs max-h-[calc(100vh-500px)] overflow-y-auto" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
          <h3 className="text-base font-black text-neutral-900 mb-4 uppercase tracking-wider border-b-2 border-neutral-800 pb-2 sticky top-0 bg-white">
            Trail Map Legend
          </h3>
          
          {showTrails && (
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
          )}

          {showLifts && (
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
          )}

          {showPOIs && (
            <div className="mb-4">
              <h4 className="text-sm font-black text-neutral-900 mb-3 uppercase tracking-wide">Facilities</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#ef4444] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-[10px]">R</span>
                  </div>
                  <span className="text-xs text-neutral-900 font-bold">Restaurant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#3b82f6] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-[10px]">WC</span>
                  </div>
                  <span className="text-xs text-neutral-900 font-bold">Restroom</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#8b5cf6] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-[10px]">L</span>
                  </div>
                  <span className="text-xs text-neutral-900 font-bold">Lift Station</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#10b981] border-2 border-neutral-800 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-white font-black text-[10px]">i</span>
                  </div>
                  <span className="text-xs text-neutral-900 font-bold">Information</span>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t-2 border-neutral-800">
            <p className="text-[10px] text-neutral-600 font-semibold uppercase tracking-wide">
              Map Data © OpenStreetMap
            </p>
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
