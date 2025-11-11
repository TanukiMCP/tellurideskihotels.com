/**
 * Convert OpenStreetMap POIs (lifts, restaurants, facilities) to GeoJSON
 * For Telluride ski resort amenities
 */
import fs from 'fs';

const osmData = JSON.parse(fs.readFileSync('telluride-pois-raw.json', 'utf8'));

const features = [];
const liftLines = [];

osmData.elements.forEach(element => {
  if (element.type === 'node') {
    // Convert OSM node to GeoJSON Point
    const feature = {
      type: 'Feature',
      properties: {
        id: element.id,
        name: element.tags?.name || getDefaultName(element.tags),
        type: getFeatureType(element.tags),
        ...element.tags
      },
      geometry: {
        type: 'Point',
        coordinates: [element.lon, element.lat]
      }
    };
    
    features.push(feature);
  } else if (element.type === 'way' && element.geometry) {
    // Lift lines (aerialways)
    const coordinates = element.geometry.map(point => [point.lon, point.lat]);
    
    const feature = {
      type: 'Feature',
      properties: {
        id: element.id,
        name: element.tags?.name || 'Lift',
        type: 'lift',
        aerialway: element.tags?.aerialway || 'unknown',
        ...element.tags
      },
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    };
    
    liftLines.push(feature);
  }
});

function getFeatureType(tags) {
  if (tags.aerialway === 'station') return 'lift-station';
  if (tags.amenity === 'restaurant') return 'restaurant';
  if (tags.amenity === 'cafe') return 'cafe';
  if (tags.amenity === 'toilets') return 'restroom';
  if (tags.emergency === 'phone') return 'emergency-phone';
  if (tags.tourism === 'information') return 'information';
  if (tags.tourism === 'viewpoint') return 'viewpoint';
  return 'other';
}

function getDefaultName(tags) {
  const type = getFeatureType(tags);
  const names = {
    'lift-station': 'Lift Station',
    'restaurant': 'Restaurant',
    'cafe': 'Cafe',
    'restroom': 'Restroom',
    'emergency-phone': 'Emergency Phone',
    'information': 'Information',
    'viewpoint': 'Viewpoint'
  };
  return names[type] || 'POI';
}

// Save POI points
const poisGeoJSON = {
  type: 'FeatureCollection',
  features: features
};

fs.writeFileSync('public/data/telluride-pois.json', JSON.stringify(poisGeoJSON, null, 2));

// Save lift lines separately
const liftsGeoJSON = {
  type: 'FeatureCollection',
  features: liftLines
};

fs.writeFileSync('public/data/telluride-lifts.json', JSON.stringify(liftsGeoJSON, null, 2));

console.log(`✅ Converted ${features.length} POIs to GeoJSON`);
console.log(`✅ Converted ${liftLines.length} lift lines to GeoJSON`);

// Show breakdown
const breakdown = {};
features.forEach(f => {
  const type = f.properties.type;
  breakdown[type] = (breakdown[type] || 0) + 1;
});

console.log('\n📊 POI Breakdown:');
Object.entries(breakdown).forEach(([type, count]) => {
  console.log(`   ${type}: ${count}`);
});

console.log(`\n📁 Saved to:`);
console.log(`   public/data/telluride-pois.json`);
console.log(`   public/data/telluride-lifts.json`);

