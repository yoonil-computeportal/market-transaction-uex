/**
 * UEX API Types and Interfaces
 * Based on UEX API Documentation: https://uex-us.stoplight.io/docs/uex
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface UEXConfig {
  swapBaseUrl: string;
  merchantBaseUrl: string;
  referralCode: string;
  clientId?: string;
  secretKey?: string;
}

// ============================================================================
// Currency Types
// ============================================================================

export interface UEXCurrency {
  code: string;
  name: string;
  network: string;
  chain_id: string;
  icon?: string;
  min_amount?: number;
  max_amount?: number;
  decimals?: number;
}

export interface GetCurrenciesResponse {
  success: boolean;
  data: UEXCurrency[];
}

// ============================================================================
// Exchange Rate / Estimation Types
// ============================================================================

export interface EstimateRequest {
  send: string;           // Currency code (e.g., "BTC")
  network: string;        // Network/chain ID (e.g., "BTC")
  receive: string;        // Target currency code (e.g., "USDT")
  receive_network: string; // Target network/chain ID (e.g., "TRX")
  amount: number;         // Amount to convert
}

export interface EstimateResponse {
  success: boolean;
  data: {
    send_amount: number;
    receive_amount: number;
    rate: number;
    min_amount: number;
    max_amount: number;
    provider_fee: number;
    network_fee: number;
    estimated_time: string; // e.g., "10-30 minutes"
  };
}

// ============================================================================
// Swap Initiation Types
// ============================================================================

export interface SwapInitiateRequest {
  send_amount: number;
  from_currency: string;
  base_currency_chain_id: string;
  to_currency: string;
  quote_currency_chain_id: string;
  userWallet: string;           // User's receiving wallet address
  receive_tag?: string | null;  // Memo/tag for some currencies (XRP, XLM, etc.)
  extend: {
    ref_code: string;            // Referral code (REQUIRED)
    [key: string]: any;          // Additional metadata
  };
}

export interface SwapInitiateResponse {
  success: boolean;
  data: {
    orderId: string;              // UEX order ID
    deposit_address: string;      // Where customer sends crypto
    deposit_network: string;      // Network for deposit
    deposit_tag?: string;         // Memo/tag if required
    expected_amount: number;      // Expected deposit amount
    receive_amount: number;       // Amount user will receive
    status: string;               // Order status
    created_at: string;           // ISO timestamp
    expires_at?: string;          // Expiration time
  };
}

// ============================================================================
// Order Status Types
// ============================================================================

export interface OrderStatusRequest {
  orderId: string;
}

export interface OrderStatusResponse {
  success: boolean;
  data: {
    orderId: string;
    external_status: UEXOrderStatus;
    internal_status: string;
    send_amount: number;
    from_currency: string;
    base_currency_chain_id: string;
    receive_amount: number;
    to_currency: string;
    quote_currency_chain_id: string;
    deposit_address: string;
    deposit_tag?: string;
    user_wallet: string;
    transaction_hash?: string;     // Blockchain transaction hash
    confirmations?: number;        // Number of confirmations
    created_at: string;
    updated_at: string;
    completed_at?: string;
    error_message?: string;
  };
}

export enum UEXOrderStatus {
  AWAITING_DEPOSIT = 'Awaiting Deposit',
  CONFIRMING_DEPOSIT = 'Confirming Deposit',
  EXCHANGING = 'Exchanging',
  SENDING = 'Sending',
  COMPLETE = 'Complete',
  FAILED = 'Failed',
  REFUND = 'Refund',
  EXPIRED = 'Expired'
}

// ============================================================================
// Merchant API Types (OAuth2 + Payment Links)
// ============================================================================

export interface OAuth2TokenRequest {
  client_id: string;
  secret_key: string;
}

export interface OAuth2TokenResponse {
  success: boolean;
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;      // Seconds until expiration
    scope?: string;
  };
}

export interface GeneratePaymentLinkRequest {
  order: string;              // Your order ID
  item_name: string;          // Product/service name
  amount: string;             // Amount in fiat currency
  currency?: string;          // Default: USD
  success_url: string;        // Redirect on success
  failure_url: string;        // Redirect on failure
  cancel_url?: string;        // Redirect on cancel
  webhook_url?: string;       // Webhook for status updates
  metadata?: Record<string, any>; // Additional data
}

export interface GeneratePaymentLinkResponse {
  success: boolean;
  data: {
    payment_url: string;      // URL to redirect customer
    payment_id: string;       // UEX payment ID
    order_id: string;         // Your order ID
    amount: string;
    currency: string;
    status: string;
    expires_at: string;       // ISO timestamp
    created_at: string;
  };
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface UEXWebhookPayload {
  order_id: string;
  status: UEXOrderStatus;
  transaction_hash?: string;
  confirmations?: number;
  send_amount: number;
  receive_amount: number;
  from_currency: string;
  to_currency: string;
  completed_at?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Error Types
// ============================================================================

export interface UEXErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export class UEXAPIError extends Error {
  code: string;
  details?: any;

  constructor(message: string, code: string = 'UEX_API_ERROR', details?: any) {
    super(message);
    this.name = 'UEXAPIError';
    this.code = code;
    this.details = details;
  }
}

// ============================================================================
// Internal Transaction Types (for database)
// ============================================================================

export interface UEXTransactionData {
  uex_order_id: string;
  uex_status: UEXOrderStatus;
  deposit_address: string;
  deposit_network: string;
  deposit_tag?: string;
  expected_amount: number;
  receive_amount: number;
  user_wallet: string;
  transaction_hash?: string;
  confirmations?: number;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
  error_message?: string;
  raw_response?: any;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface CurrencyPair {
  from: string;
  fromNetwork: string;
  to: string;
  toNetwork: string;
}

export interface CachedRate {
  rate: number;
  timestamp: Date;
  expiresAt: Date;
}

// ============================================================================
// Status Mapping
// ============================================================================

export const UEXStatusToInternalStatus: Record<UEXOrderStatus, string> = {
  [UEXOrderStatus.AWAITING_DEPOSIT]: 'pending',
  [UEXOrderStatus.CONFIRMING_DEPOSIT]: 'processing',
  [UEXOrderStatus.EXCHANGING]: 'processing',
  [UEXOrderStatus.SENDING]: 'processing',
  [UEXOrderStatus.COMPLETE]: 'completed',
  [UEXOrderStatus.FAILED]: 'failed',
  [UEXOrderStatus.REFUND]: 'cancelled',
  [UEXOrderStatus.EXPIRED]: 'failed'
};
