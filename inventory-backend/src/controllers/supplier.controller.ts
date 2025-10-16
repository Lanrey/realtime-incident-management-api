import { FastifyRequest, FastifyReply } from 'fastify';
import { supplierService } from '../services/supplier.service';
import { ResponseHandler } from '../utils/response';
import {
  createSupplierSchema,
  updateSupplierSchema,
  querySuppliersSchema,
  type CreateSupplierInput,
  type UpdateSupplierInput,
  type QuerySuppliersInput,
} from '../schemas/supplier.schema';

export class SupplierController {
  async createSupplier(
    request: FastifyRequest<{ Body: CreateSupplierInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = createSupplierSchema.validate(request.body);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }
      const supplier = await supplierService.createSupplier(value);
      return ResponseHandler.success(reply, supplier, 201);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async getSuppliers(
    request: FastifyRequest<{ Querystring: QuerySuppliersInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = querySuppliersSchema.validate(request.query);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }
      const result = await supplierService.getSuppliers(value);
      return ResponseHandler.successWithMeta(
        reply,
        result.suppliers,
        result.pagination
      );
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async getSupplierById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const supplier = await supplierService.getSupplierById(request.params.id);

      if (!supplier) {
        return ResponseHandler.notFound(reply, 'Supplier not found');
      }

      return ResponseHandler.success(reply, supplier);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async updateSupplier(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateSupplierInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = updateSupplierSchema.validate(request.body);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }
      const supplier = await supplierService.updateSupplier(
        request.params.id,
        value
      );
      return ResponseHandler.success(reply, supplier);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async deleteSupplier(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      await supplierService.deleteSupplier(request.params.id);
      return ResponseHandler.success(reply, {
        message: 'Supplier deleted successfully',
      });
    } catch (error: any) {
      return ResponseHandler.badRequest(reply, error.message);
    }
  }

  async getStatistics(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const stats = await supplierService.getSupplierStatistics(request.params.id);
      return ResponseHandler.success(reply, stats);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }
}

export const supplierController = new SupplierController();
