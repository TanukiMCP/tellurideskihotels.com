/**
 * Convert OpenStreetMap lift lines to GeoJSON
 * For Telluride ski resort gondolas and chairlifts
 */
import fs from 'fs';

const osmData = JSON.parse(fs.readFileSync('telluride-lifts-raw.json', 'utf8'));

const features = [];

osmData.elements.forEach(element => {
  if (element.type === 'way' && element.geometry) {
    // Convert OSM way to GeoJSON LineString
    const coordinates = element.geometry.map(point => [point.lon, point.lat]);
    
    const feature = {
      type: 'Feature',
      properties: {
        id: element.id,
        name: element.tags?.name || getLiftName(element.tags?.aerialway),
        aerialway: element.tags?.aerialway || 'unknown',
        occupancy: element.tags?.['aerialway:occupancy'],
        capacity: element.tags?.['aerialway:capacity'],
        duration: element.tags?.['aerialway:duration'],
        ...element.tags
      },
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    };
    
    features.push(feature);
  }
});

function getLiftName(type) {
  const names = {
    'gondola': 'Gondola',
    'chair_lift': 'Chairlift',
    'drag_lift': 'Drag Lift',
    'cable_car': 'Cable Car',
    'mixed_lift': 'Mixed Lift'
  };
  return names[type] || 'Lift';
}

const geojson = {
  type: 'FeatureCollection',
  features: features
};

fs.writeFileSync('public/data/telluride-lifts.json', JSON.stringify(geojson, null, 2));

console.log(`✅ Converted ${features.length} lift lines to GeoJSON`);

// Show breakdown
const breakdown = {};
features.forEach(f => {
  const type = f.properties.aerialway;
  breakdown[type] = (breakdown[type] || 0) + 1;
});

console.log('\n📊 Lift Type Breakdown:');
Object.entries(breakdown).forEach(([type, count]) => {
  console.log(`   ${type}: ${count} lifts`);
});

console.log(`\n📁 Saved to: public/data/telluride-lifts.json`);

