#!/bin/bash

# Test LiteAPI Prebook endpoint with actual API
API_KEY="sand_cae10031-5457-4973-9404-4ec0a6c31896"
BASE_URL="https://book.liteapi.travel/v3.0"

echo "=== Testing LiteAPI Prebook Endpoint ==="
echo ""
echo "Step 1: First we need to get a valid offerId from rates endpoint"
echo "Searching for rates in Telluride..."
echo ""

# Get rates first to get a valid offerId
RATES_RESPONSE=$(curl -s -X POST "https://api.liteapi.travel/v3.0/hotels/rates" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "checkin": "2025-12-01",
    "checkout": "2025-12-03",
    "adults": 2,
    "guestNationality": "US",
    "currency": "USD",
    "hotelIds": ["lp24373"]
  }')

echo "Rates Response:"
echo "$RATES_RESPONSE" | head -c 500
echo ""
echo "..."
echo ""

# Extract offerId from response
OFFER_ID=$(echo "$RATES_RESPONSE" | grep -o '"offerId":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$OFFER_ID" ]; then
  echo "ERROR: Could not extract offerId from rates response"
  echo "Full response:"
  echo "$RATES_RESPONSE"
  exit 1
fi

echo "Found offerId: $OFFER_ID"
echo ""
echo "Step 2: Testing Prebook with offerId..."
echo ""

# Test prebook endpoint
PREBOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/rates/prebook" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"offerId\": \"$OFFER_ID\",
    \"usePaymentSdk\": true,
    \"guestInfo\": {
      \"firstName\": \"Test\",
      \"lastName\": \"User\",
      \"email\": \"test@example.com\"
    }
  }")

echo "Prebook Response:"
echo "$PREBOOK_RESPONSE" | jq '.' 2>/dev/null || echo "$PREBOOK_RESPONSE"
echo ""

# Extract prebookId
PREBOOK_ID=$(echo "$PREBOOK_RESPONSE" | grep -o '"prebookId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$PREBOOK_ID" ]; then
  echo "Success! Got prebookId: $PREBOOK_ID"
  echo ""
  echo "Step 3: Testing Get Prebook by ID..."
  echo ""
  
  GET_PREBOOK_RESPONSE=$(curl -s -X GET "$BASE_URL/prebooks/$PREBOOK_ID" \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json")
  
  echo "Get Prebook Response:"
  echo "$GET_PREBOOK_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_PREBOOK_RESPONSE"
else
  echo "ERROR: Could not extract prebookId from prebook response"
fi
