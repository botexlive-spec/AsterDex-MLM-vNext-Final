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
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filter, statusFilter, dateRange, searchTerm]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const txData = await getTransactionHistory(100, 0); // Get last 100 transactions
      console.log('Loaded transactions:', txData);
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

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
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
        tx.description?.toLowerCase().includes(search) ||
        tx.transaction_type?.toLowerCase().includes(search) ||
        tx.id?.toLowerCase().includes(search)
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

  // Calculate statistics
  const totalDeposited = filteredTransactions
    .filter(tx => tx.transaction_type === 'deposit' && tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalWithdrawn = filteredTransactions
    .filter(tx => tx.transaction_type === 'withdrawal')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const totalEarned = filteredTransactions
    .filter(tx => ['level_income', 'matching_bonus', 'roi_income', 'rank_reward', 'roi_distribution'].includes(tx.transaction_type))
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">💳</div>
          <p className="text-[#94a3b8]">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/wallet')}
            className="text-[#64748b] hover:text-white mb-4 flex items-center space-x-2 transition-colors"
          >
            <span>←</span>
            <span>Back to Wallet</span>
          </button>
          <h1 className="text-3xl font-bold mb-2">Transaction History</h1>
          <p className="text-[#94a3b8]">View all your transactions and activity</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6">
            <p className="text-sm opacity-80 mb-1">Total Transactions</p>
            <p className="text-3xl font-bold">{filteredTransactions.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6">
            <p className="text-sm opacity-80 mb-1">Total Deposited</p>
            <p className="text-3xl font-bold">${totalDeposited.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-600 to-pink-600 rounded-xl p-6">
            <p className="text-sm opacity-80 mb-1">Total Withdrawn</p>
            <p className="text-3xl font-bold">${totalWithdrawn.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6">
            <p className="text-sm opacity-80 mb-1">Total Earned</p>
            <p className="text-3xl font-bold">${totalEarned.toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[#1a1f2e] rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[#94a3b8]">Search</label>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0f1419] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[#94a3b8]">Type</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-[#0f1419] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="deposit">Deposits</option>
                <option value="withdrawal">Withdrawals</option>
                <option value="transfer_in">Transfers In</option>
                <option value="transfer_out">Transfers Out</option>
                <option value="level_income">Level Income</option>
                <option value="matching_bonus">Matching Bonus</option>
                <option value="roi_income">ROI Income</option>
                <option value="roi_distribution">ROI Distribution</option>
                <option value="package_investment">Package Investment</option>
                <option value="rank_reward">Rank Rewards</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[#94a3b8]">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#0f1419] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-2 text-[#94a3b8]">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full bg-[#0f1419] border border-[#2d3748] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-[#94a3b8] mr-2">Quick filters:</span>
            <button
              onClick={() => setDateRange('today')}
              className="px-3 py-1 bg-[#0f1419] hover:bg-indigo-600 rounded-lg text-sm transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('week')}
              className="px-3 py-1 bg-[#0f1419] hover:bg-indigo-600 rounded-lg text-sm transition-colors"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateRange('month')}
              className="px-3 py-1 bg-[#0f1419] hover:bg-indigo-600 rounded-lg text-sm transition-colors"
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setDateRange('year')}
              className="px-3 py-1 bg-[#0f1419] hover:bg-indigo-600 rounded-lg text-sm transition-colors"
            >
              Last Year
            </button>
            <button
              onClick={() => {
                setFilter('all');
                setStatusFilter('all');
                setDateRange('all');
                setSearchTerm('');
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors ml-auto"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Transaction History Table */}
        <div className="bg-[#1a1f2e] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2d3748]">
            <h3 className="text-lg font-semibold">Transaction History</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2d3748] bg-[#0f1419]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#94a3b8]">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#94a3b8]">Date & Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#94a3b8]">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#94a3b8]">Description</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-[#94a3b8]">Amount</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-[#94a3b8]">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="text-5xl mb-4">📭</div>
                      <div className="text-[#64748b] text-lg">
                        {transactions.length === 0 ? 'No transactions found' : 'No transactions match your criteria'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-[#2d3748] hover:bg-[#0f1419] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs text-[#64748b] font-mono">
                          {tx.id.substring(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white">
                          {format(new Date(tx.created_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-[#64748b]">
                          {format(new Date(tx.created_at), 'HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${getTransactionTypeColor(tx.transaction_type)}20`,
                            color: getTransactionTypeColor(tx.transaction_type),
                          }}
                        >
                          {formatTransactionType(tx.transaction_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white max-w-md">{tx.description}</div>
                        {tx.method && (
                          <div className="text-xs text-[#64748b] mt-1">
                            via {tx.method.toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div
                          className="text-base font-bold"
                          style={{
                            color: tx.amount >= 0 ? '#10b981' : '#ef4444',
                          }}
                        >
                          {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className="inline-flex px-3 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: `${getStatusColor(tx.status)}20`,
                            color: getStatusColor(tx.status),
                          }}
                        >
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Footer */}
          {filteredTransactions.length > 0 && (
            <div className="px-6 py-4 border-t border-[#2d3748] bg-[#0f1419]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-[#94a3b8]">Total In: </span>
                  <span className="font-bold text-green-500">
                    +${filteredTransactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Total Out: </span>
                  <span className="font-bold text-red-500">
                    -${filteredTransactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[#94a3b8]">Net: </span>
                  <span className="font-bold text-indigo-500">
                    ${filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Transactions;
