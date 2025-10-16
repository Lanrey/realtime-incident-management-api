import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { warehousesApi, purchaseOrdersApi } from '../../services/api';
import { ArrowLeft, Edit, AlertTriangle, Package } from 'lucide-react';
import { WarehouseFormModal } from './WarehouseFormModal';

export const WarehouseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: warehouseData, isLoading, refetch } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: async () => {
      const response = await warehousesApi.getById(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: productsData } = useQuery({
    queryKey: ['warehouse-products', id],
    queryFn: async () => {
      const response = await warehousesApi.getProducts(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['warehouse-orders', id],
    queryFn: async () => {
      const response = await purchaseOrdersApi.getAll({ warehouseId: id });
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading warehouse details...</div>
      </div>
    );
  }

  if (!warehouseData?.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Warehouse not found</div>
      </div>
    );
  }

  const warehouse = warehouseData.data;
  const products = productsData?.data || [];
  const orders = ordersData?.data || [];
  const recentOrders = orders.slice(0, 5);

  const utilizationPercentage = Math.round(
    (warehouse.currentStock / warehouse.capacity) * 100
  );

  const availableSpace = warehouse.capacity - warehouse.currentStock;

  const getStockLevelColor = (quantity: number, threshold: number) => {
    if (quantity <= threshold) return 'text-red-600';
    return 'text-green-600';
  };

  const getStockLevelBadge = (quantity: number, threshold: number) => {
    if (quantity <= threshold) return '🔴 Low';
    return '🟢 Normal';
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      case 'IN_TRANSIT':
        return 'bg-yellow-100 text-yellow-800';
      case 'ARRIVED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT':
        return '🟡';
      case 'ARRIVED':
        return '✅';
      default:
        return '';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/warehouses')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{warehouse.name}</h1>
            <p className="text-gray-600 mt-1">{warehouse.location}</p>
          </div>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Edit size={18} />
          Edit
        </button>
      </div>

      {/* Overview Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <span className="text-sm text-gray-500">Name:</span>
            <p className="font-medium text-gray-900">{warehouse.name}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Location:</span>
            <p className="font-medium text-gray-900">{warehouse.location}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Capacity:</span>
            <p className="font-medium text-gray-900">
              {warehouse.capacity.toLocaleString()} units
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Current Stock:</span>
            <p className="font-medium text-gray-900">
              {warehouse.currentStock.toLocaleString()} units ({utilizationPercentage}%)
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Available Space:</span>
            <p className="font-medium text-gray-900">
              {availableSpace.toLocaleString()} units
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-500">Status:</span>
            <p className="font-medium">
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  warehouse.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {warehouse.isActive ? '🟢 Active' : '🔴 Inactive'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Capacity Visualization */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Capacity Visualization
        </h2>
        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
            <div
              className={`h-full flex items-center justify-center text-xs font-medium text-white transition-all ${
                utilizationPercentage >= 81
                  ? 'bg-red-600'
                  : utilizationPercentage >= 61
                  ? 'bg-yellow-600'
                  : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            >
              {utilizationPercentage}%
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              Used: {warehouse.currentStock.toLocaleString()}
            </span>
            <span className="text-gray-600">
              Available: {availableSpace.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Products Stored */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Products Stored in This Warehouse
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reorder Level
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Package size={48} className="text-gray-300" />
                      <p>No products stored in this warehouse yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((item: any) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.product?.sku || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {item.product?.name || 'Unknown Product'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`font-medium ${getStockLevelColor(
                          item.quantity,
                          item.product?.reorderThreshold || 0
                        )}`}
                      >
                        {getStockLevelBadge(
                          item.quantity,
                          item.product?.reorderThreshold || 0
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Purchase Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Purchase Orders for This Warehouse
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No purchase orders found for this warehouse
                  </td>
                </tr>
              ) : (
                recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.product?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.quantityOrdered.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getOrderStatusColor(
                          order.status
                        )}`}
                      >
                        {getOrderStatusIcon(order.status)} {order.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <WarehouseFormModal
          warehouse={warehouse}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};
