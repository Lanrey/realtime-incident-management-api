import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { suppliersApi } from '../../services/api';
import { Supplier } from '../../types';
import { Plus, Edit, Trash2, Eye, Mail, Phone } from 'lucide-react';
import { SupplierFormModal } from './SupplierFormModal';

export const SupplierList: React.FC = () => {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await suppliersApi.getAll();
      return response.data;
    },
  });

  const suppliers = data?.data || [];

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      try {
        await suppliersApi.delete(id);
        refetch();
      } catch (error: any) {
        alert(error.message || 'Failed to delete supplier');
      }
    }
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      await suppliersApi.update(supplier.id, {
        isActive: !supplier.isActive,
      });
      refetch();
    } catch (error: any) {
      alert(error.message || 'Failed to update supplier status');
    }
  };

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
          <p className="text-gray-600 mt-1">Manage your supplier relationships</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Supplier
        </button>
      </div>

      {/* Status Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">Status Indicators:</h3>
        <div className="flex gap-6 text-sm text-blue-800">
          <div className="flex items-center gap-2">
            <span>🟢</span>
            <span>Active - Available for purchase orders</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔴</span>
            <span>Inactive - Not available for new orders</span>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Phone
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
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading suppliers...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No suppliers found. Create your first supplier to get started.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier: Supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {supplier.isActive ? '🟢' : '🔴'}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {supplier.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-gray-400" />
                        {supplier.contactEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-gray-400" />
                        {supplier.contactPhone}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          supplier.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {supplier.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => navigate(`/suppliers/${supplier.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => setEditingSupplier(supplier)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(supplier)}
                          className={`${
                            supplier.isActive
                              ? 'text-orange-600 hover:text-orange-900'
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={supplier.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {supplier.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(supplier.id, supplier.name)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <SupplierFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}

      {/* Edit Modal */}
      {editingSupplier && (
        <SupplierFormModal
          supplier={editingSupplier}
          onClose={() => setEditingSupplier(null)}
          onSuccess={() => {
            setEditingSupplier(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};
