import React, { useState } from 'react';
import { UEXApiService, UEXPaymentRequest, UEXPaymentResponse } from '../services/uexApi';
import { orderApi } from '../services/api';

interface UEXPaymentFormProps {
  onPaymentSuccess?: (response: UEXPaymentResponse) => void;
  onPaymentError?: (error: string) => void;
  initialValues?: Partial<UEXPaymentRequest & { resourceId?: string; resourceName?: string }>;
}

const UEXPaymentForm: React.FC<UEXPaymentFormProps> = ({ 
  onPaymentSuccess, 
  onPaymentError, 
  initialValues
}) => {
  const [formData, setFormData] = useState<UEXPaymentRequest>({
    client_id: initialValues?.client_id || '',
    seller_id: initialValues?.seller_id || '',
    amount: initialValues?.amount || 0,
    currency: initialValues?.currency || 'USD',
    target_currency: initialValues?.target_currency || 'USD',
    payment_method: initialValues?.payment_method || 'fiat',
    settlement_method: initialValues?.settlement_method || 'bank'
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<UEXPaymentResponse | null>(null);
  const [pollingStatus, setPollingStatus] = useState<string>('');
  const [pollingError, setPollingError] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponse(null);

    try {
      // Process payment via UEX backend
      const paymentResponse = await UEXApiService.processPayment(formData);
      // Create order in marketplace backend
      const order = await orderApi.create({
        userId: formData.client_id,
        resources: [{
          resourceId: initialValues?.resourceId || '',
          quantity: 1,
          price: formData.amount,
          specifications: {},
        }],
        totalAmount: formData.amount,
        currency: formData.currency,
        status: 'pending',
        uexTransactionId: paymentResponse.transaction_id, // Store real UEX transaction ID
      });
      // 결제 성공 후 management-tier에 트랜잭션 저장
      await fetch('http://localhost:9000/api/management/integration/transactions/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: paymentResponse.transaction_id,
          orderId: order.id,
          userId: formData.client_id,
          status: paymentResponse.status,
          amount: paymentResponse.amount,
          fees: paymentResponse.fees?.total_fee ?? 0,
        }),
      });
      setResponse(paymentResponse);
      onPaymentSuccess?.(paymentResponse);

      // 결제 상태 polling 및 management-tier에 상태 동기화
      const pollTransactionStatus = async (transactionId: string, userId: string) => {
        if (!transactionId) {
          console.warn('No UEX transaction ID available for polling');
          setPollingError('No transaction ID available for status tracking');
          return;
        }
        
        setPollingStatus('Tracking payment status...');
        setPollingError('');
        
        let lastStatus = paymentResponse.status;
        let settled = false;
        let retryCount = 0;
        const maxRetries = 10; // Limit retries to avoid infinite polling
        
        while (!settled && retryCount < maxRetries) {
          try {
            const res = await fetch(`http://localhost:3001/api/payments/transaction/${transactionId}/status`);
            if (!res.ok) {
              if (res.status === 404) {
                console.warn(`UEX transaction ${transactionId} not found, stopping polling`);
                setPollingError(`Transaction ${transactionId} not found in UEX system. This may be a temporary issue.`);
                setPollingStatus('');
                break;
              }
              throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            const data = await res.json();
            const status = data.data.status;
            if (status !== lastStatus) {
              // Update management-tier when status changes
              try {
              await fetch('http://localhost:9000/api/management/integration/transactions/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  transactionId,
                  orderId: order.id,
                  userId,
                  status,
                  amount: paymentResponse.amount,
                  fees: paymentResponse.fees?.total_fee ?? 0,
                }),
              });
              } catch (updateErr) {
                console.warn('Failed to update management-tier:', updateErr);
              }
              lastStatus = status;
            }
            if (status === 'settled' || status === 'failed' || status === 'completed') {
              settled = true;
              setPollingStatus(`Payment ${status}. Tracking complete.`);
            } else {
              setPollingStatus(`Payment status: ${status}. Checking for updates...`);
              await new Promise(res => setTimeout(res, 3000)); // Wait 3 seconds before retry
              retryCount++;
            }
          } catch (err) {
            console.error('Error polling transaction status:', err);
            retryCount++;
            if (retryCount >= maxRetries) {
              console.warn('Max retries reached, stopping polling');
              setPollingError('Unable to track payment status after multiple attempts. Please check your order history.');
              setPollingStatus('');
              break;
            }
            setPollingStatus(`Connection error. Retrying... (${retryCount}/${maxRetries})`);
            await new Promise(res => setTimeout(res, 3000));
          }
        }
      };
      pollTransactionStatus(paymentResponse.transaction_id, formData.client_id);
    } catch (err: any) {
      setLoading(false);
      const errorMessage = err.message || 'Payment failed';
      onPaymentError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const supportedCurrencies = ['USD', 'EUR', 'GBP', 'BTC', 'ETH'];

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">UEX Payment Processing</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client ID
          </label>
          <input
            type="text"
            name="client_id"
            value={formData.client_id}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter client ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seller ID
          </label>
          <input
            type="text"
            name="seller_id"
            value={formData.seller_id}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter seller ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter amount"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source Currency
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {supportedCurrencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Currency
            </label>
            <select
              name="target_currency"
              value={formData.target_currency}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {supportedCurrencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fiat">Fiat</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Settlement Method
            </label>
            <select
              name="settlement_method"
              value={formData.settlement_method}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="bank">Bank</option>
              <option value="blockchain">Blockchain</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : 'Process Payment'}
        </button>
      </form>

      {response && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-lg font-semibold text-green-800 mb-2">Payment Processed Successfully</h3>
          <div className="space-y-2 text-sm text-green-700">
            <p><strong>Transaction ID:</strong> {response.transaction_id}</p>
            <p><strong>Status:</strong> {response.status}</p>
            <p><strong>Amount:</strong> {response.amount} {response.currency}</p>
            <p><strong>Target Currency:</strong> {response.target_currency}</p>
            {response.conversion_rate && (
              <p><strong>Conversion Rate:</strong> {response.conversion_rate}</p>
            )}
            <p><strong>Total Amount:</strong> {response.total_amount} {response.currency}</p>
            <p><strong>Total Fees:</strong> {response.fees.total_fee} {response.currency}</p>
            <p><strong>Estimated Settlement:</strong> {new Date(response.estimated_settlement_time).toLocaleString()}</p>
          </div>
        </div>
      )}

      {pollingStatus && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">{pollingStatus}</p>
        </div>
      )}

      {pollingError && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">{pollingError}</p>
        </div>
      )}
    </div>
  );
};

export default UEXPaymentForm; 