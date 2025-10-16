// Mock environment configuration
jest.mock('../config/env', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: 3000,
    HOST: '0.0.0.0',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_HOST: 'localhost',
    REDIS_PORT: 6379,
    RABBITMQ_URL: 'amqp://test:test@localhost:5672',
    STOCK_CHECK_INTERVAL: 5,
    LOG_LEVEL: 'silent',
  },
}));

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    productStock: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    purchaseOrder: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    alert: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      updateMany: jest.fn(),
    },
    warehouse: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    supplier: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock Event Emitter for SSE
jest.mock('../utils/eventEmitter', () => ({
  appEvents: {
    emitStockUpdate: jest.fn(),
    emitAlertNew: jest.fn(),
    emitAlertResolved: jest.fn(),
    emitOrderCreated: jest.fn(),
    emitOrderUpdated: jest.fn(),
    emitWarehouseUpdated: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
    setMaxListeners: jest.fn(),
  },
}));

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
