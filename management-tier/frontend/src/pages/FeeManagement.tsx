import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  CurrencyDollarIcon, 
  ChartBarIcon,
  CogIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

interface FeeStructure {
  id: string
  buyerFee: number
  sellerFee: number
  effectiveDate: string
  status: 'active' | 'pending' | 'scheduled'
}

export const FeeManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'current' | 'schedule' | 'analytics'>('current')
  const [buyerFee, setBuyerFee] = useState(0.5)
  const [sellerFee, setSellerFee] = useState(0.5)
  const [scheduledDate, setScheduledDate] = useState('')
  
  const queryClient = useQueryClient()

  const { data: currentFees, isLoading } = useQuery(
    ['current-fees'],
    () => fetch('/api/fees/current').then(res => res.json()),
    {
      refetchInterval: 30000
    }
  )

  const { data: feeAnalytics } = useQuery(
    ['fee-analytics'],
    () => fetch('/api/fees/analytics').then(res => res.json()),
    {
      refetchInterval: 60000
    }
  )

  const updateFeesMutation = useMutation(
    (feeData: { buyerFee: number; sellerFee: number }) =>
      fetch('/api/fees/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feeData)
      }).then(res => res.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['current-fees'])
        toast.success('Fee structure updated successfully')
      },
      onError: () => {
        toast.error('Failed to update fee structure')
      }
    }
  )

  const scheduleFeesMutation = useMutation(
    (feeData: { buyerFee: number; sellerFee: number; effectiveDate: string }) =>
      fetch('/api/fees/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feeData)
      }).then(res => res.json()),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['current-fees'])
        toast.success('Fee change scheduled successfully')
      },
      onError: () => {
        toast.error('Failed to schedule fee change')
      }
    }
  )

  const handleFeeUpdate = () => {
    updateFeesMutation.mutate({ buyerFee, sellerFee })
  }

  const handleFeeSchedule = () => {
    if (!scheduledDate) {
      toast.error('Please select an effective date')
      return
    }
    scheduleFeesMutation.mutate({ buyerFee, sellerFee, effectiveDate: scheduledDate })
  }

  const calculateFeePreview = (amount: number) => {
    const buyerFeeAmount = (amount * buyerFee) / 100
    const sellerFeeAmount = (amount * sellerFee) / 100
    const totalFees = buyerFeeAmount + sellerFeeAmount
    const netAmount = amount - totalFees
    
    return {
      buyerFee: buyerFeeAmount,
      sellerFee: sellerFeeAmount,
      totalFees,
      netAmount
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
        <p className="text-gray-600 mt-2">
          Configure and manage marketplace transaction fees
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'current'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CogIcon className="h-5 w-5 inline mr-2" />
            Current Fees
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'schedule'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckIcon className="h-5 w-5 inline mr-2" />
            Schedule Changes
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartBarIcon className="h-5 w-5 inline mr-2" />
            Analytics
          </button>
        </nav>
      </div>

      {/* Current Fees Tab */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Fee Display */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Current Fee Structure</h2>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Buyer Fee:</span>
                    <span className="font-semibold">{currentFees?.buyerFee || 0.5}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Seller Fee:</span>
                    <span className="font-semibold">{currentFees?.sellerFee || 0.5}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Platform Fee:</span>
                    <span className="font-semibold text-primary-600">
                      {((currentFees?.buyerFee || 0.5) + (currentFees?.sellerFee || 0.5))}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Fee Preview */}
            <div className="card">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Fee Preview</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Amount ($)
                  </label>
                  <input
                    type="number"
                    defaultValue="1000"
                    className="input-field"
                    onChange={(e) => {
                      const amount = parseFloat(e.target.value) || 0
                      const preview = calculateFeePreview(amount)
                      // Update preview display
                    }}
                  />
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Transaction Amount:</span>
                      <span>$1,000.00</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Buyer Fee ({buyerFee}%):</span>
                      <span>-${calculateFeePreview(1000).buyerFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Seller Fee ({sellerFee}%):</span>
                      <span>-${calculateFeePreview(1000).sellerFee.toFixed(2)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-semibold">
                      <span>Net Amount:</span>
                      <span>${calculateFeePreview(1000).netAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Adjustment */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Adjust Fees</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer Fee (%)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={buyerFee}
                    onChange={(e) => setBuyerFee(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16">{buyerFee}%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seller Fee (%)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={sellerFee}
                    onChange={(e) => setSellerFee(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-16">{sellerFee}%</span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={handleFeeUpdate}
                disabled={updateFeesMutation.isLoading}
                className="btn-primary"
              >
                {updateFeesMutation.isLoading ? 'Updating...' : 'Update Fees'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Changes Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Schedule Fee Changes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective Date
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Total Fee Rate
                </label>
                <div className="text-2xl font-bold text-primary-600">
                  {(buyerFee + sellerFee).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  {buyerFee}% buyer + {sellerFee}% seller
                </div>
              </div>
            </div>
            <div className="mt-6">
              <button
                onClick={handleFeeSchedule}
                disabled={scheduleFeesMutation.isLoading}
                className="btn-primary"
              >
                {scheduleFeesMutation.isLoading ? 'Scheduling...' : 'Schedule Fee Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Fee Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    ${feeAnalytics?.totalRevenue?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Fee Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {feeAnalytics?.averageFeeRate?.toFixed(2) || '0.00'}%
                  </p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <CheckIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Transactions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {feeAnalytics?.totalTransactions || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 

export default FeeManagement 