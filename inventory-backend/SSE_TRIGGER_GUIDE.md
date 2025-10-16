# SSE Events - Complete Trigger Guide

This guide shows **exactly** how to trigger each SSE event with sound and toast notifications.

## 🎯 All 6 SSE Events - Status & Triggers

| Event | Status | Sound | Toast | Trigger |
|-------|--------|-------|-------|---------|
| `alert:new` | ✅ Active | 🔊 Yes | 🎨 Yes | See below |
| `alert:resolved` | ✅ Active | 🔊 Yes | 🎨 Yes | See below |
| `order:created` | ✅ Active | 🔊 Yes | 🎨 Yes | See below |
| `order:updated` | ✅ Active | 🔊 Yes | 🎨 Yes | See below |
| `stock:update` | ✅ Active | 🔊 Yes | 🎨 Yes | See below |
| `warehouse:updated` | ✅ Active | 🔊 Yes | 🎨 Yes | See below |

---

## 1️⃣ alert:new Event

### Trigger Methods:

#### A. Manual Alert Creation (Easiest to Test) ⭐
```bash
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "type": "CUSTOM_ALERT",
    "severity": "WARNING",
    "message": "Test alert for SSE notification",
    "metadata": {"test": true}
  }'
```

**What happens:**
1. Alert saved to database
2. SSE event emitted immediately
3. 🔊 Sound plays
4. ⚠️ Toast shows: "Test alert for SSE notification"
5. Alert list refreshes

---

#### B. Automatic Low Stock Alert
**Trigger:** Stock falls below reorder threshold

**Steps:**
1. Find a product with low stock:
```bash
curl http://localhost:3000/api/products
```

2. Adjust product's reorder threshold higher than current stock:
```bash
curl -X PUT http://localhost:3000/api/products/{PRODUCT_ID} \
  -H "Content-Type: application/json" \
  -d '{"reorderThreshold": 999}'
```

3. Wait for stock monitor cron job (runs every 5 minutes) OR
4. Manually trigger stock check (if you add an endpoint)

**What happens:**
1. Stock monitor detects low stock
2. Creates LOW_STOCK alert in database
3. SSE event: `alert:new` emitted
4. 🔊 Sound plays
5. ⚠️ Toast: "Low stock: ProductName in WarehouseName"
6. Auto-generates purchase order

---

#### C. Warehouse Capacity Alert
**Trigger:** Warehouse reaches 80%+ capacity

**Steps:**
1. Find a warehouse:
```bash
curl http://localhost:3000/api/warehouses
```

2. Create a large purchase order that fills warehouse:
```bash
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "{PRODUCT_ID}",
    "supplierId": "{SUPPLIER_ID}",
    "warehouseId": "{WAREHOUSE_ID}",
    "quantityOrdered": 5000
  }'
```

3. Mark order as arrived:
```bash
curl -X POST http://localhost:3000/api/purchase-orders/{ORDER_ID}/arrive
```

**What happens:**
1. Stock arrives at warehouse
2. Capacity check runs
3. If ≥80%: CAPACITY_WARNING alert created
4. If ≥100%: CAPACITY_EXCEEDED alert created
5. SSE event: `alert:new` emitted
6. 🔊 Sound plays
7. 🔴/⚠️ Toast shows capacity warning

---

## 2️⃣ alert:resolved Event

### Trigger Method:

```bash
# First, get an alert ID
curl http://localhost:3000/api/alerts?isResolved=false

# Then resolve it
curl -X POST http://localhost:3000/api/alerts/{ALERT_ID}/resolve
```

**What happens:**
1. Alert marked as resolved in database
2. SSE event: `alert:resolved` emitted
3. 🔊 Sound plays
4. ✅ Toast: "Alert Resolved: ALERT_TYPE"
5. Alert list refreshes

---

## 3️⃣ order:created Event

### Trigger Methods:

#### A. Manual Order Creation (Easiest) ⭐
```bash
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "{PRODUCT_ID}",
    "supplierId": "{SUPPLIER_ID}",
    "warehouseId": "{WAREHOUSE_ID}",
    "quantityOrdered": 100,
    "notes": "Manual test order"
  }'
```

**What happens:**
1. Order created in database
2. SSE event: `order:created` emitted
3. 🔊 Sound plays
4. 🛒 Toast: "Manual Order Created: PO-20241016-123456"
5. Order list refreshes

---

#### B. Automatic Order Generation
**Trigger:** Stock monitor detects low stock

**Steps:**
1. Set product's reorder threshold higher than current stock
2. Wait for stock monitor cron (5 minutes) OR
3. Stock falls below threshold naturally

**What happens:**
1. Stock monitor creates automatic purchase order
2. Order queued via RabbitMQ
3. Order created in database
4. SSE event: `order:created` emitted
5. 🔊 Sound plays
6. 🛒 Toast: "Auto-generated Order Created: PO-..."
7. Order list refreshes

---

## 4️⃣ order:updated Event

### Trigger Methods:

#### A. Manual Status Update
```bash
curl -X PUT http://localhost:3000/api/purchase-orders/{ORDER_ID} \
  -H "Content-Type: application/json" \
  -d '{"status": "IN_TRANSIT"}'
```

**What happens:**
1. Order status updated in database
2. SSE event: `order:updated` emitted
3. 🔊 Sound plays
4. 🚚 Toast: "Order IN_TRANSIT: PO-..."
5. Order list refreshes

---

#### B. Mark Order as Arrived (Best Test) ⭐
```bash
curl -X POST http://localhost:3000/api/purchase-orders/{ORDER_ID}/arrive
```

**What happens:**
1. Order marked as ARRIVED
2. Stock quantities updated
3. **Multiple SSE events:**
   - `order:updated` (status changed)
   - `stock:update` (quantity increased)
   - `warehouse:updated` (capacity changed)
4. 🔊 Sound plays (3 times - one per event!)
5. Multiple toasts show:
   - ✅ "Order ARRIVED: PO-..."
   - 📦 "Stock Updated: ProductName - 150 units"
   - 🏭 "Warehouse Update: WarehouseName - 65% capacity"
6. Multiple UI sections refresh

---

## 5️⃣ stock:update Event

### Trigger Methods:

#### A. Order Arrival (Easiest) ⭐
```bash
# Create order first
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "{PRODUCT_ID}",
    "supplierId": "{SUPPLIER_ID}",
    "warehouseId": "{WAREHOUSE_ID}",
    "quantityOrdered": 50
  }'

# Mark as arrived
curl -X POST http://localhost:3000/api/purchase-orders/{ORDER_ID}/arrive
```

**What happens:**
1. Order arrives → stock incremented
2. SSE event: `stock:update` emitted
3. 🔊 Sound plays
4. 📦 Toast: "Stock Updated: ProductName - 50 units in WarehouseName"
5. Product stock display refreshes

---

## 6️⃣ warehouse:updated Event

### Trigger Method:

#### Order Arrival (Triggers Automatically)
```bash
# Any order arrival updates warehouse capacity
curl -X POST http://localhost:3000/api/purchase-orders/{ORDER_ID}/arrive
```

**What happens:**
1. Order arrives → warehouse stock recalculated
2. SSE event: `warehouse:updated` emitted
3. 🔊 Sound plays
4. 🏭 Toast color-coded by capacity:
   - 🏭 <80%: "Warehouse Update: Name - 45% capacity (450/1000)"
   - ⚠️ 80-89%: Yellow warning toast
   - 🔴 ≥90%: Red critical toast with border
5. Warehouse display refreshes

---

## 🧪 Complete Test Flow (All Events at Once)

Run this sequence to trigger **all 6 events:**

```bash
# 1. Create a manual alert (alert:new)
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"type":"TEST","severity":"INFO","message":"Testing all events"}'

# Save alert ID from response
ALERT_ID="..."

# 2. Create a purchase order (order:created)
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "{PRODUCT_ID}",
    "supplierId": "{SUPPLIER_ID}",
    "warehouseId": "{WAREHOUSE_ID}",
    "quantityOrdered": 100
  }'

# Save order ID from response
ORDER_ID="..."

# 3. Mark order as arrived (order:updated + stock:update + warehouse:updated)
curl -X POST http://localhost:3000/api/purchase-orders/$ORDER_ID/arrive

# 4. Resolve the alert (alert:resolved)
curl -X POST http://localhost:3000/api/alerts/$ALERT_ID/resolve
```

**Expected Result:**
- 🔊 Sound plays **6 times**
- 🎨 **6 toast notifications** appear
- 📱 All relevant UI sections refresh automatically

---

## 🔍 Debugging SSE Events

### Check if SSE is connected:
```bash
# Should see "connected" event
curl -N http://localhost:3000/api/events
```

### Check connected clients:
```bash
curl http://localhost:3000/api/events/stats
```

### Monitor backend logs:
```bash
# Look for these log messages:
docker-compose logs -f backend | grep -E "SSE|event|alert|order|stock|warehouse"
```

### Check frontend console:
```javascript
// Open browser console, should see:
// ✅ SSE Connected
// 🔗 SSE Connection established: client-...
// 📦 Stock update: {...}
// 🔔 Alert: {...}
// 🛒 Order update: {...}
```

---

## 🐛 Common Issues

### Issue 1: No sound or toast
**Cause:** SSE connection not established

**Fix:**
1. Check browser console for errors
2. Verify backend is running: `curl http://localhost:3000/health`
3. Check SSE endpoint: `curl -N http://localhost:3000/api/events`
4. Ensure frontend is connecting to correct API URL

---

### Issue 2: Events not triggering
**Cause:** Event not being emitted from backend

**Check:**
1. Backend logs show event emission
2. Service is importing `appEvents`
3. `appEvents.emit*()` is actually being called
4. No exceptions during database operation

---

### Issue 3: Sound doesn't play
**Cause:** Browser autoplay policy

**Fix:**
1. User must interact with page first (click anywhere)
2. Check browser console for audio errors
3. Try refreshing page and clicking

---

### Issue 4: Alerts not saving
**Cause:** Database connection issue

**Check:**
```bash
# Test alert creation directly
curl -X POST http://localhost:3000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"type":"TEST","severity":"INFO","message":"Test"}'

# Check database
docker-compose exec postgres psql -U inventory_user -d inventory_db
SELECT * FROM alerts ORDER BY "createdAt" DESC LIMIT 5;
```

---

## ✅ Verification Checklist

After setup, verify each event works:

- [ ] **alert:new** - Create manual alert → hear sound + see toast
- [ ] **alert:resolved** - Resolve alert → hear sound + see toast
- [ ] **order:created** - Create PO → hear sound + see toast
- [ ] **order:updated** - Update PO status → hear sound + see toast
- [ ] **stock:update** - Mark order arrived → hear sound + see toast
- [ ] **warehouse:updated** - Mark order arrived → hear sound + see toast

---

## 📊 Event Data Structures

### alert:new / alert:resolved
```json
{
  "id": "alert-uuid",
  "type": "LOW_STOCK",
  "severity": "WARNING",
  "message": "Low stock: Widget A in Main Warehouse",
  "metadata": {
    "productId": "...",
    "warehouseId": "...",
    "currentQuantity": 5
  },
  "resolved": false
}
```

### order:created / order:updated
```json
{
  "id": "order-uuid",
  "orderNumber": "PO-20241016-123456",
  "productId": "...",
  "warehouseId": "...",
  "status": "PENDING",
  "isAutoGenerated": false
}
```

### stock:update
```json
{
  "productId": "...",
  "warehouseId": "...",
  "quantity": 150,
  "productName": "Widget A",
  "warehouseName": "Main Warehouse"
}
```

### warehouse:updated
```json
{
  "id": "warehouse-uuid",
  "name": "Main Warehouse",
  "currentStock": 650,
  "capacity": 1000,
  "percentage": 65
}
```

---

**Last Updated:** October 16, 2025
**Status:** All 6 events active and tested ✅
