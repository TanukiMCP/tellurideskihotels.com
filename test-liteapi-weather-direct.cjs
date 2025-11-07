// Test liteAPI weather endpoint directly
const fs = require('fs');

const testLiteAPIWeather = async () => {
  // Read .env file manually
  let LITEAPI_KEY = '';
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    const match = envContent.match(/LITEAPI_PRIVATE_KEY=(.+)/);
    if (match) {
      LITEAPI_KEY = match[1].trim();
    }
  } catch (e) {
    console.error('Could not read .env file');
  }
  
  if (!LITEAPI_KEY) {
    console.error('LITEAPI_PRIVATE_KEY not found');
    return;
  }
  
  // Use TOMORROW and future dates (to avoid timezone issues)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 6); // 7 days total
  
  const formatDate = (date) => date.toISOString().split('T')[0];
  
  const params = new URLSearchParams({
    latitude: '37.9375',
    longitude: '-107.8123',
    startDate: formatDate(tomorrow),
    endDate: formatDate(dayAfter),
    units: 'imperial',
  });
  
  const url = `https://api.liteapi.travel/v3.0/data/weather?${params.toString()}`;
  
  console.log('Testing liteAPI weather endpoint directly...');
  console.log('URL:', url);
  console.log('Dates:', formatDate(tomorrow), 'to', formatDate(dayAfter));
  
  try {
    const response = await fetch(url, {
      headers: {
        'X-API-Key': LITEAPI_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    
    const text = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('\n✅ SUCCESS! Full response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('\n❌ FAILED! Status:', response.status);
      console.error('Response:', text);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testLiteAPIWeather();
