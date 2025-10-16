import { FastifyInstance } from 'fastify';
import { productController } from '../controllers/product.controller';

export async function productRoutes(fastify: FastifyInstance) {
  // Get all products with pagination and filters
  fastify.get(
    '/',
    productController.getProducts.bind(productController)
  );

  // Get low stock products
  fastify.get(
    '/low-stock',
    productController.getLowStockProducts.bind(productController)
  );

  // Get product by ID
  fastify.get('/:id', productController.getProductById.bind(productController));

  // Get product stock across warehouses
  fastify.get(
    '/:id/stock',
    productController.getProductStock.bind(productController)
  );

  // Create new product
  fastify.post(
    '/',
    productController.createProduct.bind(productController)
  );

  // Update product
  fastify.patch(
    '/:id',
    productController.updateProduct.bind(productController)
  );

  // Delete product
  fastify.delete('/:id', productController.deleteProduct.bind(productController));

  // Adjust stock manually
  fastify.post(
    '/adjust-stock',
    productController.adjustStock.bind(productController)
  );
}
