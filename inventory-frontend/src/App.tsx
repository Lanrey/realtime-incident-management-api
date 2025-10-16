import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Common/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProductList } from './components/Products/ProductList';
import { PurchaseOrderList } from './components/PurchaseOrders/PurchaseOrderList';
import { WarehouseList } from './components/Warehouses/WarehouseList';
import { WarehouseDetail } from './components/Warehouses/WarehouseDetail';
import { SupplierList } from './components/Suppliers/SupplierList';
import { SupplierDetail } from './components/Suppliers/SupplierDetail';
import { AlertList } from './components/Alerts/AlertList';
import { useSSE } from './hooks/useSSE';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

function AppContent() {
  // Initialize SSE connection with real-time notifications
  useSSE((eventType, data) => {
    // Invalidate relevant queries based on event type
    if (eventType === 'stock' || eventType === 'warehouse') {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    }
    if (eventType === 'alert') {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    }
    if (eventType === 'order') {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    }
  });

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/purchase-orders" element={<PurchaseOrderList />} />
          <Route path="/warehouses" element={<WarehouseList />} />
          <Route path="/warehouses/:id" element={<WarehouseDetail />} />
          <Route path="/suppliers" element={<SupplierList />} />
          <Route path="/suppliers/:id" element={<SupplierDetail />} />
          <Route path="/alerts" element={<AlertList />} />
        </Routes>
      </Layout>
    </Router>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px',
            maxWidth: '500px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
