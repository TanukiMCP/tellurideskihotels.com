#!/usr/bin/env node
/**
 * Download OpenStreetMap tiles + Terrain tiles for Telluride Ski Resort
 * Uses free public tile servers and creates a local tile cache
 * Includes 3D terrain (DEM) tiles for elevation data
 */

import { createWriteStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TILES_DIR = join(__dirname, '../public/tiles');

// Telluride Ski Resort bounds
const BOUNDS = {
  west: -107.95,
  south: 37.88,
  east: -107.70,
  north: 38.00
};

// Zoom levels to download
const MIN_ZOOM = 11;
const MAX_ZOOM = 16;
const TERRAIN_MIN_ZOOM = 10;
const TERRAIN_MAX_ZOOM = 14;

// Tile servers
const TILE_SERVER = 'https://tile.openstreetmap.org';
// Terrain tiles from Mapzen/Terrarium (free, open source)
const TERRAIN_SERVER = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';

// Convert lat/lon to tile coordinates
function latLonToTile(lat, lon, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lon + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return { x, y, z: zoom };
}

// Calculate tiles needed for bounds
function getTilesForBounds(bounds, zoom) {
  const topLeft = latLonToTile(bounds.north, bounds.west, zoom);
  const bottomRight = latLonToTile(bounds.south, bounds.east, zoom);
  
  const tiles = [];
  for (let x = topLeft.x; x <= bottomRight.x; x++) {
    for (let y = topLeft.y; y <= bottomRight.y; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  return tiles;
}

// Download a single tile with retry and rate limiting
async function downloadTile(tile, type = 'osm', retries = 3) {
  const { x, y, z } = tile;
  
  let url, dir, filepath;
  
  if (type === 'terrain') {
    url = `${TERRAIN_SERVER}/${z}/${x}/${y}.png`;
    dir = join(TILES_DIR, 'terrain', z.toString(), x.toString());
    filepath = join(dir, `${y}.png`);
  } else {
    url = `${TILE_SERVER}/${z}/${x}/${y}.png`;
    dir = join(TILES_DIR, 'osm', z.toString(), x.toString());
    filepath = join(dir, `${y}.png`);
  }
  
  // Skip if already exists
  if (existsSync(filepath)) {
    return { success: true, cached: true };
  }
  
  // Create directory
  mkdirSync(dir, { recursive: true });
  
  return new Promise((resolve) => {
    const file = createWriteStream(filepath);
    
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, {
      headers: {
        'User-Agent': 'TellurideSki-PWA/1.0'
      }
    }, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve({ success: true, cached: false });
        });
      } else if (response.statusCode === 429 && retries > 0) {
        // Rate limited, wait and retry
        file.close();
        setTimeout(() => {
          downloadTile(tile, type, retries - 1).then(resolve);
        }, 2000);
      } else {
        file.close();
        resolve({ success: false, status: response.statusCode });
      }
    }).on('error', (err) => {
      file.close();
      if (retries > 0) {
        setTimeout(() => {
          downloadTile(tile, type, retries - 1).then(resolve);
        }, 1000);
      } else {
        resolve({ success: false, error: err.message });
      }
    });
  });
}

// Main download function
async function downloadAllTiles() {
  console.log('🗺️  Downloading tiles for Telluride Ski Resort...\n');
  console.log(`📍 Bounds: ${BOUNDS.west}, ${BOUNDS.south} to ${BOUNDS.east}, ${BOUNDS.north}\n`);
  
  // ===== PART 1: Base Map Tiles =====
  console.log('🗺️  PART 1: Downloading base map tiles...');
  console.log(`🔍 Zoom levels: ${MIN_ZOOM}-${MAX_ZOOM}\n`);
  
  let allBaseTiles = [];
  for (let zoom = MIN_ZOOM; zoom <= MAX_ZOOM; zoom++) {
    const tiles = getTilesForBounds(BOUNDS, zoom);
    allBaseTiles = allBaseTiles.concat(tiles);
  }
  
  console.log(`📦 Base map tiles: ${allBaseTiles.length}\n`);
  
  let downloaded = 0;
  let cached = 0;
  let failed = 0;
  
  for (const tile of allBaseTiles) {
    const result = await downloadTile(tile, 'osm');
    
    if (result.success) {
      if (result.cached) cached++;
      else downloaded++;
    } else {
      failed++;
    }
    
    if ((downloaded + cached + failed) % 50 === 0) {
      const total = downloaded + cached + failed;
      const percent = ((total / allBaseTiles.length) * 100).toFixed(1);
      console.log(`   Progress: ${total}/${allBaseTiles.length} (${percent}%) - Downloaded: ${downloaded}, Cached: ${cached}, Failed: ${failed}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\n✅ Base map complete! Downloaded: ${downloaded}, Cached: ${cached}, Failed: ${failed}\n`);
  
  // ===== PART 2: Terrain/DEM Tiles for 3D =====
  console.log('⛰️  PART 2: Downloading terrain tiles for 3D...');
  console.log(`🔍 Zoom levels: ${TERRAIN_MIN_ZOOM}-${TERRAIN_MAX_ZOOM}\n`);
  
  let allTerrainTiles = [];
  for (let zoom = TERRAIN_MIN_ZOOM; zoom <= TERRAIN_MAX_ZOOM; zoom++) {
    const tiles = getTilesForBounds(BOUNDS, zoom);
    allTerrainTiles = allTerrainTiles.concat(tiles);
  }
  
  console.log(`📦 Terrain tiles: ${allTerrainTiles.length}\n`);
  
  let tDownloaded = 0;
  let tCached = 0;
  let tFailed = 0;
  
  for (const tile of allTerrainTiles) {
    const result = await downloadTile(tile, 'terrain');
    
    if (result.success) {
      if (result.cached) tCached++;
      else tDownloaded++;
    } else {
      tFailed++;
    }
    
    if ((tDownloaded + tCached + tFailed) % 20 === 0) {
      const total = tDownloaded + tCached + tFailed;
      const percent = ((total / allTerrainTiles.length) * 100).toFixed(1);
      console.log(`   Progress: ${total}/${allTerrainTiles.length} (${percent}%) - Downloaded: ${tDownloaded}, Cached: ${tCached}, Failed: ${tFailed}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  
  console.log(`\n✅ Terrain tiles complete! Downloaded: ${tDownloaded}, Cached: ${tCached}, Failed: ${tFailed}\n`);
  
  // ===== Summary =====
  console.log('=' .repeat(60));
  console.log('🎉 ALL DOWNLOADS COMPLETE!\n');
  console.log('📊 Final Summary:');
  console.log(`   Base Map Tiles: ${downloaded + cached} (${failed} failed)`);
  console.log(`   Terrain Tiles: ${tDownloaded + tCached} (${tFailed} failed)`);
  console.log(`   Total: ${downloaded + cached + tDownloaded + tCached} tiles\n`);
  
  // Create metadata files
  const baseMetadata = {
    name: 'Telluride Ski Resort - Base Map',
    description: 'Offline base map tiles for Telluride ski area',
    version: '1.0.0',
    attribution: '© OpenStreetMap contributors',
    bounds: [BOUNDS.west, BOUNDS.south, BOUNDS.east, BOUNDS.north],
    center: [(BOUNDS.west + BOUNDS.east) / 2, (BOUNDS.south + BOUNDS.north) / 2, 13],
    minzoom: MIN_ZOOM,
    maxzoom: MAX_ZOOM,
    format: 'png',
    type: 'baselayer'
  };
  
  const terrainMetadata = {
    name: 'Telluride Ski Resort - Terrain',
    description: 'Offline terrain/DEM tiles for 3D visualization',
    version: '1.0.0',
    attribution: 'Mapzen Terrarium',
    bounds: [BOUNDS.west, BOUNDS.south, BOUNDS.east, BOUNDS.north],
    center: [(BOUNDS.west + BOUNDS.east) / 2, (BOUNDS.south + BOUNDS.north) / 2, 12],
    minzoom: TERRAIN_MIN_ZOOM,
    maxzoom: TERRAIN_MAX_ZOOM,
    format: 'png',
    type: 'raster-dem',
    encoding: 'terrarium'
  };
  
  mkdirSync(join(TILES_DIR, 'osm'), { recursive: true });
  mkdirSync(join(TILES_DIR, 'terrain'), { recursive: true });
  
  writeFileSync(
    join(TILES_DIR, 'osm', 'metadata.json'),
    JSON.stringify(baseMetadata, null, 2)
  );
  
  writeFileSync(
    join(TILES_DIR, 'terrain', 'metadata.json'),
    JSON.stringify(terrainMetadata, null, 2)
  );
  
  console.log('💾 Metadata files saved');
  console.log(`📁 Base tiles: ${join(TILES_DIR, 'osm')}`);
  console.log(`📁 Terrain tiles: ${join(TILES_DIR, 'terrain')}\n`);
  console.log('=' .repeat(60));
  console.log('🎉 Ready for offline 3D use!');
  console.log('\n💡 Next: Update the map component to use these local tiles');
}

// Ensure tiles directory exists
if (!existsSync(TILES_DIR)) {
  mkdirSync(TILES_DIR, { recursive: true });
}

// Run the download
downloadAllTiles().catch(console.error);
