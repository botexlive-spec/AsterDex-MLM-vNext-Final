import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';
import { Button, Card, Input, Alert, Badge } from '../../components/ui/DesignSystem';
import { Modal } from '../../components/ui/Modal';
import apiClient from '../../utils/api-client';

type PaymentMethod = 'crypto' | 'bank' | 'upi' | 'card';
type CryptoType = 'USDT' | 'USDC' | 'BTC' | 'ETH';
type NetworkType = 'ERC20' | 'TRC20' | 'BEP20';

interface Transaction {
  id: string;
  date: Date;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  txHash?: string;
}

interface DepositStats {
  totalDeposits: number;
  pendingDeposits: number;
  thisMonth: number;
}

interface DepositSettings {
  minDeposit: number;
  maxDeposit: number;
  depositFeePercent: number;
  cryptoEnabled: boolean;
  bankEnabled: boolean;
  upiEnabled: boolean;
  cardEnabled: boolean;
}

interface BankDetails {
  accountName: string;
  accountNumber: string;
  routingNumber: string;
  bankName: string;
  swiftCode: string;
}

export const Deposit: React.FC = () => {
  const navigate = useNavigate();

  // Loading states
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingBankDetails, setIsLoadingBankDetails] = useState(false);

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<DepositStats>({
    totalDeposits: 0,
    pendingDeposits: 0,
    thisMonth: 0
  });
  const [settings, setSettings] = useState<DepositSettings>({
    minDeposit: 10,
    maxDeposit: 50000,
    depositFeePercent: 1.5,
    cryptoEnabled: true,
    bankEnabled: true,
    upiEnabled: true,
    cardEnabled: true
  });
  const [depositAddress, setDepositAddress] = useState('');
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    accountName: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
    swiftCode: ''
  });

  // Form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('crypto');
  const [amount, setAmount] = useState('');
  const [crypto, setCrypto] = useState<CryptoType>('USDT');
  const [network, setNetwork] = useState<NetworkType>('ERC20');
  const [showDepositAddress, setShowDepositAddress] = useState(true);

  // UI state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Load data on mount
  useEffect(() => {
    loadDepositHistory();
    loadDepositStats();
    loadDepositSettings();
  }, []);

  // Load deposit address when network changes
  useEffect(() => {
    if (paymentMethod === 'crypto' && showDepositAddress) {
      loadDepositAddress();
    }
  }, [network, paymentMethod, showDepositAddress]);

  // Load bank details when payment method changes to bank
  useEffect(() => {
    if (paymentMethod === 'bank') {
      loadBankDetails();
    }
  }, [paymentMethod]);

  const loadDepositHistory = async () => {
    try {
      setIsLoadingTransactions(true);
      const response = await apiClient.get<{ success: boolean; data: any[] }>('/user/deposits/history?limit=10');
      if (response?.data?.success && response.data.data) {
        const formattedTransactions = response.data.data.map((tx: any) => ({
          id: tx.id,
          date: new Date(tx.date),
          amount: parseFloat(tx.amount),
          method: tx.method,
          status: tx.status,
          txHash: tx.txHash
        }));
        setTransactions(formattedTransactions);
      } else {
        setTransactions([]);
      }
    } catch (error: any) {
      console.error('Error loading deposit history:', error);
      // Don't show error toast if it's just an auth issue or empty data
      if (error.response?.status !== 401) {
        console.warn('Deposit history unavailable');
      }
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const loadDepositStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await apiClient.get<{ success: boolean; data: DepositStats }>('/user/deposits/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading deposit stats:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load deposit statistics');
      }
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadDepositSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await apiClient.get<{ success: boolean; data: DepositSettings }>('/user/deposits/settings');
      if (response.data.success) {
        setSettings(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading deposit settings:', error);
      toast.error('Failed to load deposit settings');
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const loadDepositAddress = async () => {
    try {
      setIsLoadingAddress(true);
      const response = await apiClient.get<{ success: boolean; data: { address: string } }>(`/user/deposits/addresses?network=${network}`);
      if (response.data.success) {
        setDepositAddress(response.data.data.address);
      }
    } catch (error: any) {
      console.error('Error loading deposit address:', error);
      toast.error('Failed to load deposit address');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const loadBankDetails = async () => {
    try {
      setIsLoadingBankDetails(true);
      const response = await apiClient.get<{ success: boolean; data: BankDetails }>('/user/deposits/bank-details');
      if (response.data.success) {
        setBankDetails(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading bank details:', error);
      toast.error('Failed to load bank details');
    } finally {
      setIsLoadingBankDetails(false);
    }
  };

  // Validation & Fee Calculation
  const minDeposit = settings.minDeposit;
  const maxDeposit = settings.maxDeposit;
  const depositFeePercent = settings.depositFeePercent;

  const numAmount = parseFloat(amount || '0');
  const fee = (numAmount * depositFeePercent) / 100;
  const totalToDeposit = numAmount + fee;

  const isValidAmount = amount && numAmount >= minDeposit && numAmount <= maxDeposit;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    toast.success('Address copied to clipboard!');
  };

  const handleDeposit = () => {
    if (!isValidAmount) {
      toast.error(`Please enter amount between $${minDeposit} and $${maxDeposit.toLocaleString()}`);
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmDeposit = async () => {
    setShowConfirmModal(false);
    setIsProcessing(true);

    try {
      const response = await apiClient.post('/user/deposits/create', {
        amount: numAmount,
        paymentMethod,
        crypto: paymentMethod === 'crypto' ? crypto : undefined,
        network: paymentMethod === 'crypto' ? network : undefined
      });

      if (response.data.success) {
        toast.success('Deposit request submitted successfully!');
        setTransactionId(response.data.data.transactionId);
        setShowSuccessModal(true);
        setAmount('');

        // Reload data
        loadDepositHistory();
        loadDepositStats();
      }
    } catch (error: any) {
      console.error('Error creating deposit:', error);
      toast.error(error.response?.data?.error || 'Failed to process deposit');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger',
    } as const;
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <p className="text-[#94a3b8]">Loading deposit settings...</p>
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
        <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Deposit Funds</h1>
        <p className="text-[#94a3b8]">Add funds to your wallet securely</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Deposit Form */}
        <div className="lg:col-span-2">
          <Card className="bg-[#1e293b] mb-6">
            <h3 className="text-xl font-bold text-[#f8fafc] mb-6">Deposit Details</h3>

            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#f8fafc] mb-3">Select Payment Method</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'crypto' as const, icon: '🪙', label: 'Crypto', enabled: settings.cryptoEnabled },
                  { value: 'bank' as const, icon: '🏦', label: 'Bank', enabled: settings.bankEnabled },
                  { value: 'upi' as const, icon: '💳', label: 'UPI', enabled: settings.upiEnabled },
                  { value: 'card' as const, icon: '💵', label: 'Card', enabled: settings.cardEnabled },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => {
                      setPaymentMethod(method.value);
                      setShowDepositAddress(false); // Reset when changing payment method
                    }}
                    disabled={!method.enabled}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !method.enabled
                        ? 'opacity-50 cursor-not-allowed border-[#475569] bg-[#334155] text-[#64748b]'
                        : paymentMethod === method.value
                        ? 'border-[#00C7D1] bg-[#00C7D1]/10 text-[#00C7D1]'
                        : 'border-[#475569] bg-[#334155] text-[#cbd5e1] hover:border-[#00C7D1]/50'
                    }`}
                  >
                    <div className="text-2xl mb-1">{method.icon}</div>
                    <div className="text-sm font-medium">{method.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <Input
                label="Deposit Amount (USD) *"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Min: $${minDeposit} | Max: $${maxDeposit.toLocaleString()}`}
                className="text-lg"
              />
              {amount && !isValidAmount && (
                <p className="text-[#ef4444] text-sm mt-2">
                  Amount must be between ${minDeposit} and ${maxDeposit.toLocaleString()}
                </p>
              )}

              {/* Real-time Fee Calculation */}
              {amount && isValidAmount && (
                <Card className="bg-[#334155] mt-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#94a3b8]">Deposit Amount:</span>
                      <span className="text-[#f8fafc] font-bold">${numAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94a3b8]">Processing Fee ({depositFeePercent}%):</span>
                      <span className="text-[#f59e0b] font-bold">+${fee.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-[#475569] flex justify-between">
                      <span className="text-[#f8fafc] font-bold">Total to Deposit:</span>
                      <span className="text-[#10b981] font-bold text-lg">${totalToDeposit.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Crypto-specific fields */}
            {paymentMethod === 'crypto' && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-[#f8fafc] mb-2">Cryptocurrency</label>
                    <select
                      value={crypto}
                      onChange={(e) => {
                        setCrypto(e.target.value as CryptoType);
                        setShowDepositAddress(true);
                      }}
                      className="w-full px-4 py-3 bg-[#334155] border border-[#475569] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20"
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
                      onChange={(e) => {
                        setNetwork(e.target.value as NetworkType);
                        setShowDepositAddress(true);
                      }}
                      className="w-full px-4 py-3 bg-[#334155] border border-[#475569] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20"
                    >
                      <option value="ERC20">ERC20 (Ethereum)</option>
                      <option value="TRC20">TRC20 (TRON)</option>
                      <option value="BEP20">BEP20 (BSC)</option>
                    </select>
                  </div>
                </div>

                {/* Generate Address Button */}
                {!showDepositAddress && (
                  <Button
                    variant="primary"
                    onClick={() => setShowDepositAddress(true)}
                    className="w-full mb-6"
                  >
                    Generate Deposit Address
                  </Button>
                )}

                {/* Deposit Address & QR Code - Show only after selection */}
                {showDepositAddress && (
                  <Card className="bg-[#334155] mb-6">
                    {isLoadingAddress ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">⏳</div>
                        <p className="text-[#94a3b8]">Loading deposit address...</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <h4 className="text-[#f8fafc] font-bold mb-4">Deposit Address</h4>

                        {/* QR Code */}
                        <div className="flex justify-center mb-4">
                          <div className="bg-white p-4 rounded-lg">
                            <QRCodeSVG value={depositAddress} size={200} level="H" includeMargin={true} />
                          </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-center gap-2 p-3 bg-[#1e293b] rounded-lg border border-[#475569]">
                          <code className="flex-1 text-[#00C7D1] text-sm font-mono break-all text-left">
                            {depositAddress}
                          </code>
                          <Button variant="outline" size="sm" onClick={handleCopyAddress}>
                            📋 Copy
                          </Button>
                        </div>

                        <Alert variant="warning" className="mt-4 text-left">
                          <strong>⚠️ Important:</strong>
                          <ul className="mt-2 ml-5 list-disc text-sm">
                            <li>Send only {crypto} on {network} network to this address</li>
                            <li>Minimum deposit: ${minDeposit} USD</li>
                            <li>Deposits are credited after 3 network confirmations</li>
                            <li>Wrong network = permanent loss of funds</li>
                          </ul>
                        </Alert>
                      </div>
                    )}
                  </Card>
                )}
              </>
            )}

            {/* Bank Transfer */}
            {paymentMethod === 'bank' && (
              <Card className="bg-[#334155] mb-6">
                {isLoadingBankDetails ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-[#94a3b8]">Loading bank details...</p>
                  </div>
                ) : (
                  <>
                    <h4 className="text-[#f8fafc] font-bold mb-4">Bank Transfer Details</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg">
                        <span className="text-[#94a3b8]">Account Name:</span>
                        <span className="text-[#f8fafc] font-medium">{bankDetails.accountName}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg">
                        <span className="text-[#94a3b8]">Account Number:</span>
                        <span className="text-[#f8fafc] font-medium">{bankDetails.accountNumber}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg">
                        <span className="text-[#94a3b8]">Routing Number:</span>
                        <span className="text-[#f8fafc] font-medium">{bankDetails.routingNumber}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg">
                        <span className="text-[#94a3b8]">Bank Name:</span>
                        <span className="text-[#f8fafc] font-medium">{bankDetails.bankName}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg">
                        <span className="text-[#94a3b8]">SWIFT Code:</span>
                        <span className="text-[#f8fafc] font-medium">{bankDetails.swiftCode}</span>
                      </div>
                    </div>
                    <Alert variant="info" className="mt-4">
                      <strong>ℹ️ Note:</strong> Bank transfers take 1-3 business days. Please include your User ID in the transfer reference.
                    </Alert>
                  </>
                )}
              </Card>
            )}

            {/* UPI */}
            {paymentMethod === 'upi' && (
              <Card className="bg-[#334155] mb-6">
                <div className="text-center">
                  <h4 className="text-[#f8fafc] font-bold mb-4">UPI Payment</h4>

                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-4 rounded-lg">
                      <QRCodeSVG value="upi://pay?pa=finaster@paytm&pn=Finaster&cu=INR" size={200} level="H" includeMargin={true} />
                    </div>
                  </div>

                  <div className="p-4 bg-[#1e293b] rounded-lg border border-[#475569] mb-4">
                    <p className="text-[#00C7D1] text-xl font-bold">finaster@paytm</p>
                  </div>

                  <Alert variant="info">
                    Scan QR code or use UPI ID above. Payments are instant!
                  </Alert>
                </div>
              </Card>
            )}

            {/* Submit Button */}
            <Button
              variant="primary"
              onClick={handleDeposit}
              disabled={!isValidAmount || isProcessing}
              className="w-full h-14 text-lg"
            >
              {isProcessing ? 'Processing...' : `Proceed to Deposit ${amount ? `$${parseFloat(amount).toFixed(2)}` : ''}`}
            </Button>
          </Card>

          {/* Deposit Information */}
          <Alert variant="info">
            <strong>ℹ️ Deposit Information:</strong>
            <ul className="mt-2 ml-5 list-disc text-sm">
              <li>Minimum deposit: ${minDeposit}</li>
              <li>Maximum deposit: ${maxDeposit.toLocaleString()}</li>
              <li>Processing time: Instant for crypto, 1-3 days for bank</li>
              <li>Processing fee: {depositFeePercent}% of deposit amount</li>
              <li>Funds credited automatically after confirmation</li>
            </ul>
          </Alert>
        </div>

        {/* Sidebar - Recent Deposits */}
        <div>
          <Card className="bg-[#1e293b]">
            <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Recent Deposits</h3>
            {isLoadingTransactions ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-[#94a3b8] text-sm">Loading transactions...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.length > 0 ? (
                  transactions.map((tx) => (
                    <div key={tx.id} className="p-3 bg-[#334155] rounded-lg border border-[#475569]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[#f8fafc] font-medium">{tx.method}</span>
                        {getStatusBadge(tx.status)}
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#94a3b8]">Amount:</span>
                        <span className="text-[#10b981] font-bold">${tx.amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#94a3b8]">ID:</span>
                        <span className="text-[#cbd5e1] font-mono text-xs">{tx.id}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#94a3b8]">Date:</span>
                        <span className="text-[#cbd5e1] text-xs">
                          {tx.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      {tx.txHash && (
                        <div className="mt-2 pt-2 border-t border-[#475569]">
                          <span className="text-xs text-[#94a3b8]">TX: {tx.txHash}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[#94a3b8]">
                    <div className="text-4xl mb-2">📥</div>
                    <p className="text-sm">No deposits yet</p>
                  </div>
                )}
              </div>
            )}

            <Button variant="outline" onClick={() => navigate('/transactions')} className="w-full mt-4">
              View All Transactions
            </Button>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-[#1e293b] mt-6">
            <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Quick Stats</h3>
            {isLoadingStats ? (
              <div className="text-center py-4">
                <div className="text-2xl mb-2">⏳</div>
                <p className="text-[#94a3b8] text-sm">Loading stats...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Total Deposits:</span>
                  <span className="text-[#f8fafc] font-bold">${Number(stats.totalDeposits || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">This Month:</span>
                  <span className="text-[#10b981] font-bold">${Number(stats.thisMonth || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Pending:</span>
                  <span className="text-[#f59e0b] font-bold">${Number(stats.pendingDeposits || 0).toFixed(2)}</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Deposit">
        <div className="space-y-4">
          <Alert variant="warning">
            Please verify your deposit details before confirming.
          </Alert>

          <div className="p-4 bg-[#1e293b] rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Deposit Amount:</span>
              <span className="text-[#f8fafc] font-bold text-lg">${numAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Method:</span>
              <span className="text-[#f8fafc] font-medium">
                {paymentMethod === 'crypto' && `${crypto} (${network})`}
                {paymentMethod === 'bank' && 'Bank Transfer'}
                {paymentMethod === 'upi' && 'UPI Payment'}
                {paymentMethod === 'card' && 'Credit/Debit Card'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Processing Fee ({depositFeePercent}%):</span>
              <span className="text-[#f59e0b] font-medium">+${fee.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-[#475569] flex justify-between">
              <span className="text-[#f8fafc] font-bold">Total to Deposit:</span>
              <span className="text-[#00C7D1] font-bold text-xl">${totalToDeposit.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button variant="success" onClick={confirmDeposit} className="flex-1">
              Confirm Deposit
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Deposit Request Submitted">
        <div className="text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h3 className="text-2xl font-bold text-[#10b981]">Success!</h3>
          <p className="text-[#cbd5e1]">Your deposit request has been submitted successfully.</p>

          <Card className="bg-[#334155] text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Transaction ID:</span>
                <span className="text-[#00C7D1] font-mono font-bold">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Deposit Amount:</span>
                <span className="text-[#f8fafc] font-bold">${numAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Processing Fee:</span>
                <span className="text-[#f59e0b]">+${fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Total Amount:</span>
                <span className="text-[#f8fafc] font-bold">${totalToDeposit.toFixed(2)}</span>
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
              <li>Your deposit will be processed within a few minutes</li>
              <li>You'll receive a notification once confirmed</li>
              <li>Check transaction status in your wallet</li>
            </ul>
          </Alert>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowSuccessModal(false)} className="flex-1">
              Close
            </Button>
            <Button variant="primary" onClick={() => {
              setShowSuccessModal(false);
              navigate('/transactions');
            }} className="flex-1">
              View Transactions
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Deposit;
