import React, { useState } from 'react';
import { X } from 'lucide-react';
import { warehousesApi } from '../../services/api';
import { Warehouse } from '../../types';

interface WarehouseFormModalProps {
  warehouse?: Warehouse;
  onClose: () => void;
  onSuccess: () => void;
}

export const WarehouseFormModal: React.FC<WarehouseFormModalProps> = ({
  warehouse,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: warehouse?.name || '',
    location: warehouse?.location || '',
    capacity: warehouse?.capacity || '',
    isActive: warehouse?.isActive ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name,
        location: formData.location,
        capacity: Number(formData.capacity),
        isActive: formData.isActive,
      };

      if (warehouse) {
        await warehousesApi.update(warehouse.id, payload);
      } else {
        await warehousesApi.create(payload);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save warehouse');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {warehouse ? 'Edit Warehouse' : 'Add New Warehouse'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
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
            {/* Warehouse Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Main Warehouse NYC"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., 123 Industrial Blvd, New York, NY"
              />
            </div>

            {/* Maximum Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Capacity (units) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., 10000"
              />
              <p className="mt-1 text-xs text-gray-500">
                ℹ️ Total number of items this warehouse can hold
              </p>
            </div>

            {/* Status */}
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
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : warehouse
                ? 'Update Warehouse'
                : 'Create Warehouse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
