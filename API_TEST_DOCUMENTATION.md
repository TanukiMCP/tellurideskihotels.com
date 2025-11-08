# API Testing Documentation

## Ì∑™ API Response Structure Tests

### 1. Viator Activities API

**Endpoint**: `/api/viator/search`
**Method**: GET
**Parameters**: 
- `searchTerm` (optional): Search query
- `sortOrder` (optional): TOP_SELLERS | REVIEW_AVG_RATING_D | PRICE_FROM_LOW | PRICE_FROM_HIGH
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Results per page (default: 20)
- `currencyCode` (optional): Currency code (default: USD)

**Example Request**:
```bash
curl -X GET "http://localhost:4321/api/viator/search?searchTerm=Telluride&pageSize=5"
```

**Expected Response Structure**:
```json
{
  "products": [
    {
      "productCode": "string",
      "productTitle": "string",
      "productUrl": "string",
      "productUrlName": "string",
      "duration": "string",
      "description": "string",
      "shortDescription": "string",
      "images": [
        {
          "url": "string",
          "caption": "string",
          "isCover": boolean
        }
      ],
      "price": {
        "price": number,
        "currency": "string",
        "priceFormatted": "string"
      },
      "reviews": {
        "totalReviews": number,
        "combinedAverageRating": number
      },
      "tags": [
        {
          "tag": "string",
          "tagId": number
        }
      ]
    }
  ],
  "totalCount": number,
  "page": number,
  "pageSize": number
}
```

---

### 2. Viator Product Details API

**Endpoint**: `/api/viator/product/{productCode}`
**Method**: GET
**Parameters**: 
- `productCode` (required): Viator product code
- `currencyCode` (optional): Currency code (default: USD)

**Example Request**:
```bash
curl -X GET "http://localhost:4321/api/viator/product/12345ABC?currencyCode=USD"
```

**Expected Response Structure**:
```json
{
  "product": {
    "productCode": "string",
    "productTitle": "string",
    "productUrl": "string",
    "description": "string",
    "images": [...],
    "price": {...},
    "reviews": {...}
  }
}
```

---

### 3. Viator Featured Activities API

**Endpoint**: `/api/viator/featured`
**Method**: GET
**Parameters**: 
- `limit` (optional): Number of activities (default: 6)

**Example Request**:
```bash
curl -X GET "http://localhost:4321/api/viator/featured?limit=6"
```

**Expected Response Structure**:
```json
{
  "activities": [
    {
      "productCode": "string",
      "productTitle": "string",
      "productUrl": "string",
      "images": [...],
      "price": {...},
      "reviews": {...}
    }
  ]
}
```

---

### 4. Ski Conditions API

**Endpoint**: `/api/ski-conditions`
**Method**: GET
**Parameters**: None

**Example Request**:
```bash
curl -X GET "http://localhost:4321/api/ski-conditions"
```

**Expected Response Structure**:
```json
{
  "resortName": "Telluride Ski Resort",
  "timestamp": "2025-11-08T12:00:00.000Z",
  "conditions": {
    "newSnow24hr": number,
    "newSnow48hr": number,
    "newSnow72hr": number,
    "baseDepthMin": number,
    "baseDepthMax": number,
    "surfaceCondition": "string",
    "temperatureHigh": number,
    "temperatureLow": number
  },
  "trails": {
    "total": number,
    "open": number,
    "percentOpen": number
  },
  "lifts": {
    "total": number,
    "open": number,
    "percentOpen": number
  },
  "terrainParks": {
    "total": number,
    "open": number
  }
}
```

---

## Ì¥ç Type Safety

All APIs have TypeScript types defined in:
- `src/lib/viator/types.ts` - Viator API types
- `src/lib/snocountry/types.ts` - Ski conditions types

## ‚úÖ Validation Results

```
‚úì Viator Product Structure: VALIDATED
‚úì Ski Conditions Structure: VALIDATED
‚úì TypeScript Types: COMPILED
‚úì API Endpoints: DEFINED
‚úì Error Handling: IMPLEMENTED
‚úì Caching Strategy: CONFIGURED
```

## Ì∫Ä Testing in Development

To test locally:

1. Start dev server:
   ```bash
   npm run dev
   ```

2. Test endpoints:
   ```bash
   # Viator search
   curl "http://localhost:4321/api/viator/search?searchTerm=ski"
   
   # Ski conditions
   curl "http://localhost:4321/api/ski-conditions"
   
   # Featured activities
   curl "http://localhost:4321/api/viator/featured"
   ```

## Ì≥ä Production Testing

Once deployed to Netlify:

```bash
# Viator search
curl "https://tellurideskihotels.com/api/viator/search?searchTerm=ski"

# Ski conditions
curl "https://tellurideskihotels.com/api/ski-conditions"

# Featured activities
curl "https://tellurideskihotels.com/api/viator/featured"
```

## Ì¥ê Environment Variables Required

- `VIATOR_API_KEY` - Viator Partner API key
- `VIATOR_BASE_URL` - Viator API base URL (https://api.viator.com/partner)

## Ì≥ù Notes

- All endpoints return JSON
- Caching: 1 hour (s-maxage=3600), 2 hour stale-while-revalidate
- Error responses include `error` and `message` fields
- All responses properly typed with TypeScript
