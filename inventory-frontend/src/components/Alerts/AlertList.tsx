import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsApi } from '../../services/api';
import { Alert, AlertType, AlertSeverity } from '../../types';
import { AlertCard } from './AlertCard';
import { Bell, Filter, X } from 'lucide-react';

export const AlertList: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<AlertType | 'ALL'>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<AlertSeverity | 'ALL'>('ALL');
  const [showResolved, setShowResolved] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['alerts', page, filterType, filterSeverity, showResolved],
    queryFn: async () => {
      const params: any = {
        page,
        limit: 20,
        isResolved: showResolved ? undefined : false,
      };

      if (filterType !== 'ALL') params.type = filterType;
      if (filterSeverity !== 'ALL') params.severity = filterSeverity;

      const response = await alertsApi.getAll(params);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => alertsApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-statistics'] });
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['alert-statistics'] });
      refetch();
    },
  });

  const alerts = data?.data || [];
  const meta = data?.meta;

  const handleResolve = async (id: string) => {
    if (window.confirm('Mark this alert as resolved?')) {
      resolveMutation.mutate(id);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this alert permanently?')) {
      deleteMutation.mutate(id);
    }
  };

  const clearFilters = () => {
    setFilterType('ALL');
    setFilterSeverity('ALL');
    setShowResolved(false);
    setPage(1);
  };

  const hasActiveFilters = filterType !== 'ALL' || filterSeverity !== 'ALL' || showResolved;

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="text-gray-600 mt-1">Monitor system alerts and notifications</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={18} className="text-gray-600" />
          <span className="font-semibold text-gray-700">Filters</span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert Type
            </label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as AlertType | 'ALL');
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ALL">All Types</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="CAPACITY_WARNING">Capacity Warning</option>
              <option value="CAPACITY_EXCEEDED">Capacity Exceeded</option>
              <option value="ORDER_DELAYED">Order Delayed</option>
              <option value="SYSTEM_ERROR">System Error</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Severity
            </label>
            <select
              value={filterSeverity}
              onChange={(e) => {
                setFilterSeverity(e.target.value as AlertSeverity | 'ALL');
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Show Resolved */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex items-center h-10">
              <input
                type="checkbox"
                id="showResolved"
                checked={showResolved}
                onChange={(e) => {
                  setShowResolved(e.target.checked);
                  setPage(1);
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="showResolved" className="ml-2 text-sm text-gray-700">
                Show resolved alerts
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Loading alerts...
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {hasActiveFilters
                ? 'No alerts match your filters'
                : 'No active alerts. Everything looks good!'}
            </p>
          </div>
        ) : (
          <>
            {alerts.map((alert: Alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onResolve={handleResolve}
                onDelete={handleDelete}
              />
            ))}

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                <span className="text-sm text-gray-700">
                  Page {meta.page} of {meta.totalPages} ({meta.total} total alerts)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === meta.totalPages}
                    className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
