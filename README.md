# Souk - Inventory Management System

A modern, full-stack inventory management system built with microservices architecture, featuring real-time stock monitoring, automated purchase order generation, and capacity management.

## 🚀 Features

### Core Functionality
- **Real-time Stock Monitoring**: Automated stock level tracking with configurable check intervals
- **Intelligent Reordering**: Automatic purchase order generation when stock falls below thresholds
- **Multi-Warehouse Support**: Manage inventory across multiple warehouse locations
- **Capacity Management**: Track and prevent warehouse capacity overages
- **Supplier Management**: Maintain supplier information and track purchase history
- **Purchase Order Tracking**: Complete order lifecycle from generation to fulfillment
- **Stock Movement Audit Trail**: Comprehensive logging of all inventory changes
- **Alert System**: Real-time notifications for low stock, capacity issues, and system events

### Technical Features
- **Microservices Architecture**: Independent frontend and backend services
- **Real-time Updates**: WebSocket support for live inventory updates
- **Message Queue**: RabbitMQ for asynchronous job processing
- **Caching Layer**: Redis for improved performance
- **Database Migrations**: Prisma ORM with automated migrations
- **Containerized Deployment**: Full Docker support with development and production configurations
- **Type Safety**: Full TypeScript implementation across the stack
- **RESTFul API**: Well-documented API endpoints with Zod validation

## 📋 Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Available Commands](#available-commands)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture

### System Overview

Souk follows a **microservices-inspired architecture** with separated frontend and backend services, designed for scalability and maintainability. The system uses an event-driven approach for background processing and real-time updates.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│                         Port: 5173/80                           │
│  ┌──────────┐  ┌────────────┐  ┌─────────────┐  ┌───────────┐ │
│  │Dashboard │  │  Products  │  │  Warehouses │  │ Suppliers │ │
│  └──────────┘  └────────────┘  └─────────────┘  └───────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST API + WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                      Backend (Fastify)                          │
│                         Port: 3000                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Controllers  │  │   Services   │  │   Job Scheduler    │   │
│  │  - Routes    │  │  - Business  │  │  - Stock Monitor   │   │
│  │  - Validation│  │    Logic     │  │  - Cron Jobs       │   │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘   │
│         │                  │                   │               │
│         └──────────────────┼───────────────────┘               │
│                            │                                    │
│  ┌─────────────────────────▼─────────────────────────────────┐ │
│  │              Prisma ORM (Data Access Layer)               │ │
│  └───────────────────────────────────────────────────────────┘ │
└───────┬──────────┬──────────┬────────────┬──────────────────────┘
        │          │          │            │
   ┌────▼───┐  ┌──▼─────┐  ┌─▼────────┐  ┌▼──────────┐
   │Postgres│  │ Redis  │  │ RabbitMQ │  │ WebSocket │
   │ :5432  │  │ :6379  │  │ :5672    │  │  Real-time│
   │        │  │        │  │          │  │  Updates  │
   └────────┘  └────────┘  └──────────┘  └───────────┘
```

### Architecture Layers

#### 1. **Presentation Layer (Frontend)**
- **Technology**: React 18 with TypeScript, Vite
- **State Management**: TanStack Query for server state, React hooks for local state
- **Styling**: Tailwind CSS for responsive design
- **Communication**: Axios for REST API, WebSocket client for real-time updates
- **Routing**: React Router for client-side navigation

#### 2. **API Layer (Backend Controllers & Routes)**
- **Technology**: Fastify web framework
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error handling middleware
- **API Design**: RESTful endpoints following standard conventions

#### 3. **Business Logic Layer (Services)**
Key services include:
- **StockMonitorService**: Monitors stock levels and triggers reordering
- **PurchaseOrderService**: Manages purchase order lifecycle
- **CapacityManagerService**: Tracks warehouse capacity and prevents overstock
- **AlertService**: Creates and manages system alerts
- **ProductService, WarehouseService, SupplierService**: Domain-specific logic

#### 4. **Data Access Layer (Prisma ORM)**
- **Technology**: Prisma ORM with TypeScript
- **Features**: Type-safe database queries, migrations, relationships
- **Optimizations**: Indexed queries, connection pooling

#### 5. **Data Layer (PostgreSQL)**
- **Technology**: PostgreSQL 16+
- **Features**: ACID compliance, foreign keys, indexes, full-text search
- **Design**: Normalized relational schema with referential integrity

#### 6. **Supporting Infrastructure**

**Redis Cache**
- Session storage (future use)
- Query result caching
- Rate limiting data

**RabbitMQ Message Queue**
- Asynchronous job processing
- Stock check jobs
- Purchase order notifications
- Decouples heavy operations from API responses

**WebSocket Server**
- Real-time stock updates
- Live alert notifications
- Purchase order status changes

### Data Flow Examples

#### Example 1: Creating a Purchase Order
```
User → Frontend → POST /api/purchase-orders → Controller
  → Validation (Zod) → PurchaseOrderService → Check Capacity
  → Prisma → PostgreSQL (Insert) → Update Warehouse Stock
  → WebSocket Broadcast → Frontend Update → User Notification
```

#### Example 2: Automatic Reordering (Background Job)
```
Scheduler (Every 5 min) → StockMonitorService → Query Low Stock Products
  → Check Each Product Against Threshold → Create Purchase Order
  → RabbitMQ Job Queue → Process Order Creation → Update Database
  → Create Alert → WebSocket Broadcast → Frontend Shows Alert
```

### Key Components

- **Frontend**: React 18 with TypeScript, TanStack Query, React Router, Tailwind CSS
- **Backend**: Fastify with TypeScript, Prisma ORM, Zod validation
- **Database**: PostgreSQL with full-text search and indexing
- **Cache**: Redis for session management and caching
- **Message Queue**: RabbitMQ for asynchronous task processing
- **Real-time**: WebSocket connections for live updates

### Architectural Patterns

1. **Separation of Concerns**: Clear separation between presentation, business logic, and data layers
2. **Dependency Injection**: Services are injected where needed for testability
3. **Repository Pattern**: Prisma acts as a repository layer abstracting database access
4. **Event-Driven**: Background jobs and real-time updates use event-driven architecture
5. **API-First**: Backend exposes RESTful API, enabling future mobile/third-party clients

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify 4.x
- **Language**: TypeScript 5.x
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 16+
- **Cache**: Redis 7+
- **Message Queue**: RabbitMQ 3.12+
- **Validation**: Zod
- **Logging**: Pino

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 5
- **Language**: TypeScript 5.x
- **Routing**: React Router 6
- **State Management**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS 3
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

### DevOps
- **Containerization**: Docker & Docker Compose
- **Development**: Hot reload with volume mounts
- **Production**: Multi-stage builds, NGINX reverse proxy
- **Task Runner**: Make (Makefile)

## 📦 Prerequisites

### Required Software
- **Docker**: 24.0 or higher
- **Docker Compose**: 2.20 or higher
- **Node.js**: 20+ (for local development)
- **npm**: 9+ (for local development)

### Optional Tools
- **Make**: For using Makefile shortcuts
- **jq**: For JSON parsing in health checks
- **PostgreSQL Client**: For database management

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Souk
```

### 2. Start All Services with Docker
```bash
# Using Docker Compose
docker-compose up -d

# Or using Make
make dev
```

### 3. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/health
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 4. Initialize Database (First Time)
```bash
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed sample data (optional)
docker-compose exec backend npx prisma db seed
```

### 5. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

## 📱 How to Use the Application

### Getting Started

1. **Access the Dashboard**
   - Open http://localhost:5173 in your browser
   - The dashboard provides an overview of:
     - Total products, warehouses, and suppliers
     - Active and pending purchase orders
     - Recent system alerts
     - Stock level trends

2. **Set Up Your Inventory System**

   **Step 1: Create Suppliers**
   - Navigate to "Suppliers" in the sidebar
   - Click "Add Supplier"
   - Fill in supplier details (name, email, phone, address)
   - Click "Create" to save

   **Step 2: Create Warehouses**
   - Navigate to "Warehouses"
   - Click "Add Warehouse"
   - Enter warehouse details:
     - Name and location
     - Maximum capacity (total number of items it can hold)
   - Click "Create"

   **Step 3: Add Products**
   - Navigate to "Products"
   - Click "Add Product"
   - Fill in product information:
     - SKU (unique identifier)
     - Name and description
     - Reorder threshold (minimum stock level before reordering)
     - Reorder quantity (how many to order when threshold is reached)
     - Lead time in days (how long delivery takes)
     - Unit price
     - Default supplier
   - Click "Create"

### Managing Inventory

**Viewing Stock Levels**
- Click on any product to see its stock levels across all warehouses
- Stock levels are color-coded:
  - Green: Above reorder threshold
  - Yellow: At or below reorder threshold
  - Red: Critical low stock

**Creating Purchase Orders Manually**
- Navigate to "Purchase Orders"
- Click "Create Order"
- Select product, supplier, and destination warehouse
- Enter quantity and expected arrival date
- Click "Create"

**Automatic Purchase Orders**
- The system automatically monitors stock levels every 5 minutes (configurable)
- When a product's stock falls below its reorder threshold, a purchase order is automatically created
- Auto-generated orders are marked with an "Auto" badge

**Receiving Purchase Orders**
- Navigate to "Purchase Orders"
- Find the order with status "PENDING" or "IN_TRANSIT"
- Click "Mark as Arrived" when the order is received
- Stock levels will automatically update
- An audit trail entry is created in StockMovements

**Managing Alerts**
- Alerts appear in the dashboard for:
  - Low stock warnings
  - Warehouse capacity issues
  - System events
- Click on an alert to view details
- Resolve alerts by addressing the underlying issue

### Key Workflows

**Workflow 1: Adding New Product to Inventory**
1. Create product with reorder settings
2. Product appears in Products list
3. Stock level is 0 initially
4. System will auto-generate purchase order if threshold > 0

**Workflow 2: Monitoring and Reordering**
1. Background job checks stock every 5 minutes
2. If stock < reorder threshold → auto-creates purchase order
3. Purchase order status: PENDING → IN_TRANSIT → ARRIVED
4. When marked as ARRIVED → stock automatically updated
5. Alert cleared if issue is resolved

**Workflow 3: Multi-Warehouse Management**
1. Create multiple warehouses with different capacities
2. Add same product to different warehouses
3. Monitor stock levels per warehouse
4. Create purchase orders targeting specific warehouses
5. System tracks capacity to prevent overstock

### Advanced Features

**WebSocket Real-Time Updates**
- Stock levels update automatically without page refresh
- New alerts appear instantly
- Purchase order status changes reflect immediately

**Capacity Management**
- Warehouse capacity is tracked automatically
- System prevents purchase orders that would exceed capacity
- Warnings appear when capacity reaches 80%

**Audit Trail**
- All stock movements are logged in StockMovements table
- Track:
  - Purchase order arrivals
  - Manual adjustments
  - Who performed the action
  - When it happened
  - Reference numbers

**Search and Filter**
- Use search bars to filter products, warehouses, and suppliers
- Filter purchase orders by status
- Sort tables by clicking column headers

## 💻 Development Setup

### Option 1: Full Docker Development (Recommended)
```bash
# Start all services
make dev

# View logs
make logs

# Access backend shell
make shell-backend

# Access database
make shell-db
```

### Option 2: Hybrid Development (Backend + Infrastructure)
```bash
# Start only infrastructure (PostgreSQL, Redis, RabbitMQ)
make backend-only

# In another terminal, run backend locally
cd inventory-backend
npm install
cp .env.example .env
npm run dev

# In another terminal, run frontend locally
cd inventory-frontend
npm install
npm run dev
```

### Option 3: Complete Local Development
```bash
# Start infrastructure only
cd inventory-backend
docker-compose -f docker-compose.dev.yml up -d postgres redis rabbitmq

# Backend setup
cd inventory-backend
npm install
cp .env.example .env
# Edit .env with database credentials
npm run prisma:generate
npm run prisma:migrate
npm run dev

# Frontend setup (in new terminal)
cd inventory-frontend
npm install
# Create .env with VITE_API_URL=http://localhost:3000
npm run dev
```

### Development Features
- **Hot Reload**: Both frontend and backend auto-reload on code changes
- **Volume Mounts**: Source code changes reflect immediately
- **Debug Logging**: Pretty-printed logs with Pino
- **Database Studio**: Access Prisma Studio with `npm run prisma:studio`

## 🚢 Production Deployment

### 1. Environment Configuration
```bash
# Copy and edit environment file
cp .env.example .env

# Edit .env with production values:
# - Strong passwords for all services
# - Production database credentials
# - Redis password
# - RabbitMQ credentials
```

### 2. Build and Deploy
```bash
# Build production images
make prod-build

# Start production stack
make prod

# Or manual commands
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Run Database Migrations
```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### 4. Health Check
```bash
make health

# Or manual
curl http://localhost:3000/health
```

### 5. Scale Services (Optional)
```bash
# Scale backend to 3 instances
make prod-scale

# Or manual
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Production Features
- **Multi-stage Builds**: Optimized Docker images
- **NGINX Reverse Proxy**: Production-grade web server
- **Resource Limits**: CPU and memory constraints
- **Health Checks**: Automated service health monitoring
- **Restart Policies**: Automatic container recovery
- **Security**: Non-root users, minimal base images

## 📚 API Documentation

### Base URL
- Development: `http://localhost:3000`
- Production: Configure based on deployment

### Core Endpoints

#### Products
```
GET    /api/products              - List all products
GET    /api/products/:id          - Get product details
POST   /api/products              - Create new product
PUT    /api/products/:id          - Update product
DELETE /api/products/:id          - Delete product
GET    /api/products/:id/stock    - Get product stock levels
```

#### Warehouses
```
GET    /api/warehouses            - List all warehouses
GET    /api/warehouses/:id        - Get warehouse details
POST   /api/warehouses            - Create new warehouse
PUT    /api/warehouses/:id        - Update warehouse
DELETE /api/warehouses/:id        - Delete warehouse
GET    /api/warehouses/:id/capacity - Get capacity info
```

#### Suppliers
```
GET    /api/suppliers             - List all suppliers
GET    /api/suppliers/:id         - Get supplier details
POST   /api/suppliers             - Create new supplier
PUT    /api/suppliers/:id         - Update supplier
DELETE /api/suppliers/:id         - Delete supplier
```

#### Purchase Orders
```
GET    /api/purchase-orders       - List all orders
GET    /api/purchase-orders/:id   - Get order details
POST   /api/purchase-orders       - Create new order
PUT    /api/purchase-orders/:id   - Update order status
DELETE /api/purchase-orders/:id   - Cancel order
```

#### System
```
GET    /health                    - Health check endpoint
GET    /api/alerts                - Get system alerts
WS     /ws                        - WebSocket connection
```

### Request Examples

#### Create Product
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "Widget A",
    "description": "Premium widget",
    "reorderThreshold": 50,
    "reorderQuantity": 100,
    "leadTimeDays": 5,
    "unitPrice": 29.99,
    "defaultSupplierId": "supplier-uuid"
  }'
```

#### Create Purchase Order
```bash
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "product-uuid",
    "supplierId": "supplier-uuid",
    "warehouseId": "warehouse-uuid",
    "quantityOrdered": 100,
    "expectedArrivalDate": "2024-12-31"
  }'
```

## 🔄 Automatic Reordering Logic

### Overview

The automatic reordering system is the heart of Souk's inventory management. It continuously monitors stock levels and automatically generates purchase orders when inventory falls below specified thresholds, ensuring products never run out.

### How It Works

#### 1. **Background Job Scheduler**
Located in `inventory-backend/src/jobs/scheduler.ts`:
- Runs as a cron job every N minutes (default: 5 minutes, configurable via `STOCK_CHECK_INTERVAL`)
- Uses `node-cron` for scheduling
- Triggers the `StockMonitorService` on each execution
- Runs independently of user actions

```typescript
// Pseudo-code representation
cron.schedule(`*/${STOCK_CHECK_INTERVAL} * * * *`, async () => {
  await stockMonitorService.checkStockLevels();
});
```

#### 2. **Stock Level Checking Process**
The `StockMonitorService.checkStockLevels()` method:

**Step 1: Fetch All Active Products**
```sql
SELECT * FROM Product WHERE isActive = true;
```

**Step 2: For Each Product, Check All Warehouse Stock Levels**
```sql
SELECT * FROM ProductStock
WHERE productId = ? AND quantity <= product.reorderThreshold;
```

**Step 3: Identify Low Stock Situations**
- Compare current quantity with product's `reorderThreshold`
- If `quantity <= reorderThreshold`, product needs reordering

**Step 4: Check for Pending Orders**
- Query for existing PENDING or IN_TRANSIT purchase orders for this product/warehouse combination
- Skip if order already exists to avoid duplicate orders

```sql
SELECT COUNT(*) FROM PurchaseOrder
WHERE productId = ? AND warehouseId = ?
AND status IN ('PENDING', 'IN_TRANSIT');
```

#### 3. **Purchase Order Generation**

When low stock is detected and no pending order exists:

**Step 1: Validate Warehouse Capacity**
```typescript
currentStock = warehouse.currentStock;
orderQuantity = product.reorderQuantity;
availableCapacity = warehouse.capacity - currentStock;

if (orderQuantity > availableCapacity) {
  // Create alert: Capacity exceeded
  // Skip order creation
  return;
}
```

**Step 2: Calculate Order Details**
- **Quantity**: Uses `product.reorderQuantity`
- **Supplier**: Uses `product.defaultSupplierId`
- **Warehouse**: The warehouse with low stock
- **Total Cost**: `product.unitPrice × reorderQuantity`
- **Expected Arrival**: `today + product.leadTimeDays`

**Step 3: Create Purchase Order**
```typescript
const purchaseOrder = await prisma.purchaseOrder.create({
  data: {
    orderNumber: generateOrderNumber(), // Format: PO-YYYYMMDD-XXXXX
    productId: product.id,
    supplierId: product.defaultSupplierId,
    warehouseId: warehouse.id,
    quantityOrdered: product.reorderQuantity,
    totalCost: product.unitPrice * product.reorderQuantity,
    status: 'PENDING',
    orderDate: new Date(),
    expectedArrivalDate: addDays(new Date(), product.leadTimeDays),
    isAutoGenerated: true
  }
});
```

**Step 4: Create Alert**
```typescript
await alertService.create({
  type: 'LOW_STOCK',
  severity: 'WARNING',
  message: `Auto-generated purchase order for ${product.name} at ${warehouse.name}`,
  metadata: { productId, warehouseId, purchaseOrderId }
});
```

**Step 5: Broadcast via WebSocket**
- Notify connected clients of new purchase order
- Update frontend in real-time

#### 4. **Order Fulfillment**

When a purchase order arrives:

**Manual Process (via UI)**
1. User navigates to Purchase Orders
2. Clicks "Mark as Arrived" on a PENDING/IN_TRANSIT order
3. Backend updates order status to 'ARRIVED'

**Automatic Stock Update**
```typescript
// Update ProductStock
await prisma.productStock.update({
  where: { productId_warehouseId: { productId, warehouseId } },
  data: { quantity: { increment: quantityOrdered } }
});

// Update Warehouse current stock
await prisma.warehouse.update({
  where: { id: warehouseId },
  data: { currentStock: { increment: quantityOrdered } }
});

// Create audit trail entry
await prisma.stockMovement.create({
  data: {
    productId,
    warehouseId,
    movementType: 'PURCHASE_ORDER_ARRIVAL',
    quantity: quantityOrdered,
    reference: orderNumber
  }
});
```

**Resolve Alert**
- If stock is now above threshold, mark related low-stock alerts as resolved

### Configuration Parameters

All parameters are configured per-product:

| Parameter | Description | Example | Impact |
|-----------|-------------|---------|--------|
| `reorderThreshold` | Stock level that triggers reorder | 50 | Lower = less frequent orders, higher risk of stockout |
| `reorderQuantity` | How many units to order | 200 | Higher = fewer orders but more capital tied up |
| `leadTimeDays` | Delivery time from supplier | 5 | Affects expected arrival date |
| `defaultSupplierId` | Which supplier to order from | UUID | Determines vendor for auto orders |

### Example Scenario

**Product Configuration:**
- Product: "Widget A"
- Reorder Threshold: 100 units
- Reorder Quantity: 500 units
- Lead Time: 7 days
- Unit Price: $10

**Timeline:**
1. **Day 1, 9:00 AM**: Stock = 150 units (above threshold, no action)
2. **Day 3, 2:30 PM**: Sales reduce stock to 95 units
3. **Day 3, 2:35 PM**: Cron job runs, detects stock (95) <= threshold (100)
4. **Day 3, 2:35 PM**: System creates PO for 500 units, total cost $5,000, expected arrival Day 10
5. **Day 3, 2:35 PM**: Alert created: "Low stock detected for Widget A"
6. **Day 10**: Order arrives, user marks as arrived
7. **Day 10**: Stock automatically updated to 595 units (95 + 500)
8. **Day 10**: Alert resolved, audit trail created

### Edge Cases Handled

1. **Multiple Warehouses**: Each warehouse checked independently
2. **No Default Supplier**: Skip order creation, log error
3. **Capacity Exceeded**: Alert created, order skipped
4. **Duplicate Orders**: Checked before creation to prevent duplicate pending orders
5. **Inactive Products**: Skipped during stock check
6. **Inactive Warehouses**: Excluded from checks

### Monitoring & Alerts

The system creates alerts for:
- **LOW_STOCK**: When stock falls below threshold
- **CAPACITY_WARNING**: When warehouse reaches 80% capacity
- **CAPACITY_EXCEEDED**: When order would exceed warehouse capacity
- **REORDER_FAILED**: When automatic reorder fails for any reason

## 🗄️ Database Schema

### Data Modeling Choices

The database schema follows a **normalized relational design** optimized for inventory management operations. Key design decisions include:

#### 1. **Entity Relationships**

**Many-to-Many through Junction Table**
- Products ↔ Warehouses relationship implemented via `ProductStock` table
- Allows tracking stock of same product across multiple warehouses
- Composite unique constraint on `(productId, warehouseId)` prevents duplicates

**One-to-Many Relationships**
- Supplier → Products (one supplier can supply many products)
- Product → PurchaseOrders (one product can have many orders)
- Warehouse → PurchaseOrders (one warehouse can receive many orders)

**Rationale**: This design supports:
- Multi-warehouse inventory tracking
- Product availability across locations
- Historical purchase order data
- Supplier performance analysis

#### 2. **Denormalization for Performance**

**Warehouse.currentStock Field**
- Stores calculated sum of all product quantities in warehouse
- Avoids expensive JOIN and SUM queries on ProductStock table
- Updated transactionally when stock changes
- Trade-off: Slight data redundancy for significant query performance gain

**Rationale**:
- Capacity checks happen frequently (every 5 minutes + every order creation)
- Calculating sum of all products in real-time would be expensive
- Denormalized field provides O(1) capacity lookup

#### 3. **Separate Stock Movement Audit Trail**

**StockMovement Table**
- Immutable append-only log of all inventory changes
- Separate from ProductStock table (which holds current state)
- Tracks: what changed, when, why, who, and reference info

**Rationale**:
- Enables complete audit history without complex event sourcing
- ProductStock table stays small and fast (only current state)
- Supports compliance and troubleshooting
- Can reconstruct historical stock levels if needed

#### 4. **Enum Types for Status Fields**

**PurchaseOrder.status**: PENDING | IN_TRANSIT | ARRIVED | CANCELLED
**Alert.severity**: INFO | WARNING | ERROR | CRITICAL
**StockMovement.movementType**: PURCHASE_ORDER_ARRIVAL | MANUAL_ADJUSTMENT | etc.

**Rationale**:
- Type safety at database and application level
- Prevents invalid status values
- Self-documenting code
- Enables efficient indexing and querying

#### 5. **UUID Primary Keys**

All entities use UUID (CUID) instead of auto-incrementing integers:

**Advantages**:
- Globally unique across distributed systems
- No collision risk when merging data
- Harder to guess/enumerate records (security)
- Can generate client-side before database insert

**Trade-offs**:
- Slightly larger storage (36 bytes vs 4 bytes)
- Indexes slightly less efficient than integers
- Not human-readable

**Rationale**: Benefits outweigh costs for modern systems, especially with future microservices expansion

#### 6. **Soft Delete Alternative: isActive Flags**

Products, Suppliers, and Warehouses have `isActive` boolean fields:

**Rationale**:
- Maintains referential integrity (can't delete if referenced)
- Historical purchase orders still reference deactivated products/suppliers
- Can be reactivated if needed
- Simpler than full soft-delete implementation
- Query filters: `WHERE isActive = true`

#### 7. **Timestamps and Metadata**

Every entity includes:
- `createdAt`: Automatic timestamp on creation
- `updatedAt`: Automatic timestamp on modification (where applicable)

**Rationale**:
- Essential for debugging and auditing
- Enables time-based queries and analytics
- Required for compliance in many industries

#### 8. **Calculated vs Stored Fields**

**Stored**:
- `PurchaseOrder.totalCost` (instead of calculating from quantity × unit price)
- `Warehouse.currentStock` (instead of SUM of ProductStock)

**Calculated at Runtime**:
- Product stock status (low/normal/high) - derived from comparison with threshold
- Days until expected arrival - calculated from expectedArrivalDate

**Rationale**:
- Store values that might change independently (e.g., price changes shouldn't affect old orders)
- Calculate volatile or frequently changing values
- Balance between query performance and data consistency

#### 9. **Foreign Key Constraints**

All relationships use database-level foreign key constraints:
- `ON DELETE RESTRICT` for critical relationships (prevents orphaned records)
- Enforces referential integrity at database level
- Prevents application bugs from corrupting data

**Example**: Cannot delete a Supplier if Products reference it

#### 10. **Indexing Strategy**

Indexes created on:
- Primary keys (automatic with UUID)
- Foreign keys (productId, warehouseId, supplierId)
- Unique constraints (Product.sku, PurchaseOrder.orderNumber)
- Composite unique constraint (ProductStock: productId + warehouseId)
- Frequently queried fields (PurchaseOrder.status, Product.isActive)

**Rationale**:
- Optimizes JOIN operations
- Speeds up WHERE clause filtering
- Unique constraints prevent data duplication
- Trade-off: Slightly slower writes, much faster reads (appropriate for read-heavy inventory systems)

### Schema Design Decisions Summary

| Decision | Choice | Alternative Considered | Reason |
|----------|--------|------------------------|--------|
| Primary Keys | UUID (CUID) | Auto-increment integers | Distributed system support, security |
| Product-Warehouse | Junction table | Embedded arrays | Relational integrity, scalability |
| Stock tracking | Current + History tables | Event sourcing | Simpler implementation, good performance |
| Capacity | Denormalized field | Calculate on query | Performance (frequent checks) |
| Status fields | Enums | String or integers | Type safety, self-documenting |
| Delete strategy | isActive flags | Hard deletes | Preserves history, referential integrity |
| Relationships | Foreign keys | Application-level only | Data integrity at DB level |

### Core Entities

#### Supplier
- `id`: UUID (Primary Key)
- `name`: String
- `contactEmail`: String
- `contactPhone`: String
- `address`: String (optional)
- `isActive`: Boolean
- Relationships: Products, PurchaseOrders

#### Warehouse
- `id`: UUID (Primary Key)
- `name`: String
- `location`: String
- `capacity`: Integer (max items)
- `currentStock`: Integer (current total)
- `isActive`: Boolean
- Relationships: ProductStocks, PurchaseOrders

#### Product
- `id`: UUID (Primary Key)
- `sku`: String (Unique)
- `name`: String
- `description`: String (optional)
- `reorderThreshold`: Integer
- `reorderQuantity`: Integer
- `leadTimeDays`: Integer
- `unitPrice`: Float
- `isActive`: Boolean
- `defaultSupplierId`: Foreign Key
- Relationships: Supplier, ProductStocks, PurchaseOrders, StockMovements

#### ProductStock
- `id`: UUID (Primary Key)
- `productId`: Foreign Key
- `warehouseId`: Foreign Key
- `quantity`: Integer
- `lastUpdated`: DateTime
- Unique constraint on (productId, warehouseId)

#### PurchaseOrder
- `id`: UUID (Primary Key)
- `orderNumber`: String (Unique)
- `productId`: Foreign Key
- `supplierId`: Foreign Key
- `warehouseId`: Foreign Key
- `quantityOrdered`: Integer
- `totalCost`: Float
- `status`: Enum (PENDING, IN_TRANSIT, ARRIVED, CANCELLED)
- `orderDate`: DateTime
- `expectedArrivalDate`: DateTime
- `actualArrivalDate`: DateTime (optional)
- `isAutoGenerated`: Boolean

#### StockMovement (Audit Trail)
- `id`: UUID (Primary Key)
- `productId`: Foreign Key
- `warehouseId`: String
- `movementType`: Enum (PURCHASE_ORDER_ARRIVAL, MANUAL_ADJUSTMENT, etc.)
- `quantity`: Integer (positive/negative)
- `reason`: String (optional)
- `reference`: String (optional)
- `performedBy`: String (optional)
- `createdAt`: DateTime

#### Alert
- `id`: UUID (Primary Key)
- `type`: Enum (LOW_STOCK, CAPACITY_WARNING, etc.)
- `severity`: Enum (INFO, WARNING, ERROR, CRITICAL)
- `message`: String
- `metadata`: JSON (optional)
- `isResolved`: Boolean
- `resolvedAt`: DateTime (optional)

## 📁 Project Structure

```
Souk/
├── inventory-backend/          # Backend microservice
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   │   ├── database.ts
│   │   │   ├── env.ts
│   │   │   ├── rabbitmq.ts
│   │   │   └── redis.ts
│   │   ├── controllers/       # Request handlers
│   │   │   ├── product.controller.ts
│   │   │   ├── purchaseOrder.controller.ts
│   │   │   ├── supplier.controller.ts
│   │   │   └── warehouse.controller.ts
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   │   ├── capacityManager.service.ts
│   │   │   ├── stockMonitor.service.ts
│   │   │   └── [other services]
│   │   ├── schemas/          # Zod validation schemas
│   │   ├── jobs/             # Background jobs
│   │   │   ├── queueWorkers.ts
│   │   │   └── scheduler.ts
│   │   ├── utils/            # Utilities
│   │   └── index.ts          # Entry point
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── migrations/       # Migration files
│   │   └── seed.ts           # Seed data
│   ├── Dockerfile
│   ├── docker-compose.dev.yml
│   ├── package.json
│   └── tsconfig.json
│
├── inventory-frontend/         # Frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Common/       # Shared components
│   │   │   ├── Dashboard/    # Dashboard widgets
│   │   │   ├── Products/     # Product components
│   │   │   ├── PurchaseOrders/
│   │   │   ├── Suppliers/
│   │   │   └── Warehouses/
│   │   ├── services/         # API client
│   │   │   └── api.ts
│   │   ├── hooks/            # Custom React hooks
│   │   ├── types/            # TypeScript types
│   │   ├── utils/            # Utilities
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Entry point
│   ├── public/               # Static assets
│   ├── Dockerfile
│   ├── nginx.conf            # NGINX configuration
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── docker-compose.yml         # Development compose
├── docker-compose.prod.yml    # Production compose
├── Makefile                   # Task automation
├── DOCKER_GUIDE.md           # Detailed Docker guide
├── .env.example              # Environment template
└── README.md                 # This file
```

## ⚙️ Configuration

### Backend Environment Variables

Create `inventory-backend/.env`:

```env
# Server
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/inventory_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# Application
STOCK_CHECK_INTERVAL=5        # Minutes between stock checks
NODE_ENV=development
LOG_LEVEL=info
```

### Frontend Environment Variables

Create `inventory-frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### Production Environment

Create `.env` in project root (for Docker Compose):

```env
# Database
POSTGRES_USER=admin
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=inventory_db

# Redis
REDIS_PASSWORD=<redis-password>

# RabbitMQ
RABBITMQ_USER=admin
RABBITMQ_PASSWORD=<rabbitmq-password>

# Application
STOCK_CHECK_INTERVAL=5
```

**Security Note**: Generate strong passwords using:
```bash
openssl rand -base64 32
```

## 🎯 Available Commands

### Using Make (Recommended)

```bash
# Development
make dev              # Start development environment
make backend-only     # Start only backend infrastructure
make logs             # View all logs
make logs-backend     # View backend logs
make logs-frontend    # View frontend logs

# Production
make prod             # Start production environment
make prod-build       # Build production images
make prod-deploy      # Build and deploy production
make prod-scale       # Scale production services

# Common
make up               # Start all services
make down             # Stop all services
make restart          # Restart all services
make ps               # Show running containers
make stats            # Show resource usage

# Database
make migrate          # Run database migrations
make seed             # Seed database
make db-reset         # Reset database (WARNING)
make backup           # Create database backup
make restore          # Restore from backup

# Shell Access
make shell-backend    # Access backend container
make shell-db         # Access PostgreSQL
make shell-redis      # Access Redis CLI

# Maintenance
make clean            # Stop and remove containers
make clean-all        # Remove containers and volumes
make prune            # Remove unused Docker resources
make rebuild          # Rebuild without cache

# Health & Testing
make health           # Check all service health
make test             # Run backend tests
```

### Using Docker Compose

```bash
# Development
docker-compose up -d
docker-compose logs -f
docker-compose down

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml down

# Specific service
docker-compose restart backend
docker-compose exec backend sh
```

### Using npm Scripts

```bash
# Backend
cd inventory-backend
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
npm test                 # Run tests

# Frontend
cd inventory-frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run linter
```

## 🧪 Testing

### Backend Tests
```bash
# Run tests
cd inventory-backend
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch

# Using Docker
docker-compose exec backend npm test
```

### Manual API Testing
```bash
# Health check
curl http://localhost:3000/health

# Get all products
curl http://localhost:3000/api/products

# Create product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"sku":"TEST-001","name":"Test Product","reorderThreshold":10,"defaultSupplierId":"uuid"}'
```

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000
lsof -i :5432

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Database Connection Failed
```bash
# Check PostgreSQL status
docker-compose ps postgres
docker-compose logs postgres

# Verify DATABASE_URL
docker-compose exec backend env | grep DATABASE_URL

# Test connection
docker-compose exec backend npx prisma db pull
```

### Container Won't Start
```bash
# View logs
docker-compose logs backend

# Rebuild without cache
docker-compose build --no-cache backend
docker-compose up -d backend

# Check disk space
df -h
docker system df
```

### Hot Reload Not Working
```bash
# Verify volume mounts
docker-compose config | grep volumes

# Restart with clean build
docker-compose down
docker-compose up --build
```

### Database Migrations Failed
```bash
# Reset database (WARNING: deletes data)
make db-reset

# Or manually
docker-compose exec backend npx prisma migrate reset
docker-compose exec backend npx prisma migrate deploy
```

### Out of Memory
```bash
# Check resource usage
docker stats

# Increase Docker memory in Docker Desktop settings
# Or add resource limits in docker-compose.yml
```

### Clean Slate (Nuclear Option)
```bash
# Stop everything and remove all data
docker-compose down -v
docker system prune -a --volumes

# Restart fresh
docker-compose up -d --build
```

## 📝 Assumptions and Simplifications

### Design Assumptions

1. **Single-Tenant System**
   - The application is designed for a single organization
   - No multi-tenancy or user authentication/authorization implemented
   - All users have full access to all features

2. **Stock Monitoring**
   - Stock checks run every 5 minutes by default (configurable via `STOCK_CHECK_INTERVAL`)
   - The system assumes accurate stock data entry
   - No barcode scanning or RFID integration for automated stock tracking

3. **Purchase Orders**
   - Automatic purchase orders are created based on simple threshold logic
   - Lead time is static and doesn't account for supplier availability
   - No integration with external supplier systems or procurement platforms
   - Total cost is calculated as: `quantityOrdered × product.unitPrice`
   - No support for bulk pricing, discounts, or price negotiation

4. **Warehouse Capacity**
   - Capacity is measured in total item count, not weight or volume
   - All products are treated as equal size units for capacity calculation
   - No support for different storage zones or temperature-controlled areas
   - Current stock is calculated as sum of all products in warehouse

5. **Inventory Tracking**
   - No support for batch/lot tracking or serial numbers
   - No expiration date tracking for perishable goods
   - Stock movements are logged but not reversible through the UI
   - FIFO/LIFO inventory valuation methods not implemented

### Technical Simplifications

1. **Authentication & Security**
   - No user authentication or authorization system
   - No role-based access control (RBAC)
   - API endpoints are publicly accessible
   - Production deployment requires additional security measures (HTTPS, API keys, etc.)

2. **Data Validation**
   - Basic validation using Zod schemas
   - No duplicate detection for similar product names
   - SKU uniqueness is enforced but format is not standardized
   - Limited validation for business rules (e.g., negative stock allowed in edge cases)

3. **Error Handling**
   - Basic error messages for common scenarios
   - No retry mechanism for failed external service calls
   - RabbitMQ job failures are logged but not automatically retried
   - Partial failure scenarios may leave data in inconsistent states

4. **Real-Time Features**
   - WebSocket implementation is basic
   - No reconnection logic for dropped connections
   - No message queuing for offline clients
   - Stock updates may have slight delays (up to 5 minutes)

5. **Reporting & Analytics**
   - Dashboard shows basic metrics only
   - No historical trending or forecasting
   - No export functionality for reports
   - No integration with business intelligence tools

6. **Scalability**
   - Background jobs run on single backend instance
   - No distributed job processing or locking mechanism
   - Concurrent stock updates may cause race conditions
   - Database queries are not optimized for large datasets (100k+ products)

7. **Data Integrity**
   - No soft deletes (records are permanently deleted)
   - No backup/restore functionality in the UI
   - No audit log for administrative actions
   - No data versioning or change history for products/warehouses

8. **Integration**
   - No email notifications for alerts or purchase orders
   - No SMS/push notification support
   - No integration with accounting systems
   - No REST API webhooks for external systems

9. **Testing**
   - Limited test coverage
   - No end-to-end (E2E) tests
   - No load/performance testing
   - Manual testing required for critical workflows

10. **Deployment**
    - Development and production use same Docker setup with minimal differences
    - No CI/CD pipeline configured
    - No blue-green or canary deployment strategies
    - Manual database migrations required
    - No automated monitoring or alerting infrastructure

### Known Limitations

- **Performance**: Not optimized for more than 10,000 products or 1,000 warehouses
- **Concurrency**: Race conditions possible when multiple orders arrive simultaneously
- **Data Loss**: No transaction rollback mechanism for complex operations
- **Browser Support**: Tested only on modern Chrome, Firefox, and Safari
- **Mobile**: UI is responsive but not optimized for mobile usage
- **Internationalization**: No multi-language or multi-currency support
- **Time Zones**: All dates/times stored in UTC, display in local time
- **File Uploads**: No support for product images or document attachments

### Future Enhancements

Potential improvements for production deployment:
- User authentication with JWT or OAuth2
- Role-based access control
- Barcode/QR code scanning for stock management
- Email notifications for alerts and order updates
- Advanced reporting with data export (CSV, Excel, PDF)
- Batch operations for bulk updates
- Product image uploads and management
- Mobile-optimized interface or native app
- Integration with ERP systems
- Machine learning for demand forecasting
- Multi-currency and multi-language support

## 📖 Additional Resources

- [Docker Guide](./DOCKER_GUIDE.md) - Comprehensive Docker deployment guide
- [Prisma Documentation](https://www.prisma.io/docs)
- [Fastify Documentation](https://www.fastify.io/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues, questions, or contributions:
1. Check this README and [DOCKER_GUIDE.md](./DOCKER_GUIDE.md)
2. Review logs: `make logs` or `docker-compose logs -f`
3. Check service health: `make health`
4. Open an issue on GitHub

---

