#!/bin/bash

echo "🧪 Testing SSE Events and Notifications"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"

echo "1️⃣ Testing API Health..."
if curl -s "$API_URL/health" | grep -q "healthy"; then
    echo -e "${GREEN}✓ API is healthy${NC}"
else
    echo -e "${RED}✗ API is not responding${NC}"
    exit 1
fi
echo ""

echo "2️⃣ Testing SSE Connection..."
echo "   Connect to: $API_URL/api/events"
echo "   (Will show connected event if working)"
timeout 3 curl -N "$API_URL/api/events" 2>/dev/null | head -5
echo ""
echo ""

echo "3️⃣ Testing SSE Stats..."
curl -s "$API_URL/api/events/stats" | jq '.'
echo ""

echo "4️⃣ Creating Test Alert (should trigger SSE event)..."
ALERT_RESPONSE=$(curl -s -X POST "$API_URL/api/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TEST_ALERT",
    "severity": "INFO",
    "message": "This is a test alert to verify SSE notifications",
    "metadata": {"test": true, "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}
  }')

echo "$ALERT_RESPONSE" | jq '.'
echo ""

ALERT_ID=$(echo "$ALERT_RESPONSE" | jq -r '.data.id')

if [ "$ALERT_ID" != "null" ] && [ -n "$ALERT_ID" ]; then
    echo -e "${GREEN}✓ Alert created with ID: $ALERT_ID${NC}"
    echo ""

    echo "5️⃣ Verifying alert is in database..."
    curl -s "$API_URL/api/alerts/$ALERT_ID" | jq '.data'
    echo ""

    echo "6️⃣ Resolving alert (should trigger SSE event)..."
    curl -s -X POST "$API_URL/api/alerts/$ALERT_ID/resolve" | jq '.'
    echo ""

    echo "7️⃣ Cleaning up test alert..."
    curl -s -X DELETE "$API_URL/api/alerts/$ALERT_ID" | jq '.'
    echo ""
else
    echo -e "${RED}✗ Failed to create alert${NC}"
fi

echo ""
echo "8️⃣ Checking for products (needed for other tests)..."
PRODUCTS=$(curl -s "$API_URL/api/products?page=1&limit=1")
PRODUCT_COUNT=$(echo "$PRODUCTS" | jq '.meta.total // 0')
echo "   Found $PRODUCT_COUNT products"
echo ""

echo "9️⃣ Checking for warehouses..."
WAREHOUSES=$(curl -s "$API_URL/api/warehouses?page=1&limit=1")
WAREHOUSE_COUNT=$(echo "$WAREHOUSES" | jq '.meta.total // 0')
echo "   Found $WAREHOUSE_COUNT warehouses"
echo ""

echo "🎯 Summary:"
echo "==========="
echo -e "${YELLOW}To see SSE events in real-time, run:${NC}"
echo "   curl -N $API_URL/api/events"
echo ""
echo -e "${YELLOW}Then in another terminal, trigger events:${NC}"
echo "   # Create alert"
echo "   curl -X POST $API_URL/api/alerts -H 'Content-Type: application/json' -d '{\"type\":\"TEST\",\"severity\":\"INFO\",\"message\":\"Test\"}'  "
echo ""
echo "   # If you have products and purchase orders, mark one as arrived"
echo "   curl -X POST $API_URL/api/purchase-orders/{ORDER_ID}/arrive"
echo ""
echo -e "${GREEN}✓ Test script complete${NC}"
