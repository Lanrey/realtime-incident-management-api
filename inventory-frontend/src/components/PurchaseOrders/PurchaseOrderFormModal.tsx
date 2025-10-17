import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersApi, productsApi, suppliersApi, warehousesApi } from '../../services/api';
import { Product, Supplier, Warehouse } from '../../types';
import { X, AlertCircle } from 'lucide-react';

interface PurchaseOrderFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    productId: '',
    supplierId: '',
    warehouseId: '',
    quantityOrdered: '',
    expectedArrivalDate: '',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ['products-active'],
    queryFn: async () => {
      const response = await productsApi.getAll({ limit: 100, isActive: true });
      return response.data;
    },
  });

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-active'],
    queryFn: async () => {
      const response = await suppliersApi.getAll({ limit: 100 });
      return response.data;
    },
  });

  // Fetch warehouses
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-active'],
    queryFn: async () => {
      const response = await warehousesApi.getAll({ limit: 100 });
      return response.data;
    },
  });

  const products = productsData?.data || [];
  const suppliers = suppliersData?.data || [];
  const warehouses = warehousesData?.data || [];

  const activeSuppliers = suppliers.filter((s: Supplier) => s.isActive);
  const activeWarehouses = warehouses.filter((w: Warehouse) => w.isActive);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      return purchaseOrdersApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['alert-statistics'] });
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create purchase order');
    },
  });

  const handleProductChange = (productId: string) => {
    const product = products.find((p: Product) => p.id === productId);
    setSelectedProduct(product || null);

    setFormData({
      ...formData,
      productId,
      supplierId: product?.defaultSupplierId || '',
      quantityOrdered: product?.reorderQuantity?.toString() || '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Calculate expected arrival date if not provided
    let expectedDate = formData.expectedArrivalDate;
    if (!expectedDate && selectedProduct) {
      const date = new Date();
      date.setDate(date.getDate() + selectedProduct.leadTimeDays);
      expectedDate = date.toISOString().split('T')[0];
    }

    const payload = {
      productId: formData.productId,
      supplierId: formData.supplierId,
      warehouseId: formData.warehouseId,
      quantityOrdered: parseInt(formData.quantityOrdered),
      expectedArrivalDate: expectedDate,
      notes: formData.notes || undefined,
    };

    mutation.mutate(payload);
  };

  // Calculate total cost
  const totalCost = selectedProduct && formData.quantityOrdered
    ? selectedProduct.unitPrice * parseInt(formData.quantityOrdered)
    : 0;

  // Get expected delivery date suggestion
  const getSuggestedDeliveryDate = () => {
    if (selectedProduct) {
      const date = new Date();
      date.setDate(date.getDate() + selectedProduct.leadTimeDays);
      return date.toISOString().split('T')[0];
    }
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Purchase Order
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={mutation.isPending}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.productId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select product...</option>
                {products.map((product: Product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Product Info Card */}
            {selectedProduct && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Unit Price:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      ${selectedProduct.unitPrice.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Lead Time:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {selectedProduct.leadTimeDays} days
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Reorder Qty:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {selectedProduct.reorderQuantity} units
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Threshold:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {selectedProduct.reorderThreshold} units
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select supplier...</option>
                {activeSuppliers.map((supplier: Supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {selectedProduct && formData.supplierId === selectedProduct.defaultSupplierId && (
                <p className="mt-1 text-xs text-green-600">✓ Default supplier for this product</p>
              )}
            </div>

            {/* Warehouse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination Warehouse <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select warehouse...</option>
                {activeWarehouses.map((warehouse: Warehouse) => {
                  const utilization = Math.round(
                    (warehouse.currentStock / warehouse.capacity) * 100
                  );
                  const available = warehouse.capacity - warehouse.currentStock;

                  return (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} - Available: {available.toLocaleString()} units ({utilization}% used)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Ordered <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantityOrdered}
                onChange={(e) => setFormData({ ...formData, quantityOrdered: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter quantity"
              />
              {selectedProduct && (
                <p className="mt-1 text-xs text-gray-500">
                  Suggested: {selectedProduct.reorderQuantity} units
                </p>
              )}
            </div>

            {/* Expected Arrival Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Arrival Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expectedArrivalDate}
                onChange={(e) => setFormData({ ...formData, expectedArrivalDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {selectedProduct && !formData.expectedArrivalDate && (
                <p className="mt-1 text-xs text-gray-500">
                  Suggested based on lead time: {getSuggestedDeliveryDate()}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Add any notes about this order..."
              />
            </div>

            {/* Order Summary */}
            {totalCost > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Estimated Total Cost:</span>
                  <span className="text-xl font-bold text-gray-900">
                    ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.quantityOrdered} units × ${selectedProduct?.unitPrice.toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {mutation.isPending && (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {mutation.isPending ? 'Creating Order...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
