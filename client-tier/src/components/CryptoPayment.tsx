/**
 * Crypto Payment Component
 * Handles cryptocurrency payment flow with UEX integration
 *
 * Features:
 * - Currency selection (50+ cryptocurrencies)
 * - Real-time exchange rate display
 * - QR code for deposit address
 * - Order status tracking
 * - Copy-to-clipboard functionality
 */

import React, { useState, useEffect } from 'react';

interface Currency {
  code: string;
  name: string;
  network: string;
}

interface EstimateResponse {
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  fee: number;
  valid_for_minutes: number;
}

interface SwapResponse {
  order_id: string;
  deposit_address: string;
  deposit_tag?: string;
  qr_code: string;
  from_amount: number;
  to_amount: number;
  exchange_rate: number;
  status: string;
  expires_at: string;
  instructions: {
    step1: string;
    step2?: string;
    step3: string;
    step4: string;
  };
}

interface OrderStatus {
  order_id: string;
  status: string;
  deposit_confirmed: boolean;
  tx_hash?: string;
  updated_at: string;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3903';

export const CryptoPayment: React.FC = () => {
  const [step, setStep] = useState<'select' | 'estimate' | 'deposit' | 'complete'>('select');
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [estimate, setEstimate] = useState<EstimateResponse | null>(null);
  const [swap, setSwap] = useState<SwapResponse | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Fetch supported currencies on mount
  useEffect(() => {
    fetchCurrencies();
  }, []);

  // Poll order status when swap is initiated
  useEffect(() => {
    if (swap?.order_id && step === 'deposit') {
      const interval = setInterval(() => {
        fetchOrderStatus(swap.order_id);
      }, 10000); // Poll every 10 seconds

      return () => clearInterval(interval);
    }
  }, [swap, step]);

  const fetchCurrencies = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/currencies`);
      const data = await response.json();
      if (data.success) {
        setCurrencies(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
      setError('Failed to load currencies');
    }
  };

  const handleEstimate = async () => {
    if (!selectedCurrency || !amount || parseFloat(amount) <= 0) {
      setError('Please select a currency and enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_currency: selectedCurrency.code,
          from_network: selectedCurrency.network,
          to_currency: 'USDT',
          to_network: 'TRX',
          amount: parseFloat(amount)
        })
      });

      const data = await response.json();
      if (data.success) {
        setEstimate(data.data);
        setStep('estimate');
      } else {
        setError(data.error || 'Failed to estimate');
      }
    } catch (err) {
      setError('Failed to get estimate');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSwap = async () => {
    if (!selectedCurrency || !estimate) return;

    setLoading(true);
    setError('');

    try {
      // In production, get recipient address from user or backend
      const recipientAddress = 'TQ3LqkLj4FVq7ZQf8uqJHfEgF7rHjsq2KE'; // Example USDT TRX address

      const response = await fetch(`${API_BASE_URL}/api/payments/crypto/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_amount: estimate.from_amount,
          from_currency: selectedCurrency.code,
          from_network: selectedCurrency.network,
          to_currency: 'USDT',
          to_network: 'TRX',
          recipient_address: recipientAddress
        })
      });

      const data = await response.json();
      if (data.success) {
        setSwap(data.data);
        setStep('deposit');
      } else {
        setError(data.error || 'Failed to initiate swap');
      }
    } catch (err) {
      setError('Failed to initiate swap');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderStatus = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/payments/crypto/order/${orderId}`);
      const data = await response.json();
      if (data.success) {
        setOrderStatus(data.data);
        if (data.data.status === 'Complete') {
          setStep('complete');
        }
      }
    } catch (err) {
      console.error('Failed to fetch order status:', err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderSelectStep = () => (
    <div className="crypto-payment-select">
      <h2>Pay with Cryptocurrency</h2>

      <div className="form-group">
        <label>Select Cryptocurrency</label>
        <select
          value={selectedCurrency?.code || ''}
          onChange={(e) => {
            const curr = currencies.find(c => c.code === e.target.value);
            setSelectedCurrency(curr || null);
          }}
          className="form-control"
        >
          <option value="">-- Select Currency --</option>
          {currencies.map(curr => (
            <option key={curr.code} value={curr.code}>
              {curr.name} ({curr.code})
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Amount</label>
        <input
          type="number"
          step="0.00000001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="form-control"
        />
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <button
        onClick={handleEstimate}
        disabled={loading || !selectedCurrency || !amount}
        className="btn btn-primary"
      >
        {loading ? 'Loading...' : 'Get Quote'}
      </button>
    </div>
  );

  const renderEstimateStep = () => (
    <div className="crypto-payment-estimate">
      <h2>Payment Estimate</h2>

      <div className="estimate-details">
        <div className="estimate-row">
          <span>You send:</span>
          <strong>{estimate?.from_amount} {selectedCurrency?.code}</strong>
        </div>
        <div className="estimate-row">
          <span>You receive:</span>
          <strong>{estimate?.to_amount} USDT</strong>
        </div>
        <div className="estimate-row">
          <span>Exchange rate:</span>
          <span>1 {selectedCurrency?.code} = {estimate?.exchange_rate.toFixed(2)} USDT</span>
        </div>
        <div className="estimate-row">
          <span>Network fee:</span>
          <span>{estimate?.fee} USDT</span>
        </div>
        <div className="estimate-info">
          <small>Rate valid for {estimate?.valid_for_minutes} minutes</small>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="button-group">
        <button onClick={() => setStep('select')} className="btn btn-secondary">
          Back
        </button>
        <button
          onClick={handleInitiateSwap}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Processing...' : 'Confirm Payment'}
        </button>
      </div>
    </div>
  );

  const renderDepositStep = () => (
    <div className="crypto-payment-deposit">
      <h2>Send {selectedCurrency?.code}</h2>

      <div className="order-status">
        <span className={`status-badge status-${orderStatus?.status.toLowerCase()}`}>
          {orderStatus?.status || swap?.status}
        </span>
      </div>

      <div className="qr-code">
        <img src={swap?.qr_code} alt="Deposit QR Code" />
      </div>

      <div className="deposit-address">
        <label>Deposit Address</label>
        <div className="address-input">
          <input
            type="text"
            value={swap?.deposit_address || ''}
            readOnly
            className="form-control"
          />
          <button
            onClick={() => copyToClipboard(swap?.deposit_address || '')}
            className="btn btn-copy"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {swap?.deposit_tag && (
        <div className="deposit-tag">
          <label>Memo/Tag (Required)</label>
          <div className="address-input">
            <input
              type="text"
              value={swap.deposit_tag}
              readOnly
              className="form-control"
            />
            <button
              onClick={() => copyToClipboard(swap.deposit_tag || '')}
              className="btn btn-copy"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      <div className="instructions">
        <h3>Instructions</h3>
        <ol>
          <li>{swap?.instructions.step1}</li>
          {swap?.instructions.step2 && <li>{swap.instructions.step2}</li>}
          <li>{swap?.instructions.step3}</li>
          <li>{swap?.instructions.step4}</li>
        </ol>
      </div>

      <div className="order-info">
        <p><strong>Order ID:</strong> {swap?.order_id}</p>
        <p><strong>Amount to send:</strong> {swap?.from_amount} {selectedCurrency?.code}</p>
        <p><strong>You will receive:</strong> {swap?.to_amount} USDT</p>
        {orderStatus?.deposit_confirmed && (
          <div className="alert alert-success">
            ✓ Deposit confirmed! Processing swap...
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="crypto-payment-complete">
      <div className="success-icon">✓</div>
      <h2>Payment Complete!</h2>

      <div className="completion-details">
        <p>Your crypto swap has been completed successfully.</p>
        <p><strong>Order ID:</strong> {swap?.order_id}</p>
        <p><strong>Transaction Hash:</strong> {orderStatus?.tx_hash}</p>
        <p><strong>Amount received:</strong> {swap?.to_amount} USDT</p>
      </div>

      <button
        onClick={() => {
          setStep('select');
          setSwap(null);
          setEstimate(null);
          setOrderStatus(null);
          setAmount('');
        }}
        className="btn btn-primary"
      >
        Make Another Payment
      </button>
    </div>
  );

  return (
    <div className="crypto-payment-container">
      {step === 'select' && renderSelectStep()}
      {step === 'estimate' && renderEstimateStep()}
      {step === 'deposit' && renderDepositStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  );
};

export default CryptoPayment;
