import { SellerTransaction } from '../types';

// Dynamic in-memory transaction storage
let dynamicTransactions: SellerTransaction[] = [
  // Original sample transactions (these will be preserved)
  {
    id: 'txn-001',
    client_id: 'user-1',
    item_id: 'rtx-4090-gpu',
    item_name: 'NVIDIA RTX 4090 GPU',
    amount: 1599.99,
    currency: 'USD',
    status: 'completed',
    payment_method: 'credit_card',
    created_at: '2024-01-15T14:30:00Z',
    completed_at: '2024-01-15T14:35:00Z',
    fees: {
      platform_fee: 79.99,
      processing_fee: 15.99,
      total_fee: 95.98
    },
    total_amount: 1504.01
  },
  {
    id: 'txn-002',
    client_id: 'user-2',
    item_id: 'rtx-4080-gpu',
    item_name: 'NVIDIA RTX 4080 GPU',
    amount: 1199.99,
    currency: 'USD',
    status: 'completed',
    payment_method: 'paypal',
    created_at: '2024-01-14T16:45:00Z',
    completed_at: '2024-01-14T16:50:00Z',
    fees: {
      platform_fee: 59.99,
      processing_fee: 11.99,
      total_fee: 71.98
    },
    total_amount: 1128.01
  },
  {
    id: 'txn-003',
    client_id: 'user-3',
    item_id: 'high-performance-cpu',
    item_name: 'Intel Core i9-14900K Processor',
    amount: 589.99,
    currency: 'USD',
    status: 'processing',
    payment_method: 'bank_transfer',
    created_at: '2024-01-15T10:20:00Z',
    fees: {
      platform_fee: 29.49,
      processing_fee: 5.89,
      total_fee: 35.38
    },
    total_amount: 554.61
  },
  {
    id: 'txn-004',
    client_id: 'user-4',
    item_id: 'rtx-4070-ti-gpu',
    item_name: 'NVIDIA RTX 4070 Ti GPU',
    amount: 799.99,
    currency: 'USD',
    status: 'pending',
    payment_method: 'crypto',
    created_at: '2024-01-15T09:15:00Z',
    fees: {
      platform_fee: 39.99,
      processing_fee: 7.99,
      total_fee: 47.98
    },
    total_amount: 752.01
  },
  {
    id: 'txn-005',
    client_id: 'user-5',
    item_id: 'storage-cluster',
    item_name: 'Enterprise NVMe Storage Cluster',
    amount: 2499.99,
    currency: 'USD',
    status: 'completed',
    payment_method: 'wire_transfer',
    created_at: '2024-01-13T11:30:00Z',
    completed_at: '2024-01-13T12:00:00Z',
    fees: {
      platform_fee: 124.99,
      processing_fee: 24.99,
      total_fee: 149.98
    },
    total_amount: 2350.01
  },
  {
    id: 'txn-006',
    client_id: 'user-6',
    item_id: 'rtx-4090-gpu',
    item_name: 'NVIDIA RTX 4090 GPU',
    amount: 1599.99,
    currency: 'USD',
    status: 'failed',
    payment_method: 'credit_card',
    created_at: '2024-01-12T15:45:00Z',
    fees: {
      platform_fee: 0,
      processing_fee: 0,
      total_fee: 0
    },
    total_amount: 0
  },
  {
    id: 'txn-007',
    client_id: 'user-7',
    item_id: 'rtx-4080-gpu',
    item_name: 'NVIDIA RTX 4080 GPU',
    amount: 1199.99,
    currency: 'USD',
    status: 'completed',
    payment_method: 'credit_card',
    created_at: '2024-01-11T13:20:00Z',
    completed_at: '2024-01-11T13:25:00Z',
    fees: {
      platform_fee: 59.99,
      processing_fee: 11.99,
      total_fee: 71.98
    },
    total_amount: 1128.01
  },
  {
    id: 'txn-008',
    client_id: 'user-8',
    item_id: 'rtx-4070-ti-gpu',
    item_name: 'NVIDIA RTX 4070 Ti GPU',
    amount: 799.99,
    currency: 'USD',
    status: 'completed',
    payment_method: 'paypal',
    created_at: '2024-01-10T16:10:00Z',
    completed_at: '2024-01-10T16:15:00Z',
    fees: {
      platform_fee: 39.99,
      processing_fee: 7.99,
      total_fee: 47.98
    },
    total_amount: 752.01
  },
  {
    id: 'txn-009',
    client_id: 'user-9',
    item_id: 'high-performance-cpu',
    item_name: 'Intel Core i9-14900K Processor',
    amount: 589.99,
    currency: 'USD',
    status: 'completed',
    payment_method: 'bank_transfer',
    created_at: '2024-01-09T14:30:00Z',
    completed_at: '2024-01-09T15:00:00Z',
    fees: {
      platform_fee: 29.49,
      processing_fee: 5.89,
      total_fee: 35.38
    },
    total_amount: 554.61
  },
  {
    id: 'txn-010',
    client_id: 'user-10',
    item_id: 'storage-cluster',
    item_name: 'Enterprise NVMe Storage Cluster',
    amount: 2499.99,
    currency: 'USD',
    status: 'pending',
    payment_method: 'wire_transfer',
    created_at: '2024-01-15T08:45:00Z',
    fees: {
      platform_fee: 124.99,
      processing_fee: 24.99,
      total_fee: 149.98
    },
    total_amount: 2350.01
  }
];

// Function to get all transactions
export const getSellerTransactions = (): SellerTransaction[] => {
  return [...dynamicTransactions];
};

// Function to add a new transaction automatically
export const addSellerTransaction = (transaction: SellerTransaction): void => {
  // Check if transaction already exists
  const existingIndex = dynamicTransactions.findIndex(t => t.id === transaction.id);
  
  if (existingIndex >= 0) {
    // Update existing transaction
    dynamicTransactions[existingIndex] = transaction;
    console.log(`✅ Updated existing transaction: ${transaction.id}`);
  } else {
    // Add new transaction
    dynamicTransactions.unshift(transaction); // Add to beginning of array
    console.log(`✅ Added new transaction: ${transaction.id} - Amount: $${transaction.amount}`);
  }
};

// Function to create a transaction from notification data
export const createTransactionFromNotification = (
  transaction_id: string,
  seller_id: string,
  item_id: string,
  item_name: string,
  original_amount: number,
  currency: string,
  payment_method: string,
  client_id: string,
  completed_at: string,
  fees: { management_tier_fee: number; uex_fee: number; total_fees: number }
): SellerTransaction => {
  return {
    id: transaction_id,
    client_id,
    item_id,
    item_name,
    amount: original_amount,
    currency,
    status: 'completed',
    payment_method,
    created_at: completed_at, // Use completed_at as created_at for simplicity
    completed_at,
    fees: {
      platform_fee: fees.management_tier_fee,
      processing_fee: fees.uex_fee,
      total_fee: fees.total_fees
    },
    total_amount: original_amount - fees.total_fees
  };
};

// Legacy export for backward compatibility
export const sellerTransactions = dynamicTransactions;

export const getTransactionsByStatus = (status: string): SellerTransaction[] => {
  return dynamicTransactions.filter(txn => txn.status === status);
};

export const getTransactionsByItem = (itemId: string): SellerTransaction[] => {
  return dynamicTransactions.filter(txn => txn.item_id === itemId);
};

export const getTransactionById = (id: string): SellerTransaction | undefined => {
  return dynamicTransactions.find(txn => txn.id === id);
};

export const getRecentTransactions = (limit: number = 10): SellerTransaction[] => {
  return dynamicTransactions
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}; 