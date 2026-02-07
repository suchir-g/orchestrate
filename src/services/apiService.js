// API Service for backend communication
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Events API
export const eventsApi = {
  getAll: () => apiClient.get('/events'),
  getById: (id) => apiClient.get(`/events/${id}`),
  create: (data) => apiClient.post('/events', data),
  update: (id, data) => apiClient.put(`/events/${id}`, data),
  delete: (id) => apiClient.delete(`/events/${id}`),
  getAnalytics: (eventId) => apiClient.get(`/events/${eventId}/analytics`),
};

// Orders API
export const ordersApi = {
  getAll: () => apiClient.get('/orders'),
  getById: (id) => apiClient.get(`/orders/${id}`),
  create: (data) => apiClient.post('/orders', data),
  update: (id, data) => apiClient.put(`/orders/${id}`, data),
  updateStatus: (id, status) => apiClient.patch(`/orders/${id}/status`, { status }),
  getTracking: (trackingNumber) => apiClient.get(`/orders/tracking/${trackingNumber}`),
};

// Shipments API
export const shipmentsApi = {
  getAll: () => apiClient.get('/shipments'),
  getById: (id) => apiClient.get(`/shipments/${id}`),
  getByTrackingNumber: (trackingNumber) => apiClient.get(`/shipments/track/${trackingNumber}`),
  updateLocation: (id, location) => apiClient.patch(`/shipments/${id}/location`, { location }),
};

// Analytics API
export const analyticsApi = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getEventAnalytics: (timeRange = '30d') => apiClient.get(`/analytics/events?range=${timeRange}`),
  getOrderAnalytics: (timeRange = '30d') => apiClient.get(`/analytics/orders?range=${timeRange}`),
  getPredictions: () => apiClient.get('/analytics/predictions'),
  getDeliveryPredictions: () => apiClient.get('/analytics/predictions/delivery'),
  getDemandForecast: (days = 30) => apiClient.get(`/analytics/forecast?days=${days}`),
};

// Blockchain API
export const blockchainApi = {
  mintTicket: (ticketData) => apiClient.post('/blockchain/tickets/mint', ticketData),
  getTickets: (walletAddress) => apiClient.get(`/blockchain/tickets/${walletAddress}`),
  verifyTicket: (tokenId) => apiClient.get(`/blockchain/tickets/verify/${tokenId}`),
  transferTicket: (tokenId, to) => apiClient.post(`/blockchain/tickets/${tokenId}/transfer`, { to }),
};

// File Upload API
export const uploadApi = {
  uploadFile: (file, type = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    return apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteFile: (fileId) => apiClient.delete(`/upload/${fileId}`),
};

// Dashboard Analytics - Structured error handling
export const getDashboardAnalytics = async (timeRange = '30d') => {
  try {
    const response = await apiClient.get(`/analytics/dashboard?range=${timeRange}`);
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return {
      data: null,
      error: error.response?.data?.message || error.message || 'Failed to fetch dashboard analytics'
    };
  }
};

export default apiClient;