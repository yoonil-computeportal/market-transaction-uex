import React, { useState } from 'react';
import { UEXApiService, UEXPaymentRequest, UEXPaymentResponse } from '../services/uexApi';
import { orderApi } from '../services/api';

interface UEXPaymentFormProps {
  onPaymentSuccess?: (response: UEXPaymentResponse) => void;
  onPaymentError?: (error: string) => void;
  initialValues?: Partial<UEXPaymentRequest & { resourceId?: string; resourceName?: string }>;
}

export interface UEXPaymentRequest {
  client_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  target_currency: string;
  payment_method: 'fiat' | 'crypto';
  settlement_method: 'bank' | 'blockchain';
  metadata?: Record<string, any>;
  resourceId?: string;
  resourceName?: string;
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
      await orderApi.create({
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
      });
      setResponse(paymentResponse);
      onPaymentSuccess?.(paymentResponse);
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
    </div>
  );
};

export default UEXPaymentForm; 