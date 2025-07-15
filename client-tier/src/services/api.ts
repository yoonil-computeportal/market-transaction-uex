import axios from 'axios'
import { 
  Resource, 
  Order, 
  Transaction, 
  PaymentMethod, 
  Payment,
  SearchParams,
  ApiResponse,
  PaginatedResponse,
  RealTransaction
} from '../types'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Resource API
export const resourceApi = {
  search: async (params: SearchParams): Promise<PaginatedResponse<Resource>> => {
    const response = await api.get('/resources/search', { params })
    return response.data
  },

  getById: async (id: string): Promise<Resource> => {
    const response = await api.get(`/resources/${id}`)
    return response.data
  },

  compare: async (resourceIds: string[]): Promise<Resource[]> => {
    const response = await api.post('/resources/compare', { resourceIds })
    return response.data
  },

  getAvailability: async (id: string): Promise<{ availability: number; utilization: number }> => {
    const response = await api.get(`/resources/${id}/availability`)
    return response.data
  },
}

// Order API
export const orderApi = {
  create: async (orderData: Partial<Order>): Promise<Order> => {
    const response = await api.post('/orders', orderData)
    return response.data
  },

  getById: async (id: string): Promise<Order> => {
    const response = await api.get(`/orders/${id}`)
    return response.data
  },

  getUserOrders: async (params?: { page?: number; limit?: number; status?: string; userId?: string }): Promise<PaginatedResponse<Order>> => {
    const response = await api.get('/orders/user', { params })
    return response.data
  },

  update: async (id: string, updates: Partial<Order>): Promise<Order> => {
    const response = await api.put(`/orders/${id}`, updates)
    return response.data
  },

  cancel: async (id: string): Promise<Order> => {
    const response = await api.post(`/orders/${id}/cancel`)
    return response.data
  },
}

// Transaction API
export const transactionApi = {
  getById: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`)
    return response.data
  },

  getUserTransactions: async (params?: { page?: number; limit?: number; status?: string; userId?: string }): Promise<PaginatedResponse<RealTransaction>> => {
    const response = await api.get('/transactions/user', { params })
    return response.data
  },

  getTransactionHistory: async (params?: { startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<PaginatedResponse<Transaction>> => {
    const response = await api.get('/transactions/history', { params })
    return response.data
  },
}

// Payment API
export const paymentApi = {
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    const response = await api.get('/payments/methods')
    return response.data
  },

  addPaymentMethod: async (methodData: Partial<PaymentMethod>): Promise<PaymentMethod> => {
    const response = await api.post('/payments/methods', methodData)
    return response.data
  },

  removePaymentMethod: async (id: string): Promise<void> => {
    await api.delete(`/payments/methods/${id}`)
  },

  processPayment: async (paymentData: { transactionId: string; methodId: string; amount: number }): Promise<Payment> => {
    const response = await api.post('/payments/process', paymentData)
    return response.data
  },

  getPaymentHistory: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Payment>> => {
    const response = await api.get('/payments/history', { params })
    return response.data
  },
}

// Real-time updates
export const realtimeApi = {
  subscribeToResourceUpdates: (resourceId: string, callback: (data: any) => void) => {
    // WebSocket implementation would go here
    console.log(`Subscribing to resource updates for ${resourceId}`)
  },

  subscribeToOrderUpdates: (orderId: string, callback: (data: any) => void) => {
    // WebSocket implementation would go here
    console.log(`Subscribing to order updates for ${orderId}`)
  },

  subscribeToTransactionUpdates: (transactionId: string, callback: (data: any) => void) => {
    // WebSocket implementation would go here
    console.log(`Subscribing to transaction updates for ${transactionId}`)
  },
}

export default api 