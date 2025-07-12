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

export interface ResourceAllocation {
  id: string
  resourceId: string
  userId: string
  quantity: number
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

export interface ResourceChange {
  id: string
  resourceId: string
  changeType: 'advertise' | 'update' | 'remove'
  synced: boolean
  createdAt: string
} 