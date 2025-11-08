# liteAPI Endpoints Audit

## Endpoints Found in Codebase

### 1. Hotel Search - `/data/hotels`
**File:** `src/lib/liteapi/hotels.ts:28`
**Method:** GET
**Query Params:**
- `cityName` (string)
- `countryCode` (string)
- `latitude` (number, optional)
- `longitude` (number, optional)
- `radius` (number, optional)
- `limit` (number, optional)
- `offset` (number, optional)

**Expected Response:**
```typescript
{
  hotelIds: string[]
}
```

**Curl Command:**
```bash
curl -X GET "https://api.liteapi.travel/v3.0/data/hotels?cityName=Telluride&countryCode=US&limit=50" \
  -H "X-API-Key: prod_b6b03dde-18d7-47cb-88ca-fc40347d02ab"
```

---

### 2. Hotel Details - `/data/hotel`
**File:** `src/lib/liteapi/hotels.ts:92`
**Method:** GET
**Query Params:**
- `hotelId` (string, required)

**Expected Response:**
```typescript
{
  data: {
    id: string
    name: string
    starRating: number
    rating: number
    reviewCount: number
    address: string
    city: string
    state: string
    postalCode: string
    country: string
    location: {
      latitude: number
      longitude: number
    }
    hotelImages: Array<{
      defaultImage: boolean
      url: string
      caption: string
    }>
    hotelFacilities: string[]
    hotelDescription: string
  }
}
```

**Curl Command:**
```bash
curl -X GET "https://api.liteapi.travel/v3.0/data/hotel?hotelId=lp21ee2" \
  -H "X-API-Key: prod_b6b03dde-18d7-47cb-88ca-fc40347d02ab"
```

---

### 3. Hotel Rates - `/hotels/rates`
**File:** `src/lib/liteapi/rates.ts:175`
**Method:** POST
**Request Body:**
```typescript
{
  hotelIds: string[]
  checkin: string  // YYYY-MM-DD
  checkout: string  // YYYY-MM-DD
  occupancies: Array<{
    adults: number
    children: number[]  // Array of ages
  }>
  currency: string
  guestNationality: string
  margin: number
  stream?: boolean  // Enable streaming
}
```

**Expected Response:**
```typescript
{
  data: Array<{
    hotelId: string
    roomTypes: Array<{
      roomTypeId: string
      name: string
      offerId: string
      rates: Array<{
        rateId: string
        name: string
        boardName: string
        retailRate: {
          total: [{
            amount: number
            currency: string
          }]
          suggestedSellingPrice: [{
            amount: number
            currency: string
          }]
        }
        cancellationPolicies: {
          cancelPolicyInfos: Array<{
            refundType: string
            text: string
          }>
          refundableTag: string
          hotelRemarks: string[]
        }
      }>
      bedTypes: string[]
      maxOccupancy: number
      amenities: string[]
    }>
  }>
}
```

**Curl Command:**
```bash
curl -X POST "https://api.liteapi.travel/v3.0/hotels/rates" \
  -H "X-API-Key: prod_b6b03dde-18d7-47cb-88ca-fc40347d02ab" \
  -H "Content-Type: application/json" \
  -d '{
    "hotelIds": ["lp21ee2"],
    "checkin": "2025-11-15",
    "checkout": "2025-11-22",
    "occupancies": [{"adults": 2, "children": []}],
    "currency": "USD",
    "guestNationality": "US",
    "margin": 15
  }'
```

---

### 4. Prebook - `/rates/prebook`
**File:** `src/lib/liteapi/booking.ts:20`
**Method:** POST
**Request Body:**
```typescript
{
  offerId: string
  usePaymentSdk: boolean
}
```

**Expected Response:**
```typescript
{
  data: {
    prebookId: string
    hotelId: string
    rateId: string
    checkin: string
    checkout: string
    total: {
      amount: number
      currency: string
    }
    expiresAt: string
    secretKey: string  // Only when usePaymentSdk: true
    transactionId: string  // Only when usePaymentSdk: true
  }
}
```

**Curl Command:**
```bash
# First need to get an offerId from rates search, then:
curl -X POST "https://api.liteapi.travel/v3.0/rates/prebook" \
  -H "X-API-Key: prod_b6b03dde-18d7-47cb-88ca-fc40347d02ab" \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "OFFER_ID_FROM_RATES",
    "usePaymentSdk": true
  }'
```

---

### 5. Confirm Booking - `/rates/book`
**File:** `src/lib/liteapi/booking.ts:63`
**Method:** POST
**Request Body:**
```typescript
{
  prebookId: string
  payment: {
    method: "TRANSACTION_ID"
    transactionId: string
  }
}
```

**Expected Response:**
```typescript
{
  data: {
    bookingId: string
    confirmationNumber: string
    status: string
    hotelId: string
    checkin: string
    checkout: string
    total: {
      amount: number
      currency: string
    }
  }
}
```

**Curl Command:**
```bash
# After prebook and payment:
curl -X POST "https://api.liteapi.travel/v3.0/rates/book" \
  -H "X-API-Key: prod_b6b03dde-18d7-47cb-88ca-fc40347d02ab" \
  -H "Content-Type: application/json" \
  -d '{
    "prebookId": "PREBOOK_ID",
    "payment": {
      "method": "TRANSACTION_ID",
      "transactionId": "TRANSACTION_ID_FROM_SDK"
    }
  }'
```

---

### 6. Get Booking - `/bookings/{bookingId}`
**File:** `src/lib/liteapi/booking.ts:82`
**Method:** GET
**Path Params:**
- `bookingId` (string, required)

**Curl Command:**
```bash
curl -X GET "https://api.liteapi.travel/v3.0/bookings/BOOKING_ID" \
  -H "X-API-Key: prod_b6b03dde-18d7-47cb-88ca-fc40347d02ab"
```

---

### 7. List Bookings - `/bookings`
**File:** `src/lib/liteapi/booking.ts:88`
**Method:** GET

**Curl Command:**
```bash
curl -X GET "https://api.liteapi.travel/v3.0/bookings" \
  -H "X-API-Key: prod_b6b03dde-18d7-47cb-88ca-fc40347d02ab"
```

---

### 8. Cancel Booking - `/bookings/{bookingId}`
**File:** `src/lib/liteapi/booking.ts:94`
**Method:** PUT
**Path Params:**
- `bookingId` (string, required)
**Request Body:**
```typescript
{
  status: "cancelled"
}
```

**Curl Command:**
```bash
curl -X PUT "https://api.liteapi.travel/v3.0/bookings/BOOKING_ID" \
  -H "X-API-Key: prod_b6b03dde-18d7-47cb-88ca-fc40347d02ab" \
  -H "Content-Type: application/json" \
  -d '{"status": "cancelled"}'
```

---

### 9. Amend Guest Name - `/bookings/{bookingId}/amend`
**File:** `src/lib/liteapi/booking.ts:101`
**Method:** PUT
**Path Params:**
- `bookingId` (string, required)
**Request Body:**
```typescript
{
  guestInfo: {
    firstName: string
    lastName: string
  }
}
```

**Curl Command:**
```bash
curl -X PUT "https://api.liteapi.travel/v3.0/bookings/BOOKING_ID/amend" \
  -H "X-API-Key: prod_b6b03dde-18d7-47cb-88ca-fc40347d02ab" \
  -H "Content-Type: application/json" \
  -d '{
    "guestInfo": {
      "firstName": "John",
      "lastName": "Doe"
    }
  }'
```

---

### 10. Get Hotel Addons - `/data/hotel/{hotelId}/addons`
**File:** `src/lib/liteapi/addons.ts:9`
**Method:** GET
**Path Params:**
- `hotelId` (string, required)

**Curl Command:**
```bash
curl -X GET "https://api.liteapi.travel/v3.0/data/hotel/lp21ee2/addons" \
  -H "X-API-Key: prod_b6b03dde-18d7-47cb-88ca-fc40347d02ab"
```

---

### 11. Weather Data - `/data/weather`
**File:** `src/lib/liteapi/weather.ts:195`
**Method:** GET
**Query Params:**
- `latitude` (number, required)
- `longitude` (number, required)
- `startDate` (string, YYYY-MM-DD, required) - Must be tomorrow or later
- `endDate` (string, YYYY-MM-DD, required)
- `units` (string, 'metric' or 'imperial')

**Expected Response:**
```typescript
{
  weatherData: Array<{
    detailedWeatherData: {
      lat: number
      lon: number
      timezone: string
      timezone_offset: number
      daily: Array<{
        date: string
        temp: {
          day: number
          min: number
          max: number
          night: number
          eve: number
          morn: number
        }
        feels_like: {
          day: number
          night: number
          eve: number
          morn: number
        }
        pressure: number
        humidity: number
        wind_speed: number
        wind_deg: number
        weather: Array<{
          id: number
          main: string
          description: string
          icon: string
        }>
        clouds: number
        pop: number
        summary: string
      }>
    }
  }>
}
```

**Curl Command:**
```bash
curl -X GET "https://api.liteapi.travel/v3.0/data/weather?latitude=37.9375&longitude=-107.8123&startDate=2025-11-09&endDate=2025-11-12&units=imperial" \
  -H "X-API-Key: prod_b6b03dde-18d7-47cb-88ca-fc40347d02ab"
```

---

## Testing Status

- ✅ Weather API - Tested and verified (uses tomorrow+ dates, returns detailedWeatherData.daily[])
- ❌ Hotel Search - **MISMATCH FOUND** - Returns `data[]` with full hotel objects, NOT `hotelIds[]`
- ✅ Hotel Details - Tested and verified (correct structure)
- ✅ Hotel Rates - Tested and verified (correct structure)
- ⏳ Prebook - Pending (requires offerId from rates)
- ⏳ Confirm Booking - Pending (requires prebookId)
- ⏳ Get Booking - Pending (requires bookingId)
- ⏳ List Bookings - Pending
- ⏳ Cancel Booking - Pending (requires bookingId)
- ⏳ Amend Guest Name - Pending (requires bookingId)
- ⏳ Get Hotel Addons - Pending

---

## CRITICAL ISSUE FOUND

### Hotel Search Endpoint Returns Different Structure

**Current Code Assumption (WRONG):**
```typescript
const response = await liteAPIClient<any>(endpoint);
const hotelIds = response.hotelIds || [];
```

**Actual API Response:**
```json
{
  "data": [
    {
      "id": "lp21ee2",
      "name": "The Peaks Resort and Spa",
      "hotelDescription": "...",
      "latitude": 37.93886,
      "longitude": -107.84807,
      "stars": 3,
      "rating": 9,
      ...full hotel object...
    }
  ]
}
```

**Impact:** The code is trying to extract `hotelIds` array, but the API returns full hotel objects in `data[]` array. This causes the code to then fetch details for each ID, which is redundant since we already have the full objects.

