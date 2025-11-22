
const fs = require('fs');

try {
  const data = fs.readFileSync('liteapi_response.json', 'utf8');
  const json = JSON.parse(data);
  
  const hotels = [];
  
  // Handle different potential response structures
  const list = json.data || json.hotels || (Array.isArray(json) ? json : []);
  
  if (Array.isArray(list)) {
    list.forEach(h => {
      if (h.id || h.hotel_id) {
        hotels.push({
          id: h.id || h.hotel_id,
          name: h.name
        });
      }
    });
  }
  
  console.log(JSON.stringify(hotels, null, 2));
} catch (e) {
  console.error("Error parsing JSON:", e.message);
}

