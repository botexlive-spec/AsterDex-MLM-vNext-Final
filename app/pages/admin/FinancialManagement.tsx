import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import {
  getAllDeposits,
  getAllWithdrawals,
  getAllTransactions,
  approveDeposit,
  rejectDeposit,
  approveWithdrawal,
  rejectWithdrawal,
  getFinancialStats,
} from '../../services/admin-financial.service';

// Types
interface Deposit {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: string;
  date: string;
  proof?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

interface Withdrawal {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: string;
  bankDetails?: string;
  walletAddress?: string;
  requestDate: string;
  kycStatus: 'approved' | 'pending' | 'not_submitted';
  availableBalance: number;
  status: 'pending' | 'approved' | 'rejected' | 'on_hold';
}

interface Transaction {
  id: string;
  userId: string;
  userName: string;
  type: 'deposit' | 'withdrawal' | 'commission' | 'roi' | 'investment' | 'referral';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  date: string;
  description: string;
}

interface PaymentGateway {
  id: string;
  name: string;
  type: 'stripe' | 'razorpay' | 'paypal' | 'crypto';
  status: 'active' | 'inactive';
  testMode: boolean;
  apiKey?: string;
  secretKey?: string;
  webhookUrl?: string;
  transactionFee: number;
}

export const FinancialManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'deposits' | 'withdrawals' | 'transactions' | 'gateways' | 'reports'>('deposits');

  // Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showGatewayModal, setShowGatewayModal] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showWithdrawalApproveConfirm, setShowWithdrawalApproveConfirm] = useState(false);
  const [showWithdrawalRejectConfirm, setShowWithdrawalRejectConfirm] = useState(false);

  // Filters
  const [depositFilter, setDepositFilter] = useState('all');
  const [withdrawalFilter, setWithdrawalFilter] = useState('pending');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all');
  const [transactionStatusFilter, setTransactionStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Withdrawal Management
  const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([]);
  const [adminPassword, setAdminPassword] = useState('');

  // Data from database
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositStats, setDepositStats] = useState<any>(null);

  // Mock Data - Payment Gateways
  const [gateways, setGateways] = useState<PaymentGateway[]>([
    {
      id: 'GW001',
      name: 'Stripe',
      type: 'stripe',
      status: 'active',
      testMode: false,
      apiKey: 'pk_live_xxxxxxxxxxxx',
      secretKey: 'sk_live_xxxxxxxxxxxx',
      webhookUrl: 'https://yoursite.com/webhooks/stripe',
      transactionFee: 2.9,
    },
    {
      id: 'GW002',
      name: 'Razorpay',
      type: 'razorpay',
      status: 'active',
      testMode: false,
      apiKey: 'rzp_live_xxxxxxxxxxxx',
      secretKey: 'xxxxxxxxxxxx',
      webhookUrl: 'https://yoursite.com/webhooks/razorpay',
      transactionFee: 2.0,
    },
    {
      id: 'GW003',
      name: 'PayPal',
      type: 'paypal',
      status: 'inactive',
      testMode: true,
      transactionFee: 3.5,
    },
  ]);

  // Chart Data
  const depositVsWithdrawal = [
    { month: 'Jan', deposits: 12500, withdrawals: 8200 },
    { month: 'Feb', deposits: 15800, withdrawals: 9500 },
    { month: 'Mar', deposits: 18200, withdrawals: 11200 },
    { month: 'Apr', deposits: 21500, withdrawals: 13800 },
    { month: 'May', deposits: 24800, withdrawals: 15200 },
  ];

  // Load financial data from database
  useEffect(() => {
    const loadFinancialData = async () => {
      try {
        setLoading(true);

        // Load deposits, withdrawals, transactions, and stats in parallel
        const [depositsData, withdrawalsData, transactionsData, stats] = await Promise.all([
          getAllDeposits(),
          getAllWithdrawals(),
          getAllTransactions(),
          getFinancialStats(),
        ]);

        // Format deposits for UI
        const formattedDeposits: Deposit[] = depositsData.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          userName: d.user_name || 'Unknown',
          amount: d.amount,
          method: d.payment_method || 'Unknown',
          date: d.created_at,
          proof: d.proof_url || undefined,
          status: d.status,
          notes: d.notes || undefined,
        }));

        // Format withdrawals for UI
        const formattedWithdrawals: Withdrawal[] = withdrawalsData.map((w: any) => ({
          id: w.id,
          userId: w.user_id,
          userName: w.user_name || 'Unknown',
          amount: w.final_amount || w.requested_amount || w.amount || 0,
          method: w.withdrawal_method || 'Unknown',
          bankDetails: w.bank_details || undefined,
          walletAddress: w.wallet_address || undefined,
          requestDate: w.created_at,
          kycStatus: w.user_kyc_status || 'not_submitted',
          availableBalance: w.user_available_balance || 0,
          status: w.status,
        }));

        // Format transactions for UI
        const formattedTransactions: Transaction[] = transactionsData.map((t: any) => ({
          id: t.id,
          userId: t.user_id,
          userName: t.user_name || t.user_email || 'Unknown',
          type: t.transaction_type,
          amount: Number(t.amount || 0),
          status: t.status,
          date: t.created_at,
          description: t.description || '',
        }));

        setDeposits(formattedDeposits);
        setWithdrawals(formattedWithdrawals);
        setTransactions(formattedTransactions);
        setDepositStats(stats);

      } catch (error) {
        console.error('Error loading financial data:', error);
        toast.error('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    loadFinancialData();
  }, []);

  // Load gateways from localStorage on mount
  useEffect(() => {
    try {
      const savedGateways = localStorage.getItem('finaster_payment_gateways');
      if (savedGateways) {
        setGateways(JSON.parse(savedGateways));
        toast.success('Payment gateways loaded from storage');
      }
    } catch (error) {
      console.error('Failed to load gateways from localStorage:', error);
    }
  }, []);

  // Save gateways to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('finaster_payment_gateways', JSON.stringify(gateways));
    } catch (error) {
      console.error('Failed to save gateways to localStorage:', error);
    }
  }, [gateways]);

  // Handlers
  const handleApproveDeposit = async (depositId: string) => {
    if (!adminPassword) {
      toast.error('Please enter admin password');
      return;
    }

    try {
      await approveDeposit(depositId, `Approved by admin. Password verified.`);

      // Update local state
      setDeposits(prev =>
        prev.map(d =>
          d.id === depositId
            ? { ...d, status: 'approved' as const }
            : d
        )
      );

      toast.success(`Deposit ${depositId} approved successfully`);
      setShowDepositModal(false);
      setAdminPassword('');
    } catch (error: any) {
      console.error('Failed to approve deposit:', error);
      toast.error(error.message || 'Failed to approve deposit');
    }
  };

  const handleRejectDeposit = async (depositId: string, reason: string) => {
    try {
      await rejectDeposit(depositId, reason);

      // Update local state
      setDeposits(prev =>
        prev.map(d =>
          d.id === depositId
            ? { ...d, status: 'rejected' as const }
            : d
        )
      );

      toast.success(`Deposit ${depositId} rejected: ${reason}`);
      setShowDepositModal(false);
    } catch (error: any) {
      console.error('Failed to reject deposit:', error);
      toast.error(error.message || 'Failed to reject deposit');
    }
  };

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    if (!adminPassword) {
      toast.error('Please enter admin password for verification');
      return;
    }

    try {
      await approveWithdrawal(withdrawalId, `Approved by admin. Password verified.`);

      // Update local state
      setWithdrawals(prev =>
        prev.map(w =>
          w.id === withdrawalId
            ? { ...w, status: 'approved' as const }
            : w
        )
      );

      toast.success(`Withdrawal ${withdrawalId} approved and processed`);
      setShowWithdrawalModal(false);
      setAdminPassword('');
    } catch (error: any) {
      console.error('Failed to approve withdrawal:', error);
      toast.error(error.message || 'Failed to approve withdrawal');
    }
  };

  const handleBatchApprove = async () => {
    if (selectedWithdrawals.length === 0) {
      toast.error('No withdrawals selected');
      return;
    }
    if (!adminPassword) {
      toast.error('Please enter admin password');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    try {
      for (const withdrawalId of selectedWithdrawals) {
        try {
          await approveWithdrawal(withdrawalId, 'Batch approved by admin');
          successCount++;
        } catch (error) {
          console.error(`Failed to approve withdrawal ${withdrawalId}:`, error);
          failCount++;
        }
      }

      // Update local state for all successfully approved
      setWithdrawals(prev =>
        prev.map(w =>
          selectedWithdrawals.includes(w.id)
            ? { ...w, status: 'approved' as const }
            : w
        )
      );

      if (successCount > 0) {
        toast.success(`${successCount} withdrawal${successCount > 1 ? 's' : ''} processed successfully`);
      }
      if (failCount > 0) {
        toast.error(`Failed to process ${failCount} withdrawal${failCount > 1 ? 's' : ''}`);
      }

      setSelectedWithdrawals([]);
      setAdminPassword('');
    } catch (error: any) {
      console.error('Batch approval error:', error);
      toast.error('Batch approval failed');
    }
  };

  const handleExportCSV = () => {
    const csv = selectedWithdrawals.map(id => {
      const wd = withdrawals.find(w => w.id === id);
      return `${wd?.userName},${wd?.bankDetails},${wd?.amount}`;
    }).join('\n');

    const blob = new Blob([`Name,Account,Amount\n${csv}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'withdrawals.csv';
    a.click();
    toast.success('CSV file downloaded');
  };

  const handleToggleGateway = (id: string) => {
    setGateways(gateways.map(g =>
      g.id === id ? { ...g, status: g.status === 'active' ? 'inactive' as const : 'active' as const } : g
    ));
    toast.success('Gateway status updated');
  };

  const filteredDeposits = deposits.filter(d =>
    depositFilter === 'all' || d.status === depositFilter
  );

  const filteredWithdrawals = withdrawals.filter(w =>
    withdrawalFilter === 'all' || w.status === withdrawalFilter
  );

  const filteredTransactions = transactions.filter(t => {
    const matchesType = transactionTypeFilter === 'all' || t.type === transactionTypeFilter;
    const matchesStatus = transactionStatusFilter === 'all' || t.status === transactionStatusFilter;
    const matchesSearch = t.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Date range filtering
    let matchesDateRange = true;
    if (dateRange.from && dateRange.to) {
      const txnDate = new Date(t.date);
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      matchesDateRange = txnDate >= fromDate && txnDate <= toDate;
    } else if (dateRange.from) {
      const txnDate = new Date(t.date);
      const fromDate = new Date(dateRange.from);
      matchesDateRange = txnDate >= fromDate;
    } else if (dateRange.to) {
      const txnDate = new Date(t.date);
      const toDate = new Date(dateRange.to);
      matchesDateRange = txnDate <= toDate;
    }

    return matchesType && matchesStatus && matchesSearch && matchesDateRange;
  });

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Financial Management</h1>
        <p className="text-[#94a3b8]">Manage deposits, withdrawals, transactions, and payment gateways</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94a3b8] text-sm mb-1">Total Deposits</p>
              <p className="text-3xl font-bold text-[#10b981]">$41,500</p>
              <p className="text-[#10b981] text-sm mt-1">↑ 12% this month</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94a3b8] text-sm mb-1">Total Withdrawals</p>
              <p className="text-3xl font-bold text-[#ef4444]">$24,800</p>
              <p className="text-[#10b981] text-sm mt-1">↓ 5% this month</p>
            </div>
            <div className="text-4xl">💸</div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94a3b8] text-sm mb-1">Pending Requests</p>
              <p className="text-3xl font-bold text-[#f59e0b]">
                {deposits.filter(d => d.status === 'pending').length +
                 withdrawals.filter(w => w.status === 'pending').length}
              </p>
              <p className="text-[#94a3b8] text-sm mt-1">Need attention</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94a3b8] text-sm mb-1">Net Balance</p>
              <p className="text-3xl font-bold text-[#00C7D1]">$16,700</p>
              <p className="text-[#10b981] text-sm mt-1">Positive flow</p>
            </div>
            <div className="text-4xl">💳</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#334155] overflow-x-auto">
        {[
          { id: 'deposits', label: 'Deposits', icon: '💰' },
          { id: 'withdrawals', label: 'Withdrawals', icon: '💸' },
          { id: 'transactions', label: 'Transactions', icon: '📊' },
          { id: 'gateways', label: 'Payment Gateways', icon: '💳' },
          { id: 'reports', label: 'Financial Reports', icon: '📈' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'text-[#00C7D1] border-b-2 border-[#00C7D1]'
                : 'text-[#94a3b8] hover:text-[#cbd5e1]'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Deposits */}
      {activeTab === 'deposits' && (
        <div className="space-y-6">
          {/* Filter */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#f8fafc]">Deposit Requests</h2>
            <select
              value={depositFilter}
              onChange={(e) => setDepositFilter(e.target.value)}
              className="bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Deposits Table */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#334155]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Transaction ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">User</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Method</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Date</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {filteredDeposits.map((deposit) => (
                    <tr key={deposit.id} className="hover:bg-[#334155]/50">
                      <td className="px-6 py-4 text-[#f8fafc] font-mono text-sm">{deposit.id}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-[#f8fafc] font-medium">{deposit.userName}</p>
                          <p className="text-[#94a3b8] text-sm">{deposit.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-[#10b981] font-semibold">${deposit.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-[#cbd5e1]">{deposit.method}</td>
                      <td className="px-6 py-4 text-[#94a3b8] text-sm">
                        {format(new Date(deposit.date), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          deposit.status === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                          deposit.status === 'approved' ? 'bg-[#10b981]/20 text-[#10b981]' :
                          'bg-[#ef4444]/20 text-[#ef4444]'
                        }`}>
                          {deposit.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {deposit.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedDeposit(deposit);
                              setShowDepositModal(true);
                            }}
                            className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-4 py-1 rounded text-sm transition-colors"
                          >
                            Review
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deposit Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <p className="text-[#94a3b8] text-sm mb-1">Pending Deposits</p>
              <p className="text-2xl font-bold text-[#f59e0b]">
                {deposits.filter(d => d.status === 'pending').length}
              </p>
              <p className="text-[#94a3b8] text-sm mt-1">
                Total: ${deposits.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
              </p>
            </div>

            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <p className="text-[#94a3b8] text-sm mb-1">Approved Today</p>
              <p className="text-2xl font-bold text-[#10b981]">
                {deposits.filter(d => d.status === 'approved').length}
              </p>
              <p className="text-[#94a3b8] text-sm mt-1">Average: $1,250</p>
            </div>

            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <p className="text-[#94a3b8] text-sm mb-1">Rejection Rate</p>
              <p className="text-2xl font-bold text-[#ef4444]">2.5%</p>
              <p className="text-[#10b981] text-sm mt-1">↓ 0.5% vs last week</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Withdrawals */}
      {activeTab === 'withdrawals' && (
        <div className="space-y-6">
          {/* Header with Actions */}
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <h2 className="text-xl font-semibold text-[#f8fafc]">Withdrawal Queue</h2>
              {selectedWithdrawals.length > 0 && (
                <span className="bg-[#00C7D1] text-white px-3 py-1 rounded-full text-sm">
                  {selectedWithdrawals.length} selected
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {selectedWithdrawals.length > 0 && (
                <>
                  <button
                    onClick={handleBatchApprove}
                    className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Batch Approve
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Export CSV
                  </button>
                </>
              )}
              <select
                value={withdrawalFilter}
                onChange={(e) => setWithdrawalFilter(e.target.value)}
                className="bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* Withdrawals Table */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#334155]">
                  <tr>
                    <th className="px-6 py-4">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWithdrawals(filteredWithdrawals.filter(w => w.status === 'pending').map(w => w.id));
                          } else {
                            setSelectedWithdrawals([]);
                          }
                        }}
                        className="w-4 h-4 rounded"
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">User</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Method</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Details</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">KYC</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Balance</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {filteredWithdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-[#334155]/50">
                      <td className="px-6 py-4">
                        {withdrawal.status === 'pending' && (
                          <input
                            type="checkbox"
                            checked={selectedWithdrawals.includes(withdrawal.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedWithdrawals([...selectedWithdrawals, withdrawal.id]);
                              } else {
                                setSelectedWithdrawals(selectedWithdrawals.filter(id => id !== withdrawal.id));
                              }
                            }}
                            className="w-4 h-4 rounded"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#f8fafc] font-mono text-sm">{withdrawal.id}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-[#f8fafc] font-medium">{withdrawal.userName}</p>
                          <p className="text-[#94a3b8] text-sm">{withdrawal.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-[#ef4444] font-semibold">
                        ${withdrawal.amount ? Number(withdrawal.amount).toLocaleString() : '0.00'}
                      </td>
                      <td className="px-6 py-4 text-[#cbd5e1]">{withdrawal.method || 'N/A'}</td>
                      <td className="px-6 py-4 text-[#94a3b8] text-sm font-mono">
                        {withdrawal.bankDetails || withdrawal.walletAddress || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          withdrawal.kycStatus === 'approved' ? 'bg-[#10b981]/20 text-[#10b981]' :
                          withdrawal.kycStatus === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                          'bg-[#ef4444]/20 text-[#ef4444]'
                        }`}>
                          {withdrawal.kycStatus || 'unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[#10b981] font-semibold">
                        ${withdrawal.availableBalance ? Number(withdrawal.availableBalance).toLocaleString() : '0.00'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          withdrawal.status === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                          withdrawal.status === 'approved' ? 'bg-[#10b981]/20 text-[#10b981]' :
                          withdrawal.status === 'on_hold' ? 'bg-[#94a3b8]/20 text-[#94a3b8]' :
                          'bg-[#ef4444]/20 text-[#ef4444]'
                        }`}>
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {withdrawal.status === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setShowWithdrawalModal(true);
                            }}
                            className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-4 py-1 rounded text-sm transition-colors"
                          >
                            Process
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Withdrawal Limits */}
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Withdrawal Limits Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Daily Limit</label>
                <input
                  type="number"
                  defaultValue="10000"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Weekly Limit</label>
                <input
                  type="number"
                  defaultValue="50000"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Monthly Limit</label>
                <input
                  type="number"
                  defaultValue="200000"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
            </div>
            <button
              onClick={() => toast.success('Withdrawal limits updated')}
              className="mt-4 bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-6 py-2 rounded-lg transition-colors"
            >
              Save Limits
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Transactions */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search by ID or user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Type</label>
                <select
                  value={transactionTypeFilter}
                  onChange={(e) => setTransactionTypeFilter(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                >
                  <option value="all">All Types</option>
                  <option value="deposit">Deposits</option>
                  <option value="withdrawal">Withdrawals</option>
                  <option value="commission">Commissions</option>
                  <option value="roi">ROI</option>
                  <option value="investment">Investments</option>
                </select>
              </div>
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Status</label>
                <select
                  value={transactionStatusFilter}
                  onChange={(e) => setTransactionStatusFilter(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Actions</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowTransactionModal(true)}
                    className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    + Manual Entry
                  </button>
                  <button
                    onClick={() => toast.success('Transactions exported')}
                    className="flex-1 bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#334155]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Transaction ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Type</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Date</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-[#94a3b8]">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-[#94a3b8]">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-[#334155]/50">
                      <td className="px-6 py-4 text-[#f8fafc] font-mono text-sm">{txn.id}</td>
                      <td className="px-6 py-4 text-[#f8fafc]">{txn.userName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          txn.type === 'deposit' ? 'bg-[#10b981]/20 text-[#10b981]' :
                          txn.type === 'withdrawal' ? 'bg-[#ef4444]/20 text-[#ef4444]' :
                          txn.type === 'commission' ? 'bg-[#00C7D1]/20 text-[#00C7D1]' :
                          'bg-[#f59e0b]/20 text-[#f59e0b]'
                        }`}>
                          {txn.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-semibold ${
                        txn.type === 'withdrawal' ? 'text-[#ef4444]' : 'text-[#10b981]'
                      }`}>
                        {txn.type === 'withdrawal' ? '-' : '+'}${txn.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-[#94a3b8] text-sm">{txn.description}</td>
                      <td className="px-6 py-4 text-[#94a3b8] text-sm">
                        <div>{format(new Date(txn.date), 'MMM dd, yyyy')}</div>
                        <div className="text-xs text-[#64748b]">{format(new Date(txn.date), 'hh:mm:ss a')}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          txn.status === 'completed' ? 'bg-[#10b981]/20 text-[#10b981]' :
                          txn.status === 'pending' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' :
                          'bg-[#ef4444]/20 text-[#ef4444]'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toast('Transaction details modal', { icon: 'ℹ️' })}
                          className="text-[#00C7D1] hover:text-[#00b3bd] text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Payment Gateways */}
      {activeTab === 'gateways' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#f8fafc]">Payment Gateway Configuration</h2>
            <button
              onClick={() => {
                setSelectedGateway(null);
                setShowGatewayModal(true);
              }}
              className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-6 py-3 rounded-lg transition-colors"
            >
              + Add Gateway
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {gateways.map((gateway) => (
              <div key={gateway.id} className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-[#f8fafc]">{gateway.name}</h3>
                    <p className="text-[#94a3b8] text-sm">{gateway.type}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      gateway.status === 'active' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#ef4444]/20 text-[#ef4444]'
                    }`}>
                      {gateway.status}
                    </span>
                    {gateway.testMode && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#f59e0b]/20 text-[#f59e0b]">
                        Test Mode
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {gateway.apiKey && (
                    <div>
                      <p className="text-[#94a3b8] text-xs mb-1">API Key</p>
                      <p className="text-[#f8fafc] text-sm font-mono">
                        {gateway.apiKey.substring(0, 20)}...
                      </p>
                    </div>
                  )}
                  {gateway.webhookUrl && (
                    <div>
                      <p className="text-[#94a3b8] text-xs mb-1">Webhook URL</p>
                      <p className="text-[#f8fafc] text-sm font-mono break-all">{gateway.webhookUrl}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[#94a3b8] text-xs mb-1">Transaction Fee</p>
                    <p className="text-[#f8fafc] text-sm font-semibold">{gateway.transactionFee}%</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleGateway(gateway.id)}
                    className={`flex-1 ${
                      gateway.status === 'active'
                        ? 'bg-[#ef4444] hover:bg-[#dc2626]'
                        : 'bg-[#10b981] hover:bg-[#059669]'
                    } text-white px-4 py-2 rounded-lg text-sm transition-colors`}
                  >
                    {gateway.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedGateway(gateway);
                      setShowGatewayModal(true);
                    }}
                    className="flex-1 bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Gateway Statistics */}
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Gateway Statistics (Last 30 Days)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-[#94a3b8] text-sm mb-1">Stripe</p>
                <p className="text-2xl font-bold text-[#f8fafc]">$28,500</p>
                <p className="text-[#10b981] text-sm">142 transactions</p>
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm mb-1">Razorpay</p>
                <p className="text-2xl font-bold text-[#f8fafc]">$13,000</p>
                <p className="text-[#10b981] text-sm">68 transactions</p>
              </div>
              <div>
                <p className="text-[#94a3b8] text-sm mb-1">Total Fees Paid</p>
                <p className="text-2xl font-bold text-[#ef4444]">$1,087</p>
                <p className="text-[#94a3b8] text-sm">2.62% average</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Financial Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[#f8fafc]">Financial Reports & Analytics</h2>

          {/* Deposit vs Withdrawal Chart */}
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Deposit vs Withdrawal Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={depositVsWithdrawal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="deposits" fill="#10b981" name="Deposits" />
                <Bar dataKey="withdrawals" fill="#ef4444" name="Withdrawals" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Report Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Daily Reconciliation', description: 'End of day financial summary', icon: '📊' },
              { title: 'Revenue Report', description: 'Total platform revenue breakdown', icon: '💰' },
              { title: 'Commission Payout', description: 'Referral and team commissions', icon: '🤝' },
              { title: 'Package Investment', description: 'Package-wise investment analysis', icon: '📦' },
              { title: 'Profit/Loss Statement', description: 'Complete P&L statement', icon: '📈' },
              { title: 'Tax Report', description: 'Tax calculation and deductions', icon: '🧾' },
            ].map((report, idx) => (
              <div key={idx} className="bg-[#1e293b] rounded-xl p-6 border border-[#334155] hover:border-[#00C7D1] transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-3xl">{report.icon}</span>
                      <h3 className="text-lg font-semibold text-[#f8fafc]">{report.title}</h3>
                    </div>
                    <p className="text-[#94a3b8] text-sm mb-4">{report.description}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toast.success(`Generating ${report.title}...`)}
                        className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Generate PDF
                      </button>
                      <button
                        onClick={() => toast.success(`Exporting ${report.title}...`)}
                        className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Export Excel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deposit Approval Modal */}
      {showDepositModal && selectedDeposit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-xl max-w-2xl w-full border border-[#334155]">
            <div className="p-6 border-b border-[#334155]">
              <h2 className="text-2xl font-bold text-[#f8fafc]">Review Deposit - {selectedDeposit.id}</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#94a3b8] text-sm mb-1">User</p>
                  <p className="text-[#f8fafc] font-semibold">{selectedDeposit.userName}</p>
                </div>
                <div>
                  <p className="text-[#94a3b8] text-sm mb-1">Amount</p>
                  <p className="text-[#10b981] font-semibold text-lg">${selectedDeposit.amount}</p>
                </div>
                <div>
                  <p className="text-[#94a3b8] text-sm mb-1">Method</p>
                  <p className="text-[#f8fafc]">{selectedDeposit.method}</p>
                </div>
                <div>
                  <p className="text-[#94a3b8] text-sm mb-1">Date</p>
                  <p className="text-[#f8fafc]">{format(new Date(selectedDeposit.date), 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>

              {selectedDeposit.proof && (
                <div>
                  <p className="text-[#94a3b8] text-sm mb-2">Payment Proof</p>
                  <img
                    src={selectedDeposit.proof}
                    alt="Payment Proof"
                    className="w-full rounded-lg border border-[#334155]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Admin Password (Required)</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#334155] flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDepositModal(false);
                  setAdminPassword('');
                }}
                className="bg-[#334155] hover:bg-[#475569] text-[#f8fafc] px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRejectConfirm(true)}
                className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-2 rounded-lg transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => setShowApproveConfirm(true)}
                className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg transition-colors"
              >
                Approve Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Approval Modal */}
      {showWithdrawalModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-xl max-w-2xl w-full border border-[#334155]">
            <div className="p-6 border-b border-[#334155]">
              <h2 className="text-2xl font-bold text-[#f8fafc]">Process Withdrawal - {selectedWithdrawal.id}</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#94a3b8] text-sm mb-1">User</p>
                  <p className="text-[#f8fafc] font-semibold">{selectedWithdrawal.userName}</p>
                  <p className="text-[#94a3b8] text-xs">{selectedWithdrawal.userId}</p>
                </div>
                <div>
                  <p className="text-[#94a3b8] text-sm mb-1">Amount</p>
                  <p className="text-[#ef4444] font-semibold text-lg">${selectedWithdrawal.amount}</p>
                </div>
                <div>
                  <p className="text-[#94a3b8] text-sm mb-1">Available Balance</p>
                  <p className="text-[#10b981] font-semibold">${selectedWithdrawal.availableBalance}</p>
                </div>
                <div>
                  <p className="text-[#94a3b8] text-sm mb-1">KYC Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    selectedWithdrawal.kycStatus === 'approved' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                  }`}>
                    {selectedWithdrawal.kycStatus}
                  </span>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-lg p-4 border border-[#334155]">
                <p className="text-[#94a3b8] text-sm mb-2">Payment Details</p>
                <p className="text-[#f8fafc] font-semibold">{selectedWithdrawal.method}</p>
                <p className="text-[#cbd5e1] font-mono text-sm mt-1">
                  {selectedWithdrawal.bankDetails || selectedWithdrawal.walletAddress}
                </p>
              </div>

              {/* User Transaction History */}
              <div className="bg-[#0f172a] rounded-lg p-4 border border-[#334155]">
                <h4 className="text-[#f8fafc] font-semibold mb-3">User Transaction History</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {transactions
                    .filter(t => t.userId === selectedWithdrawal.userId)
                    .slice(0, 10)
                    .map((txn) => (
                      <div key={txn.id} className="flex justify-between items-center p-2 bg-[#1e293b] rounded">
                        <div className="flex-1">
                          <p className="text-[#f8fafc] text-sm font-medium">{txn.description}</p>
                          <p className="text-[#94a3b8] text-xs">{format(new Date(txn.date), 'MMM dd, yyyy')}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${
                            txn.type === 'withdrawal' ? 'text-[#ef4444]' : 'text-[#10b981]'
                          }`}>
                            {txn.type === 'withdrawal' ? '-' : '+'}${txn.amount.toLocaleString()}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            txn.type === 'deposit' ? 'bg-[#10b981]/20 text-[#10b981]' :
                            txn.type === 'withdrawal' ? 'bg-[#ef4444]/20 text-[#ef4444]' :
                            'bg-[#00C7D1]/20 text-[#00C7D1]'
                          }`}>
                            {txn.type}
                          </span>
                        </div>
                      </div>
                    ))}
                  {transactions.filter(t => t.userId === selectedWithdrawal.userId).length === 0 && (
                    <p className="text-[#94a3b8] text-sm text-center py-4">No transaction history found</p>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-[#334155]">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[#94a3b8]">Total Deposits</p>
                      <p className="text-[#10b981] font-semibold">
                        ${transactions.filter(t => t.userId === selectedWithdrawal.userId && t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#94a3b8]">Total Withdrawals</p>
                      <p className="text-[#ef4444] font-semibold">
                        ${transactions.filter(t => t.userId === selectedWithdrawal.userId && t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Admin Password / 2FA (Required)</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                  placeholder="Enter password or 2FA code"
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#334155] flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowWithdrawalModal(false);
                  setAdminPassword('');
                }}
                className="bg-[#334155] hover:bg-[#475569] text-[#f8fafc] px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowWithdrawalRejectConfirm(true)}
                className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-2 rounded-lg transition-colors"
              >
                Reject
              </button>
              <button
                onClick={() => setShowWithdrawalApproveConfirm(true)}
                className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg transition-colors"
              >
                Approve & Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Approve Confirmation Modal */}
      {showWithdrawalApproveConfirm && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1e293b] rounded-xl max-w-md w-full border border-[#10b981]">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#10b981]/20 rounded-full flex items-center justify-center text-2xl">
                  ✓
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#f8fafc]">Approve Withdrawal</h2>
                  <p className="text-[#94a3b8] text-sm">Confirm withdrawal processing</p>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-lg p-4 mb-6 border border-[#334155]">
                <p className="text-[#f8fafc] mb-3">
                  Are you sure you want to approve and process this withdrawal?
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">User:</span>
                    <span className="text-[#f8fafc] font-semibold">{selectedWithdrawal.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Amount:</span>
                    <span className="text-[#ef4444] font-semibold">${selectedWithdrawal.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Method:</span>
                    <span className="text-[#f8fafc]">{selectedWithdrawal.method}</span>
                  </div>
                </div>
                <p className="text-[#10b981] text-sm mt-3">
                  ✓ This will process the payment and update the user's balance immediately.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWithdrawalApproveConfirm(false)}
                  className="flex-1 bg-[#334155] hover:bg-[#475569] text-[#f8fafc] px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleApproveWithdrawal(selectedWithdrawal.id);
                    setShowWithdrawalApproveConfirm(false);
                  }}
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Reject Confirmation Modal */}
      {showWithdrawalRejectConfirm && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1e293b] rounded-xl max-w-md w-full border border-[#ef4444]">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#ef4444]/20 rounded-full flex items-center justify-center text-2xl">
                  ⚠️
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#f8fafc]">Reject Withdrawal</h2>
                  <p className="text-[#94a3b8] text-sm">Confirm withdrawal rejection</p>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-lg p-4 mb-4 border border-[#334155]">
                <p className="text-[#f8fafc] mb-3">
                  Are you sure you want to reject this withdrawal request?
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">User:</span>
                    <span className="text-[#f8fafc] font-semibold">{selectedWithdrawal.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Amount:</span>
                    <span className="text-[#ef4444] font-semibold">${selectedWithdrawal.amount.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-[#ef4444] text-sm mt-3">
                  Warning: The user will be notified and the funds will remain in their account.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-[#94a3b8] text-sm mb-2">Rejection Reason (Optional)</label>
                <textarea
                  placeholder="Enter reason for rejection..."
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#ef4444]"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowWithdrawalRejectConfirm(false)}
                  className="flex-1 bg-[#334155] hover:bg-[#475569] text-[#f8fafc] px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.error(`Withdrawal ${selectedWithdrawal.id} rejected`);
                    setShowWithdrawalRejectConfirm(false);
                    setShowWithdrawalModal(false);
                    setAdminPassword('');
                  }}
                  className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Approve Confirmation Modal */}
      {showApproveConfirm && selectedDeposit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1e293b] rounded-xl max-w-md w-full border border-[#10b981]">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#10b981]/20 rounded-full flex items-center justify-center text-2xl">
                  ✓
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#f8fafc]">Approve Deposit</h2>
                  <p className="text-[#94a3b8] text-sm">Confirm deposit approval</p>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-lg p-4 mb-6 border border-[#334155]">
                <p className="text-[#f8fafc] mb-3">
                  Are you sure you want to approve this deposit?
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">User:</span>
                    <span className="text-[#f8fafc] font-semibold">{selectedDeposit.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Amount:</span>
                    <span className="text-[#10b981] font-semibold">${selectedDeposit.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Method:</span>
                    <span className="text-[#f8fafc]">{selectedDeposit.method}</span>
                  </div>
                </div>
                <p className="text-[#10b981] text-sm mt-3">
                  ✓ This will credit the amount to the user's wallet immediately.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowApproveConfirm(false)}
                  className="flex-1 bg-[#334155] hover:bg-[#475569] text-[#f8fafc] px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleApproveDeposit(selectedDeposit.id);
                    setShowApproveConfirm(false);
                  }}
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Reject Confirmation Modal */}
      {showRejectConfirm && selectedDeposit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1e293b] rounded-xl max-w-md w-full border border-[#ef4444]">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#ef4444]/20 rounded-full flex items-center justify-center text-2xl">
                  ⚠️
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#f8fafc]">Reject Deposit</h2>
                  <p className="text-[#94a3b8] text-sm">Confirm deposit rejection</p>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-lg p-4 mb-4 border border-[#334155]">
                <p className="text-[#f8fafc] mb-3">
                  Are you sure you want to reject this deposit?
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">User:</span>
                    <span className="text-[#f8fafc] font-semibold">{selectedDeposit.userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Amount:</span>
                    <span className="text-[#ef4444] font-semibold">${selectedDeposit.amount.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-[#ef4444] text-sm mt-3">
                  Warning: The user will be notified about this rejection.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-[#94a3b8] text-sm mb-2">Rejection Reason (Required)</label>
                <textarea
                  placeholder="Enter reason for rejection..."
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#ef4444]"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectConfirm(false)}
                  className="flex-1 bg-[#334155] hover:bg-[#475569] text-[#f8fafc] px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleRejectDeposit(selectedDeposit.id, 'Invalid proof');
                    setShowRejectConfirm(false);
                  }}
                  className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialManagement;
