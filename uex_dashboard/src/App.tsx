import React, { useEffect, useState } from 'react';

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

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>UEX Dashboard</h1>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 32 }}>
        {/* UEX Transaction Status */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>UEX Processing Transactions (Polling)</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f9f9f9' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th>Transaction ID</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {uexTxs.map(tx => (
                <tr key={tx.transaction_id}>
                  <td>{tx.transaction_id}</td>
                  <td>{tx.client_id}</td>
                  <td>{tx.amount} {tx.currency}</td>
                  <td>{tx.status}</td>
                  <td>{tx.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Management-tier Transaction Processing Requests and Results */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Management-tier Transaction Processing Requests/Results</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#f9f9f9' }}>
            <thead>
              <tr style={{ background: '#eee' }}>
                <th>Transaction ID</th>
                <th>User</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {mgmtTxs.map(tx => (
                <tr key={tx.transactionId}>
                  <td>{tx.transactionId}</td>
                  <td>{tx.userId}</td>
                  <td>{tx.amount}</td>
                  <td>{tx.status}</td>
                  <td>{tx.updated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
