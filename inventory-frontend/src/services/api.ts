import axios from 'axios';
import type { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Response interceptor for consistent error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const apiError = error.response.data as ApiResponse<any>;
      throw new Error(apiError.error?.message || 'An error occurred');
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// Products API
export const productsApi = {
  getAll: (params?: any) => apiClient.get('/products', { params }),
  getById: (id: string) => apiClient.get(`/products/${id}`),
  getStock: (id: string) => apiClient.get(`/products/${id}/stock`),
  getLowStock: (warehouseId?: string) =>
    apiClient.get('/products/low-stock', { params: { warehouseId } }),
  create: (data: any) => apiClient.post('/products', data),
  update: (id: string, data: any) => apiClient.patch(`/products/${id}`, data),
  delete: (id: string) => apiClient.delete(`/products/${id}`),
  adjustStock: (data: any) => apiClient.post('/products/adjust-stock', data),
};

// Purchase Orders API
export const purchaseOrdersApi = {
  getAll: (params?: any) => apiClient.get('/purchase-orders', { params }),
  getById: (id: string) => apiClient.get(`/purchase-orders/${id}`),
  getPending: (warehouseId?: string) =>
    apiClient.get('/purchase-orders/pending', { params: { warehouseId } }),
  getStatistics: (warehouseId?: string) =>
    apiClient.get('/purchase-orders/statistics', { params: { warehouseId } }),
  create: (data: any) => apiClient.post('/purchase-orders', data),
  update: (id: string, data: any) => apiClient.patch(`/purchase-orders/${id}`, data),
  markAsArrived: (id: string) => apiClient.post(`/purchase-orders/${id}/arrive`),
  cancel: (id: string) => apiClient.post(`/purchase-orders/${id}/cancel`),
};

// Warehouses API
export const warehousesApi = {
  getAll: (params?: any) => apiClient.get('/warehouses', { params }),
  getById: (id: string) => apiClient.get(`/warehouses/${id}`),
  getProducts: (id: string) => apiClient.get(`/warehouses/${id}/products`),
  getCapacity: (id: string) => apiClient.get(`/warehouses/${id}/capacity`),
  getStatistics: () => apiClient.get('/warehouses/statistics'),
  create: (data: any) => apiClient.post('/warehouses', data),
  update: (id: string, data: any) => apiClient.patch(`/warehouses/${id}`, data),
  delete: (id: string) => apiClient.delete(`/warehouses/${id}`),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params?: any) => apiClient.get('/suppliers', { params }),
  getById: (id: string) => apiClient.get(`/suppliers/${id}`),
  getStatistics: (id: string) => apiClient.get(`/suppliers/${id}/statistics`),
  create: (data: any) => apiClient.post('/suppliers', data),
  update: (id: string, data: any) => apiClient.patch(`/suppliers/${id}`, data),
  delete: (id: string) => apiClient.delete(`/suppliers/${id}`),
};

// Alerts API
export const alertsApi = {
  getAll: (params?: any) => apiClient.get('/alerts', { params }),
  getById: (id: string) => apiClient.get(`/alerts/${id}`),
  getStatistics: () => apiClient.get('/alerts/statistics'),
  resolve: (id: string) => apiClient.post(`/alerts/${id}/resolve`),
  delete: (id: string) => apiClient.delete(`/alerts/${id}`),
};
