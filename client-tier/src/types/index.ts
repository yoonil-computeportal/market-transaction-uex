// Resource Types
export interface Resource {
  id: string
  name: string
  type: 'CPU' | 'GPU' | 'Storage' | 'Network'
  specifications: {
    cpu?: number
    memory?: number
    storage?: number
    gpu?: string
    bandwidth?: number
  }
  price: number
  currency: string
  availability: number
  location: string
  provider: string
  sla: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  rating: number
  reviews: number
  estimatedProvisioningTime: number
  utilization: number
}

// Order Types
export interface Order {
  id: string
  userId: string
  resources: OrderResource[]
  totalAmount: number
  currency: string
  status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
  scheduledFor?: string
  uexTransactionId?: string  // Link to real UEX transaction
}

export interface OrderResource {
  resourceId: string
  quantity: number
  price: number
  specifications: any
}

// Transaction Types
export interface Transaction {
  id: string
  orderId: string
  userId: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: string
  fees: {
    buyer: number
    seller: number
    platform: number
  }
  createdAt: string
  completedAt?: string
}

// Payment Types
export interface PaymentMethod {
  id: string
  type: 'credit_card' | 'bank_transfer' | 'crypto'
  name: string
  last4?: string
  isDefault: boolean
}

export interface Payment {
  id: string
  transactionId: string
  amount: number
  currency: string
  method: PaymentMethod
  status: 'pending' | 'completed' | 'failed'
  createdAt: string
}

// Search and Filter Types
export interface SearchFilters {
  resourceType?: string[]
  priceRange?: {
    min: number
    max: number
  }
  location?: string[]
  sla?: string[]
  availability?: boolean
}

export interface SearchParams {
  query?: string
  filters: SearchFilters
  sortBy?: 'price' | 'availability' | 'rating' | 'performance'
  sortOrder?: 'asc' | 'desc'
  page: number
  limit: number
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Real Transaction Type for UEX backend
export interface RealTransaction {
  id: string;
  client_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  target_currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method: string;
  settlement_method: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  failure_reason?: string;
  total_amount: number;
  conversion_rate?: number;
  conversion_fee?: number;
  management_fee?: number;
  transaction_hash?: string;
  bank_reference?: string;
} 