const API_BASE_URL = '/api';

export interface PaymentTransaction {
  id: string;
  client_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  target_currency: string;
  payment_method: string;
  settlement_method: string;
  status: 'initiated' | 'processing' | 'settled' | 'failed';
  created_at: string;
  updated_at: string;
  uex_buyer_fee?: number;
  uex_seller_fee?: number;
  conversion_fee?: number;
  management_fee?: number;
  total_amount: number;
  conversion_rate?: number;
  fees?: {
    processing_fee: number;
    currency_conversion_fee: number;
    settlement_fee: number;
    total_fees: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  error?: {
    message: string;
    code: string;
  };
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get all payment transactions
  async getPayments(): Promise<PaymentTransaction[]> {
    const response: ApiResponse<PaymentTransaction[]> = await this.request('/payments');
    return response.data;
  }

  // Get specific payment transaction
  async getPayment(id: string): Promise<PaymentTransaction> {
    const response: ApiResponse<PaymentTransaction> = await this.request(`/payments/${id}`);
    return response.data;
  }

  // Get payment status
  async getPaymentStatus(id: string): Promise<{ id: string; status: string; updated_at: string }> {
    const response: ApiResponse<{ id: string; status: string; updated_at: string }> = await this.request(`/payments/${id}/status`);
    return response.data;
  }
}

export const apiService = new ApiService(); 