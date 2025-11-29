import fs from 'fs';

// Fetch hiking and biking trail data from Overpass API for Telluride area
// Hiking trails: highway=path, highway=footway, route=hiking
// Biking trails: highway=cycleway, route=bicycle, or path with bicycle=yes

const hikingQuery = `
[out:json][timeout:60];
(
  way["highway"~"path|footway"]["bicycle"!="yes"](37.85,-107.95,38.00,-107.70);
  way["route"="hiking"](37.85,-107.95,38.00,-107.70);
  way["highway"="path"]["foot"="yes"](37.85,-107.95,38.00,-107.70);
);
(._;>;);
out geom;
`;

const bikingQuery = `
[out:json][timeout:60];
(
  way["highway"~"cycleway|path"]["bicycle"~"yes|designated"](37.85,-107.95,38.00,-107.70);
  way["route"="bicycle"](37.85,-107.95,38.00,-107.70);
  way["highway"="path"]["bicycle"~"yes|designated"](37.85,-107.95,38.00,-107.70);
);
(._;>;);
out geom;
`;

const url = 'https://overpass-api.de/api/interpreter';

async function fetchTrails(query, trailType) {
  console.log(`🔍 Fetching ${trailType} trail data from OpenStreetMap...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: query
    });
    
    const data = await response.json();
    console.log(`✅ Received ${data.elements.length} ${trailType} trail elements from Overpass API`);
    
    // Save raw data
    fs.writeFileSync(`telluride-${trailType}-trails-raw.json`, JSON.stringify(data, null, 2));
    console.log(`📁 Saved raw data to: telluride-${trailType}-trails-raw.json`);
    
    // Convert to GeoJSON
    const features = [];
    const processedIds = new Set();
    
    data.elements.forEach(element => {
      if (element.type === 'way' && element.geometry && !processedIds.has(element.id)) {
        processedIds.add(element.id);
        
        const coordinates = element.geometry.map(point => [point.lon, point.lat]);
        
        // Determine trail properties
        const tags = element.tags || {};
        const name = tags.name || tags['ref'] || `Unnamed ${trailType} trail`;
        
        // Determine difficulty/grade (if available)
        let difficulty = 'intermediate';
        if (tags.sac_scale) {
          const sac = tags.sac_scale.toLowerCase();
          if (sac.includes('hiking')) difficulty = 'easy';
          else if (sac.includes('mountain')) difficulty = 'intermediate';
          else if (sac.includes('alpine')) difficulty = 'advanced';
        }
        
        const feature = {
          type: 'Feature',
          properties: {
            id: element.id,
            name: name,
            type: trailType,
            difficulty: difficulty,
            surface: tags.surface || null,
            smoothness: tags.smoothness || null,
            description: tags.description || tags.note || null,
            ...tags
          },
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        };
        
        features.push(feature);
      }
    });
    
    const geoJson = {
      type: 'FeatureCollection',
      features: features
    };
    
    const outputPath = `public/data/telluride-${trailType}-trails.json`;
    fs.writeFileSync(outputPath, JSON.stringify(geoJson, null, 2));
    console.log(`✅ Converted ${features.length} ${trailType} trails to GeoJSON`);
    console.log(`📁 Saved to: ${outputPath}`);
    
    // Show sample of trail names
    if (features.length > 0) {
      const namedTrails = features.filter(f => f.properties.name && !f.properties.name.includes('Unnamed'));
      console.log(`   ${namedTrails.length} named trails`);
      if (namedTrails.length > 0) {
        console.log(`   Sample: ${namedTrails.slice(0, 5).map(f => f.properties.name).join(', ')}`);
      }
    }
    
    return features.length;
  } catch (error) {
    console.error(`❌ Error fetching ${trailType} trail data:`, error);
    throw error;
  }
}

// Fetch both types
(async () => {
  try {
    console.log('🚴 Fetching Telluride hiking and biking trails from OpenStreetMap...\n');
    
    const hikingCount = await fetchTrails(hikingQuery, 'hiking');
    console.log('');
    const bikingCount = await fetchTrails(bikingQuery, 'biking');
    
    console.log(`\n✅ Complete! Fetched ${hikingCount} hiking trails and ${bikingCount} biking trails`);
  } catch (error) {
    console.error('❌ Failed to fetch trail data:', error);
    process.exit(1);
  }
})();

