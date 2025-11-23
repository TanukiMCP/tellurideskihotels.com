
const fs = require('fs');

try {
  const rawData = fs.readFileSync('c:/Users/ididi/.cursor/projects/c-Users-ididi-OneDrive-Desktop-tellurideskihotels-com/agent-tools/c4e06198-dde9-4960-a4aa-cb864ce5fb24.txt', 'utf8');
  // The output file might have headers or extra text, so we need to find the JSON part.
  // It looks like the response body starts with { and ends with }
  // But the curl output might contain headers. 
  // Let's try to parse it directly, or find the first {
  
  const jsonStartIndex = rawData.indexOf('{');
  const jsonEndIndex = rawData.lastIndexOf('}');
  
  if (jsonStartIndex === -1 || jsonEndIndex === -1) {
    console.error('Could not find JSON object in file');
    process.exit(1);
  }

  const jsonString = rawData.substring(jsonStartIndex, jsonEndIndex + 1);
  const data = JSON.parse(jsonString);

  if (!data.data) {
    console.error('No data property in JSON');
    console.log(Object.keys(data));
    process.exit(1);
  }

  const hotels = data.data.map(hotel => ({
    id: hotel.id,
    name: hotel.name
  }));

  console.log(`Found ${hotels.length} hotels.`);

  fs.writeFileSync('src/data/telluride-hotels.json', JSON.stringify(hotels, null, 2));
  console.log('Successfully wrote to src/data/telluride-hotels.json');

} catch (error) {
  console.error('Error processing file:', error);
  process.exit(1);
}

