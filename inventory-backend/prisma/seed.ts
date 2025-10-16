import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  await prisma.stockMovement.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.productStock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.supplier.deleteMany();

  // Create Suppliers
  console.log('Creating suppliers...');
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'TechParts Inc.',
        contactEmail: 'orders@techparts.com',
        contactPhone: '+1-555-0101',
        address: '123 Industrial Blvd, Tech City, TC 12345',
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Global Electronics Supply',
        contactEmail: 'sales@globalelec.com',
        contactPhone: '+1-555-0202',
        address: '456 Commerce St, Metro City, MC 67890',
        isActive: true,
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Hardware Solutions Ltd',
        contactEmail: 'support@hardwaresolutions.com',
        contactPhone: '+1-555-0303',
        address: '789 Supply Chain Ave, Industrial Park, IP 11111',
        isActive: true,
      },
    }),
  ]);

  // Create Warehouses
  console.log('Creating warehouses...');
  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        name: 'Central Warehouse',
        location: 'New York, NY',
        capacity: 10000,
        currentStock: 0,
        isActive: true,
      },
    }),
    prisma.warehouse.create({
      data: {
        name: 'West Coast Distribution Center',
        location: 'Los Angeles, CA',
        capacity: 15000,
        currentStock: 0,
        isActive: true,
      },
    }),
    prisma.warehouse.create({
      data: {
        name: 'Midwest Hub',
        location: 'Chicago, IL',
        capacity: 8000,
        currentStock: 0,
        isActive: true,
      },
    }),
  ]);

  // Create Products
  console.log('Creating products...');
  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'LAPTOP-001',
        name: 'Professional Laptop 15"',
        description: 'High-performance laptop for business use',
        reorderThreshold: 50,
        reorderQuantity: 100,
        leadTimeDays: 7,
        unitPrice: 1200.0,
        defaultSupplierId: suppliers[0].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'MOUSE-001',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with USB receiver',
        reorderThreshold: 100,
        reorderQuantity: 200,
        leadTimeDays: 3,
        unitPrice: 25.0,
        defaultSupplierId: suppliers[1].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'KEYBOARD-001',
        name: 'Mechanical Keyboard',
        description: 'RGB mechanical keyboard with Cherry MX switches',
        reorderThreshold: 75,
        reorderQuantity: 150,
        leadTimeDays: 5,
        unitPrice: 85.0,
        defaultSupplierId: suppliers[1].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'MONITOR-001',
        name: '27" 4K Monitor',
        description: 'Professional 4K monitor with HDR support',
        reorderThreshold: 30,
        reorderQuantity: 50,
        leadTimeDays: 7,
        unitPrice: 450.0,
        defaultSupplierId: suppliers[0].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'CABLE-001',
        name: 'USB-C Cable 2m',
        description: 'High-speed USB-C cable with 100W power delivery',
        reorderThreshold: 200,
        reorderQuantity: 500,
        leadTimeDays: 2,
        unitPrice: 15.0,
        defaultSupplierId: suppliers[2].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'HEADSET-001',
        name: 'Noise-Cancelling Headset',
        description: 'Professional headset with active noise cancellation',
        reorderThreshold: 60,
        reorderQuantity: 120,
        leadTimeDays: 5,
        unitPrice: 150.0,
        defaultSupplierId: suppliers[1].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'WEBCAM-001',
        name: '1080p Webcam',
        description: 'Full HD webcam with auto-focus',
        reorderThreshold: 40,
        reorderQuantity: 80,
        leadTimeDays: 4,
        unitPrice: 75.0,
        defaultSupplierId: suppliers[2].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'DOCK-001',
        name: 'USB-C Docking Station',
        description: 'Multi-port docking station with dual monitor support',
        reorderThreshold: 25,
        reorderQuantity: 50,
        leadTimeDays: 6,
        unitPrice: 200.0,
        defaultSupplierId: suppliers[0].id,
        isActive: true,
      },
    }),
  ]);

  // Create initial stock for products in warehouses
  console.log('Creating product stocks...');
  const stockData = [];

  // Distribute products across warehouses with varying stock levels
  for (const product of products) {
    for (const warehouse of warehouses) {
      // Create varying stock levels - some below threshold, some above
      const randomStock = Math.floor(Math.random() * (product.reorderThreshold * 2));
      stockData.push({
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: randomStock,
        lastUpdated: new Date(),
      });
    }
  }

  await prisma.productStock.createMany({
    data: stockData,
  });

  // Update warehouse current stock counts
  console.log('Updating warehouse stock counts...');
  for (const warehouse of warehouses) {
    const totalStock = await prisma.productStock.aggregate({
      where: { warehouseId: warehouse.id },
      _sum: { quantity: true },
    });

    await prisma.warehouse.update({
      where: { id: warehouse.id },
      data: { currentStock: totalStock._sum.quantity || 0 },
    });
  }

  // Create some sample purchase orders
  console.log('Creating sample purchase orders...');
  const orderDate = new Date();
  const expectedArrival = new Date(orderDate);
  expectedArrival.setDate(expectedArrival.getDate() + 5);

  await prisma.purchaseOrder.createMany({
    data: [
      {
        orderNumber: 'PO-2024-0001',
        productId: products[0].id,
        supplierId: suppliers[0].id,
        warehouseId: warehouses[0].id,
        quantityOrdered: 50,
        totalCost: 60000.0,
        status: 'PENDING',
        orderDate,
        expectedArrivalDate: expectedArrival,
        isAutoGenerated: false,
      },
      {
        orderNumber: 'PO-2024-0002',
        productId: products[1].id,
        supplierId: suppliers[1].id,
        warehouseId: warehouses[1].id,
        quantityOrdered: 150,
        totalCost: 3750.0,
        status: 'IN_TRANSIT',
        orderDate,
        expectedArrivalDate: expectedArrival,
        isAutoGenerated: true,
      },
    ],
  });

  console.log('✅ Database seeding completed successfully!');
  console.log(`   - ${suppliers.length} suppliers created`);
  console.log(`   - ${warehouses.length} warehouses created`);
  console.log(`   - ${products.length} products created`);
  console.log(`   - ${stockData.length} stock records created`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
