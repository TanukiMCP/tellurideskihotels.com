import fs from 'fs';

// Fetch POI data from Overpass API for Telluride Ski Resort
const query = `
[out:json][timeout:25];
// Telluride Ski Resort area - POIs
(
  node["amenity"~"restaurant|cafe|toilets|parking"](37.90,-107.90,37.97,-107.75);
  node["tourism"~"information|viewpoint"](37.90,-107.90,37.97,-107.75);
  node["aerialway"="station"](37.90,-107.90,37.97,-107.75);
  node["building"="restaurant"](37.90,-107.90,37.97,-107.75);
);
out;
`;

const url = 'https://overpass-api.de/api/interpreter';

console.log('🔍 Fetching POI data from OpenStreetMap...');

fetch(url, {
  method: 'POST',
  body: query
})
  .then(res => res.json())
  .then(data => {
    console.log(`✅ Received ${data.elements.length} POI elements from Overpass API`);
    fs.writeFileSync('telluride-pois-raw.json', JSON.stringify(data, null, 2));
    console.log('📁 Saved raw data to: telluride-pois-raw.json');
    
    // Convert to GeoJSON
    const features = [];
    
    data.elements.forEach(element => {
      if (element.lat && element.lon && element.tags) {
        // Determine POI type
        let type = 'other';
        let name = 'Unnamed location';
        
        if (element.tags.amenity === 'restaurant' || element.tags.building === 'restaurant') {
          type = 'restaurant';
          name = element.tags.name || 'Restaurant';
        } else if (element.tags.amenity === 'cafe') {
          type = 'cafe';
          name = element.tags.name || 'Cafe';
        } else if (element.tags.amenity === 'toilets') {
          type = 'restroom';
          name = 'Restroom';
        } else if (element.tags.aerialway === 'station') {
          type = 'lift-station';
          name = element.tags.name || 'Lift Station';
        } else if (element.tags.tourism === 'information') {
          type = 'information';
          name = element.tags.name || 'Information';
        } else if (element.tags.tourism === 'viewpoint') {
          type = 'viewpoint';
          name = element.tags.name || 'Viewpoint';
        } else if (element.tags.amenity === 'parking') {
          type = 'parking';
          name = element.tags.name || 'Parking';
        }
        
        features.push({
          type: 'Feature',
          properties: {
            name: name,
            type: type,
            amenity: element.tags.amenity || null,
            tourism: element.tags.tourism || null,
            description: element.tags.description || null
          },
          geometry: {
            type: 'Point',
            coordinates: [element.lon, element.lat]
          }
        });
      }
    });
    
    const geoJson = {
      type: 'FeatureCollection',
      features: features
    };
    
    fs.writeFileSync('public/data/telluride-pois.json', JSON.stringify(geoJson, null, 2));
    console.log(`✅ Converted ${features.length} POIs to GeoJSON`);
    console.log('📁 Saved to: public/data/telluride-pois.json');
    
    // Breakdown by type
    const typeCounts = features.reduce((acc, feature) => {
      const type = feature.properties.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📊 POI Type Breakdown:');
    for (const type in typeCounts) {
      console.log(`   ${type}: ${typeCounts[type]}`);
    }
  })
  .catch(err => {
    console.error('❌ Error fetching POI data:', err);
    process.exit(1);
  });

