import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, suppliersApi } from '../../services/api';
import { Product, Supplier } from '../../types';
import { X } from 'lucide-react';

interface ProductFormModalProps {
  product?: Product;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  onClose,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    reorderThreshold: product?.reorderThreshold?.toString() || '',
    reorderQuantity: product?.reorderQuantity?.toString() || '',
    leadTimeDays: product?.leadTimeDays?.toString() || '',
    unitPrice: product?.unitPrice?.toString() || '',
    defaultSupplierId: product?.defaultSupplierId || '',
    isActive: product?.isActive ?? true,
  });
  const [useCustomSupplier, setUseCustomSupplier] = useState(!!product?.defaultSupplierId);
  const [error, setError] = useState<string | null>(null);

  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await suppliersApi.getAll({ limit: 100 });
      return response.data;
    },
  });

  const suppliers = suppliersData?.data || [];
  const activeSuppliers = suppliers.filter((s: Supplier) => s.isActive);

  // Auto-select first supplier if available and not in edit mode
  React.useEffect(() => {
    if (!product && activeSuppliers.length > 0 && !formData.defaultSupplierId && !useCustomSupplier) {
      setFormData(prev => ({ ...prev, defaultSupplierId: activeSuppliers[0].id }));
    }
  }, [activeSuppliers, product, formData.defaultSupplierId, useCustomSupplier]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (product) {
        return productsApi.update(product.id, data);
      } else {
        return productsApi.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onSuccess();
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to save product');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const payload = {
      sku: formData.sku,
      name: formData.name,
      description: formData.description || undefined,
      reorderThreshold: parseInt(formData.reorderThreshold),
      reorderQuantity: parseInt(formData.reorderQuantity),
      leadTimeDays: parseInt(formData.leadTimeDays),
      unitPrice: parseFloat(formData.unitPrice),
      defaultSupplierId: formData.defaultSupplierId,
      isActive: formData.isActive,
    };

    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* SKU */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., PROD-001"
                disabled={!!product} // SKU cannot be changed after creation
              />
              {product && (
                <p className="mt-1 text-xs text-gray-500">SKU cannot be changed after creation</p>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Widget A"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Product description..."
              />
            </div>

            {/* Default Supplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Supplier <span className="text-red-500">*</span>
              </label>

              {/* Show default supplier or allow selection */}
              {!useCustomSupplier && activeSuppliers.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-900">
                      {activeSuppliers[0]?.name || 'No suppliers available'}
                    </span>
                    <span className="text-xs text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Default
                    </span>
                  </div>
                  <div className="mt-2 flex items-center">
                    <input
                      type="checkbox"
                      id="useCustomSupplier"
                      checked={useCustomSupplier}
                      onChange={(e) => {
                        setUseCustomSupplier(e.target.checked);
                        if (!e.target.checked && activeSuppliers.length > 0) {
                          setFormData({ ...formData, defaultSupplierId: activeSuppliers[0].id });
                        }
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="useCustomSupplier" className="ml-2 text-sm text-gray-700">
                      Choose a different supplier
                    </label>
                  </div>
                </div>
              ) : (
                <div>
                  <select
                    required
                    value={formData.defaultSupplierId}
                    onChange={(e) => setFormData({ ...formData, defaultSupplierId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select supplier...</option>
                    {activeSuppliers.map((supplier: Supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {!product && (
                    <div className="mt-2 flex items-center">
                      <input
                        type="checkbox"
                        id="useCustomSupplier"
                        checked={useCustomSupplier}
                        onChange={(e) => {
                          setUseCustomSupplier(e.target.checked);
                          if (!e.target.checked && activeSuppliers.length > 0) {
                            setFormData({ ...formData, defaultSupplierId: activeSuppliers[0].id });
                          }
                        }}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="useCustomSupplier" className="ml-2 text-sm text-gray-700">
                        Use default supplier
                      </label>
                    </div>
                  )}
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                ℹ️ Supplier used for automatic reordering
              </p>
            </div>

            {/* Grid Layout for Numbers */}
            <div className="grid grid-cols-2 gap-4">
              {/* Reorder Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Threshold <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.reorderThreshold}
                  onChange={(e) => setFormData({ ...formData, reorderThreshold: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="50"
                />
                <p className="mt-1 text-xs text-gray-500">Minimum stock level</p>
              </div>

              {/* Reorder Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reorder Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.reorderQuantity}
                  onChange={(e) => setFormData({ ...formData, reorderQuantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="100"
                />
                <p className="mt-1 text-xs text-gray-500">Quantity to order</p>
              </div>

              {/* Lead Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Time (days) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.leadTimeDays}
                  onChange={(e) => setFormData({ ...formData, leadTimeDays: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="5"
                />
                <p className="mt-1 text-xs text-gray-500">Delivery time</p>
              </div>

              {/* Unit Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="29.99"
                />
                <p className="mt-1 text-xs text-gray-500">Price per unit</p>
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Active (Available for operations)
              </label>
            </div>
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
              {mutation.isPending
                ? 'Saving...'
                : product
                ? 'Update Product'
                : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
