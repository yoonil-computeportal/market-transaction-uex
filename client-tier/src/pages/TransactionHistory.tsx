import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { transactionApi } from '../services/api'
import { Transaction } from '../types'
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export const TransactionHistory: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20
  })

  const { data: transactionsData, isLoading, error } = useQuery(
    ['transactions', filters],
    () => transactionApi.getUserTransactions({ ...filters, userId: 'user-1' }),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  )

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />
      case 'refunded':
        return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'refunded':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
        <p className="text-gray-600 mt-2">
          View and track all your marketplace transactions
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input-field w-auto"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
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
            Error loading transactions. Please try again.
          </div>
        </div>
      )}

      {/* Transactions List */}
      {transactionsData && !isLoading && (
        <div className="space-y-4">
          {transactionsData.data.map((transaction: Transaction) => (
            <div key={transaction.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(transaction.status)}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      Transaction #{transaction.id.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Order: #{transaction.orderId.slice(-8)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    ${transaction.amount.toFixed(2)}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
              
              {/* Fee Breakdown */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Buyer Fee:</span>
                    <span className="ml-2 font-medium">${transaction.fees.buyer.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Seller Fee:</span>
                    <span className="ml-2 font-medium">${transaction.fees.seller.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Platform Fee:</span>
                    <span className="ml-2 font-medium">${transaction.fees.platform.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {transactionsData && transactionsData.pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={filters.page === 1}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-600">
            Page {filters.page} of {transactionsData.pagination.totalPages}
          </span>
          
          <button
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={filters.page === transactionsData.pagination.totalPages}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
} 