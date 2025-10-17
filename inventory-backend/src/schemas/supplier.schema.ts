import Joi from 'joi';

export const createSupplierSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().min(1).max(50).required(),
  address: Joi.string().optional(),
    isActive: Joi.boolean().optional(),
});

export const updateSupplierSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  contactEmail: Joi.string().email().optional(),
  contactPhone: Joi.string().min(1).max(50).optional(),
  address: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

export const querySuppliersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  isActive: Joi.boolean().optional(),
  sortBy: Joi.string().valid('name', 'contactEmail', 'createdAt').default('name'),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
});

export interface CreateSupplierInput {
  name: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateSupplierInput {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive?: boolean;
}

export interface QuerySuppliersInput {
  page?: number;
  limit?: number;
  isActive?: boolean;
  sortBy?: 'name' | 'contactEmail' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
