import React from 'react';
import { Alert, AlertType, AlertSeverity } from '../../types';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  XCircle,
  Package,
  Warehouse,
  ShoppingCart,
  CheckCircle,
  X,
} from 'lucide-react';

interface AlertCardProps {
  alert: Alert;
  onResolve?: (id: string) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onResolve,
  onDelete,
  showActions = true,
}) => {
  const getAlertIcon = (type: AlertType, severity: AlertSeverity) => {
    const iconSize = 20;

    switch (type) {
      case 'LOW_STOCK':
        return <Package size={iconSize} />;
      case 'CAPACITY_WARNING':
      case 'CAPACITY_EXCEEDED':
        return <Warehouse size={iconSize} />;
      case 'ORDER_DELAYED':
        return <ShoppingCart size={iconSize} />;
      case 'SYSTEM_ERROR':
        return <XCircle size={iconSize} />;
      default:
        return <AlertCircle size={iconSize} />;
    }
  };

  const getSeverityStyles = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-800',
        };
      case 'ERROR':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          icon: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-800',
        };
      case 'WARNING':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-800',
        };
      case 'INFO':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-800',
        };
    }
  };

  const getTypeLabel = (type: AlertType) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'Low Stock';
      case 'CAPACITY_WARNING':
        return 'Capacity Warning';
      case 'CAPACITY_EXCEEDED':
        return 'Capacity Exceeded';
      case 'ORDER_DELAYED':
        return 'Order Delayed';
      case 'SYSTEM_ERROR':
        return 'System Error';
    }
  };

  const styles = getSeverityStyles(alert.severity);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`${styles.bg} border ${styles.border} rounded-lg p-4 ${
        alert.isResolved ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <div className={`${styles.icon} mt-0.5`}>
            {getAlertIcon(alert.type, alert.severity)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${styles.badge}`}>
                {alert.severity}
              </span>
              <span className="text-xs font-medium text-gray-600">
                {getTypeLabel(alert.type)}
              </span>
              {alert.isResolved && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle size={14} />
                  Resolved
                </span>
              )}
            </div>

            {/* Message */}
            <p className={`${styles.text} font-medium mb-2`}>{alert.message}</p>

            {/* Metadata Details */}
            {alert.metadata && (
              <div className="text-xs text-gray-600 space-y-1">
                {alert.metadata.productName && (
                  <div>
                    <span className="font-medium">Product:</span>{' '}
                    {alert.metadata.productName}
                    {alert.metadata.productSku && ` (${alert.metadata.productSku})`}
                  </div>
                )}
                {alert.metadata.warehouseName && (
                  <div>
                    <span className="font-medium">Warehouse:</span>{' '}
                    {alert.metadata.warehouseName}
                  </div>
                )}
                {alert.metadata.currentQuantity !== undefined &&
                  alert.metadata.reorderThreshold !== undefined && (
                    <div>
                      <span className="font-medium">Stock Level:</span>{' '}
                      {alert.metadata.currentQuantity} / {alert.metadata.reorderThreshold}{' '}
                      (threshold)
                    </div>
                  )}
                {alert.metadata.currentStock !== undefined &&
                  alert.metadata.capacity !== undefined && (
                    <div>
                      <span className="font-medium">Capacity:</span>{' '}
                      {alert.metadata.currentStock.toLocaleString()} /{' '}
                      {alert.metadata.capacity.toLocaleString()} (
                      {Math.round(
                        (alert.metadata.currentStock / alert.metadata.capacity) * 100
                      )}
                      %)
                    </div>
                  )}
                {alert.metadata.orderNumber && (
                  <div>
                    <span className="font-medium">Order:</span> {alert.metadata.orderNumber}
                  </div>
                )}
              </div>
            )}

            {/* Timestamp */}
            <div className="text-xs text-gray-500 mt-2">
              {formatDate(alert.createdAt)}
              {alert.resolvedAt && ` • Resolved ${formatDate(alert.resolvedAt)}`}
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && !alert.isResolved && (
          <div className="flex items-center gap-2 ml-4">
            {onResolve && (
              <button
                onClick={() => onResolve(alert.id)}
                className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-100"
                title="Mark as Resolved"
              >
                <CheckCircle size={18} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(alert.id)}
                className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
                title="Delete Alert"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
