import { FastifyRequest, FastifyReply } from 'fastify';
import { productService } from '../services/product.service';
import { stockMonitor } from '../services/stockMonitor.service';
import { ResponseHandler } from '../utils/response';
import {
  createProductSchema,
  updateProductSchema,
  queryProductsSchema,
  adjustStockSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type QueryProductsInput,
  type AdjustStockInput,
} from '../schemas/product.schema';

export class ProductController {
  async createProduct(
    request: FastifyRequest<{ Body: CreateProductInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = createProductSchema.validate(request.body);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }
      const product = await productService.createProduct(value);
      return ResponseHandler.success(reply, product, 201);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async getProducts(
    request: FastifyRequest<{ Querystring: QueryProductsInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = queryProductsSchema.validate(request.query);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }
      const result = await productService.getProducts(value);
      return ResponseHandler.successWithMeta(
        reply,
        result.products,
        result.pagination
      );
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async getProductById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const product = await productService.getProductById(request.params.id);

      if (!product) {
        return ResponseHandler.notFound(reply, 'Product not found');
      }

      return ResponseHandler.success(reply, product);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async getProductStock(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      const stock = await productService.getProductStock(request.params.id);
      return ResponseHandler.success(reply, stock);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async updateProduct(
    request: FastifyRequest<{ Params: { id: string }; Body: UpdateProductInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = updateProductSchema.validate(request.body);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }
      const product = await productService.updateProduct(
        request.params.id,
        value
      );
      return ResponseHandler.success(reply, product);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async deleteProduct(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    try {
      await productService.deleteProduct(request.params.id);
      return ResponseHandler.success(reply, { message: 'Product deleted successfully' });
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async adjustStock(
    request: FastifyRequest<{ Body: AdjustStockInput }>,
    reply: FastifyReply
  ) {
    try {
      const { error, value } = adjustStockSchema.validate(request.body);
      if (error) {
        return reply.status(400).send({
          success: false,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }

      const { productId, warehouseId, quantityChange, reason, performedBy } = value;

      await stockMonitor.adjustStock(
        productId,
        warehouseId,
        quantityChange,
        reason,
        performedBy
      );

      return ResponseHandler.success(reply, {
        message: 'Stock adjusted successfully',
      });
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }

  async getLowStockProducts(
    request: FastifyRequest<{ Querystring: { warehouseId?: string } }>,
    reply: FastifyReply
  ) {
    try {
      const products = await productService.getLowStockProducts(
        request.query.warehouseId
      );
      return ResponseHandler.success(reply, products);
    } catch (error: any) {
      return ResponseHandler.serverError(reply, error);
    }
  }
}

export const productController = new ProductController();
