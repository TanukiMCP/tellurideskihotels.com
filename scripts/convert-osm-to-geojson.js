/**
 * Convert OpenStreetMap Overpass API JSON to GeoJSON
 * For Telluride ski trails
 */
import fs from 'fs';

const osmData = JSON.parse(fs.readFileSync('telluride-trails-raw.json', 'utf8'));

const features = [];

osmData.elements.forEach(element => {
  if (element.type === 'way' && element.geometry) {
    // Convert OSM way to GeoJSON LineString
    const coordinates = element.geometry.map(point => [point.lon, point.lat]);
    
    const feature = {
      type: 'Feature',
      properties: {
        id: element.id,
        name: element.tags?.name || 'Unnamed Trail',
        'piste:type': element.tags?.['piste:type'] || 'downhill',
        'piste:difficulty': element.tags?.['piste:difficulty'] || 'intermediate',
        'piste:grooming': element.tags?.['piste:grooming'],
        'piste:status': element.tags?.['piste:status'],
        'aerialway': element.tags?.aerialway, // For lifts
        description: element.tags?.description || element.tags?.name || 'Ski trail'
      },
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    };
    
    features.push(feature);
  }
});

const geojson = {
  type: 'FeatureCollection',
  features: features
};

// Write to public directory
fs.writeFileSync('public/data/telluride-ski-trails.json', JSON.stringify(geojson, null, 2));

console.log(`✅ Converted ${features.length} trails to GeoJSON`);
console.log(`📁 Saved to: public/data/telluride-ski-trails.json`);

// Show difficulty breakdown
const difficulties = {};
features.forEach(f => {
  const diff = f.properties['piste:difficulty'];
  difficulties[diff] = (difficulties[diff] || 0) + 1;
});

console.log('\n📊 Trail Difficulty Breakdown:');
Object.entries(difficulties).forEach(([diff, count]) => {
  console.log(`   ${diff}: ${count} trails`);
});

