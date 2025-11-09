import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { Button, Card, Badge, Input } from '../../components/ui/DesignSystem';
import { get, post } from '../../utils/httpClient';

type WithdrawalType = 'roi' | 'principal' | 'commission' | 'bonus';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  withdrawal_type: WithdrawalType;
  requested_amount: number;
  deduction_percentage: number;
  deduction_amount: number;
  final_amount: number;
  wallet_address?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  rejection_reason?: string;
  days_held?: number;
  investment_date?: string;
  created_at: string;
}

export const WithdrawalApproval: React.FC = () => {
  const { isAdmin } = useAuth();
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReasonModal, setRejectionReasonModal] = useState<{
    show: boolean;
    withdrawalId: string;
    reason: string;
  }>({ show: false, withdrawalId: '', reason: '' });
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    if (isAdmin) {
      fetchWithdrawals();
    }
  }, [isAdmin]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const data = await get<WithdrawalRequest[]>('/api/wallet/withdrawals/pending');
      setWithdrawals(data);
    } catch (error: any) {
      console.error('Failed to fetch withdrawals:', error);
      toast.error(error.message || 'Failed to load withdrawal requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId: string) => {
    if (!confirm('Are you sure you want to approve this withdrawal?')) {
      return;
    }

    try {
      setProcessingId(withdrawalId);
      const response = await post<{ success: boolean; message: string }>(
        `/api/wallet/withdrawals/${withdrawalId}/approve`,
        {}
      );

      if (response.success) {
        toast.success('Withdrawal approved successfully!');
        fetchWithdrawals(); // Reload list
      } else {
        toast.error(response.message || 'Failed to approve withdrawal');
      }
    } catch (error: any) {
      console.error('Approval error:', error);
      toast.error(error.message || 'Failed to approve withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (withdrawalId: string) => {
    setRejectionReasonModal({
      show: true,
      withdrawalId,
      reason: ''
    });
  };

  const confirmReject = async () => {
    const { withdrawalId, reason } = rejectionReasonModal;

    if (!reason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessingId(withdrawalId);
      const response = await post<{ success: boolean; message: string }>(
        `/api/wallet/withdrawals/${withdrawalId}/reject`,
        { reason: reason.trim() }
      );

      if (response.success) {
        toast.success('Withdrawal rejected');
        setRejectionReasonModal({ show: false, withdrawalId: '', reason: '' });
        fetchWithdrawals(); // Reload list
      } else {
        toast.error(response.message || 'Failed to reject withdrawal');
      }
    } catch (error: any) {
      console.error('Rejection error:', error);
      toast.error(error.message || 'Failed to reject withdrawal');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: WithdrawalRequest['status']) => {
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
      roi: 'ROI',
      principal: 'Principal',
      commission: 'Commission',
      bonus: 'Bonus'
    };
    return labels[type];
  };

  const filteredWithdrawals = withdrawals.filter(w =>
    filter === 'all' ? true : w.status === filter
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto">
        <div className="text-center text-red-400 py-20">
          Access denied. Admin privileges required.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Withdrawal Approval</h1>
        <p className="text-[#94a3b8]">Review and approve/reject user withdrawal requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-yellow-600 to-yellow-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Pending</p>
              <p className="text-2xl font-bold text-white">
                {withdrawals.filter(w => w.status === 'pending').length}
              </p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Approved</p>
              <p className="text-2xl font-bold text-white">
                {withdrawals.filter(w => w.status === 'approved' || w.status === 'completed').length}
              </p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-red-600 to-red-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-white">
                {withdrawals.filter(w => w.status === 'rejected').length}
              </p>
            </div>
            <div className="text-4xl">❌</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-600 to-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Total Amount</p>
              <p className="text-2xl font-bold text-white">
                ${withdrawals.reduce((sum, w) => sum + w.final_amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card className="bg-[#1e293b] mb-6">
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchWithdrawals}
            className="ml-auto"
          >
            🔄 Refresh
          </Button>
        </div>
      </Card>

      {/* Withdrawals Table */}
      <Card className="bg-[#1e293b]">
        <h3 className="text-xl font-bold text-[#f8fafc] mb-6">Withdrawal Requests</h3>

        {loading ? (
          <div className="text-center text-[#94a3b8] py-10">Loading...</div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="text-center text-[#94a3b8] py-10">
            No {filter !== 'all' && filter} withdrawal requests
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">User</th>
                  <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Type</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Requested</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Deduction</th>
                  <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Final</th>
                  <th className="text-center py-3 px-4 text-[#94a3b8] font-medium">Status</th>
                  <th className="text-center py-3 px-4 text-[#94a3b8] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b border-[#334155] hover:bg-[#334155]/30">
                    <td className="py-3 px-4 text-[#f8fafc] text-sm">
                      {new Date(withdrawal.created_at).toLocaleString()}
                      {withdrawal.days_held !== undefined && (
                        <div className="text-xs text-[#94a3b8]">
                          Held: {withdrawal.days_held} days
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#f8fafc]">
                      <div>{withdrawal.user_name || 'Unknown'}</div>
                      <div className="text-xs text-[#94a3b8]">{withdrawal.user_email || withdrawal.user_id}</div>
                    </td>
                    <td className="py-3 px-4 text-[#f8fafc]">
                      <Badge variant={withdrawal.withdrawal_type === 'principal' ? 'warning' : 'info'}>
                        {getTypeLabel(withdrawal.withdrawal_type)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right text-[#f8fafc]">
                      ${withdrawal.requested_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-400">
                      {withdrawal.deduction_percentage > 0 ? (
                        <>
                          ${withdrawal.deduction_amount.toFixed(2)}
                          <div className="text-xs">({withdrawal.deduction_percentage}%)</div>
                        </>
                      ) : (
                        '$0.00'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right text-green-400 font-bold">
                      ${withdrawal.final_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(withdrawal.status)}
                    </td>
                    <td className="py-3 px-4">
                      {withdrawal.status === 'pending' && (
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApprove(withdrawal.id)}
                            disabled={processingId === withdrawal.id}
                          >
                            {processingId === withdrawal.id ? '...' : '✓ Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleReject(withdrawal.id)}
                            disabled={processingId === withdrawal.id}
                          >
                            ✗ Reject
                          </Button>
                        </div>
                      )}
                      {withdrawal.status === 'rejected' && withdrawal.rejection_reason && (
                        <div className="text-xs text-red-400 text-center">
                          {withdrawal.rejection_reason}
                        </div>
                      )}
                      {withdrawal.wallet_address && (
                        <div className="text-xs text-[#94a3b8] text-center mt-1">
                          {withdrawal.wallet_address.substring(0, 10)}...
                          {withdrawal.wallet_address.substring(withdrawal.wallet_address.length - 8)}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Rejection Reason Modal */}
      {rejectionReasonModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-[#1e293b] max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-[#f8fafc] mb-4">Reject Withdrawal</h3>
            <p className="text-[#94a3b8] mb-4">
              Please provide a reason for rejecting this withdrawal request:
            </p>
            <textarea
              value={rejectionReasonModal.reason}
              onChange={(e) => setRejectionReasonModal(prev => ({ ...prev, reason: e.target.value }))}
              className="w-full p-3 bg-[#0f172a] border border-[#475569] rounded-lg text-[#f8fafc] mb-4"
              rows={4}
              placeholder="e.g., Insufficient documentation, Invalid wallet address, etc."
            />
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={confirmReject}
                disabled={!rejectionReasonModal.reason.trim() || processingId !== null}
                className="flex-1"
              >
                {processingId ? 'Processing...' : 'Confirm Rejection'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setRejectionReasonModal({ show: false, withdrawalId: '', reason: '' })}
                disabled={processingId !== null}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
