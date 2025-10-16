import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Common/Layout';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ProductList } from './components/Products/ProductList';
import { PurchaseOrderList } from './components/PurchaseOrders/PurchaseOrderList';

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
            <Route path="/warehouses" element={<div className="text-2xl">Warehouses (Coming Soon)</div>} />
            <Route path="/suppliers" element={<div className="text-2xl">Suppliers (Coming Soon)</div>} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
