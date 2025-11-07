// Test weather API locally
const testWeatherAPI = async () => {
  const startDate = '2025-01-15';
  const endDate = '2025-01-17';
  
  console.log('Testing weather API...');
  console.log(`URL: http://localhost:4321/api/weather/forecast?startDate=${startDate}&endDate=${endDate}&units=imperial`);
  
  try {
    const response = await fetch(
      `http://localhost:4321/api/weather/forecast?startDate=${startDate}&endDate=${endDate}&units=imperial`
    );
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
};

testWeatherAPI();

