import React, { useEffect, useState } from 'react';
import './App.css';

interface UEXTransaction {
  transaction_id: string;
  client_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

interface ManagementTransaction {
  transactionId: string;
  userId: string;
  status: string;
  amount: number;
  updated_at: string;
}

const UEX_API = 'http://localhost:3001/api/payments';
const MGMT_API = 'http://localhost:3002/api/payments';

const App: React.FC = () => {
  const [uexTxs, setUexTxs] = useState<UEXTransaction[]>([]);
  const [mgmtTxs, setMgmtTxs] = useState<ManagementTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingTxs, setProcessingTxs] = useState<Set<string>>(new Set());

  // Function to process a transaction
  const processTransaction = async (transactionId: string) => {
    if (processingTxs.has(transactionId)) return;
    
    setProcessingTxs(prev => new Set(prev).add(transactionId));
    
    try {
      console.log(`🔄 Processing transaction ${transactionId}...`);
      
      // Step 1: Update to processing
      console.log('  📝 Updating status to "processing"...');
      await fetch(`${UEX_API}/transaction/${transactionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'processing',
          metadata: {
            processed_at: new Date().toISOString(),
            processor: 'uex-dashboard-admin'
          }
        })
      });
      
      // Step 2: Simulate processing time
      console.log('  ⏳ Simulating processing time...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 3: Update to completed
      console.log('  ✅ Updating status to "completed"...');
      await fetch(`${UEX_API}/transaction/${transactionId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          metadata: {
            completed_at: new Date().toISOString(),
            processor: 'uex-dashboard-admin',
            settlement_reference: `SETTLE-${Date.now()}`,
            transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`
          }
        })
      });
      
      console.log(`  🎉 Transaction ${transactionId} completed successfully!`);
      
      // Refresh the transaction list
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error(`❌ Failed to process transaction ${transactionId}:`, error);
      alert(`Failed to process transaction ${transactionId}: ${error}`);
    } finally {
      setProcessingTxs(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return { color: '#10b981', bg: '#d1fae5', icon: '✅' };
      case 'processing':
        return { color: '#f59e0b', bg: '#fef3c7', icon: '⏳' };
      case 'pending':
        return { color: '#3b82f6', bg: '#dbeafe', icon: '⏸️' };
      case 'failed':
        return { color: '#ef4444', bg: '#fee2e2', icon: '❌' };
      case 'cancelled':
        return { color: '#6b7280', bg: '#f3f4f6', icon: '🚫' };
      default:
        return { color: '#6b7280', bg: '#f3f4f6', icon: '❓' };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Poll UEX transactions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchUexTxs = async () => {
      try {
        // Fetch real transaction data from UEX backend
        const res = await fetch(`${UEX_API}/transactions`);
        const data = await res.json();
        
        if (data.success && Array.isArray(data.data)) {
          const txs: UEXTransaction[] = data.data.slice(0, 10).map((tx: any) => ({
            transaction_id: tx.id,
            client_id: tx.client_id,
            amount: tx.amount,
            currency: tx.currency,
            status: tx.status,
            created_at: tx.created_at,
          }));
          setUexTxs(txs);
        } else {
          setUexTxs([]);
        }
      } catch (err) {
        console.error('Failed to fetch UEX transactions:', err);
        setError('Failed to fetch UEX transactions');
      } finally {
        setLoading(false);
      }
    };
    fetchUexTxs();
    interval = setInterval(fetchUexTxs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Poll management-tier transactions
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchMgmtTxs = async () => {
      try {
        const res = await fetch(MGMT_API);
        const data = await res.json();
        setMgmtTxs(
          (data.data || []).map((tx: any) => ({
            transactionId: tx.id || tx.transaction_id,
            userId: tx.client_id || tx.userId || '-',
            status: tx.status,
            amount: tx.amount,
            updated_at: tx.updated_at || '-',
          }))
        );
      } catch (err) {
        setError('Failed to fetch management transactions');
      }
    };
    fetchMgmtTxs();
    interval = setInterval(fetchMgmtTxs, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calculate statistics
  const uexStats = {
    total: uexTxs.length,
    pending: uexTxs.filter(tx => tx.status === 'pending').length,
    processing: uexTxs.filter(tx => tx.status === 'processing').length,
    completed: uexTxs.filter(tx => tx.status === 'completed').length,
    failed: uexTxs.filter(tx => tx.status === 'failed').length,
  };

  const mgmtStats = {
    total: mgmtTxs.length,
    initiated: mgmtTxs.filter(tx => tx.status === 'initiated').length,
    processing: mgmtTxs.filter(tx => tx.status === 'processing').length,
    settled: mgmtTxs.filter(tx => tx.status === 'settled').length,
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="title-icon">🚀</span>
            UEX Dashboard
          </h1>
          <p className="dashboard-subtitle">Real-time transaction monitoring and processing</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-number">{uexStats.total}</div>
            <div className="stat-label">Total UEX</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{mgmtStats.total}</div>
            <div className="stat-label">Total Mgmt</div>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-section">
          <h3 className="section-title">UEX Transaction Status</h3>
          <div className="stats-row">
            <div className="mini-stat pending">
              <div className="mini-stat-number">{uexStats.pending}</div>
              <div className="mini-stat-label">Pending</div>
            </div>
            <div className="mini-stat processing">
              <div className="mini-stat-number">{uexStats.processing}</div>
              <div className="mini-stat-label">Processing</div>
            </div>
            <div className="mini-stat completed">
              <div className="mini-stat-number">{uexStats.completed}</div>
              <div className="mini-stat-label">Completed</div>
            </div>
            <div className="mini-stat failed">
              <div className="mini-stat-number">{uexStats.failed}</div>
              <div className="mini-stat-label">Failed</div>
            </div>
          </div>
        </div>

        <div className="stat-section">
          <h3 className="section-title">Management-tier Status</h3>
          <div className="stats-row">
            <div className="mini-stat initiated">
              <div className="mini-stat-number">{mgmtStats.initiated}</div>
              <div className="mini-stat-label">Initiated</div>
            </div>
            <div className="mini-stat processing">
              <div className="mini-stat-number">{mgmtStats.processing}</div>
              <div className="mini-stat-label">Processing</div>
            </div>
            <div className="mini-stat settled">
              <div className="mini-stat-number">{mgmtStats.settled}</div>
              <div className="mini-stat-label">Settled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* UEX Transaction Status */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-icon">💳</span>
              UEX Processing Transactions
            </h2>
            <div className="card-subtitle">Real-time polling from UEX backend</div>
          </div>
          
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading transactions...</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transaction ID</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {uexTxs.map(tx => {
                    const statusInfo = getStatusInfo(tx.status);
                    return (
                      <tr key={tx.transaction_id} className="table-row">
                        <td className="transaction-id">{tx.transaction_id.slice(0, 8)}...</td>
                        <td className="client-id">{tx.client_id}</td>
                        <td className="amount">
                          <span className="currency-symbol">$</span>
                          {tx.amount.toFixed(2)}
                        </td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ 
                              backgroundColor: statusInfo.bg, 
                              color: statusInfo.color 
                            }}
                          >
                            <span className="status-icon">{statusInfo.icon}</span>
                            {tx.status}
                          </span>
                        </td>
                        <td className="date">{formatDate(tx.created_at)}</td>
                        <td className="actions">
                          {tx.status === 'pending' && (
                            <button
                              onClick={() => processTransaction(tx.transaction_id)}
                              disabled={processingTxs.has(tx.transaction_id)}
                              className={`process-button ${processingTxs.has(tx.transaction_id) ? 'processing' : ''}`}
                            >
                              {processingTxs.has(tx.transaction_id) ? (
                                <>
                                  <span className="button-spinner"></span>
                                  Processing...
                                </>
                              ) : (
                                'Process'
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Management-tier Transaction Processing */}
        <div className="content-card">
          <div className="card-header">
            <h2 className="card-title">
              <span className="card-icon">⚙️</span>
              Management-tier Processing
            </h2>
            <div className="card-subtitle">Transaction processing requests and results</div>
          </div>
          
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {mgmtTxs.map(tx => {
                  const statusInfo = getStatusInfo(tx.status);
                  return (
                    <tr key={tx.transactionId} className="table-row">
                      <td className="transaction-id">{tx.transactionId.slice(0, 8)}...</td>
                      <td className="client-id">{tx.userId}</td>
                      <td className="amount">
                        <span className="currency-symbol">$</span>
                        {tx.amount?.toFixed(2) || '0.00'}
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ 
                            backgroundColor: statusInfo.bg, 
                            color: statusInfo.color 
                          }}
                        >
                          <span className="status-icon">{statusInfo.icon}</span>
                          {tx.status}
                        </span>
                      </td>
                      <td className="date">{formatDate(tx.updated_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
