import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import apiClient from '../../utils/api-client';

// Types
interface WalletBalance {
  total: number;
  available: number;
  locked: number;
  pending: number;
}

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  status: string;
  description: string;
  created_at: string;
}

export const Wallet: React.FC = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<WalletBalance>({
    total: 0,
    available: 0,
    locked: 0,
    pending: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);

      // Load wallet balance and recent transactions from MySQL backend
      const [balanceRes, transactionsRes] = await Promise.all([
        apiClient.get<WalletBalance>('/api/wallet-simple/balance'),
        apiClient.get<Transaction[]>('/api/wallet-simple/transactions?limit=10')
      ]);

      if (balanceRes.data) {
        setBalance(balanceRes.data);
      }

      if (transactionsRes.data) {
        setTransactions(transactionsRes.data);
      }
    } catch (error: any) {
      console.error('Error loading wallet data:', error);
      toast.error(error.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      deposit: '#4caf50',
      withdrawal: '#f44336',
      transfer_in: '#2196f3',
      transfer_out: '#ff9800',
      package_investment: '#9c27b0',
      level_income: '#00bcd4',
      matching_bonus: '#009688',
      roi_income: '#8bc34a',
      rank_reward: '#ffc107'
    };
    return colors[type] || '#666';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: '#4caf50',
      pending: '#ff9800',
      failed: '#f44336',
      cancelled: '#9e9e9e'
    };
    return colors[status] || '#666';
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>💰</div>
        <p>Loading wallet...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer' }}>
        ← Back to Dashboard
      </button>

      <h1>My Wallet</h1>
      <p>Manage your funds and transactions</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '30px' }}>
        <div style={{ padding: '25px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', color: 'white' }}>
          <p style={{ opacity: 0.9, marginBottom: '10px' }}>Total Balance</p>
          <h2 style={{ fontSize: '36px', margin: '0' }}>${balance.total.toFixed(2)}</h2>
        </div>

        <div style={{ padding: '25px', background: '#fff', borderRadius: '12px', border: '1px solid #ddd' }}>
          <p style={{ color: '#666', marginBottom: '10px' }}>Available Balance</p>
          <h3 style={{ fontSize: '28px', margin: '0', color: '#4caf50' }}>${balance.available.toFixed(2)}</h3>
        </div>

        <div style={{ padding: '25px', background: '#fff', borderRadius: '12px', border: '1px solid #ddd' }}>
          <p style={{ color: '#666', marginBottom: '10px' }}>Locked Balance</p>
          <h3 style={{ fontSize: '28px', margin: '0', color: '#ff9800' }}>${balance.locked.toFixed(2)}</h3>
        </div>

        <div style={{ padding: '25px', background: '#fff', borderRadius: '12px', border: '1px solid #ddd' }}>
          <p style={{ color: '#666', marginBottom: '10px' }}>Pending</p>
          <h3 style={{ fontSize: '28px', margin: '0', color: '#2196f3' }}>${balance.pending.toFixed(2)}</h3>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
        <button
          onClick={() => navigate('/wallet/deposit')}
          style={{
            padding: '20px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px'
          }}
        >
          💰 Deposit Funds
        </button>

        <button
          onClick={() => navigate('/wallet/withdraw')}
          style={{
            padding: '20px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '16px'
          }}
        >
          💸 Withdraw Funds
        </button>
      </div>

      <div style={{ marginTop: '40px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Recent Transactions</h3>
          <button
            onClick={() => navigate('/transactions')}
            style={{
              padding: '8px 16px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            View All
          </button>
        </div>
        <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Amount</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                  No transactions yet
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                    {format(new Date(tx.created_at), 'MMM dd, yyyy HH:mm')}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: `${getTransactionTypeColor(tx.transaction_type)}20`,
                      color: getTransactionTypeColor(tx.transaction_type)
                    }}>
                      {tx.transaction_type.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{tx.description}</td>
                  <td style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: tx.amount >= 0 ? '#4caf50' : '#f44336'
                  }}>
                    {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      background: `${getStatusColor(tx.status)}20`,
                      color: getStatusColor(tx.status)
                    }}>
                      {tx.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>💡 Wallet Information</h4>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#666', fontSize: '14px', lineHeight: '1.8' }}>
          <li><strong>Available Balance:</strong> Funds available for withdrawals and investments</li>
          <li><strong>Locked Balance:</strong> Funds locked in active packages and pending commissions</li>
          <li><strong>Pending:</strong> Deposits and withdrawals awaiting admin approval</li>
          <li><strong>Withdrawal Limits:</strong> Daily $10,000 | Weekly $50,000 | Monthly $200,000</li>
          <li><strong>KYC Required:</strong> Complete KYC verification to enable withdrawals</li>
        </ul>
      </div>
    </div>
  );
};

export default Wallet;
