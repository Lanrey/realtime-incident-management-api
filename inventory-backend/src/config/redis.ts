import Redis from 'ioredis';
import { env } from './env';

// Redis client configuration
export const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

// Cache key prefixes for organization
export const CACHE_KEYS = {
  PRODUCT: (id: string) => `product:${id}`,
  PRODUCT_STOCK: (productId: string, warehouseId: string) =>
    `product_stock:${productId}:${warehouseId}`,
  WAREHOUSE: (id: string) => `warehouse:${id}`,
  WAREHOUSE_CAPACITY: (id: string) => `warehouse_capacity:${id}`,
  SUPPLIER: (id: string) => `supplier:${id}`,
  LOW_STOCK_PRODUCTS: 'low_stock_products',
};

// Cache TTL in seconds
export const CACHE_TTL = {
  PRODUCT: 3600, // 1 hour
  WAREHOUSE: 300, // 5 minutes
  SUPPLIER: 1800, // 30 minutes
  LOW_STOCK: 60, // 1 minute
};

// Cache utility functions
export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  }

  static async del(key: string | string[]): Promise<void> {
    await redis.del(key);
  }

  static async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
