import * as React from 'react';

interface FeeBreakdown {
  uex_buyer_fee?: number;
  uex_seller_fee?: number;
  conversion_fee?: number;
  management_fee?: number;
  total_fee: number;
}

interface FeeApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  amount: number;
  currency: string;
  targetCurrency: string;
  fees: FeeBreakdown;
  totalAmount: number;
  exchangeRate?: number;
}

export const FeeApprovalModal: React.FC<FeeApprovalModalProps> = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  amount,
  currency,
  targetCurrency,
  fees,
  totalAmount,
  exchangeRate
}) => {
  if (!isOpen) return null;

  const formatCurrency = (value: number, curr: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(value);
  };

  const isCryptoToFiat = currency !== targetCurrency && 
    (currency === 'BTC' || currency === 'ETH') && 
    (targetCurrency === 'USD' || targetCurrency === 'EUR' || targetCurrency === 'GBP');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {isCryptoToFiat ? 'Crypto-to-Fiat Conversion' : 'Payment Confirmation'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Transaction Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Transaction Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Base Amount:</span>
                <span className="font-medium">{formatCurrency(amount, currency)}</span>
              </div>
              {exchangeRate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Exchange Rate:</span>
                  <span className="font-medium">1 {currency} = {exchangeRate.toFixed(4)} {targetCurrency}</span>
                </div>
              )}
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Fee Breakdown</h3>
            <div className="space-y-2 text-sm">
              {fees.uex_buyer_fee && fees.uex_buyer_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700">UEX Buyer Fee (0.1%):</span>
                  <span className="font-medium text-blue-900">
                    {formatCurrency(fees.uex_buyer_fee, currency)}
                  </span>
                </div>
              )}
              {fees.uex_seller_fee && fees.uex_seller_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700">UEX Seller Fee (0.1%):</span>
                  <span className="font-medium text-blue-900">
                    {formatCurrency(fees.uex_seller_fee, currency)}
                  </span>
                </div>
              )}
              {fees.conversion_fee && fees.conversion_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Conversion Fee:</span>
                  <span className="font-medium text-blue-900">
                    {formatCurrency(fees.conversion_fee, currency)}
                  </span>
                </div>
              )}
              {fees.management_fee && fees.management_fee > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Management Fee (Buyer 0.5%):</span>
                    <span className="font-medium text-blue-900">
                      {formatCurrency(fees.management_fee * 0.5, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Management Fee (Seller 0.5%):</span>
                    <span className="font-medium text-blue-900">
                      {formatCurrency(fees.management_fee * 0.5, currency)}
                    </span>
                  </div>
                </>
              )}
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span className="text-blue-900">Total Fees:</span>
                  <span className="text-blue-900">
                    {formatCurrency(fees.total_fee, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Amount */}
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-green-900">Total Amount:</span>
              <span className="text-xl font-bold text-green-900">
                {formatCurrency(totalAmount, currency)}
              </span>
            </div>
          </div>

          {/* Warning for Crypto-to-Fiat */}
          {isCryptoToFiat && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Crypto-to-Fiat Conversion</p>
                  <p className="mt-1">
                    This transaction involves converting {currency} to {targetCurrency}. 
                    Exchange rates may fluctuate during processing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={onReject}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reject
            </button>
            <button
              onClick={onApprove}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Approve Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 