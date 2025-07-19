export interface SellerItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  availability: number;
  specifications: {
    [key: string]: string | number;
  };
  images: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SellerTransaction {
  id: string;
  client_id: string;
  item_id: string;
  item_name: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method: string;
  created_at: string;
  completed_at?: string;
  fees: {
    platform_fee: number;
    processing_fee: number;
    total_fee: number;
  };
  total_amount: number;
}

export interface SellerStats {
  total_items: number;
  total_transactions: number;
  total_revenue: number;
  active_listings: number;
  pending_transactions: number;
  completed_transactions: number;
  monthly_revenue: number;
  top_selling_items: Array<{
    item_id: string;
    item_name: string;
    sales_count: number;
    revenue: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// New types for transaction completion notifications
export interface TransactionCompletionNotification {
  transaction_id: string;
  seller_id: string;
  item_id: string;
  item_name: string;
  original_amount: number;
  currency: string;
  payment_method: string;
  completed_at: string;
  fees: {
    management_tier_fee: number;
    uex_fee: number;
    total_fees: number;
  };
  seller_payout_amount: number;
  client_id: string;
  order_id?: string;
}

export interface SellerPayout {
  transaction_id: string;
  seller_id: string;
  item_id: string;
  item_name: string;
  original_amount: number;
  seller_payout_amount: number;
  currency: string;
  fees_breakdown: {
    management_tier_fee: number;
    uex_fee: number;
    total_fees: number;
  };
  completed_at: string;
  status: 'pending' | 'processed' | 'completed' | 'failed';
  payout_method?: string;
  payout_reference?: string;
}

export interface FeeCalculation {
  original_amount: number;
  management_tier_fee: number;
  uex_fee: number;
  total_fees: number;
  seller_payout_amount: number;
  currency: string;
} 