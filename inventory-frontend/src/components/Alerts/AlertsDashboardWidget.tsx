import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { alertsApi } from '../../services/api';
import { Alert } from '../../types';
import { AlertCard } from './AlertCard';
import { Bell, ArrowRight } from 'lucide-react';

export const AlertsDashboardWidget: React.FC = () => {
  const navigate = useNavigate();

  const { data: statisticsData } = useQuery({
    queryKey: ['alert-statistics'],
    queryFn: async () => {
      const response = await alertsApi.getStatistics();
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const statistics = statisticsData?.data;
  const recentAlerts = statistics?.recent || [];

  if (!statistics || statistics.unresolved === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
          <Bell size={20} className="text-gray-400" />
        </div>
        <div className="text-center py-8">
          <Bell size={48} className="mx-auto text-green-300 mb-3" />
          <p className="text-green-600 font-medium">All Clear!</p>
          <p className="text-sm text-gray-500 mt-1">No active alerts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell size={20} />
              Active Alerts
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {statistics.unresolved} unresolved alert{statistics.unresolved !== 1 ? 's' : ''}
              {statistics.critical > 0 && (
                <span className="ml-2 text-red-600 font-semibold">
                  • {statistics.critical} critical
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => navigate('/alerts')}
            className="text-primary-600 hover:text-primary-800 flex items-center gap-1 text-sm font-medium"
          >
            View All
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="p-6 border-b bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* By Severity */}
          {statistics.bySeverity.CRITICAL > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {statistics.bySeverity.CRITICAL}
              </div>
              <div className="text-xs text-gray-600 mt-1">Critical</div>
            </div>
          )}
          {statistics.bySeverity.ERROR > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.bySeverity.ERROR}
              </div>
              <div className="text-xs text-gray-600 mt-1">Errors</div>
            </div>
          )}
          {statistics.bySeverity.WARNING > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {statistics.bySeverity.WARNING}
              </div>
              <div className="text-xs text-gray-600 mt-1">Warnings</div>
            </div>
          )}
          {statistics.bySeverity.INFO > 0 && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.bySeverity.INFO}
              </div>
              <div className="text-xs text-gray-600 mt-1">Info</div>
            </div>
          )}
        </div>

        {/* By Type */}
        {Object.keys(statistics.byType).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="text-xs font-semibold text-gray-700 mb-2">By Type:</div>
            <div className="flex flex-wrap gap-2">
              {statistics.byType.LOW_STOCK > 0 && (
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                  Low Stock: {statistics.byType.LOW_STOCK}
                </span>
              )}
              {statistics.byType.CAPACITY_WARNING > 0 && (
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded">
                  Capacity Warning: {statistics.byType.CAPACITY_WARNING}
                </span>
              )}
              {statistics.byType.CAPACITY_EXCEEDED > 0 && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">
                  Capacity Exceeded: {statistics.byType.CAPACITY_EXCEEDED}
                </span>
              )}
              {statistics.byType.ORDER_DELAYED > 0 && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  Order Delayed: {statistics.byType.ORDER_DELAYED}
                </span>
              )}
              {statistics.byType.SYSTEM_ERROR > 0 && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                  System Error: {statistics.byType.SYSTEM_ERROR}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Alerts */}
      <div className="p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Alerts</h3>
        <div className="space-y-3">
          {recentAlerts.slice(0, 5).map((alert: Alert) => (
            <AlertCard key={alert.id} alert={alert} showActions={false} />
          ))}
        </div>
        {recentAlerts.length > 5 && (
          <button
            onClick={() => navigate('/alerts')}
            className="w-full mt-4 text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            View {recentAlerts.length - 5} more alerts
          </button>
        )}
      </div>
    </div>
  );
};
