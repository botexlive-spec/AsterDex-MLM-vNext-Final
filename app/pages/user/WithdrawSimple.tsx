import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { Button, Card, Input } from '../../components/ui/DesignSystem';
import { get, post } from '../../utils/httpClient';

type CryptoType = 'USDT' | 'USDC' | 'BTC' | 'ETH';
type NetworkType = 'ERC20' | 'TRC20' | 'BEP20';

export default function WithdrawSimple() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [crypto, setCrypto] = useState<CryptoType>('USDT');
  const [network, setNetwork] = useState<NetworkType>('TRC20');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(0);
  const [minWithdrawal, setMinWithdrawal] = useState(50);
  const [deductionPercent, setDeductionPercent] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoadingData(true);

      // Fetch balance
      const balanceRes = await get('/api/wallet-simple/balance');
      const availableBalance = Number(balanceRes?.available || 0);
      setBalance(availableBalance);

      // Fetch limits
      const limitsRes = await get('/api/wallet-simple/withdrawal/limits');
      setMinWithdrawal(Number(limitsRes?.minimum_withdrawal || 10));
      setDeductionPercent(Number(limitsRes?.deduction_percentage || 0));

    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load withdrawal data');
      setBalance(0);
      setMinWithdrawal(10);
      setDeductionPercent(0);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (numAmount < minWithdrawal) {
      toast.error(`Minimum withdrawal is $${minWithdrawal.toFixed(2)}`);
      return;
    }

    if (numAmount > balance) {
      toast.error(`Insufficient balance. Available: $${balance.toFixed(2)}`);
      return;
    }

    if (!walletAddress.trim()) {
      toast.error('Please enter wallet address');
      return;
    }

    try {
      setLoading(true);
      const response = await post('/api/wallet-simple/withdrawal', {
        amount: numAmount,
        wallet_address: walletAddress,
        network: network
      });

      if (response?.success) {
        toast.success(response.message || 'Withdrawal request submitted!');
        setAmount('');
        setWalletAddress('');
        await loadData();
      } else {
        toast.error(response?.message || 'Withdrawal failed');
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.message || 'Failed to submit withdrawal');
    } finally {
      setLoading(false);
    }
  };

  const calculateFinal = () => {
    const numAmount = Number(amount || 0);
    const deduction = (numAmount * deductionPercent) / 100;
    const final = numAmount - deduction;
    return { deduction, final };
  };

  const { deduction, final } = calculateFinal();

  if (loadingData) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto">
        <div className="text-center text-[#94a3b8] py-20">
          <div className="w-12 h-12 border-4 border-[#8b5cf6] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          Loading...
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
        <p className="text-[#94a3b8]">Request withdrawal from your wallet</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdrawal Form */}
        <div className="lg:col-span-2">
          <Card className="bg-[#1e293b] p-6">
            <h2 className="text-xl font-bold text-[#f8fafc] mb-6">Withdrawal Request</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Balance Display */}
              <div className="bg-[#0f172a] p-4 rounded-lg">
                <p className="text-[#94a3b8] text-sm mb-1">Available Balance</p>
                <p className="text-3xl font-bold text-[#10b981]">${balance.toFixed(2)}</p>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-[#f8fafc] font-medium mb-2">
                  Withdrawal Amount
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min={minWithdrawal}
                  max={balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Minimum: $${minWithdrawal.toFixed(2)}`}
                  className="w-full"
                  required
                />
                <p className="text-[#64748b] text-sm mt-1">
                  Min: ${minWithdrawal.toFixed(2)} | Max: ${balance.toFixed(2)}
                </p>
              </div>

              {/* Cryptocurrency and Network Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#f8fafc] mb-2">
                    Cryptocurrency
                  </label>
                  <select
                    value={crypto}
                    onChange={(e) => setCrypto(e.target.value as CryptoType)}
                    className="w-full px-4 py-3 bg-[#334155] border border-[#475569] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                  >
                    <option value="USDT">USDT (Tether)</option>
                    <option value="USDC">USDC</option>
                    <option value="BTC">Bitcoin</option>
                    <option value="ETH">Ethereum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#f8fafc] mb-2">
                    Network
                  </label>
                  <select
                    value={network}
                    onChange={(e) => setNetwork(e.target.value as NetworkType)}
                    className="w-full px-4 py-3 bg-[#334155] border border-[#475569] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20"
                  >
                    <option value="ERC20">ERC20 (Ethereum)</option>
                    <option value="TRC20">TRC20 (TRON)</option>
                    <option value="BEP20">BEP20 (BSC)</option>
                  </select>
                </div>
              </div>

              {/* Wallet Address */}
              <div>
                <label className="block text-[#f8fafc] font-medium mb-2">
                  Wallet Address
                </label>
                <Input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter your wallet address"
                  className="w-full"
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:opacity-90"
                size="lg"
              >
                {loading ? 'Processing...' : 'Submit Withdrawal Request'}
              </Button>
            </form>
          </Card>
        </div>

        {/* Summary Card */}
        <div>
          <Card className="bg-[#1e293b] p-6">
            <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Withdrawal Summary</h3>

            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-[#334155]">
                <span className="text-[#94a3b8]">Requested Amount</span>
                <span className="text-[#f8fafc] font-bold">
                  ${Number(amount || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between py-2 border-b border-[#334155]">
                <span className="text-[#94a3b8]">Deduction ({deductionPercent}%)</span>
                <span className="text-[#ef4444] font-bold">
                  -${deduction.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between py-3 bg-[#0f172a] rounded-lg px-3">
                <span className="text-[#f8fafc] font-bold">You Will Receive</span>
                <span className="text-[#10b981] text-xl font-bold">
                  ${final.toFixed(2)}
                </span>
              </div>

              <div className="mt-6 p-4 bg-[#0f172a] rounded-lg">
                <h4 className="text-[#f8fafc] font-medium mb-2">Important Notes:</h4>
                <ul className="text-[#94a3b8] text-sm space-y-1 list-disc list-inside">
                  <li>Minimum withdrawal: ${minWithdrawal.toFixed(2)}</li>
                  <li>Deduction rate: {deductionPercent}%</li>
                  <li>Processing time: 24-48 hours</li>
                  <li>Requests are reviewed by admin</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
