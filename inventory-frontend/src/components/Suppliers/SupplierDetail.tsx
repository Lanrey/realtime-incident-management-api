import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { suppliersApi, productsApi, purchaseOrdersApi } from '../../services/api';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { SupplierFormModal } from './SupplierFormModal';

export const SupplierDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditModal, setShowEditModal] = useState(false);

  const { data: supplierData, isLoading, refetch } = useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const response = await suppliersApi.getById(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: statisticsData } = useQuery({
    queryKey: ['supplier-statistics', id],
    queryFn: async () => {
      const response = await suppliersApi.getStatistics(id!);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: productsData } = useQuery({
    queryKey: ['supplier-products', id],
    queryFn: async () => {
      const response = await productsApi.getAll({ supplierId: id });
      return response.data;
    },
    enabled: !!id,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['supplier-orders', id],
    queryFn: async () => {
      const response = await purchaseOrdersApi.getAll({ supplierId: id });
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading supplier details...</div>
      </div>
    );
  }

  if (!supplierData?.data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Supplier not found</div>
      </div>
    );
  }

  const supplier = supplierData.data;
  const statistics = statisticsData?.data || {};
  const products = productsData?.data || [];
  const orders = ordersData?.data || [];
  const recentOrders = orders.slice(0, 5);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/suppliers')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
            <p className="text-gray-600 mt-1">Supplier Details</p>
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

      {/* Contact Information Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Contact Information
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="text-gray-400 mt-1">
              <Mail size={20} />
            </div>
            <div>
              <span className="text-sm text-gray-500">Email:</span>
              <p className="font-medium text-gray-900">
                <a
                  href={`mailto:${supplier.contactEmail}`}
                  className="text-primary-600 hover:underline"
                >
                  {supplier.contactEmail}
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-gray-400 mt-1">
              <Phone size={20} />
            </div>
            <div>
              <span className="text-sm text-gray-500">Phone:</span>
              <p className="font-medium text-gray-900">
                <a
                  href={`tel:${supplier.contactPhone}`}
                  className="text-primary-600 hover:underline"
                >
                  {supplier.contactPhone}
                </a>
              </p>
            </div>
          </div>

          {supplier.address && (
            <div className="flex items-start gap-3">
              <div className="text-gray-400 mt-1">
                <MapPin size={20} />
              </div>
              <div>
                <span className="text-sm text-gray-500">Address:</span>
                <p className="font-medium text-gray-900">{supplier.address}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <div className="text-gray-400 mt-1">
              <Calendar size={20} />
            </div>
            <div>
              <span className="text-sm text-gray-500">Joined:</span>
              <p className="font-medium text-gray-900">
                {formatDate(supplier.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1">
              <span className="text-2xl">{supplier.isActive ? '🟢' : '🔴'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Status:</span>
              <p className="font-medium">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    supplier.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Supplier Performance Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <span className="text-sm text-gray-500">Total Orders</span>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {statistics.totalOrders || orders.length}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <span className="text-sm text-gray-500">Active Orders</span>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {orders.filter((o: any) => ['PENDING', 'IN_TRANSIT'].includes(o.status))
                .length || 0}
            </p>
            <span className="text-xs text-gray-500">(In Transit)</span>
          </div>
          <div className="border rounded-lg p-4">
            <span className="text-sm text-gray-500">Completed Orders</span>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {orders.filter((o: any) => o.status === 'ARRIVED').length || 0}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <span className="text-sm text-gray-500">Cancelled Orders</span>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {orders.filter((o: any) => o.status === 'CANCELLED').length || 0}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <span className="text-sm text-gray-500">Products Supplied</span>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {products.length}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <span className="text-sm text-gray-500">Average Lead Time</span>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {statistics.avgLeadTime ||
                Math.round(
                  products.reduce((acc: number, p: any) => acc + (p.leadTimeDays || 0), 0) /
                    (products.length || 1)
                )}{' '}
              days
            </p>
          </div>
        </div>
      </div>

      {/* Products Supplied */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Products Supplied by This Supplier
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
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Lead Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No products assigned to this supplier yet
                  </td>
                </tr>
              ) : (
                products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${product.unitPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.leadTimeDays} days
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Purchase Order History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Purchase Order History
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Order Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No purchase orders found for this supplier
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.orderDate)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {orders.length > 5 && (
          <div className="p-4 border-t text-center">
            <button
              onClick={() => navigate('/purchase-orders')}
              className="text-primary-600 hover:text-primary-900 font-medium text-sm"
            >
              View All Orders
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <SupplierFormModal
          supplier={supplier}
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
