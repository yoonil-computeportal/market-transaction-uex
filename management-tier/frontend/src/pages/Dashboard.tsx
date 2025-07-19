import React, { useState, useEffect } from 'react'
import { apiService, PaymentTransaction } from '../services/api'

interface Analytics {
  totalTransactions: number
  totalRevenue: number
  activeUsers: number
  resourceUtilization: number
  topResources: Array<{
    name: string
    transactions: number
  }>
}

const Dashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [payments, setPayments] = useState<PaymentTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentsLoading, setPaymentsLoading] = useState(true)

  useEffect(() => {
    // Mock API call for analytics
    setTimeout(() => {
      setAnalytics({
        totalTransactions: 1250,
        totalRevenue: 12500.50,
        activeUsers: 450,
        resourceUtilization: 68,
        topResources: [
          { name: 'High-Performance CPU', transactions: 150 },
          { name: 'NVIDIA RTX 4090', transactions: 120 },
          { name: 'Storage Cluster', transactions: 95 }
        ]
      })
      setLoading(false)
    }, 1000)

    // Fetch real payment transactions
    const fetchPayments = async () => {
      try {
        const data = await apiService.getPayments()
        setPayments(data)
      } catch (error) {
        console.error('Error fetching payments:', error)
      } finally {
        setPaymentsLoading(false)
      }
    }

    fetchPayments()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initiated': return 'bg-blue-500'
      case 'processing': return 'bg-yellow-500'
      case 'settled': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'initiated': return 'Initiated'
      case 'processing': return 'Processing'
      case 'settled': return 'Settled'
      case 'failed': return 'Failed'
      default: return status
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return <div>Error loading dashboard data</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Marketplace Dashboard</h1>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalTransactions.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${analytics.totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.activeUsers.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resource Utilization</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.resourceUtilization}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payment Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Payment Transactions</h2>
          <p className="text-sm text-gray-600 mt-1">Latest payment activities</p>
        </div>
        <div className="overflow-x-auto">
          {paymentsLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : payments.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.slice(0, 5).map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payment.client_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payment.amount, payment.currency)}
                      {payment.currency !== payment.target_currency && (
                        <span className="text-xs text-gray-500 ml-1">
                          → {payment.target_currency}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="space-y-1">
                        {payment.uex_buyer_fee && payment.uex_buyer_fee > 0 && (
                          <div className="flex justify-between text-xs">
                            <span>Buyer:</span>
                            <span className="text-red-600 font-medium">
                              {formatCurrency(payment.uex_buyer_fee, payment.currency)}
                            </span>
                          </div>
                        )}
                        {payment.uex_seller_fee && payment.uex_seller_fee > 0 && (
                          <div className="flex justify-between text-xs">
                            <span>Seller:</span>
                            <span className="text-red-600 font-medium">
                              {formatCurrency(payment.uex_seller_fee, payment.currency)}
                            </span>
                          </div>
                        )}
                        {payment.conversion_fee && payment.conversion_fee > 0 && (
                          <div className="flex justify-between text-xs">
                            <span>Conv:</span>
                            <span className="text-red-600 font-medium">
                              {formatCurrency(payment.conversion_fee, payment.currency)}
                            </span>
                          </div>
                        )}
                        {payment.management_fee && payment.management_fee > 0 && (
                          <>
                            <div className="flex justify-between text-xs">
                              <span>Mgmt Buyer:</span>
                              <span className="text-red-600 font-medium">
                                {formatCurrency(payment.management_fee * 0.5, payment.currency)}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span>Mgmt Seller:</span>
                              <span className="text-red-600 font-medium">
                                {formatCurrency(payment.management_fee * 0.5, payment.currency)}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(payment.total_amount || payment.amount, payment.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {payment.currency !== payment.target_currency && payment.conversion_rate ? (
                        <div className="text-xs">
                          <div className="font-medium">
                            1 {payment.currency} = {payment.conversion_rate.toFixed(4)} {payment.target_currency}
                          </div>
                          <div className="text-gray-500">
                            {payment.currency} → {payment.target_currency}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No conversion</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)} text-white`}>
                        {getStatusText(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(payment.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No payment transactions found
            </div>
          )}
        </div>
      </div>

      {/* Top Resources */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Top Resources</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {analytics.topResources.map((resource, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-8">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900">{resource.name}</span>
                </div>
                <span className="text-sm text-gray-600">{resource.transactions} transactions</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard 