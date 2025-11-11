import fs from 'fs';

// Fetch lift data from Overpass API for Telluride Ski Resort
const query = `
[out:json][timeout:25];
// Telluride Ski Resort area
(
  way["aerialway"]["aerialway"!="station"](37.90,-107.90,37.97,-107.75);
  relation["aerialway"]["aerialway"!="station"](37.90,-107.90,37.97,-107.75);
);
out geom;
`;

const url = 'https://overpass-api.de/api/interpreter';

console.log('🔍 Fetching lift data from OpenStreetMap...');

fetch(url, {
  method: 'POST',
  body: query
})
  .then(res => res.json())
  .then(data => {
    console.log(`✅ Received ${data.elements.length} lift elements from Overpass API`);
    fs.writeFileSync('telluride-lifts-raw.json', JSON.stringify(data, null, 2));
    console.log('📁 Saved raw data to: telluride-lifts-raw.json');
    
    // Convert to GeoJSON
    const features = [];
    
    data.elements.forEach(element => {
      if (element.geometry && element.tags && element.tags.aerialway) {
        const coordinates = element.geometry.map(node => [node.lon, node.lat]);
        
        features.push({
          type: 'Feature',
          properties: {
            name: element.tags.name || `Unnamed ${element.tags.aerialway}`,
            aerialway: element.tags.aerialway,
            capacity: element.tags['aerialway:capacity'] || 'Unknown',
            occupancy: element.tags['aerialway:occupancy'] || 'Unknown',
            duration: element.tags['aerialway:duration'] || 'Unknown',
            description: element.tags.description || 'Ski lift'
          },
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        });
      }
    });
    
    const geoJson = {
      type: 'FeatureCollection',
      features: features
    };
    
    fs.writeFileSync('public/data/telluride-lifts.json', JSON.stringify(geoJson, null, 2));
    console.log(`✅ Converted ${features.length} lifts to GeoJSON`);
    console.log('📁 Saved to: public/data/telluride-lifts.json');
    
    // Breakdown by type
    const typeCounts = features.reduce((acc, feature) => {
      const type = feature.properties.aerialway;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 Lift Type Breakdown:');
    for (const type in typeCounts) {
      console.log(`   ${type}: ${typeCounts[type]}`);
    }
  })
  .catch(err => {
    console.error('❌ Error fetching lift data:', err);
    process.exit(1);
  });

