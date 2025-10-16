import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, warehousesApi } from '../../services/api';
import { Product, Warehouse } from '../../types';
import { X, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';

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
            <h4 className="font-medium text-gray-900 mb-3">
              Current Stock by Warehouse
              <span className="ml-2 text-xs text-gray-500">
                (Reorder Threshold: {product.reorderThreshold} units)
              </span>
            </h4>
            <div className="space-y-2">
              {stockByWarehouse.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No stock records found for this product
                </div>
              ) : (
                stockByWarehouse.map((stock: any) => {
                  const isLowStock = stock.quantity <= product.reorderThreshold;
                  const isCritical = stock.quantity === 0;
                  const percentOfThreshold = product.reorderThreshold > 0
                    ? Math.round((stock.quantity / product.reorderThreshold) * 100)
                    : 0;

                  return (
                    <div
                      key={stock.id}
                      className={`flex items-center justify-between p-3 rounded border ${
                        isCritical
                          ? 'bg-red-50 border-red-200'
                          : isLowStock
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Status Icon */}
                        {isCritical ? (
                          <div className="text-red-600" title="Out of Stock">
                            <X size={20} className="font-bold" />
                          </div>
                        ) : isLowStock ? (
                          <div className="text-yellow-600" title="Low Stock">
                            <AlertTriangle size={20} />
                          </div>
                        ) : (
                          <div className="text-green-600" title="Normal Stock">
                            <CheckCircle size={20} />
                          </div>
                        )}

                        {/* Warehouse Name */}
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {stock.warehouse.name}
                          </span>
                          <div className="text-xs text-gray-600">
                            {stock.warehouse.location}
                          </div>
                        </div>
                      </div>

                      {/* Stock Info */}
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              isCritical
                                ? 'text-red-700'
                                : isLowStock
                                ? 'text-yellow-700'
                                : 'text-green-700'
                            }`}
                          >
                            {stock.quantity}
                          </span>
                          <span className="text-sm text-gray-600">units</span>
                        </div>

                        {/* Status Badge */}
                        <div className="mt-1">
                          {isCritical ? (
                            <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded-full font-medium">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full font-medium flex items-center gap-1">
                              <TrendingDown size={12} />
                              Low ({percentOfThreshold}%)
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-medium flex items-center gap-1">
                              <TrendingUp size={12} />
                              Normal ({percentOfThreshold}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Legend */}
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs font-semibold text-gray-700 mb-2">Status Legend:</div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <CheckCircle size={14} className="text-green-600" />
                  <span className="text-gray-600">Above threshold</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle size={14} className="text-yellow-600" />
                  <span className="text-gray-600">Below threshold</span>
                </div>
                <div className="flex items-center gap-1">
                  <X size={14} className="text-red-600 font-bold" />
                  <span className="text-gray-600">Out of stock</span>
                </div>
              </div>
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
