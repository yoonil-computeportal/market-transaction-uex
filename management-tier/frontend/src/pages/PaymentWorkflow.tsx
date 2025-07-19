import React, { useState, useEffect, useRef } from 'react';
import { apiService, PaymentTransaction } from '../services/api';

const PaymentWorkflow: React.FC = () => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPayments = async () => {
    try {
      const data = await apiService.getPayments();
      setPayments(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();

    // Set up polling every 3 seconds for real-time updates
    pollingIntervalRef.current = setInterval(fetchPayments, 3000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'initiated': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'settled': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'initiated': return 'Initiated';
      case 'processing': return 'Processing';
      case 'settled': return 'Settled';
      case 'failed': return 'Failed';
      default: return status;
    }
  };

  const getStepStatus = (payment: PaymentTransaction, step: number) => {
    const statusOrder = ['initiated', 'processing', 'settled', 'failed'];
    const currentIndex = statusOrder.indexOf(payment.status);
    
    if (step < currentIndex) return 'completed';
    if (step === currentIndex) return 'current';
    return 'pending';
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Workflow</h1>
        <p className="text-gray-600">Real-time monitoring of payment transactions and their processing status</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Workflow Steps Overview */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Payment Processing Steps</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</div>
            <span className="ml-3 text-sm font-medium">Initiated</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
          <div className="flex items-center">
            <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</div>
            <span className="ml-3 text-sm font-medium">Processing</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-300 mx-4"></div>
          <div className="flex items-center">
            <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</div>
            <span className="ml-3 text-sm font-medium">Settled</span>
          </div>
        </div>
      </div>

      {/* Payment Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Payment Transactions</h2>
          <p className="text-sm text-gray-600 mt-1">Showing {payments.length} transactions</p>
        </div>
        
        <div className="overflow-x-auto">
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workflow Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.client_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(payment.total_amount, payment.currency)}
                    {payment.currency !== payment.target_currency && (
                      <span className="text-xs text-gray-500 ml-1">
                        → {payment.target_currency}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)} text-white`}>
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {[0, 1, 2].map((step) => {
                        const stepStatus = getStepStatus(payment, step);
                        return (
                          <div
                            key={step}
                            className={`w-3 h-3 rounded-full ${
                              stepStatus === 'completed' ? 'bg-green-500' :
                              stepStatus === 'current' ? 'bg-yellow-500' :
                              'bg-gray-300'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payment.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {payments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No payment transactions found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentWorkflow; 