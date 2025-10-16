import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { warehousesApi } from '../../services/api';
import { Warehouse } from '../../types';
import { Plus, Edit, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { WarehouseFormModal } from './WarehouseFormModal';

export const WarehouseList: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await warehousesApi.getAll();
      return response.data;
    },
  });

  const warehouses = data?.data || [];

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 81) return 'text-red-600';
    if (percentage >= 61) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCapacityBgColor = (percentage: number) => {
    if (percentage >= 81) return 'bg-red-100';
    if (percentage >= 61) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  const getCapacityIndicator = (percentage: number) => {
    if (percentage >= 81) return '🔴';
    if (percentage >= 61) return '🟡';
    return '🟢';
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete warehouse "${name}"?`)) {
      try {
        await warehousesApi.delete(id);
        refetch();
      } catch (error: any) {
        alert(error.message || 'Failed to delete warehouse');
      }
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-gray-600 mt-1">Manage your warehouse locations and capacity</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Warehouse
        </button>
      </div>

      {/* Capacity Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Capacity Indicators:</h3>
        <div className="flex gap-6 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <span>🟢</span>
            <span>Green (0-60%): Normal capacity</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🟡</span>
            <span>Yellow (61-80%): Warning - approaching limit</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔴</span>
            <span>Red (81-100%): Critical - near/at capacity</span>
          </div>
        </div>
      </div>

      {/* Warehouses Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Loading warehouses...
                  </td>
                </tr>
              ) : warehouses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No warehouses found. Create your first warehouse to get started.
                  </td>
                </tr>
              ) : (
                warehouses.map((warehouse: Warehouse) => {
                  const utilizationPercentage = Math.round(
                    (warehouse.currentStock / warehouse.capacity) * 100
                  );

                  return (
                    <tr key={warehouse.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {warehouse.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {warehouse.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {warehouse.capacity.toLocaleString()} units
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {getCapacityIndicator(utilizationPercentage)}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {warehouse.currentStock.toLocaleString()} units
                            </div>
                            <div
                              className={`text-xs font-semibold ${getCapacityColor(
                                utilizationPercentage
                              )}`}
                            >
                              ({utilizationPercentage}%)
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            warehouse.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {warehouse.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => navigate(`/warehouses/${warehouse.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => setEditingWarehouse(warehouse)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(warehouse.id, warehouse.name)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <WarehouseFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingWarehouse && (
        <WarehouseFormModal
          warehouse={editingWarehouse}
          onClose={() => setEditingWarehouse(null)}
          onSuccess={() => {
            setEditingWarehouse(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};
