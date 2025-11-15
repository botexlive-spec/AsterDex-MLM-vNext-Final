import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Button, Card, Input, Alert, Badge } from '../../components/ui/DesignSystem';
import { Modal } from '../../components/ui/Modal';
import apiClient from '../../utils/api-client';

type WithdrawMethod = 'crypto' | 'bank' | 'paypal';
type CryptoType = 'USDT' | 'USDC' | 'BTC' | 'ETH';
type NetworkType = 'ERC20' | 'TRC20' | 'BEP20';

interface SavedWallet {
  id: string;
  type: 'crypto' | 'bank' | 'paypal';
  label: string;
  crypto?: CryptoType;
  network?: NetworkType;
  address?: string;
  bankName?: string;
  accountNumber?: string;
  paypalEmail?: string;
  isDefault: boolean;
}

interface WithdrawRequest {
  id: string;
  date: Date;
  amount: number;
  fee: number;
  netAmount: number;
  method: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed';
  destination: string;
}

interface WithdrawalSettings {
  minWithdraw: number;
  withdrawFeePercent: number;
  cryptoEnabled: boolean;
  bankEnabled: boolean;
  paypalEnabled: boolean;
}

export const Withdraw: React.FC = () => {
  const navigate = useNavigate();

  // Loading states
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isLoadingKYC, setIsLoadingKYC] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Data states
  const [walletBalance, setWalletBalance] = useState(0);
  const [kycVerified, setKycVerified] = useState(false);
  const [settings, setSettings] = useState<WithdrawalSettings>({
    minWithdraw: 50,
    withdrawFeePercent: 2,
    cryptoEnabled: true,
    bankEnabled: true,
    paypalEnabled: true
  });
  const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([]);
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);

  // Form state
  const [method, setMethod] = useState<WithdrawMethod>('crypto');
  const [amount, setAmount] = useState('');
  const [crypto, setCrypto] = useState<CryptoType>('USDT');
  const [network, setNetwork] = useState<NetworkType>('ERC20');
  const [walletAddress, setWalletAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<string>('');
  const [twoFACode, setTwoFACode] = useState('');

  // UI state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [requestId, setRequestId] = useState('');

  // Load data on mount
  useEffect(() => {
    loadBalance();
    loadKYCStatus();
    loadSettings();
    loadWithdrawalHistory();
  }, []);

  // Load wallets when method changes
  useEffect(() => {
    loadSavedWallets();
  }, [method]);

  const loadBalance = async () => {
    try {
      setIsLoadingBalance(true);
      const response = await apiClient.get<{ success: boolean; data: { balance: number } }>('/user/withdrawals/balance');
      if (response.data.success) {
        setWalletBalance(response.data.data.balance);
      }
    } catch (error: any) {
      console.error('Error loading balance:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load wallet balance');
      }
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const loadKYCStatus = async () => {
    try {
      setIsLoadingKYC(true);
      const response = await apiClient.get<{ success: boolean; data: { kycVerified: boolean } }>('/user/withdrawals/kyc-status');
      if (response.data.success) {
        setKycVerified(response.data.data.kycVerified);
      }
    } catch (error: any) {
      console.error('Error loading KYC status:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load KYC status');
      }
    } finally {
      setIsLoadingKYC(false);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await apiClient.get<{ success: boolean; data: WithdrawalSettings }>('/user/withdrawals/settings');
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading withdrawal settings:', error);
      toast.error('Failed to load withdrawal settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadSavedWallets = async () => {
    try {
      setIsLoadingWallets(true);
      const response = await apiClient.get<{ success: boolean; data: SavedWallet[] }>(`/user/withdrawals/saved-wallets?type=${method}`);
      if (response.data.success) {
        setSavedWallets(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading saved wallets:', error);
      setSavedWallets([]);
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const loadWithdrawalHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await apiClient.get<{ success: boolean; data: any[] }>('/user/withdrawals/history?limit=10');
      if (response.data.success) {
        const formattedRequests = response.data.data.map((req: any) => ({
          id: req.id,
          date: new Date(req.date),
          amount: parseFloat(req.amount),
          fee: parseFloat(req.fee),
          netAmount: parseFloat(req.netAmount),
          method: req.method,
          status: req.status,
          destination: req.destination
        }));
        setRequests(formattedRequests);
      }
    } catch (error: any) {
      console.error('Error loading withdrawal history:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load withdrawal history');
      }
      setRequests([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Validation & calculations
  const minWithdraw = settings.minWithdraw;
  const maxWithdraw = walletBalance;
  const withdrawFeePercent = settings.withdrawFeePercent;

  const numAmount = parseFloat(amount || '0');
  const fee = (numAmount * withdrawFeePercent) / 100;
  const netAmount = numAmount - fee;

  const isValidAmount = amount && numAmount >= minWithdraw && numAmount <= maxWithdraw;
  const canWithdraw = kycVerified && isValidAmount;

  const filteredWallets = useMemo(() => {
    return savedWallets.filter((w) => w.type === method);
  }, [savedWallets, method]);

  const handleSelectWallet = (walletId: string) => {
    const wallet = savedWallets.find((w) => w.id === walletId);
    if (!wallet) return;

    setSelectedWallet(walletId);

    if (wallet.type === 'crypto' && wallet.address && wallet.crypto && wallet.network) {
      setWalletAddress(wallet.address);
      setCrypto(wallet.crypto);
      setNetwork(wallet.network);
    } else if (wallet.type === 'bank' && wallet.bankName && wallet.accountNumber) {
      setBankName(wallet.bankName);
      setAccountNumber(wallet.accountNumber);
    } else if (wallet.type === 'paypal' && wallet.paypalEmail) {
      setPaypalEmail(wallet.paypalEmail);
    }
  };

  const handleWithdraw = () => {
    if (!canWithdraw) {
      if (!kycVerified) {
        toast.error('KYC verification required for withdrawals');
        return;
      }
      toast.error(`Please enter amount between $${minWithdraw} and $${maxWithdraw.toLocaleString()}`);
      return;
    }

    // Validate destination
    if (method === 'crypto' && !walletAddress) {
      toast.error('Please enter wallet address');
      return;
    }
    if (method === 'bank' && (!bankName || !accountNumber)) {
      toast.error('Please enter bank details');
      return;
    }
    if (method === 'paypal' && !paypalEmail) {
      toast.error('Please enter PayPal email');
      return;
    }

    setShowConfirmModal(true);
  };

  const confirmWithdraw = () => {
    setShowConfirmModal(false);
    setShow2FAModal(true);
  };

  const submit2FA = async () => {
    if (!twoFACode || twoFACode.length !== 6) {
      toast.error('Please enter a valid 6-digit 2FA code');
      return;
    }

    setShow2FAModal(false);
    setIsProcessing(true);

    try {
      const response = await apiClient.post('/user/withdrawals/create', {
        amount: numAmount,
        method,
        crypto: method === 'crypto' ? crypto : undefined,
        network: method === 'crypto' ? network : undefined,
        walletAddress: method === 'crypto' ? walletAddress : undefined,
        bankName: method === 'bank' ? bankName : undefined,
        accountNumber: method === 'bank' ? accountNumber : undefined,
        routingNumber: method === 'bank' ? routingNumber : undefined,
        paypalEmail: method === 'paypal' ? paypalEmail : undefined,
        twoFACode
      });

      if (response.data.success) {
        toast.success('Withdrawal request submitted successfully!');
        setRequestId(response.data.data.requestId);
        setShowSuccessModal(true);
        setAmount('');
        setWalletAddress('');
        setBankName('');
        setAccountNumber('');
        setRoutingNumber('');
        setPaypalEmail('');
        setTwoFACode('');

        // Reload data
        loadBalance();
        loadWithdrawalHistory();
      }
    } catch (error: any) {
      console.error('Error creating withdrawal:', error);
      toast.error(error.response?.data?.error || 'Failed to process withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: WithdrawRequest['status']) => {
    const variants = {
      completed: 'success',
      processing: 'info',
      pending: 'warning',
      cancelled: 'secondary',
      failed: 'danger',
    } as const;
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  if (isLoadingSettings || isLoadingBalance || isLoadingKYC) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-[#94a3b8]">Loading withdrawal settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      <Button variant="secondary" onClick={() => navigate('/wallet')} className="mb-5">
        ← Back to Wallet
      </Button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Withdraw Funds</h1>
        <p className="text-[#94a3b8]">Request withdrawal from your wallet</p>
      </div>

      {/* KYC Warning */}
      {!kycVerified && (
        <Alert variant="warning" className="mb-6">
          <strong>⚠️ KYC Verification Required</strong>
          <p className="mt-2">You must complete KYC verification before making withdrawals.</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/kyc')} className="mt-3">
            Complete KYC Now
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Withdrawal Form */}
        <div className="lg:col-span-2">
          {/* Available Balance Card */}
          <Card className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-[#334155] mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#94a3b8] text-sm mb-1">Available Balance</p>
                <h2 className="text-4xl font-bold text-[#f8fafc]">${walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              </div>
              <div className="text-5xl">💰</div>
            </div>
          </Card>

          <Card className="bg-[#1e293b] mb-6">
            <h3 className="text-xl font-bold text-[#f8fafc] mb-6">Withdrawal Details</h3>

            {/* Withdrawal Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#f8fafc] mb-3">Select Withdrawal Method</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'crypto' as const, icon: '🪙', label: 'Crypto', enabled: settings.cryptoEnabled },
                  { value: 'bank' as const, icon: '🏦', label: 'Bank', enabled: settings.bankEnabled },
                  { value: 'paypal' as const, icon: '💳', label: 'PayPal', enabled: settings.paypalEnabled },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMethod(m.value)}
                    disabled={!m.enabled}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !m.enabled
                        ? 'opacity-50 cursor-not-allowed border-[#475569] bg-[#334155] text-[#64748b]'
                        : method === m.value
                        ? 'border-[#00C7D1] bg-[#00C7D1]/10 text-[#00C7D1]'
                        : 'border-[#475569] bg-[#334155] text-[#cbd5e1] hover:border-[#00C7D1]/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{m.icon}</div>
                    <div className="text-sm font-medium">{m.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Wallets */}
            {filteredWallets.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#f8fafc] mb-3">Or Select Saved Wallet</label>
                <div className="space-y-2">
                  {filteredWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleSelectWallet(wallet.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedWallet === wallet.id
                          ? 'border-[#00C7D1] bg-[#00C7D1]/10'
                          : 'border-[#475569] bg-[#334155] hover:border-[#00C7D1]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[#f8fafc] font-medium">{wallet.label}</p>
                          <p className="text-[#94a3b8] text-sm mt-1">
                            {wallet.type === 'crypto' && `${wallet.crypto} (${wallet.network})`}
                            {wallet.type === 'bank' && wallet.bankName}
                            {wallet.type === 'paypal' && wallet.paypalEmail}
                          </p>
                        </div>
                        {wallet.isDefault && <Badge variant="success">Default</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="mb-6">
              <Input
                label="Withdrawal Amount (USD) *"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min: $${minWithdraw} | Max: $${maxWithdraw.toLocaleString()}`}
                className="text-lg"
                disabled={!kycVerified}
              />
              {amount && !isValidAmount && (
                <p className="text-[#ef4444] text-sm mt-2">
                  Amount must be between ${minWithdraw} and ${maxWithdraw.toLocaleString()}
                </p>
              )}

              {/* Fee Calculation */}
              {amount && isValidAmount && (
                <Card className="bg-[#334155] mt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#94a3b8]">Withdrawal Amount:</span>
                      <span className="text-[#f8fafc] font-bold">${numAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94a3b8]">Processing Fee ({withdrawFeePercent}%):</span>
                      <span className="text-[#ef4444] font-bold">-${fee.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-[#475569] flex justify-between">
                      <span className="text-[#f8fafc] font-bold">You Will Receive:</span>
                      <span className="text-[#10b981] font-bold text-lg">${netAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Method-specific fields */}
            {method === 'crypto' && (
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#f8fafc] mb-2">Cryptocurrency</label>
                    <select
                      value={crypto}
                      onChange={(e) => setCrypto(e.target.value as CryptoType)}
                      className="w-full px-4 py-3 bg-[#334155] border border-[#475569] rounded-lg text-[#f8fafc]"
                      disabled={!kycVerified}
                    >
                      <option value="USDT">USDT (Tether)</option>
                      <option value="USDC">USDC</option>
                      <option value="BTC">Bitcoin</option>
                      <option value="ETH">Ethereum</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#f8fafc] mb-2">Network</label>
                    <select
                      value={network}
                      onChange={(e) => setNetwork(e.target.value as NetworkType)}
                      className="w-full px-4 py-3 bg-[#334155] border border-[#475569] rounded-lg text-[#f8fafc]"
                      disabled={!kycVerified}
                    >
                      <option value="ERC20">ERC20 (Ethereum)</option>
                      <option value="TRC20">TRC20 (TRON)</option>
                      <option value="BEP20">BEP20 (BSC)</option>
                    </select>
                  </div>
                </div>
                <Input
                  label="Wallet Address *"
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter your wallet address"
                  disabled={!kycVerified}
                />
                <Alert variant="warning">
                  <strong>⚠️ Important:</strong> Double-check your wallet address. Wrong address = permanent loss of funds.
                </Alert>
              </div>
            )}

            {method === 'bank' && (
              <div className="space-y-4 mb-6">
                <Input
                  label="Bank Name *"
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                  disabled={!kycVerified}
                />
                <Input
                  label="Account Number *"
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter account number"
                  disabled={!kycVerified}
                />
                <Input
                  label="Routing Number"
                  type="text"
                  value={routingNumber}
                  onChange={(e) => setRoutingNumber(e.target.value)}
                  placeholder="Enter routing number (optional)"
                  disabled={!kycVerified}
                />
                <Alert variant="info">
                  Bank transfers take 3-5 business days to process.
                </Alert>
              </div>
            )}

            {method === 'paypal' && (
              <div className="space-y-4 mb-6">
                <Input
                  label="PayPal Email *"
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="Enter PayPal email"
                  disabled={!kycVerified}
                />
                <Alert variant="info">
                  PayPal withdrawals are processed within 24 hours.
                </Alert>
              </div>
            )}

            <Button
              variant="primary"
              onClick={handleWithdraw}
              disabled={!canWithdraw || isProcessing}
              className="w-full h-14 text-lg"
            >
              {isProcessing ? 'Processing...' : `Withdraw ${amount ? `$${parseFloat(amount).toFixed(2)}` : ''}`}
            </Button>
          </Card>

          <Alert variant="info">
            <strong>ℹ️ Withdrawal Information:</strong>
            <ul className="mt-2 ml-5 list-disc text-sm">
              <li>Minimum withdrawal: ${minWithdraw}</li>
              <li>Processing fee: {withdrawFeePercent}% of withdrawal amount</li>
              <li>KYC verification required</li>
              <li>2FA authentication required for security</li>
            </ul>
          </Alert>
        </div>

        {/* Sidebar - Recent Withdrawals */}
        <div>
          <Card className="bg-[#1e293b]">
            <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Recent Withdrawals</h3>
            {isLoadingHistory ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-[#94a3b8] text-sm">Loading history...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.length > 0 ? (
                  requests.map((req) => (
                    <div key={req.id} className="p-3 bg-[#334155] rounded-lg border border-[#475569]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#f8fafc] font-medium">{req.method}</span>
                        {getStatusBadge(req.status)}
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#94a3b8]">Amount:</span>
                        <span className="text-[#ef4444] font-bold">${req.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#94a3b8]">You Receive:</span>
                        <span className="text-[#10b981] font-bold">${req.netAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#94a3b8]">Date:</span>
                        <span className="text-[#cbd5e1] text-xs">
                          {req.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#94a3b8]">
                    <div className="text-4xl mb-2">📤</div>
                    <p className="text-sm">No withdrawals yet</p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Withdrawal">
        <div className="space-y-4">
          <Alert variant="warning">
            Please verify your withdrawal details before confirming.
          </Alert>

          <div className="p-4 bg-[#1e293b] rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Withdrawal Amount:</span>
              <span className="text-[#f8fafc] font-bold text-lg">${numAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Method:</span>
              <span className="text-[#f8fafc] font-medium">
                {method === 'crypto' && `${crypto} (${network})`}
                {method === 'bank' && 'Bank Transfer'}
                {method === 'paypal' && 'PayPal'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Processing Fee ({withdrawFeePercent}%):</span>
              <span className="text-[#ef4444] font-medium">-${fee.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-[#475569] flex justify-between">
              <span className="text-[#f8fafc] font-bold">You Will Receive:</span>
              <span className="text-[#10b981] font-bold text-xl">${netAmount.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="success" onClick={confirmWithdraw} className="flex-1">
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2FA Modal */}
      <Modal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} title="Two-Factor Authentication">
        <div className="space-y-4">
          <Alert variant="info">
            Enter your 6-digit 2FA code to authorize this withdrawal.
          </Alert>

          <Input
            label="2FA Code *"
            type="text"
            value={twoFACode}
            onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            maxLength={6}
            className="text-center text-2xl tracking-widest"
          />

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShow2FAModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="primary" onClick={submit2FA} disabled={isProcessing} className="flex-1">
              {isProcessing ? 'Processing...' : 'Submit'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Withdrawal Request Submitted">
        <div className="text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h3 className="text-2xl font-bold text-[#10b981]">Success!</h3>
          <p className="text-[#cbd5e1]">Your withdrawal request has been submitted successfully.</p>

          <Card className="bg-[#334155] text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Request ID:</span>
                <span className="text-[#00C7D1] font-mono font-bold">{requestId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Amount:</span>
                <span className="text-[#f8fafc] font-bold">${numAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Fee:</span>
                <span className="text-[#ef4444]">-${fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">You Receive:</span>
                <span className="text-[#10b981] font-bold">${netAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Status:</span>
                <Badge variant="warning">PENDING</Badge>
              </div>
            </div>
          </Card>

          <Alert variant="info" className="text-left">
            <strong>What's next?</strong>
            <ul className="mt-2 ml-5 list-disc text-sm">
              <li>Your request will be reviewed within 24 hours</li>
              <li>You'll receive email notifications on status updates</li>
              <li>Funds will be sent once approved</li>
            </ul>
          </Alert>

          <Button variant="primary" onClick={() => setShowSuccessModal(false)} className="w-full">
            Done
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Withdraw;
