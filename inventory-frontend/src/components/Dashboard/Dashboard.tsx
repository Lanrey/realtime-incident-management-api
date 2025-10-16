import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  productsApi,
  warehousesApi,
  purchaseOrdersApi,
} from '../../services/api';
import { Package, Warehouse, ShoppingCart, AlertTriangle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { data: warehouseStats } = useQuery({
    queryKey: ['warehouse-statistics'],
    queryFn: async () => {
      const response = await warehousesApi.getStatistics();
      return response.data.data;
    },
  });

  const { data: orderStats } = useQuery({
    queryKey: ['order-statistics'],
    queryFn: async () => {
      const response = await purchaseOrdersApi.getStatistics();
      return response.data.data;
    },
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const response = await productsApi.getLowStock();
      return response.data.data;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-count'],
    queryFn: async () => {
      const response = await productsApi.getAll({ limit: 1 });
      return response.data.meta;
    },
  });

  const stats = [
    {
      name: 'Total Products',
      value: productsData?.total || 0,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      name: 'Total Warehouses',
      value: warehouseStats?.totalWarehouses || 0,
      icon: Warehouse,
      color: 'bg-purple-500',
    },
    {
      name: 'Pending Orders',
      value: orderStats?.pendingOrders || 0,
      icon: ShoppingCart,
      color: 'bg-green-500',
    },
    {
      name: 'Low Stock Items',
      value: lowStockProducts?.length || 0,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your inventory management system
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow p-6 flex items-center gap-4"
            >
              <div className={`${stat.color} p-3 rounded-lg`}>
                <Icon className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warehouse Capacity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Warehouse Capacity
          </h2>
          {warehouseStats && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Capacity</span>
                <span className="font-medium text-gray-900">
                  {warehouseStats.totalCapacity.toLocaleString()} units
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Stock</span>
                <span className="font-medium text-gray-900">
                  {warehouseStats.totalStock.toLocaleString()} units
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Average Utilization</span>
                <span className="font-medium text-gray-900">
                  {warehouseStats.averageUtilization.toFixed(1)}%
                </span>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-primary-600 h-4 rounded-full transition-all"
                    style={{
                      width: `${Math.min(warehouseStats.averageUtilization, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Purchase Order Stats
          </h2>
          {orderStats && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Orders</span>
                <span className="font-medium text-gray-900">
                  {orderStats.totalOrders}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending</span>
                <span className="font-medium text-yellow-600">
                  {orderStats.pendingOrders}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">In Transit</span>
                <span className="font-medium text-blue-600">
                  {orderStats.inTransitOrders}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Arrived</span>
                <span className="font-medium text-green-600">
                  {orderStats.arrivedOrders}
                </span>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total Value</span>
                  <span className="font-bold text-gray-900 text-lg">
                    ${orderStats.totalValue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Low Stock Alerts ({lowStockProducts.length})
          </h3>
          <div className="space-y-2">
            {lowStockProducts.slice(0, 5).map((product: any) => (
              <div
                key={`${product.productId}-${product.warehouseId}`}
                className="flex justify-between items-center py-2"
              >
                <div>
                  <span className="font-medium text-gray-900">{product.name}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    ({product.sku})
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">
                    {product.currentQuantity} / {product.reorderThreshold} in{' '}
                  </span>
                  <span className="font-medium">{product.warehouseName}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
