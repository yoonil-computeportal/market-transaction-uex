export interface PaymentTransaction {
  id: string;
  client_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  target_currency: string;
  conversion_rate?: number;
  uex_buyer_fee?: number;
  uex_seller_fee?: number;
  conversion_fee?: number;
  management_fee?: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method: 'fiat' | 'crypto';
  settlement_method: 'bank' | 'blockchain';
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  failure_reason?: string;
  transaction_hash?: string;
  bank_reference?: string;
}

export interface SellerPayoutAccount {
  id: string;
  seller_id: string;
  account_type: 'bank' | 'crypto';
  account_details: {
    bank_name?: string;
    account_number?: string;
    routing_number?: string;
    crypto_address?: string;
    crypto_network?: string;
  };
  currency: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CurrencyConversion {
  id: string;
  transaction_id: string;
  from_currency: string;
  to_currency: string;
  exchange_rate: number;
  amount: number;
  converted_amount: number;
  conversion_fee: number;
  created_at: Date;
}

export interface ManagementTierFee {
  id: string;
  transaction_id: string;
  fee_type: 'processing' | 'settlement' | 'currency_conversion';
  amount: number;
  currency: string;
  description: string;
  created_at: Date;
}

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  source: string;
  valid_until: Date;
  created_at: Date;
}

export interface PaymentRequest {
  client_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  target_currency: string;
  payment_method: 'fiat' | 'crypto';
  settlement_method: 'bank' | 'blockchain';
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  transaction_id: string;
  status: string;
  amount: number;
  currency: string;
  target_currency: string;
  conversion_rate?: number;
  fees: {
    uex_buyer_fee?: number;
    uex_seller_fee?: number;
    conversion_fee?: number;
    management_fee?: number;
    total_fee: number;
  };
  total_amount: number;
  estimated_settlement_time: string;
  created_at: Date;
}

export interface WorkflowStep {
  step_id: string;
  transaction_id: string;
  step_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

export interface CurrencyPair {
  from_currency: string;
  to_currency: string;
  rate: number;
  last_updated: Date;
}

export interface FeeStructure {
  uex_buyer_fee_percentage: number;
  uex_seller_fee_percentage: number;
  conversion_fee_percentage: number;
  management_fee_percentage: number;
  minimum_fee: number;
  maximum_fee: number;
  currency: string;
}

export interface SettlementRequest {
  transaction_id: string;
  settlement_method: 'bank' | 'blockchain';
  recipient_details: {
    bank_account?: {
      account_number: string;
      routing_number: string;
      bank_name: string;
    };
    crypto_address?: {
      address: string;
      network: string;
    };
  };
  amount: number;
  currency: string;
}

export interface SettlementResponse {
  settlement_id: string;
  transaction_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  settlement_method: string;
  amount: number;
  currency: string;
  reference_id?: string;
  estimated_completion: Date;
  created_at: Date;
} 