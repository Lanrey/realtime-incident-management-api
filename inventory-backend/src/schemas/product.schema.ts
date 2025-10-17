import Joi from 'joi';

export const createProductSchema = Joi.object({
  sku: Joi.string().min(1).max(100).required(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional(),
  reorderThreshold: Joi.number().integer().min(0).required(),
  reorderQuantity: Joi.number().integer().min(1).required(),
  leadTimeDays: Joi.number().integer().min(1).default(3),
  unitPrice: Joi.number().min(0).default(0),
    isActive: Joi.boolean().default(false),
  defaultSupplierId: Joi.string().uuid().required(),
});

export const updateProductSchema = Joi.object({
  sku: Joi.string().min(1).max(100).optional(),
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().optional(),
  reorderThreshold: Joi.number().integer().min(0).optional(),
  reorderQuantity: Joi.number().integer().min(1).optional(),
  leadTimeDays: Joi.number().integer().min(1).optional(),
  unitPrice: Joi.number().min(0).optional(),
  defaultSupplierId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
});

export const adjustStockSchema = Joi.object({
  productId: Joi.string().uuid().required(),
  warehouseId: Joi.string().uuid().required(),
  quantityChange: Joi.number().integer().required(),
  reason: Joi.string().min(1).max(500).required(),
  performedBy: Joi.string().default('USER'),
});

export const queryProductsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().optional(),
  supplierId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string().valid('name', 'sku', 'reorderThreshold', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
});

export interface CreateProductInput {
  sku: string;
  name: string;
  description?: string;
  reorderThreshold: number;
  reorderQuantity: number;
  leadTimeDays?: number;
  unitPrice?: number;
  defaultSupplierId: string;
  isActive?: boolean;
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string;
  reorderThreshold?: number;
  reorderQuantity?: number;
  leadTimeDays?: number;
  unitPrice?: number;
  defaultSupplierId?: string;
  isActive?: boolean;
}

export interface AdjustStockInput {
  productId: string;
  warehouseId: string;
  quantityChange: number;
  reason: string;
  performedBy?: string;
}

export interface QueryProductsInput {
  page?: number;
  limit?: number;
  search?: string;
  supplierId?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'sku' | 'reorderThreshold' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
