import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Card, Button } from '../../components/ui/DesignSystem';
import { get } from '../../utils/httpClient';

export default function WalletSimple() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState({ total: 0, available: 0, locked: 0, pending: 0 });
  const [pendingTx, setPendingTx] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);

      const [balanceData, pendingData, recentData] = await Promise.all([
        get('/api/wallet-simple/balance'),
        get('/api/wallet-simple/transactions/pending'),
        get('/api/wallet-simple/transactions?limit=10')
      ]);

      setBalance(balanceData);
      setPendingTx(Array.isArray(pendingData) ? pendingData : []);
      setRecentTx(Array.isArray(recentData) ? recentData : []);
    } catch (error: any) {
      console.error('Failed to load wallet:', error);
      toast.error(error.message || 'Failed to load wallet data');

      // Set defaults
      setBalance({ total: 0, available: 0, locked: 0, pending: 0 });
      setPendingTx([]);
      setRecentTx([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto">
        <div className="text-center text-[#94a3b8] py-20">
          <div className="w-12 h-12 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Loading wallet...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">My Wallet</h1>
        <p className="text-[#94a3b8]">Manage your funds and transactions</p>
      </div>

      {/* Balance Card */}
      <Card className="bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] mb-6 p-8">
        <div className="text-center">
          <p className="text-white/80 text-sm mb-2">Total Balance</p>
          <h2 className="text-5xl font-bold text-white mb-6">${balance.total.toFixed(2)}</h2>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/70 text-xs mb-1">Available</p>
              <p className="text-white text-xl font-bold">${balance.available.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/70 text-xs mb-1">Locked</p>
              <p className="text-white text-xl font-bold">${balance.locked.toFixed(2)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <p className="text-white/70 text-xs mb-1">Pending</p>
              <p className="text-white text-xl font-bold">${balance.pending.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Button
          onClick={() => navigate('/wallet/deposit')}
          className="bg-gradient-to-r from-[#10b981] to-[#059669] hover:opacity-90 text-white py-6"
          size="lg"
        >
          <div className="text-center">
            <div className="text-2xl mb-1">↓</div>
            <div>Deposit</div>
          </div>
        </Button>

        <Button
          onClick={() => navigate('/wallet/withdraw')}
          className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] hover:opacity-90 text-white py-6"
          size="lg"
        >
          <div className="text-center">
            <div className="text-2xl mb-1">↑</div>
            <div>Withdraw</div>
          </div>
        </Button>

        <Button
          onClick={() => navigate('/wallet/transfer')}
          className="bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:opacity-90 text-white py-6"
          size="lg"
        >
          <div className="text-center">
            <div className="text-2xl mb-1">⇄</div>
            <div>Transfer</div>
          </div>
        </Button>
      </div>

      {/* Pending Transactions */}
      {pendingTx.length > 0 && (
        <Card className="bg-[#1e293b] mb-6">
          <h3 className="text-xl font-bold text-[#f8fafc] mb-4">Pending Transactions</h3>
          <div className="space-y-3">
            {pendingTx.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-[#0f172a] rounded-lg">
                <div>
                  <p className="text-[#f8fafc] font-medium capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                  <p className="text-[#94a3b8] text-sm">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-[#f59e0b] font-bold">${tx.amount.toFixed(2)}</p>
                  <p className="text-[#f59e0b] text-sm uppercase">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card className="bg-[#1e293b]">
        <h3 className="text-xl font-bold text-[#f8fafc] mb-4">Recent Transactions</h3>

        {recentTx.length === 0 ? (
          <div className="text-center text-[#94a3b8] py-10">
            No transactions yet
          </div>
        ) : (
          <div className="space-y-2">
            {recentTx.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-[#0f172a] rounded-lg hover:bg-[#0f172a]/70">
                <div className="flex-1">
                  <p className="text-[#f8fafc] font-medium capitalize">{tx.transaction_type.replace('_', ' ')}</p>
                  <p className="text-[#94a3b8] text-sm">{tx.description || 'No description'}</p>
                  <p className="text-[#64748b] text-xs">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right ml-4">
                  <p className={`font-bold ${tx.amount >= 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {tx.amount >= 0 ? '+' : ''} ${tx.amount.toFixed(2)}
                  </p>
                  <p className={`text-xs uppercase ${
                    tx.status === 'completed' ? 'text-[#10b981]' :
                    tx.status === 'pending' ? 'text-[#f59e0b]' :
                    'text-[#ef4444]'
                  }`}>
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
