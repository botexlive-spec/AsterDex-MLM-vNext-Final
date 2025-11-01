import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactionHistory, Transaction } from '../../services/wallet.service';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filter, dateRange, searchTerm]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const txData = await getTransactionHistory(100, 0); // Get last 100 transactions
      setTransactions(txData);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
      toast.error(error.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filter by type
    if (filter !== 'all') {
      filtered = filtered.filter(tx => tx.transaction_type === filter);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      if (dateRange === 'today') {
        filterDate.setHours(0, 0, 0, 0);
      } else if (dateRange === 'week') {
        filterDate.setDate(now.getDate() - 7);
      } else if (dateRange === 'month') {
        filterDate.setMonth(now.getMonth() - 1);
      } else if (dateRange === 'year') {
        filterDate.setFullYear(now.getFullYear() - 1);
      }

      filtered = filtered.filter(tx => new Date(tx.created_at) >= filterDate);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.description.toLowerCase().includes(search) ||
        tx.transaction_type.toLowerCase().includes(search) ||
        tx.id.toLowerCase().includes(search)
      );
    }

    setFilteredTransactions(filtered);
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
      rank_reward: '#ffc107',
      robot_subscription: '#673ab7'
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

  const formatTransactionType = (type: string) => {
    return type.replace(/_/g, ' ').split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>💳</div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <button onClick={() => navigate('/dashboard')} style={{ marginBottom: '20px', padding: '10px 20px', cursor: 'pointer' }}>
        ← Back to Dashboard
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0' }}>Transaction History</h1>
          <p style={{ margin: '0', color: '#666' }}>View all your transactions and activity</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#667eea' }}>
            {filteredTransactions.length}
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>Total Transactions</div>
        </div>
      </div>

      <div style={{ marginTop: '30px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', padding: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Filter by Type</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="all">All Transactions</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="level_income">Level Commission</option>
              <option value="matching_bonus">Matching Bonus</option>
              <option value="roi_income">ROI Earnings</option>
              <option value="package_investment">Package Purchases</option>
              <option value="robot_subscription">Robot Subscriptions</option>
              <option value="rank_reward">Rank Rewards</option>
              <option value="transfer_in">Transfers In</option>
              <option value="transfer_out">Transfers Out</option>
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '600' }}>Search</label>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #ddd', background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date & Time</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Type</th>
                <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '60px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📭</div>
                    <div style={{ color: '#999', fontSize: '16px' }}>
                      {transactions.length === 0 ? 'No transactions yet' : 'No transactions match your filters'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', color: '#666', fontSize: '14px' }}>
                      <div>{format(new Date(tx.created_at), 'MMM dd, yyyy')}</div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {format(new Date(tx.created_at), 'HH:mm:ss')}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: `${getTransactionTypeColor(tx.transaction_type)}20`,
                        color: getTransactionTypeColor(tx.transaction_type),
                        whiteSpace: 'nowrap'
                      }}>
                        {formatTransactionType(tx.transaction_type)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <div>{tx.description}</div>
                      {tx.method && (
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                          via {tx.method.toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td style={{
                      padding: '12px',
                      textAlign: 'right',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: tx.amount >= 0 ? '#4caf50' : '#f44336'
                    }}>
                      <div>
                        {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                      </div>
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
                      {tx.completed_at && (
                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                          {format(new Date(tx.completed_at), 'MMM dd')}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length > 0 && (
          <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '6px', fontSize: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <strong>Total In:</strong>
                <span style={{ marginLeft: '10px', color: '#4caf50', fontWeight: '600' }}>
                  +${filteredTransactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)}
                </span>
              </div>
              <div>
                <strong>Total Out:</strong>
                <span style={{ marginLeft: '10px', color: '#f44336', fontWeight: '600' }}>
                  ${filteredTransactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0).toFixed(2)}
                </span>
              </div>
              <div>
                <strong>Net:</strong>
                <span style={{ marginLeft: '10px', color: '#667eea', fontWeight: '600' }}>
                  ${filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
