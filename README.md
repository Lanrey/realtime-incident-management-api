# Inventory Management System

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
- **Real-time Updates**: Server-Sent Events (SSE) for live inventory updates
- **Message Queue**: RabbitMQ for asynchronous job processing
- **Caching Layer**: Redis for improved performance
- **Database Migrations**: Prisma ORM with automated migrations
- **Containerized Deployment**: Full Docker support with development and production configurations
- **Type Safety**: Full TypeScript implementation across the stack
- **RESTFul API**: Well-documented API endpoints with Joi validation

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
                             │ HTTP/REST API + SSE
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
   │Postgres│  │ Redis  │  │ RabbitMQ │  │    SSE    │
   │ :5432  │  │ :6379  │  │ :5672    │  │  Real-time│
   │        │  │        │  │          │  │  Events   │
   └────────┘  └────────┘  └──────────┘  └───────────┘
```

### Architecture Layers

#### 1. **Presentation Layer (Frontend)**
- **Technology**: React 18 with TypeScript, Vite
- **State Management**: TanStack Query for server state, React hooks for local state
- **Styling**: Tailwind CSS for responsive design
- **Communication**: Axios for REST API, EventSource API for SSE real-time updates
- **Routing**: React Router for client-side navigation

#### 2. **API Layer (Backend Controllers & Routes)**
- **Technology**: Fastify web framework
- **Validation**: Joi schemas for request/response validation
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

**Server-Sent Events (SSE)**
- Real-time stock updates
- Live alert notifications
- Purchase order status changes
- Automatic reconnection handling
- Lower resource overhead than WebSocket

### Data Flow Examples

#### Example 1: Creating a Purchase Order
```
User → Frontend → POST /api/purchase-orders → Controller
  → Validation (Joi) → PurchaseOrderService → Check Capacity
  → Prisma → PostgreSQL (Insert) → Update Warehouse Stock
  → SSE Event Broadcast → Frontend Update → User Notification
```

#### Example 2: Automatic Reordering (Background Job)
```
Scheduler (Every 5 min) → StockMonitorService → Query Low Stock Products
  → Check Each Product Against Threshold → Create Purchase Order
  → RabbitMQ Job Queue → Process Order Creation → Update Database
  → Create Alert → SSE Event Broadcast → Frontend Shows Alert
```

### Key Components

- **Frontend**: React 18 with TypeScript, TanStack Query, React Router, Tailwind CSS
- **Backend**: Fastify with TypeScript, Prisma ORM, Zod validation
- **Database**: PostgreSQL with full-text search and indexing
- **Cache**: Redis for session management and caching
- **Message Queue**: RabbitMQ for asynchronous task processing
- **Real-time**: Server-Sent Events (SSE) for live updates

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

### Dashboard Design Flow

#### Warehouse Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Warehouses Dashboard                        │
├─────────────────────────────────────────────────────────────────┤
│  Header: "Warehouses" + [Add Warehouse] Button                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Warehouse List Table                                   │    │
│  │  ┌──────┬──────────┬────────────┬──────────┬─────────┐ │    │
│  │  │ Name │ Location │ Capacity   │ Current  │ Actions │ │    │
│  │  │      │          │            │ Stock    │         │ │    │
│  │  ├──────┼──────────┼────────────┼──────────┼─────────┤ │    │
│  │  │ WH-1 │ NYC      │ 10,000     │ 7,500    │ [View]  │ │    │
│  │  │      │          │            │ (75%)    │ [Edit]  │ │    │
│  │  │      │          │            │ 🟡       │ [Del]   │ │    │
│  │  ├──────┼──────────┼────────────┼──────────┼─────────┤ │    │
│  │  │ WH-2 │ LA       │ 5,000      │ 2,100    │ [View]  │ │    │
│  │  │      │          │            │ (42%)    │ [Edit]  │ │    │
│  │  │      │          │            │ 🟢       │ [Del]   │ │    │
│  │  └──────┴──────────┴────────────┴──────────┴─────────┘ │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Capacity Indicators:                                           │
│  🟢 Green  (0-60%):  Normal capacity                            │
│  🟡 Yellow (61-80%): Warning - approaching limit                │
│  🔴 Red    (81-100%): Critical - near/at capacity               │
└─────────────────────────────────────────────────────────────────┘

User Actions:
1. [Add Warehouse] → Opens Create Warehouse Form
2. [View] → Navigate to Warehouse Detail Page
3. [Edit] → Opens Edit Warehouse Form
4. [Delete] → Confirmation modal → Delete warehouse

┌─────────────────────────────────────────────────────────────────┐
│              Warehouse Detail View (Click on [View])            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Warehouse: WH-1 NYC                        [Edit] [Back]       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Overview                                                 │   │
│  │ • Name: Main Warehouse NYC                               │   │
│  │ • Location: 123 Industrial Blvd, New York, NY           │   │
│  │ • Capacity: 10,000 units                                │   │
│  │ • Current Stock: 7,500 units (75%)                      │   │
│  │ • Available Space: 2,500 units                          │   │
│  │ • Status: Active 🟢                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Capacity Visualization                                   │   │
│  │  ┌────────────────────────────────────────────────────┐ │   │
│  │  │██████████████████████████████░░░░░░░░░░            │ │   │
│  │  │ Used: 7,500       Available: 2,500                 │ │   │
│  │  └────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Products Stored in This Warehouse                        │   │
│  │  ┌─────────┬──────────────┬──────────┬──────────────┐   │   │
│  │  │ SKU     │ Product Name │ Quantity │ Reorder Level│   │   │
│  │  ├─────────┼──────────────┼──────────┼──────────────┤   │   │
│  │  │ PROD-01 │ Widget A     │ 2,500    │ 🟢 Normal    │   │   │
│  │  │ PROD-02 │ Widget B     │ 5,000    │ 🟢 Normal    │   │   │
│  │  │ PROD-03 │ Gadget C     │ 45       │ 🔴 Low       │   │   │
│  │  └─────────┴──────────────┴──────────┴──────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Recent Purchase Orders for This Warehouse                │   │
│  │  ┌──────────────┬──────────┬────────┬─────────────────┐ │   │
│  │  │ Order #      │ Product  │ Qty    │ Status          │ │   │
│  │  ├──────────────┼──────────┼────────┼─────────────────┤ │   │
│  │  │ PO-20241115-1│ Widget A │ 500    │ 🟡 In Transit   │ │   │
│  │  │ PO-20241114-2│ Widget B │ 1,000  │ ✅ Arrived      │ │   │
│  │  └──────────────┴──────────┴────────┴─────────────────┘ │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│         Create/Edit Warehouse Form (Modal or New Page)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Add New Warehouse                            [X] Close         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Warehouse Name *                                        │    │
│  │ [_____________________________]                         │    │
│  │                                                          │    │
│  │ Location *                                              │    │
│  │ [_____________________________]                         │    │
│  │                                                          │    │
│  │ Maximum Capacity (units) *                              │    │
│  │ [_____________________________]                         │    │
│  │ ℹ️  Total number of items this warehouse can hold      │    │
│  │                                                          │    │
│  │ Status                                                  │    │
│  │ ☑ Active                                                │    │
│  │                                                          │    │
│  │                    [Cancel]  [Create Warehouse]         │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Validation Rules:                                              │
│  • All fields marked with * are required                        │
│  • Capacity must be a positive integer                          │
│  • Name and location must be unique                             │
└─────────────────────────────────────────────────────────────────┘
```

**Warehouse Management User Flow:**
1. User navigates to "Warehouses" from sidebar
2. System displays list of all warehouses with capacity indicators
3. User can:
   - **Add new warehouse**: Click [Add Warehouse] → Fill form → Submit
   - **View details**: Click [View] → See warehouse overview, products, orders
   - **Edit warehouse**: Click [Edit] → Modify details → Save
   - **Delete warehouse**: Click [Delete] → Confirm → Remove (if no active stock)
4. System validates:
   - Warehouse capacity constraints
   - Prevents deletion if products are stored
   - Updates capacity indicators in real-time
5. Dashboard shows color-coded capacity status:
   - Green: Healthy capacity usage
   - Yellow: Approaching capacity limit (80%+)
   - Red: Critical capacity (90%+) or exceeded

#### Supplier Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Suppliers Dashboard                         │
├─────────────────────────────────────────────────────────────────┤
│  Header: "Suppliers" + [Add Supplier] Button                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Supplier List Table                                    │    │
│  │  ┌─────────┬───────────────┬────────────┬────────────┐ │    │
│  │  │ Name    │ Contact Email │ Phone      │ Actions    │ │    │
│  │  ├─────────┼───────────────┼────────────┼────────────┤ │    │
│  │  │ Acme Co │ sales@acme.com│ 555-0100   │ [View]     │ │    │
│  │  │ 🟢      │               │            │ [Edit]     │ │    │
│  │  │         │               │            │ [Deact.]   │ │    │
│  │  ├─────────┼───────────────┼────────────┼────────────┤ │    │
│  │  │ Widget  │ info@widget..│ 555-0200   │ [View]     │ │    │
│  │  │ Supply  │               │            │ [Edit]     │ │    │
│  │  │ 🟢      │               │            │ [Deact.]   │ │    │
│  │  ├─────────┼───────────────┼────────────┼────────────┤ │    │
│  │  │ Global  │ contact@globa│ 555-0300   │ [View]     │ │    │
│  │  │ Parts   │               │            │ [Edit]     │ │    │
│  │  │ 🔴      │               │            │ [Activate] │ │    │
│  │  └─────────┴───────────────┴────────────┴────────────┘ │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Status Indicators:                                             │
│  🟢 Active - Available for purchase orders                      │
│  🔴 Inactive - Not available for new orders                     │
└─────────────────────────────────────────────────────────────────┘

User Actions:
1. [Add Supplier] → Opens Create Supplier Form
2. [View] → Navigate to Supplier Detail Page
3. [Edit] → Opens Edit Supplier Form
4. [Deactivate/Activate] → Toggle supplier status

┌─────────────────────────────────────────────────────────────────┐
│              Supplier Detail View (Click on [View])             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Supplier: Acme Corporation                 [Edit] [Back]       │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Contact Information                                      │   │
│  │ • Company Name: Acme Corporation                         │   │
│  │ • Email: sales@acmecorp.com                             │   │
│  │ • Phone: +1 (555) 123-0100                              │   │
│  │ • Address: 456 Supply Chain Ave, Los Angeles, CA       │   │
│  │ • Status: Active 🟢                                      │   │
│  │ • Joined: January 15, 2024                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Supplier Performance Metrics                             │   │
│  │  ┌────────────────────┬────────────────────────────┐    │   │
│  │  │ Total Orders       │ 47                         │    │   │
│  │  │ Active Orders      │ 3 (In Transit)             │    │   │
│  │  │ Completed Orders   │ 42                         │    │   │
│  │  │ Cancelled Orders   │ 2                          │    │   │
│  │  │ Products Supplied  │ 12                         │    │   │
│  │  │ Average Lead Time  │ 5 days                     │    │   │
│  │  └────────────────────┴────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Products Supplied by This Supplier                       │   │
│  │  ┌─────────┬────────────────┬────────────┬───────────┐  │   │
│  │  │ SKU     │ Product Name   │ Unit Price │ Lead Time │  │   │
│  │  ├─────────┼────────────────┼────────────┼───────────┤  │   │
│  │  │ PROD-01 │ Widget A       │ $29.99     │ 5 days    │  │   │
│  │  │ PROD-02 │ Widget B       │ $34.99     │ 5 days    │  │   │
│  │  │ PROD-05 │ Component X    │ $12.50     │ 7 days    │  │   │
│  │  │ PROD-08 │ Assembly Kit Y │ $89.99     │ 10 days   │  │   │
│  │  └─────────┴────────────────┴────────────┴───────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Purchase Order History                                   │   │
│  │  ┌──────────────┬──────────┬────────┬─────────────────┐ │   │
│  │  │ Order #      │ Product  │ Qty    │ Status          │ │   │
│  │  ├──────────────┼──────────┼────────┼─────────────────┤ │   │
│  │  │ PO-20241115-1│ Widget A │ 500    │ 🟡 In Transit   │ │   │
│  │  │ PO-20241114-3│ Widget B │ 1,000  │ 🟡 In Transit   │ │   │
│  │  │ PO-20241112-5│ Comp. X  │ 200    │ ✅ Arrived      │ │   │
│  │  │ PO-20241110-2│ Kit Y    │ 50     │ ✅ Arrived      │ │   │
│  │  │ PO-20241108-7│ Widget A │ 500    │ ✅ Arrived      │ │   │
│  │  └──────────────┴──────────┴────────┴─────────────────┘ │   │
│  │  [View All Orders]                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│         Create/Edit Supplier Form (Modal or New Page)           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Add New Supplier                             [X] Close         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Company Name *                                          │    │
│  │ [_____________________________]                         │    │
│  │                                                          │    │
│  │ Contact Email *                                         │    │
│  │ [_____________________________]                         │    │
│  │ ℹ️  Primary contact email for orders                   │    │
│  │                                                          │    │
│  │ Contact Phone *                                         │    │
│  │ [_____________________________]                         │    │
│  │                                                          │    │
│  │ Address                                                 │    │
│  │ [_____________________________]                         │    │
│  │ [_____________________________]                         │    │
│  │ [_____________________________]                         │    │
│  │                                                          │    │
│  │ Status                                                  │    │
│  │ ☑ Active (Available for purchase orders)               │    │
│  │                                                          │    │
│  │                    [Cancel]  [Create Supplier]          │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Validation Rules:                                              │
│  • All fields marked with * are required                        │
│  • Email must be valid format                                   │
│  • Phone must be valid format                                   │
│  • Company name should be unique                                │
└─────────────────────────────────────────────────────────────────┘
```

**Supplier Management User Flow:**
1. User navigates to "Suppliers" from sidebar
2. System displays list of all suppliers with status indicators
3. User can:
   - **Add new supplier**: Click [Add Supplier] → Fill form → Submit
   - **View details**: Click [View] → See supplier info, products, order history
   - **Edit supplier**: Click [Edit] → Modify contact details → Save
   - **Activate/Deactivate**: Click [Deactivate/Activate] → Toggle status
4. System validates:
   - Valid email and phone formats
   - Prevents deletion if supplier has active purchase orders
   - Prevents deactivation if supplier is default for active products
5. Integration with Products:
   - When creating a product, user selects default supplier from dropdown
   - Automatic purchase orders use product's default supplier
   - Supplier detail page shows all products they supply
6. Integration with Purchase Orders:
   - Supplier detail page shows order history and performance metrics
   - Can filter purchase orders by supplier
   - Active orders (PENDING/IN_TRANSIT) highlighted in supplier view

### Advanced Features

**Server-Sent Events (SSE) Real-Time Updates**
- Stock levels update automatically without page refresh
- New alerts appear instantly
- Purchase order status changes reflect immediately
- Automatic reconnection on connection loss
- Lower latency and resource usage compared to polling

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

#### System & Real-time
```
GET    /health                    - Health check endpoint
GET    /api/alerts                - Get system alerts
GET    /api/events                - SSE endpoint for real-time updates
GET    /api/events/stats          - Get connected SSE clients stats
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

## 🔴 Real-Time Updates with Server-Sent Events (SSE)

### Overview

Souk implements Server-Sent Events (SSE) for real-time, unidirectional server-to-client communication. SSE provides automatic updates to connected clients without the complexity of WebSocket bidirectional communication.

### Why SSE Over WebSocket?

**Advantages of SSE:**
- **Simpler Implementation**: Built on standard HTTP, no special protocol required
- **Automatic Reconnection**: Browser's EventSource API handles reconnection natively
- **Better Compatibility**: Works through proxies and firewalls more reliably
- **Lower Resource Usage**: No need for full-duplex communication overhead
- **Perfect Fit**: Our use case only requires server-to-client updates (no client-to-server needed)

### SSE Architecture

#### Connection Endpoint
```
GET /api/events
```

Clients connect via the EventSource API:
```javascript
const eventSource = new EventSource('http://localhost:3000/api/events');

// Listen to specific event types
eventSource.addEventListener('stock', (event) => {
  const data = JSON.parse(event.data);
  console.log('Stock updated:', data);
});

eventSource.addEventListener('alert', (event) => {
  const data = JSON.parse(event.data);
  console.log('New alert:', data);
});
```

#### Event Types Broadcasted

| Event Type | Description | Data Structure |
|------------|-------------|----------------|
| `connected` | Initial connection confirmation | `{ clientId, timestamp }` |
| `stock` | Stock level changed | `{ productId, warehouseId, quantity, productName, warehouseName }` |
| `alert` | New alert or alert resolved | `{ id, type, severity, message, metadata, resolved? }` |
| `order` | Purchase order created/updated | `{ id, orderNumber, productId, warehouseId, status, isAutoGenerated }` |
| `warehouse` | Warehouse capacity changed | `{ id, name, currentStock, capacity, percentage }` |
| `: heartbeat` | Keep-alive ping (every 30s) | (comment, no data) |

#### Internal Event System

Souk uses an internal EventEmitter (`appEvents`) to decouple event broadcasting:

```typescript
// In service layer
import { appEvents } from '../utils/eventEmitter';

// Emit events when data changes
appEvents.emitAlertResolved({
  id: alert.id,
  type: alert.type
});

// SSE route automatically broadcasts to all connected clients
```

#### Connection Management

**Features:**
- Each client receives a unique `clientId` on connection
- Heartbeat messages sent every 30 seconds to keep connection alive
- Automatic cleanup on client disconnect
- Error handling for failed message delivery
- Connection statistics available at `/api/events/stats`

**Connection Flow:**
```
1. Client connects → GET /api/events
2. Server responds with SSE headers (text/event-stream)
3. Server sends "connected" event with clientId
4. Server registers event listeners for all event types
5. Server sends heartbeat every 30 seconds
6. On client disconnect → cleanup listeners and remove from active clients
```

#### Monitoring Connected Clients

```bash
# Get statistics on connected clients
curl http://localhost:3000/api/events/stats

# Response:
{
  "connectedClients": 3,
  "clients": [
    { "id": "client-1234567890-abc123", "connected": true },
    { "id": "client-1234567891-def456", "connected": true },
    { "id": "client-1234567892-ghi789", "connected": true }
  ]
}
```

### Implementation Details

**Backend Components:**
- `inventory-backend/src/routes/sse.routes.ts` - SSE endpoint and connection management
- `inventory-backend/src/utils/eventEmitter.ts` - Internal event bus
- `inventory-backend/src/services/*.service.ts` - Services emit events on data changes

**Event Broadcasting:**
```typescript
// Service emits event
appEvents.emitOrderCreated({
  id: order.id,
  orderNumber: order.orderNumber,
  productId: order.productId,
  warehouseId: order.warehouseId,
  status: order.status,
  isAutoGenerated: order.isAutoGenerated
});

// SSE route automatically sends to all connected clients
// No additional code needed!
```

### Testing SSE

**Using curl:**
```bash
# Connect and listen for events
curl -N http://localhost:3000/api/events

# You'll see:
event: connected
data: {"clientId":"client-1234567890-abc123","timestamp":"2024-10-16T12:00:00.000Z"}

: heartbeat

event: alert
data: {"id":"alert-1","type":"LOW_STOCK","severity":"WARNING","message":"Product Widget A low in stock"}
```

**Using browser console:**
```javascript
const es = new EventSource('http://localhost:3000/api/events');
es.onopen = () => console.log('Connected!');
es.onerror = (e) => console.error('Error:', e);
es.onmessage = (e) => console.log('Event:', e);
```

### Performance Characteristics

- **Latency**: < 100ms from event to client notification
- **Scalability**: Supports 100+ concurrent connections per backend instance
- **Resource Usage**: ~1KB memory per connected client
- **Reconnection**: Automatic with exponential backoff (EventSource default)

### Error Handling

**Client Disconnection:**
- Automatic cleanup of event listeners
- Client removed from active connections set
- Heartbeat timer cleared

**Message Delivery Failure:**
- Error logged with client ID and event type
- Failed client automatically disconnected and cleaned up
- No retry for individual messages (client reconnects and receives latest state)

**Server Restart:**
- Clients automatically reconnect via EventSource
- No data loss for persistent state (database-backed)
- Temporary alerts may be missed (acceptable for real-time notifications)

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

**Step 5: Broadcast via SSE**
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

### Entity Relationship Diagram (ERD)

View the complete database schema and entity relationships:

![Souk Inventory ERD](./Souk-ERD.png)

<sub>Open full-size image: <a href="./Souk-ERD.png">Souk-ERD.png</a></sub>

**[📊 Interactive ERD on diagrams.net](https://app.diagrams.net/?&highlight=0000ff&edit=_blank&layers=1&nav=1&title=exported_from_idea.drawio#R7Ztbb9s2FMff9ykEDwjaB9e6%2B6K4QHpZN2CXbumw9SmgJdriQokqSTV2P%2F0OSdmWY9lz7EF1g8AITJFHFHX0%2F51zJMWX2fwdR0X6C0swtZL5uGN3rGShv2acJOOOYxrX5AuGDdVdkgQLPSAZo5IUZiNmeY5jqduIc3ZnuqeMmlkKNMN6XtW4jhHFunuC4tsZZ2UOVjnLccfKkEy1oUhRwu5U8%2BV3lnXJGZOqAc1s%2FhpTaqn1gV1vu1sfj%2BNc7jLI4YS9tRHYf8Zc4rlpIlrC6i6ojApLyAUs9eJTyWSUIT4j%2Bcgu5lWzK1kx8mETdpVdRMksH8UwI%2BaR2eNiBn8wz0Q1bgpORIZuMjLjSBKWCzXUmyyNesWylXJLKI%2BbSRzz1VuONi%2FKUh%2B1Fkpy3E0xmaVy5LwIayux4hTHt6LMRnCOPE4Rfxb6z%2FX6uJ7dmpKciBQnN0iOLEkyLCTKCuuOyFRvWl%2FgGtV3WJ3LTY4yvJ7XDYKNiSmbCZgR3FTv5YxSOJgSwcFHhHG4UoevEBUFJWAvJC7ETQxSgx0JXKMZ5u14nSRrv3jh8%2FVBO9WUHSU%2BAkxcKQWNQVSR1tKY4qmMGIxOKZAwJZRGU5ZLTaPj6%2FYPKCN0Mf4R089YzRGlMqNjJ9JM4WRsRxVHdhSzjMTwTdEE01cr8F4zyvhYwRcJydkt%2FoskgKATdQw3mpx3mGVY8oWlEAmGHQuChD8AuO60cccdhB3LnD5seC4EAQgAs2qvNYM9A2Ezkf22iYQoxGXrFMpFAaRcgGwj3alXoTrXXRuCx%2BAJIhdbuywHmncDMgSE2m3o4IqgBEk0sv4RLJ%2FUh4j4AwsGSgLFTiC6Y5Rv4FoNXtXRe%2BZtgB5zjGSzSTukLU%2F3m0ZsMNCEdV17jZgzGJ6OmNs2YgVnSRlLCL8MUk%2FbqFVH%2FynZxuAO3JCyUuCmwU8lyqVmrpYpVrkMCflnkSiZP4n8lDzi%2B1rl%2FWG4Fvmwvxa5E9pHidz5SiJvXd7ittzWrinE7vdC0R5zUqhSraEOw4wnmH9IIcKnULE3yr4y%2Bn0vGhglH4CIN2ghGg3KnMj3nMSwgoSVE4oBURwTAcvaTERXsSSfcWMaSvAUlVRel7qy40387slCq5UYgp8S1UkM%2B4FG2HHcGsLBGmHPHRyFsN86wqUq0AW%2B0SJvnWR91F%2FLbIL5tpr3ZDGxB4KDMtxv6sC4mXjJJKKvmZD7YQV0ZCnq5anxoe5uLk61wRvgbzefeF7gWAHKOYGLvt8YxbIEZA4xzZnEDbeiEHFKyd7hHHOT2BsCz1NUaSmqdB3f03Fl2F%2BXBm5gr%2BOKbx9XGthtxxVd995k4OIMbL6ZAni54A%2F37lWX%2FbtvV%2FeWzgCQaC5AphCF8rihcClAm4xnOHm1eFCef8LtYNzc0NDm2P5gjZtXv90MwqNwC1vHrcqHrYPWXHXHcEEhN73NUKE7R9%2BncKm2R1GSQDnenKp2F8dPOaq1HOU5TQ9p%2FofnoEHb1KxSwZlgQ1mMmu9UY1SgeFd2iUuuvHatUm6jwRM5Z0FO39l6f3AyNziZKW7UVx2VDZIEg5s8vHoQKsH5WK4eGVW%2BvHf%2BTqSmvNZjjMuUzViO6NtlX5Qg9b5MuUm9l7pSbz6NL3CemK0JqPlWbRq3u5WXjNu%2BD4bqE%2BE5kX%2BP7Rf9wNbtj9C2bdN%2BMx9XjYVq5OAQZRrY1cbHsWNs1YYx1i1l3XgNKp%2FX62nV5pgiRYd5h1t3%2F3ISmAbOCS30aMGAMFEb0wd5r3p1UTE0V7mvSofeTivffYiVt8%2FK2WF12dOLXnmit3bFf6lKS92rPTSvZFaLydWLbzSh5v12Jbx14U2SlbbU3j%2BrKSPI7OSL3sdeEldDdpvnumaq51%2B7yzknNH4I%2B0dh5B%2BPUXAmGLmPBiNnaGrzfn8vIG6j0anKd8NN5fuHKL9%2BX9m69h3bOUn7zgO072xqPzwT7Qf2wdrX2eaMtb8M6PukP2wyOVX4g03dO4fofvu1RPuR3zyNP1L79gO0759n%2BTTwvEcS98PgkVRP94on%2B8yLJ0fBo9zgHgdReDxE55JAwAWHQuSedwLpLsuB4V5AusPBA6z8%2FVYDv9Hq5JuQeykpPIQj8RVzUdfpV9loeBxJ7vEkBd9eKXbm6ajrDL7ebYjjb2rfPfvbkK6j%2FldeuWJwnPi9B4jfPs9a7PGI3xu4j6UYszdJ8s68GvPsqhrzD8Losmd%2BJKLdsvpdy8t%2FAQ%3D%3D#%7B%22pageId%22%3A%22e3cvxCK0qKaoln1zC0ir%22%7D)**

This ERD visualizes:
- All database entities (tables) with their fields and data types
- Primary and foreign key relationships
- One-to-many and many-to-many relationships
- Cardinality and relationship constraints
- Junction tables (e.g., ProductStock linking Products and Warehouses)

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

Souk includes comprehensive test suites for both backend and frontend, covering unit tests, integration tests, and edge cases.

### Testing Infrastructure

#### Backend Testing (Jest + Supertest)
- **Framework**: Jest 29 with ts-jest
- **HTTP Testing**: Supertest for integration tests
- **Coverage**: Configured for comprehensive code coverage reporting
- **Test Types**: Unit tests for services, integration tests for routes/endpoints

#### Frontend Testing (Vitest + React Testing Library)
- **Framework**: Vitest 3 with jsdom environment
- **Component Testing**: React Testing Library 16
- **User Interactions**: @testing-library/user-event
- **Coverage**: v8 coverage provider

### Backend Tests

#### Running Tests
```bash
# Run all tests
cd inventory-backend
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test alert.service.test

# Watch mode (re-runs on file changes)
npm test -- --watch

# Using Docker
docker-compose exec backend npm test
```

#### Test Structure
```
inventory-backend/src/__tests__/
├── setup.ts                          # Global test configuration
├── unit/                             # Unit tests
│   ├── alert.service.test.ts         # Alert service tests
│   ├── product.service.test.ts       # Product service tests
│   └── purchaseOrder.service.test.ts # Purchase order service tests
└── integration/                      # Integration tests
    ├── alert.routes.test.ts          # Alert API endpoint tests
    ├── product.routes.test.ts        # Product API endpoint tests
    └── purchaseOrder.routes.test.ts  # Purchase order API endpoint tests
```

#### Test Coverage

**Unit Tests** - Business Logic Layer:
- ✅ Alert Service (13 test cases)
  - Pagination and filtering (type, severity, resolved status)
  - Alert statistics aggregation
  - Resolve by ID and bulk resolve by type
  - Product and warehouse alert queries
  - Edge cases: empty results, null values, metadata filtering

- ✅ Product Service (15 test cases)
  - CRUD operations with validation
  - Search and filtering (by supplier, status, search term)
  - Stock level queries and calculations
  - Caching behavior (Redis integration)
  - Low stock product detection with deficit calculation
  - Edge cases: pending order checks, capacity constraints

- ✅ Purchase Order Service (18 test cases)
  - Order creation with capacity validation
  - Quantity adjustment based on warehouse capacity
  - Expected arrival date calculation
  - Order number collision retry mechanism
  - Status transitions (PENDING → IN_TRANSIT → ARRIVED)
  - Cancellation validation
  - Statistics aggregation
  - Edge cases: large quantities, concurrent operations, invalid data

**Integration Tests** - API Layer:
- ✅ Alert Endpoints (15 test cases)
  - GET /api/alerts with pagination and filtering
  - GET /api/alerts/statistics for dashboard
  - GET /api/alerts/:id for individual alerts
  - POST /api/alerts/:id/resolve
  - DELETE /api/alerts/:id
  - Error handling and validation
  - Edge cases: concurrent resolves, invalid parameters

- ✅ Product Endpoints (17 test cases)
  - GET /api/products with search and filters
  - POST /api/products with validation
  - GET /api/products/:id with caching
  - GET /api/products/:id/stock
  - PUT /api/products/:id
  - DELETE /api/products/:id with constraint checks
  - GET /api/products/low-stock
  - Edge cases: duplicate SKU, missing supplier, special characters

- ✅ Purchase Order Endpoints (18 test cases)
  - GET /api/purchase-orders with multi-filter support
  - POST /api/purchase-orders with capacity validation
  - GET /api/purchase-orders/:id
  - PUT /api/purchase-orders/:id
  - POST /api/purchase-orders/:id/arrive (RabbitMQ integration)
  - POST /api/purchase-orders/:id/cancel
  - GET /api/purchase-orders/pending
  - GET /api/purchase-orders/statistics
  - Edge cases: order number collision, concurrent cancellations

**Total Backend Coverage**: 76 test cases covering critical business logic and API endpoints

### Frontend Tests

#### Running Tests
```bash
# Run all tests
cd inventory-frontend
npm test

# Run with UI (interactive test explorer)
npm run test:ui

# Run with coverage report
npm run test:coverage

# Watch mode (default with npm test)
npm test

# Run specific test file
npm test AlertCard.test
```

#### Test Structure
```
inventory-frontend/src/tests/
├── setup.ts              # Global test configuration & mocks
├── testUtils.tsx         # Custom render with providers
└── unit/                 # Component unit tests
    └── AlertCard.test.tsx    # Alert card component tests
```

#### Test Coverage

**Unit Tests** - React Components:
- ✅ AlertCard Component (24 test cases)
  - Severity level rendering (CRITICAL, ERROR, WARNING, INFO)
  - Alert type icons and labels
  - Metadata display (stock levels, capacity, order numbers)
  - Action buttons (resolve, delete)
  - Resolved state handling
  - Timestamp formatting (relative and absolute)
  - Edge cases: missing metadata, null values, capacity calculations
  - User interactions: button clicks, callbacks

**Test Utilities**:
- Custom render function with React Query and Router providers
- Mock window APIs (matchMedia, IntersectionObserver, ResizeObserver)
- Test query client configuration for deterministic tests

**Total Frontend Coverage**: 24 test cases with plans for comprehensive component coverage

### Test Configuration

#### Backend (jest.config.js)
```javascript
{
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts', '!src/index.ts'],
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 10000
}
```

#### Frontend (vite.config.ts)
```javascript
{
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
}
```

### Key Testing Decisions

1. **Mocking Strategy**
   - Database: Prisma Client fully mocked in unit tests
   - Cache: Redis mocked for predictable tests
   - Queue: RabbitMQ publish calls mocked
   - External Services: Capacity manager mocked to isolate tests

2. **Test Data Isolation**
   - Each test uses fresh mock data
   - No shared state between tests
   - Automatic cleanup after each test

3. **Edge Case Coverage**
   - Null/undefined handling
   - Empty result sets
   - Concurrent operations
   - Boundary conditions (capacity limits, thresholds)
   - Invalid input validation
   - Error scenarios

4. **Integration Test Approach**
   - Use Fastify test injection (no actual HTTP server)
   - Mock Prisma but test full request/response cycle
   - Verify request validation and error handling
   - Test endpoint security and authorization (when implemented)

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

# Get alert statistics
curl http://localhost:3000/api/alerts/statistics

# Create purchase order
curl -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -d '{
    "productId":"product-uuid",
    "supplierId":"supplier-uuid",
    "warehouseId":"warehouse-uuid",
    "quantityOrdered":100
  }'
```

### CI/CD Integration

Tests are designed to run in CI/CD pipelines:
```bash
# Backend CI
cd inventory-backend && npm test -- --coverage --ci

# Frontend CI
cd inventory-frontend && npm test -- --coverage --run
```

### Future Testing Enhancements

Planned improvements:
- [ ] E2E tests with Playwright or Cypress
- [ ] Load testing with k6 or Artillery
- [ ] API contract testing with Pact
- [ ] Visual regression testing for UI components
- [ ] Mutation testing for code quality assessment
- [ ] Performance benchmarking for critical paths

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

## 🆕 Recent Changes and Decisions

### Latest Updates (October 2024)

#### 1. Server-Sent Events (SSE) Implementation
**What Changed**: Implemented SSE for real-time updates, replacing previous WebSocket approach

**Features:**
- SSE endpoint at `/api/events` with automatic connection management
- Internal event emitter system for decoupled event broadcasting
- Six event types: `connected`, `stock`, `alert`, `order`, `warehouse`, `heartbeat`
- Heartbeat every 30 seconds to maintain connections
- Client statistics endpoint at `/api/events/stats`
- Automatic cleanup on client disconnect
- Integrated with alert service to broadcast resolved alerts

**Why**: SSE provides simpler, more reliable real-time updates than WebSocket for our unidirectional use case. Benefits include:
- Native browser reconnection handling
- Better proxy/firewall compatibility
- Lower resource overhead
- Simpler implementation
- Perfect for server-to-client only communication

**Impact**:
- Real-time alerts without page refresh
- Live stock level updates across all clients
- Purchase order status changes broadcast instantly
- Reduced server resource usage vs WebSocket
- Improved reliability through native reconnection

**Testing Updates:**
- Added mock for `appEvents` event emitter in test setup
- Added test case for SSE event emission in alert service
- Mocked environment configuration to prevent test validation errors
- All 21 alert service tests passing with SSE integration

#### 2. Comprehensive Testing Infrastructure
**What Changed**: Added full test suites for both backend and frontend with 100+ test cases

**Backend Testing**:
- Jest 29 + ts-jest + Supertest configuration
- 76 test cases across services and API endpoints
- Unit tests for Alert, Product, and PurchaseOrder services
- Integration tests for all major API routes
- Mock setup for Prisma, Redis, and RabbitMQ

**Frontend Testing**:
- Vitest 3 + React Testing Library setup
- Custom test utilities with provider wrappers
- 24 test cases for AlertCard component
- Mock configuration for browser APIs

**Why**: Ensure code quality, prevent regressions, and provide confidence in deployments. Testing infrastructure enables CI/CD pipeline integration and faster development cycles.

**Impact**:
- Developers can run `npm test` to validate changes
- Coverage reports identify untested code paths
- Automated tests catch bugs before production
- Documentation through test cases

#### 2. Enhanced Alert System
**What Changed**: Implemented granular alert management with detailed metadata

**Features**:
- 5 alert types: LOW_STOCK, CAPACITY_WARNING, CAPACITY_EXCEEDED, ORDER_DELAYED, SYSTEM_ERROR
- 4 severity levels: INFO, WARNING, ERROR, CRITICAL
- Rich metadata support (product details, warehouse info, stock levels, capacity percentages)
- Backend API endpoints: GET /api/alerts, GET /api/alerts/statistics, POST /api/alerts/:id/resolve
- Frontend components: AlertCard, AlertList, AlertsDashboardWidget
- Real-time notification badge in navigation with pulse animation for critical alerts

**Why**: Previous alert system only provided counts. Users needed detailed information about each alert to take action.

**Impact**:
- Users can see exactly which product, in which warehouse, needs attention
- Filtering by type/severity helps prioritize critical issues
- Dashboard shows alert breakdown by type and severity
- 30-second auto-refresh keeps information current

#### 3. Manual Purchase Order Creation
**What Changed**: Added UI for manually creating purchase orders

**Features**:
- PurchaseOrderFormModal component with full form validation
- Product selection with auto-populated supplier and quantity
- Product info card showing unit price, lead time, and reorder quantity
- Warehouse selection with available capacity display
- Quantity input with suggested reorder quantity
- Expected arrival date auto-calculation based on lead time
- Total cost calculator
- Integration with existing purchase order list

**Why**: System only supported automatic purchase orders. Users needed ability to manually order products outside of reorder threshold triggers (e.g., seasonal demand, special orders).

**Impact**:
- Users can create orders on-demand without waiting for automatic triggers
- Flexibility for special circumstances and manual inventory planning
- Maintains capacity validation to prevent warehouse overstock
- Audit trail preserved for manual orders

#### 4. Stock Adjustment Threshold Indicators
**What Changed**: Added visual indicators in stock adjustment modal showing whether stock is above/below reorder threshold

**Features**:
- Color-coded cards: Green (normal), Yellow (low), Red (out of stock)
- Status badges with icons (CheckCircle, AlertTriangle, X)
- Percentage of threshold calculation
- Visual legend explaining color meanings
- Per-warehouse threshold comparison

**Why**: When adjusting stock, users couldn't tell if they were bringing stock above/below critical thresholds without manual calculation.

**Impact**:
- Instant visual feedback on stock health
- Helps users make informed adjustment decisions
- Reduces errors in stock management
- Improves user experience with clear visual cues

#### 5. Warehouse and Supplier Management UI
**What Changed**: Implemented complete CRUD interfaces for warehouses and suppliers

**Warehouse Features**:
- List view with capacity indicators (color-coded: green 0-60%, yellow 61-80%, red 81-100%)
- Detail view showing overview, capacity visualization, products stored, recent orders
- Create/Edit modal form with validation
- Capacity tracking and percentage calculations

**Supplier Features**:
- List view with active/inactive status indicators
- Detail view showing contact info, performance metrics, products supplied, order history
- Create/Edit modal form
- Status toggle (activate/deactivate)

**Why**: Initial focus was on products and purchase orders. Warehouses and suppliers needed full management interfaces for complete inventory control.

**Impact**:
- Users can manage entire inventory ecosystem from UI
- Warehouse capacity warnings prevent overstock situations
- Supplier performance tracking aids procurement decisions
- Complete audit trail of supplier orders

#### 6. Database Schema Documentation
**What Changed**: Added comprehensive database schema documentation with ERD link

**Additions**:
- Interactive ERD on diagrams.net showing all entities and relationships
- Data modeling choices explained (why UUID keys, denormalization decisions, etc.)
- Design decisions summary table comparing alternatives
- Relationship cardinality visualization

**Why**: Complex database schema needed clear documentation for onboarding and maintenance.

**Impact**:
- New developers understand schema quickly
- Design decisions are documented for future reference
- ERD serves as single source of truth for database structure
- Easier to identify schema improvements

### Key Technical Decisions

#### Decision 1: Jest vs Vitest for Backend
**Chosen**: Jest
**Reason**: Mature ecosystem, excellent TypeScript support, familiar to most developers, supertest integration
**Alternative Considered**: Vitest (chose for frontend instead)

#### Decision 2: Prisma Mocking Strategy
**Chosen**: Full mock of Prisma Client in unit tests
**Reason**: Fast test execution, no database required, deterministic results
**Alternative Considered**: Test database with docker-compose (would slow tests significantly)
**Trade-off**: Mocks must be kept in sync with actual Prisma behavior

#### Decision 3: Frontend Test Framework
**Chosen**: Vitest + React Testing Library
**Reason**: Vite-native, faster than Jest for frontend, modern and actively maintained
**Alternative Considered**: Jest (slower build times with Vite)

#### Decision 4: Alert Metadata Structure
**Chosen**: Flexible JSON field with optional typed metadata
**Reason**: Allows different alert types to store different information without rigid schema
**Alternative Considered**: Separate tables per alert type (overly complex)
**Trade-off**: Less type safety, requires frontend validation of metadata structure

#### Decision 5: Manual Purchase Order Flow
**Chosen**: Separate modal form with validation, integrated into existing list
**Reason**: Consistent with existing UI patterns (ProductFormModal, WarehouseFormModal)
**Alternative Considered**: Dedicated page for order creation (more clicks required)

#### Decision 6: Stock Threshold Indicators
**Chosen**: Color-coded cards with icons and percentages
**Reason**: Universal color language (red=danger, yellow=warning, green=ok), accessible
**Alternative Considered**: Text-only indicators (less visible)

### Breaking Changes
None in recent updates. All changes are additive and backward-compatible.

### Migration Notes
No database migrations required for testing infrastructure. All tests use mocked data.

For new features:
1. Alert system: Run existing migrations (already in schema)
2. Purchase orders: No schema changes (uses existing tables)
3. Warehouse/Supplier UI: No schema changes (CRUD only)

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

