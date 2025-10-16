import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Prisma Client with logging configuration
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  errorFormat: 'pretty',
});

// Connection management
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('Database disconnected');
}

// Graceful shutdown handler
process.on('beforeExit', async () => {
  await disconnectDatabase();
});
