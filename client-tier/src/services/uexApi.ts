import axios from 'axios';

// UEX Backend API Configuration
// Dynamically construct URL based on window location for Kubernetes deployment
const getUEXApiUrl = () => {
  if (typeof window !== 'undefined') {
    // In browser, use the same hostname with port 31903
    const hostname = window.location.hostname;
    return `http://${hostname}:31903/api`;
  }
  // Fallback for SSR or non-browser environments
  return (import.meta as any).env?.VITE_UEX_API_URL || 'http://localhost:3903/api';
};

const UEX_API_BASE_URL = getUEXApiUrl();

// Create axios instance for UEX API
const uexApi = axios.create({
  baseURL: UEX_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// UEX API Types
export interface UEXPaymentRequest {
  client_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  target_currency: string;
  payment_method: 'fiat' | 'crypto';
  settlement_method: 'bank' | 'blockchain';
  metadata?: Record<string, any>;
}

export interface UEXPaymentResponse {
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
  target_currency: string;
  conversion_rate?: number;
  fees: {
    conversion_fee?: number;
    management_fee?: number;
    total_fee: number;
  };
  total_amount: number;
  estimated_settlement_time: string;
  created_at: string;
}

export interface UEXTransactionStatus {
  id: string;
  client_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  target_currency: string;
  conversion_rate?: number;
  conversion_fee?: number;
  management_fee?: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method: 'fiat' | 'crypto';
  settlement_method: 'bank' | 'blockchain';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  failure_reason?: string;
  transaction_hash?: string;
  bank_reference?: string;
}

export interface UEXTransactionFee {
  id: string;
  transaction_id: string;
  fee_type: 'processing' | 'settlement' | 'currency_conversion';
  amount: number;
  currency: string;
  description: string;
  created_at: string;
}

export interface UEXCurrencyConversion {
  id: string;
  transaction_id: string;
  from_currency: string;
  to_currency: string;
  exchange_rate: number;
  amount: number;
  converted_amount: number;
  conversion_fee: number;
  created_at: string;
}

// UEX API Service Class
export class UEXApiService {
  /**
   * Process a payment through UEX backend
   */
  static async processPayment(paymentRequest: UEXPaymentRequest): Promise<UEXPaymentResponse> {
    try {
      const response = await uexApi.post('/payments/process', paymentRequest);
      return response.data.data;
    } catch (error: any) {
      console.error('UEX Payment processing error:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to process payment through UEX backend'
      );
    }
  }

  /**
   * Get transaction status from UEX backend
   */
  static async getTransactionStatus(transactionId: string): Promise<UEXTransactionStatus> {
    try {
      const response = await uexApi.get(`/payments/transaction/${transactionId}/status`);
      return response.data.data;
    } catch (error: any) {
      console.error('UEX Get transaction status error:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to get transaction status from UEX backend'
      );
    }
  }

  /**
   * Update transaction status in UEX backend
   */
  static async updateTransactionStatus(
    transactionId: string, 
    status: UEXTransactionStatus['status'], 
    metadata?: any
  ): Promise<UEXTransactionStatus> {
    try {
      const response = await uexApi.put(`/payments/transaction/${transactionId}/status`, {
        status,
        metadata
      });
      return response.data.data;
    } catch (error: any) {
      console.error('UEX Update transaction status error:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to update transaction status in UEX backend'
      );
    }
  }

  /**
   * Get transaction fees from UEX backend
   */
  static async getTransactionFees(transactionId: string): Promise<UEXTransactionFee[]> {
    try {
      const response = await uexApi.get(`/payments/transaction/${transactionId}/fees`);
      return response.data.data;
    } catch (error: any) {
      console.error('UEX Get transaction fees error:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to get transaction fees from UEX backend'
      );
    }
  }

  /**
   * Get currency conversions from UEX backend
   */
  static async getTransactionConversions(transactionId: string): Promise<UEXCurrencyConversion[]> {
    try {
      const response = await uexApi.get(`/payments/transaction/${transactionId}/conversions`);
      return response.data.data;
    } catch (error: any) {
      console.error('UEX Get transaction conversions error:', error);
      throw new Error(
        error.response?.data?.message || 
        'Failed to get transaction conversions from UEX backend'
      );
    }
  }

  /**
   * Check UEX backend health
   */
  static async checkHealth(): Promise<{ status: string; service: string; timestamp: string }> {
    try {
      const response = await uexApi.get('/payments/health');
      return response.data;
    } catch (error: any) {
      console.error('UEX Health check error:', error);
      throw new Error('UEX backend is not available');
    }
  }

  /**
   * Get UEX API documentation
   */
  static async getApiInfo(): Promise<any> {
    try {
      const response = await uexApi.get('/payments');
      return response.data;
    } catch (error) {
      console.error('UEX API info error:', error);
      throw new Error('Failed to get UEX API information');
    }
  }
}

// Export the axios instance for direct use if needed
export { uexApi };

// Export default service instance
export default UEXApiService; 