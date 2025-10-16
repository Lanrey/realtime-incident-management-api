import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  LayoutDashboard,
  Bell,
} from 'lucide-react';
import { alertsApi } from '../../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  // Fetch alert statistics for badge
  const { data: alertStats } = useQuery({
    queryKey: ['alert-statistics'],
    queryFn: async () => {
      const response = await alertsApi.getStatistics();
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const unresolvedCount = alertStats?.data?.unresolved || 0;
  const criticalCount = alertStats?.data?.critical || 0;

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
    { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart },
    { name: 'Suppliers', href: '/suppliers', icon: Users },
    { name: 'Alerts', href: '/alerts', icon: Bell, badge: unresolvedCount, critical: criticalCount > 0 },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center px-6 border-b">
          <h1 className="text-xl font-bold text-primary-600">
            Inventory System
          </h1>
        </div>

        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 mb-1 rounded-lg text-sm font-medium transition-colors relative
                  ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon size={20} />
                {item.name}
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-auto px-2 py-0.5 text-xs font-bold rounded-full ${
                      item.critical
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-yellow-500 text-white'
                    }`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
};
