import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { paymentApi } from '../services/api'
import { PaymentMethod, Payment } from '../types'

export const PaymentCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'methods' | 'history'>('methods')

  const { data: paymentMethods, isLoading: methodsLoading } = useQuery(
    ['payment-methods'],
    () => paymentApi.getPaymentMethods(),
    {
      refetchInterval: 60000,
    }
  )

  const { data: paymentHistory, isLoading: historyLoading } = useQuery(
    ['payment-history'],
    () => paymentApi.getPaymentHistory(),
    {
      refetchInterval: 60000,
    }
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Center</h1>
        <p className="text-gray-600 mt-2">
          Manage your payment methods and view payment history
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('methods')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'methods'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payment Methods
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Payment History
          </button>
        </nav>
      </div>

      {/* Payment Methods Tab */}
      {activeTab === 'methods' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Payment Methods</h2>
            <button className="btn-primary">
              Add Payment Method
            </button>
          </div>

          {methodsLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {paymentMethods && paymentMethods.length > 0 && (
            <div className="space-y-4">
              {paymentMethods.map((method: PaymentMethod) => (
                <div key={method.id} className="card">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-6 bg-gray-200 rounded flex items-center justify-center">
                        {method.type === 'credit_card' ? '💳' : 
                         method.type === 'bank_transfer' ? '🏦' : '₿'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{method.name}</div>
                        {method.last4 && (
                          <div className="text-sm text-gray-600">**** {method.last4}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {method.isDefault && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Default
                        </span>
                      )}
                      <button className="text-red-600 hover:text-red-700 text-sm">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {paymentMethods && paymentMethods.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">💳</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
              <p className="text-gray-600">
                Add a payment method to start making purchases.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Payment History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Payment History</h2>

          {historyLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {paymentHistory && paymentHistory.data.length > 0 && (
            <div className="space-y-4">
              {paymentHistory.data.map((payment: Payment) => (
                <div key={payment.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Payment #{payment.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Method: {payment.method.name}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        ${payment.amount.toFixed(2)}
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                        payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {paymentHistory && paymentHistory.data.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment history</h3>
              <p className="text-gray-600">
                Your payment history will appear here once you make your first payment.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 