import Joi from 'joi';

export const createWarehouseSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  location: Joi.string().min(1).max(500).required(),
  capacity: Joi.number().integer().min(1).required(),
});

export const updateWarehouseSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  location: Joi.string().min(1).max(500).optional(),
  capacity: Joi.number().integer().min(1).optional(),
});

export const queryWarehousesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string().valid('name', 'location', 'capacity', 'currentStock').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
});

export interface CreateWarehouseInput {
  name: string;
  location: string;
  capacity: number;
}

export interface UpdateWarehouseInput {
  name?: string;
  location?: string;
  capacity?: number;
}

export interface QueryWarehousesInput {
  page?: number;
  limit?: number;
  isActive?: boolean;
  sortBy?: 'name' | 'location' | 'capacity' | 'currentStock';
  sortOrder?: 'asc' | 'desc';
}
