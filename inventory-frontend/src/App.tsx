import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Common/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProductList } from './components/Products/ProductList';
import { PurchaseOrderList } from './components/PurchaseOrders/PurchaseOrderList';
import { WarehouseList } from './components/Warehouses/WarehouseList';
import { WarehouseDetail } from './components/Warehouses/WarehouseDetail';
import { SupplierList } from './components/Suppliers/SupplierList';
import { SupplierDetail } from './components/Suppliers/SupplierDetail';
import { AlertList } from './components/Alerts/AlertList';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
}

export default App;
