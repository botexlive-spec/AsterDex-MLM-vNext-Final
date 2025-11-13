import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { Button, Card, Input, Alert, Badge } from '../../components/ui/DesignSystem';
import { get, post } from '../../utils/httpClient';

type WithdrawalType = 'roi' | 'principal' | 'commission' | 'bonus';

interface WithdrawalLimits {
  minimum_withdrawal: number;
  deduction_before_30_days: number;
  deduction_after_30_days: number;
}

interface WithdrawalRecord {
  id: string;
  withdrawal_type: WithdrawalType;
  requested_amount: number;
  deduction_percentage: number;
  deduction_amount: number;
  final_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  rejection_reason?: string;
  days_held?: number;
  created_at: string;
}

interface WalletBalance {
  total: number;
  available: number;
  locked: number;
  pending: number;
}

// Helper function to safely convert values to numbers
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Helper function to safely extract and convert limits data
const parseLimitsData = (data: any): WithdrawalLimits => {
  return {
    minimum_withdrawal: toNumber(data?.minimum_withdrawal ?? 50),
    deduction_before_30_days: toNumber(data?.deduction_before_30_days ?? 15),
    deduction_after_30_days: toNumber(data?.deduction_after_30_days ?? 5),
  };
};

// Helper function to safely extract and convert balance data
const parseBalanceData = (data: any): WalletBalance => {
  return {
    total: toNumber(data?.total ?? 0),
    available: toNumber(data?.available ?? 0),
    locked: toNumber(data?.locked ?? 0),
    pending: toNumber(data?.pending ?? 0),
  };
};

// Helper function to safely extract withdrawals array
const parseWithdrawalsData = (data: any): WithdrawalRecord[] => {
  const withdrawals = Array.isArray(data) ? data : (data?.withdrawals || []);
  return withdrawals.map((w: any) => ({
    id: String(w.id || ''),
    withdrawal_type: w.withdrawal_type || 'roi',
    requested_amount: toNumber(w.requested_amount),
    deduction_percentage: toNumber(w.deduction_percentage),
    deduction_amount: toNumber(w.deduction_amount),
    final_amount: toNumber(w.final_amount),
    status: w.status || 'pending',
    rejection_reason: w.rejection_reason,
    days_held: toNumber(w.days_held),
    created_at: w.created_at || new Date().toISOString(),
  }));
};

export const WithdrawNew: React.FC = () => {
  const { user } = useAuth();

  // State
  const [withdrawalType, setWithdrawalType] = useState<WithdrawalType>('roi');
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [limits, setLimits] = useState<WithdrawalLimits | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Fetch wallet balance and limits
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingData(true);
        const [balanceResponse, limitsResponse, withdrawalsResponse] = await Promise.all([
          get<any>('/api/wallet-simple/balance'),
          get<any>('/api/wallet-simple/withdrawal/limits'),
          get<any>('/api/wallet-simple/withdrawals')
        ]);

        // Parse and set data with type safety
        setBalance(parseBalanceData(balanceResponse));
        setLimits(parseLimitsData(limitsResponse));
        setWithdrawals(parseWithdrawalsData(withdrawalsResponse));
      } catch (error: any) {
        console.error('Failed to load withdrawal data:', error);
        toast.error(error.message || 'Failed to load data');

        // Set defaults on error
        setBalance({ total: 0, available: 0, locked: 0, pending: 0 });
        setLimits({ minimum_withdrawal: 50, deduction_before_30_days: 15, deduction_after_30_days: 5 });
        setWithdrawals([]);
      } finally {
        setLoadingData(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  // Calculate deduction
  const calculateDeduction = () => {
    const numAmount = parseFloat(amount || '0');
    if (!numAmount || !limits) return { deduction: 0, final: 0, percentage: 0 };

    if (withdrawalType === 'principal') {
      // For principal, show estimated deduction (actual is calculated on backend)
      const percentage = limits.deduction_before_30_days; // Show max deduction
      const deduction = (numAmount * percentage) / 100;
      return { deduction, final: numAmount - deduction, percentage };
    }

    // No deduction for ROI, commission, bonus
    return { deduction: 0, final: numAmount, percentage: 0 };
  };

  const { deduction, final, percentage } = calculateDeduction();

  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!balance || !limits) {
      toast.error('Loading wallet data...');
      return;
    }

    const numAmount = parseFloat(amount || '0');

    // Validation
    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (numAmount < limits.minimum_withdrawal) {
      toast.error(`Minimum withdrawal is $${limits.minimum_withdrawal.toFixed(2)}`);
      return;
    }

    if (numAmount > balance.available) {
      toast.error(`Insufficient balance. Available: $${balance.available.toFixed(2)}`);
      return;
    }

    if (!walletAddress.trim()) {
      toast.error('Please enter wallet address');
      return;
    }

    try {
      setLoading(true);
      const response = await post<{ success: boolean; withdrawal_id?: string; message: string }>(
        '/api/wallet-simple/withdrawal',
        {
          amount: numAmount,
          withdrawal_type: withdrawalType,
          wallet_address: walletAddress
        }
      );

      if (response.success) {
        toast.success(response.message || 'Withdrawal request submitted!');

        // Reset form
        setAmount('');
        setWalletAddress('');

        // Reload data
        const [newBalanceResponse, newWithdrawalsResponse] = await Promise.all([
          get<any>('/api/wallet-simple/balance'),
          get<any>('/api/wallet-simple/withdrawals')
        ]);

        setBalance(parseBalanceData(newBalanceResponse));
        setWithdrawals(parseWithdrawalsData(newWithdrawalsResponse));
      } else {
        toast.error(response.message || 'Withdrawal failed');
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Failed to submit withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: WithdrawalRecord['status']) => {
    const variants = {
      pending: 'warning',
      approved: 'info',
      completed: 'success',
      rejected: 'danger',
    } as const;
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  const getTypeLabel = (type: WithdrawalType) => {
    const labels = {
      roi: 'ROI Earnings',
      principal: 'Principal Amount',
      commission: 'Commission Earnings',
      bonus: 'Bonus Earnings'
    };
    return labels[type];
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto">
        <div className="text-center text-[#94a3b8] py-20">
          Loading withdrawal data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Withdraw Funds</h1>
        <p className="text-[#94a3b8]">Request withdrawal with automatic deduction calculation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdrawal Form */}
        <div className="lg:col-span-2">
          <Card className="bg-[#1e293b] mb-6">
            <h3 className="text-xl font-bold text-[#f8fafc] mb-6">New Withdrawal Request</h3>

            {/* Balance Display */}
            {balance && (
              <Card className="bg-gradient-to-br from-[#10b981] to-[#059669] mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm mb-1">Available Balance</p>
                    <p className="text-3xl font-bold text-white">${balance.available.toFixed(2)}</p>
                  </div>
                  <div className="text-5xl">💰</div>
                </div>
                {balance.locked > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-white/70 text-sm">Locked: ${balance.locked.toFixed(2)}</p>
                  </div>
                )}
              </Card>
            )}

            {/* Withdrawal Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#f8fafc] mb-3">Withdrawal Type</label>
              <div className="grid grid-cols-2 gap-3">
                {(['roi', 'principal', 'commission', 'bonus'] as WithdrawalType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setWithdrawalType(type)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      withdrawalType === type
                        ? 'border-[#8b5cf6] bg-[#8b5cf6]/10'
                        : 'border-[#475569] hover:border-[#64748b]'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-[#f8fafc] font-medium">{getTypeLabel(type)}</div>
                      {type === 'principal' && limits && (
                        <div className="text-xs text-[#94a3b8] mt-1">
                          {limits.deduction_before_30_days.toFixed(0)}% deduction if &lt;30 days
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#f8fafc] mb-2">Amount</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={limits ? `Min: $${limits.minimum_withdrawal.toFixed(2)}` : "Enter amount"}
                className="w-full"
                step="0.01"
              />
              {limits && (
                <p className="text-sm text-[#94a3b8] mt-1">
                  Minimum: ${limits.minimum_withdrawal.toFixed(2)}
                </p>
              )}
            </div>

            {/* Wallet Address */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#f8fafc] mb-2">Wallet Address</label>
              <Input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x... or wallet address"
                className="w-full"
              />
            </div>

            {/* Deduction Info */}
            {withdrawalType === 'principal' && amount && parseFloat(amount) > 0 && (
              <Alert variant="warning" className="mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Requested Amount:</span>
                    <span className="font-bold">${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-400">
                    <span>Deduction ({percentage.toFixed(0)}%):</span>
                    <span className="font-bold">- ${deduction.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-yellow-600/30 pt-2">
                    <span className="font-bold">Final Amount:</span>
                    <span className="font-bold text-green-400">${final.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-yellow-200/80 mt-2">
                    Note: Actual deduction depends on your investment date.
                    15% if held &lt;30 days, 5% if &gt;=30 days.
                  </p>
                </div>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleWithdraw}
              disabled={loading || !amount || !walletAddress}
              className="w-full"
              size="lg"
            >
              {loading ? 'Processing...' : 'Submit Withdrawal Request'}
            </Button>
          </Card>
        </div>

        {/* Sidebar - Info */}
        <div>
          <Card className="bg-[#1e293b] mb-6">
            <h4 className="text-lg font-bold text-[#f8fafc] mb-4">Withdrawal Info</h4>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-[#94a3b8]">Processing Time</p>
                <p className="text-[#f8fafc] font-medium">1-3 business days</p>
              </div>
              <div>
                <p className="text-[#94a3b8]">Min. Withdrawal</p>
                <p className="text-[#f8fafc] font-medium">${limits?.minimum_withdrawal.toFixed(2) || '50.00'}</p>
              </div>
              <div>
                <p className="text-[#94a3b8]">Principal Deduction</p>
                <p className="text-[#f8fafc] font-medium">
                  {limits && `${limits.deduction_before_30_days.toFixed(0)}% (<30 days)`}<br />
                  {limits && `${limits.deduction_after_30_days.toFixed(0)}% (>=30 days)`}
                </p>
              </div>
            </div>
          </Card>

          <Card className="bg-[#1e293b]">
            <h4 className="text-lg font-bold text-[#f8fafc] mb-4">Important Notes</h4>
            <ul className="space-y-2 text-sm text-[#94a3b8]">
              <li>✓ ROI, Commission, Bonus: No deduction</li>
              <li>✓ Principal: Time-based deduction applies</li>
              <li>✓ All requests require admin approval</li>
              <li>✓ Funds locked until approval</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Withdrawal History */}
      <Card className="bg-[#1e293b] mt-6">
        <h3 className="text-xl font-bold text-[#f8fafc] mb-6">Withdrawal History</h3>

        {withdrawals.length === 0 ? (
          <div className="text-center text-[#94a3b8] py-10">
            No withdrawal requests yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Type</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Requested</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Deduction</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Final Amount</th>
                  <th className="text-center py-3 px-4 text-[#94a3b8] font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-[#334155] hover:bg-[#334155]/30">
                    <td className="py-3 px-4 text-[#f8fafc]">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-[#f8fafc]">{getTypeLabel(withdrawal.withdrawal_type)}</td>
                    <td className="py-3 px-4 text-right text-[#f8fafc]">
                      ${withdrawal.requested_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-400">
                      {withdrawal.deduction_percentage > 0 ? (
                        <>-${withdrawal.deduction_amount.toFixed(2)} ({withdrawal.deduction_percentage.toFixed(0)}%)</>
                      ) : (
                        '$0.00'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-green-400 font-medium">
                      ${withdrawal.final_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(withdrawal.status)}
                      {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                        <div className="text-xs text-red-400 mt-1">{withdrawal.rejection_reason}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
