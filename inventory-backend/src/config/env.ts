import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  HOST: Joi.string().default('0.0.0.0'),
  DATABASE_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional().allow(''),
  RABBITMQ_URL: Joi.string().default('amqp://guest:guest@localhost:5672'),
  STOCK_CHECK_INTERVAL_MINUTES: Joi.number().default(5),
  DEFAULT_LEAD_TIME_DAYS: Joi.number().default(3),
  MAX_CONCURRENT_ORDERS: Joi.number().default(10),
  LOG_LEVEL: Joi.string().default('info'),
}).unknown(true);

export interface Env {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  HOST: string;
  DATABASE_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  RABBITMQ_URL: string;
  STOCK_CHECK_INTERVAL_MINUTES: number;
  DEFAULT_LEAD_TIME_DAYS: number;
  MAX_CONCURRENT_ORDERS: number;
  LOG_LEVEL: string;
}

export function loadEnv(): Env {
  const { error, value } = envSchema.validate(process.env, {
    convert: true,
    allowUnknown: true,
    stripUnknown: false,
  });

  if (error) {
    console.error('❌ Invalid environment variables:', error.details);
    throw new Error('Invalid environment variables');
  }

  return value as Env;
}

export const env = loadEnv();
