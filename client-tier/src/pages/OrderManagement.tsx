import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { orderApi } from '../services/api'
import { Order } from '../types'

export const OrderManagement: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  })
  const [userId, setUserId] = useState('user-1'); // 기본값을 user-1로

  const { data: ordersData, isLoading, error } = useQuery(
    ['orders', filters, userId],
    () => orderApi.getUserOrders({ ...filters, userId }),
    {
      refetchInterval: 30000,
    }
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-2">
          Manage and track your resource orders
        </p>
      </div>

      {/* User ID 입력 필드 */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input
              type="text"
              value={userId}
              onChange={e => setUserId(e.target.value)}
              className="input-field w-auto"
              placeholder="User ID로 주문 조회"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-field w-auto"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="text-red-800">
            Error loading orders. Please try again.
          </div>
        </div>
      )}

      {/* Orders List */}
      {!isLoading && Array.isArray(ordersData?.data) && (
        <div className="space-y-4">
          {ordersData.data.map((order: Order) => (
            <div key={order.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">
                    Order #{order.id.slice(-8)}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {order.resources.length} resources
                  </p>
                  {/* UEX Transaction Status */}
                  <div className="mt-2">
                    {order.uexTransactionId ? (
                      <div className="text-sm">
                        <span className="text-gray-600">UEX Transaction: </span>
                        <span className="font-mono text-blue-600">
                          {`${order.uexTransactionId}`.slice(-8)}
                        </span>
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Payment Processed
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm">
                        <span className="text-gray-500 italic">No payment record</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    ${order.totalAmount.toFixed(2)}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 