// Debug weather API
const testWeatherAPI = async () => {
  const url = new URL('http://localhost:4321/api/weather/forecast');
  url.searchParams.set('startDate', '2025-01-15');
  url.searchParams.set('endDate', '2025-01-17');
  url.searchParams.set('units', 'imperial');
  
  console.log('Testing weather API...');
  console.log('Full URL:', url.toString());
  
  try {
    const response = await fetch(url.toString());
    
    console.log('Response status:', response.status);
    
    const text = await response.text();
    console.log('Response text:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('Parsed data:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Could not parse as JSON');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
};

testWeatherAPI();

