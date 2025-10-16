# Quick SSE Test - 5 Minutes

## ✅ Pre-requisites

1. Backend running: `docker-compose up -d`
2. Frontend running: `npm run dev` (in inventory-frontend folder)
3. Browser open to: `http://localhost:5173`

---

## 🧪 Test 1: Manual Alert (30 seconds)

### Step 1: Open browser and console
- Open http://localhost:5173
- Open DevTools (F12) → Console tab
- Click anywhere on the page (enables sound)

### Step 2: Create alert
```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"type":"TEST_ALERT","severity":"WARNING","message":"Testing notifications"}'
```

### Expected Result:
- ✅ Console log: `🔔 Alert: {...}`
- ✅ Hear beep sound
- ✅ See toast notification (top-right): "Testing notifications"
- ✅ Alert appears in Alerts page

### If it works: ✅ SSE events are working!

---

## 🧪 Test 2: Purchase Order (2 minutes)

### Step 1: Get required IDs
```bash
# Get a product
curl -s http://localhost:3000/api/products | jq '.data[0] | {id, name}'

# Get a supplier
curl -s http://localhost:3000/api/suppliers | jq '.data[0] | {id, name}'

# Get a warehouse
curl -s http://localhost:3000/api/warehouses | jq '.data[0] | {id, name}'
```

### Step 2: Create order (replace IDs below)
```bash
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "PASTE_PRODUCT_ID_HERE",
    "supplierId": "PASTE_SUPPLIER_ID_HERE",
    "warehouseId": "PASTE_WAREHOUSE_ID_HERE",
    "quantityOrdered": 50
  }'
```

### Expected Result:
- ✅ Console log: `🛒 Order update: {...}`
- ✅ Hear beep sound
- ✅ See toast: "Manual Order Created: PO-..."
- ✅ Order appears in Purchase Orders page

---

## 🧪 Test 3: Mark Order Arrived (1 minute)

### Step 1: Get a pending order
```bash
ORDER_ID=$(curl -s 'http://localhost:3000/api/purchase-orders?status=PENDING&limit=1' | jq -r '.data[0].id')
echo "Order ID: $ORDER_ID"
```

### Step 2: Mark as arrived
```bash
curl -X POST "http://localhost:3000/api/purchase-orders/$ORDER_ID/arrive"
```

### Expected Result (this is the best test - triggers 3 events!):
- ✅ Console logs 3 times:
  - `🛒 Order update: {...}`
  - `📦 Stock update: {...}`
  - `🏭 Warehouse update: {...}`
- ✅ Hear 3 beep sounds
- ✅ See 3 toasts:
  1. "Order ARRIVED: PO-..."
  2. "Stock Updated: ProductName - X units"
  3. "Warehouse Update: WarehouseName - X% capacity"
- ✅ Stock quantity increased
- ✅ Warehouse capacity updated

### If all 3 events fire: ✅ Everything is working perfectly!

---

## 🧪 Test 4: Resolve Alert (30 seconds)

### Step 1: Get an alert
```bash
ALERT_ID=$(curl -s 'http://localhost:3000/api/alerts?isResolved=false&limit=1' | jq -r '.data[0].id')
echo "Alert ID: $ALERT_ID"
```

### Step 2: Resolve it
```bash
curl -X POST "http://localhost:3000/api/alerts/$ALERT_ID/resolve"
```

### Expected Result:
- ✅ Console log: `🔔 Alert: {...resolved:true}`
- ✅ Hear beep sound
- ✅ See toast: "Alert Resolved: TEST_ALERT"
- ✅ Alert marked as resolved in database

---

## 🎯 All-in-One Test Script

Run this to test everything at once:

```bash
#!/bin/bash
echo "🧪 Quick SSE Test"
echo "================="
echo ""

# Test 1: Create Alert
echo "1️⃣ Creating test alert..."
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"type":"QUICK_TEST","severity":"INFO","message":"Quick test alert"}' \
  -s | jq '.data.id' -r > /tmp/alert_id.txt
echo "✓ Alert created: $(cat /tmp/alert_id.txt)"
echo "   Listen for: beep sound + toast"
sleep 2

# Test 2: Get IDs for purchase order
echo ""
echo "2️⃣ Getting product/supplier/warehouse IDs..."
PRODUCT_ID=$(curl -s http://localhost:3000/api/products | jq -r '.data[0].id')
SUPPLIER_ID=$(curl -s http://localhost:3000/api/suppliers | jq -r '.data[0].id')
WAREHOUSE_ID=$(curl -s http://localhost:3000/api/warehouses | jq -r '.data[0].id')
echo "   Product: $PRODUCT_ID"
echo "   Supplier: $SUPPLIER_ID"
echo "   Warehouse: $WAREHOUSE_ID"

# Test 3: Create Purchase Order
echo ""
echo "3️⃣ Creating purchase order..."
ORDER_ID=$(curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"supplierId\": \"$SUPPLIER_ID\",
    \"warehouseId\": \"$WAREHOUSE_ID\",
    \"quantityOrdered\": 25
  }" -s | jq -r '.data.id')
echo "✓ Order created: $ORDER_ID"
echo "   Listen for: beep sound + toast"
sleep 2

# Test 4: Mark Order as Arrived (triggers 3 events!)
echo ""
echo "4️⃣ Marking order as arrived..."
curl -X POST "http://localhost:3000/api/purchase-orders/$ORDER_ID/arrive" -s > /dev/null
echo "✓ Order arrived"
echo "   Listen for: 3 beep sounds + 3 toasts"
sleep 3

# Test 5: Resolve Alert
echo ""
echo "5️⃣ Resolving alert..."
ALERT_ID=$(cat /tmp/alert_id.txt)
curl -X POST "http://localhost:3000/api/alerts/$ALERT_ID/resolve" -s > /dev/null
echo "✓ Alert resolved: $ALERT_ID"
echo "   Listen for: beep sound + toast"

echo ""
echo "🎉 Test Complete!"
echo ""
echo "Expected: 6 beep sounds + 6 toast notifications"
echo ""
echo "Check browser console for SSE event logs"
```

Save this as `quick-test.sh`, make it executable, and run:
```bash
chmod +x quick-test.sh
./quick-test.sh
```

---

## 🐛 Troubleshooting

### No sound?
- Click on the page first (browser autoplay policy)
- Check browser console for audio errors
- Try refreshing the page

### No toast?
- Check browser console for JavaScript errors
- Verify frontend is running on http://localhost:5173
- Check Network tab for SSE connection to `/api/events`

### Events not firing?
```bash
# Check SSE connection
curl -N http://localhost:3000/api/events

# Should see:
# event: connected
# data: {"clientId":"...","timestamp":"..."}
#
# : heartbeat

# Check connected clients
curl http://localhost:3000/api/events/stats

# Should see:
# {"connectedClients":1,"clients":[...]}
```

### Backend not responding?
```bash
# Check health
curl http://localhost:3000/health

# Check logs
docker-compose logs -f backend | grep -i "sse\|event\|alert"
```

---

## ✅ Success Criteria

After running tests, you should have:

- [x] Heard beep sounds (at least 6)
- [x] Seen toast notifications (at least 6)
- [x] Console logs showing SSE events
- [x] Alerts in database
- [x] Orders in database
- [x] Stock quantities updated
- [x] Warehouse capacity updated
- [x] No JavaScript errors in console
- [x] SSE connection active (check /api/events/stats)

If all checked: ✅ **SSE notification system is fully functional!**

---

## 📝 Notes

- Each test is independent - can run in any order
- Test 3 (order arrival) is the most comprehensive (3 events)
- You need at least 1 product, 1 supplier, 1 warehouse in database
- If database is empty, run seed script first
- Sound requires user interaction - click page once before testing

---

**Estimated Time:** 5 minutes
**Difficulty:** Easy
**Requirements:** Running backend + frontend + browser
