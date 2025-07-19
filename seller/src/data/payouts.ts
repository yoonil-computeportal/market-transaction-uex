import { SellerPayout, TransactionCompletionNotification, FeeCalculation } from '../types';

// Sample seller payouts data
export const sellerPayouts: SellerPayout[] = [
  {
    transaction_id: 'txn-001',
    seller_id: 'cloud-provider-b',
    item_id: 'rtx-4090-gpu',
    item_name: 'NVIDIA RTX 4090 GPU',
    original_amount: 1695.97,
    seller_payout_amount: 1500.00,
    currency: 'USD',
    fees_breakdown: {
      management_tier_fee: 84.80,
      uex_fee: 111.17,
      total_fees: 195.97
    },
    completed_at: '2024-01-15T14:35:00Z',
    status: 'completed',
    payout_method: 'bank_transfer',
    payout_reference: 'PAY-2024-001'
  },
  {
    transaction_id: 'txn-002',
    seller_id: 'cloud-provider-b',
    item_id: 'rtx-4080-gpu',
    item_name: 'NVIDIA RTX 4080 GPU',
    original_amount: 1271.97,
    seller_payout_amount: 1120.00,
    currency: 'USD',
    fees_breakdown: {
      management_tier_fee: 63.60,
      uex_fee: 88.37,
      total_fees: 151.97
    },
    completed_at: '2024-01-14T16:50:00Z',
    status: 'completed',
    payout_method: 'paypal',
    payout_reference: 'PAY-2024-002'
  }
];

// Sample transaction completion notifications
export const transactionNotifications: TransactionCompletionNotification[] = [
  {
    transaction_id: 'txn-001',
    seller_id: 'cloud-provider-b',
    item_id: 'rtx-4090-gpu',
    item_name: 'NVIDIA RTX 4090 GPU',
    original_amount: 1695.97,
    currency: 'USD',
    payment_method: 'credit_card',
    completed_at: '2024-01-15T14:35:00Z',
    fees: {
      management_tier_fee: 84.80,
      uex_fee: 111.17,
      total_fees: 195.97
    },
    seller_payout_amount: 1500.00,
    client_id: 'user-1',
    order_id: 'order-001'
  },
  {
    transaction_id: 'txn-002',
    seller_id: 'cloud-provider-b',
    item_id: 'rtx-4080-gpu',
    item_name: 'NVIDIA RTX 4080 GPU',
    original_amount: 1271.97,
    currency: 'USD',
    payment_method: 'paypal',
    completed_at: '2024-01-14T16:50:00Z',
    fees: {
      management_tier_fee: 63.60,
      uex_fee: 88.37,
      total_fees: 151.97
    },
    seller_payout_amount: 1120.00,
    client_id: 'user-2',
    order_id: 'order-002'
  }
];

// Fee calculation constants
export const FEE_RATES = {
  MANAGEMENT_TIER_FEE_PERCENTAGE: 0.5, // 0.5% of original amount
  UEX_FEE_PERCENTAGE: 0.1, // 0.1% of original amount
  MINIMUM_FEE: 0.01 // Minimum fee in USD
};

// Calculate fees for a transaction
export function calculateFees(originalAmount: number, currency: string = 'USD'): FeeCalculation {
  const managementTierFee = Math.max(
    (originalAmount * FEE_RATES.MANAGEMENT_TIER_FEE_PERCENTAGE) / 100,
    FEE_RATES.MINIMUM_FEE
  );
  
  const uexFee = Math.max(
    (originalAmount * FEE_RATES.UEX_FEE_PERCENTAGE) / 100,
    FEE_RATES.MINIMUM_FEE
  );
  
  const totalFees = managementTierFee + uexFee;
  const sellerPayoutAmount = originalAmount - totalFees;
  
  return {
    original_amount: originalAmount,
    management_tier_fee: Math.round(managementTierFee * 100) / 100,
    uex_fee: Math.round(uexFee * 100) / 100,
    total_fees: Math.round(totalFees * 100) / 100,
    seller_payout_amount: Math.round(sellerPayoutAmount * 100) / 100,
    currency
  };
}

// Add a new payout record
export function addPayout(payout: SellerPayout): void {
  sellerPayouts.push(payout);
}

// Add a new transaction notification
export function addTransactionNotification(notification: TransactionCompletionNotification): void {
  transactionNotifications.push(notification);
}

// Get payout by transaction ID
export function getPayoutByTransactionId(transactionId: string): SellerPayout | undefined {
  return sellerPayouts.find(payout => payout.transaction_id === transactionId);
}

// Get all payouts for a seller
export function getPayoutsBySellerId(sellerId: string): SellerPayout[] {
  return sellerPayouts.filter(payout => payout.seller_id === sellerId);
}

// Get recent payouts
export function getRecentPayouts(limit: number = 10): SellerPayout[] {
  return sellerPayouts
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    .slice(0, limit);
}

// Get payout statistics
export function getPayoutStats(sellerId: string = 'cloud-provider-b') {
  const sellerPayoutsList = getPayoutsBySellerId(sellerId);
  const completedPayouts = sellerPayoutsList.filter(p => p.status === 'completed');
  
  const totalPayouts = completedPayouts.reduce((sum, p) => sum + p.seller_payout_amount, 0);
  const totalFees = completedPayouts.reduce((sum, p) => sum + p.fees_breakdown.total_fees, 0);
  const totalOriginalAmount = completedPayouts.reduce((sum, p) => sum + p.original_amount, 0);
  
  return {
    total_payouts: Math.round(totalPayouts * 100) / 100,
    total_fees_paid: Math.round(totalFees * 100) / 100,
    total_original_amount: Math.round(totalOriginalAmount * 100) / 100,
    total_transactions: completedPayouts.length,
    average_payout: completedPayouts.length > 0 ? Math.round((totalPayouts / completedPayouts.length) * 100) / 100 : 0
  };
} 