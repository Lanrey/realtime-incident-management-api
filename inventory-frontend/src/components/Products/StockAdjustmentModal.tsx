import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, warehousesApi } from '../../services/api';
import { Product, Warehouse } from '../../types';
import { X } from 'lucide-react';

interface StockAdjustmentModalProps {
  product: Product;
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  product,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [warehouseId, setWarehouseId] = useState('');
  const [quantityChange, setQuantityChange] = useState('');
  const [reason, setReason] = useState('');

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await warehousesApi.getAll({ limit: 100 });
      return response.data;
    },
  });

  const { data: stockData } = useQuery({
    queryKey: ['product-stock', product.id],
    queryFn: async () => {
      const response = await productsApi.getStock(product.id);
      return response.data;
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async (data: any) => {
      return productsApi.adjustStock(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-stock', product.id] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    adjustMutation.mutate({
      productId: product.id,
      warehouseId,
      quantityChange: parseInt(quantityChange),
      reason,
      performedBy: 'USER',
    });
  };

  const warehouses = warehousesData?.data || [];
  const stockByWarehouse = stockData?.data?.stockByWarehouse || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Adjust Stock</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* Product Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
          </div>

          {/* Current Stock */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Current Stock by Warehouse</h4>
            <div className="space-y-2">
              {stockByWarehouse.map((stock: any) => (
                <div
                  key={stock.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <span className="text-sm text-gray-700">
                    {stock.warehouse.name}
                  </span>
                  <span className="font-medium text-gray-900">
                    {stock.quantity} units
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Adjustment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse *
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((w: Warehouse) => (
                  <option key={w.id} value={w.id}>
                    {w.name} - {w.location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Change * (use negative for reduction)
              </label>
              <input
                type="number"
                value={quantityChange}
                onChange={(e) => setQuantityChange(e.target.value)}
                required
                placeholder="e.g., 50 or -20"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={3}
                placeholder="Describe the reason for this adjustment..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {adjustMutation.isError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {(adjustMutation.error as Error).message}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjustMutation.isPending}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {adjustMutation.isPending ? 'Adjusting...' : 'Adjust Stock'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
