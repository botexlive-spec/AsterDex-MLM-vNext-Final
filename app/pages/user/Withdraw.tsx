import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { Button, Card, Input, Alert, Badge } from '../../components/ui/DesignSystem';
import { Modal } from '../../components/ui/Modal';

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

export const Withdraw: React.FC = () => {
  const navigate = useNavigate();

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

  // Mock data
  const walletBalance = 5000;
  const kycVerified = true;

  const savedWallets: SavedWallet[] = [
    {
      id: '1',
      type: 'crypto',
      label: 'Main Wallet',
      crypto: 'USDT',
      network: 'ERC20',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbF',
      isDefault: true,
    },
    {
      id: '2',
      type: 'bank',
      label: 'Chase Bank',
      bankName: 'Chase Bank',
      accountNumber: '****1234',
      isDefault: false,
    },
  ];

  const [requests] = useState<WithdrawRequest[]>([
    { id: 'WDR001', date: new Date(Date.now() - 86400000), amount: 500, fee: 10, netAmount: 490, method: 'USDT (ERC20)', status: 'completed', destination: '0xabcd...1234' },
    { id: 'WDR002', date: new Date(Date.now() - 172800000), amount: 1000, fee: 20, netAmount: 980, method: 'Bank Transfer', status: 'processing', destination: 'Chase Bank ****1234' },
    { id: 'WDR003', date: new Date(Date.now() - 259200000), amount: 250, fee: 5, netAmount: 245, method: 'PayPal', status: 'pending', destination: 'user@email.com' },
  ]);

  // Validation & calculations
  const minWithdraw = 50;
  const maxWithdraw = walletBalance;
  const withdrawFeePercent = 2;

  const numAmount = parseFloat(amount || '0');
  const fee = (numAmount * withdrawFeePercent) / 100;
  const netAmount = numAmount - fee;

  const isValidAmount = amount && numAmount >= minWithdraw && numAmount <= maxWithdraw;
  const canWithdraw = kycVerified && isValidAmount;

  const filteredWallets = useMemo(() => {
    return savedWallets.filter((w) => w.type === method);
  }, [method]);

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

  const verify2FA = () => {
    if (!twoFACode || twoFACode.length !== 6) {
      toast.error('Please enter valid 6-digit 2FA code');
      return;
    }

    setShow2FAModal(false);
    setIsProcessing(true);

    // Simulate withdrawal processing
    const promise = new Promise((resolve) => setTimeout(resolve, 3000));

    toast.promise(promise, {
      loading: 'Processing withdrawal request...',
      success: 'Withdrawal request submitted successfully!',
      error: 'Failed to process withdrawal',
    });

    promise.then(() => {
      setIsProcessing(false);
      const reqId = 'WDR' + Math.random().toString(36).substring(2, 9).toUpperCase();
      setRequestId(reqId);
      setShowSuccessModal(true);
      setAmount('');
      setWalletAddress('');
      setTwoFACode('');
    });
  };

  const getStatusBadge = (status: WithdrawRequest['status']) => {
    const variants = {
      pending: 'warning',
      processing: 'info',
      completed: 'success',
      cancelled: 'danger',
      failed: 'danger',
    } as const;
    return <Badge variant={variants[status]}>{status.toUpperCase()}</Badge>;
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      <Button variant="secondary" onClick={() => navigate('/wallet')} className="mb-5">
        ← Back to Wallet
      </Button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Withdraw Funds</h1>
        <p className="text-[#94a3b8]">Withdraw funds from your wallet securely</p>
      </div>

      {/* KYC Alert */}
      {!kycVerified && (
        <Alert variant="danger" className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <strong>⚠️ KYC Verification Required</strong>
              <p className="text-sm mt-1">You must complete KYC verification before making withdrawals.</p>
            </div>
            <Button variant="danger" size="sm" onClick={() => navigate('/kyc')}>
              Complete KYC
            </Button>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Withdraw Form */}
        <div className="lg:col-span-2">
          <Card className="bg-[#1e293b] mb-6">
            <h3 className="text-xl font-bold text-[#f8fafc] mb-6">Withdrawal Details</h3>

            {/* Balance Display */}
            <Card className="bg-gradient-to-br from-[#10b981] to-[#059669] mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm mb-1">Available Balance</p>
                  <p className="text-3xl font-bold text-white">${walletBalance.toLocaleString()}</p>
                </div>
                <div className="text-5xl">💰</div>
              </div>
            </Card>

            {/* Withdrawal Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#f8fafc] mb-3">Withdrawal Method</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'crypto' as const, icon: '🪙', label: 'Crypto' },
                  { value: 'bank' as const, icon: '🏦', label: 'Bank' },
                  { value: 'paypal' as const, icon: '💳', label: 'PayPal' },
                ].map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setMethod(m.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      method === m.value
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

            {/* Saved Wallets/Accounts */}
            {filteredWallets.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#f8fafc] mb-3">Saved Accounts</label>
                <div className="grid grid-cols-1 gap-3">
                  {filteredWallets.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleSelectWallet(wallet.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        selectedWallet === wallet.id
                          ? 'border-[#00C7D1] bg-[#00C7D1]/10'
                          : 'border-[#475569] bg-[#334155] hover:border-[#00C7D1]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[#f8fafc] font-medium">{wallet.label}</span>
                            {wallet.isDefault && <Badge variant="info">DEFAULT</Badge>}
                          </div>
                          <p className="text-sm text-[#94a3b8]">
                            {wallet.type === 'crypto' && `${wallet.crypto} (${wallet.network})`}
                            {wallet.type === 'bank' && `${wallet.bankName} ${wallet.accountNumber}`}
                            {wallet.type === 'paypal' && wallet.label}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Crypto Withdrawal Fields */}
            {method === 'crypto' && (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-[#f8fafc] mb-2">Cryptocurrency</label>
                    <select
                      value={crypto}
                      onChange={(e) => setCrypto(e.target.value as CryptoType)}
                      className="w-full px-4 py-3 bg-[#334155] border border-[#475569] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20"
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
                      className="w-full px-4 py-3 bg-[#334155] border border-[#475569] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#00C7D1] focus:ring-2 focus:ring-[#00C7D1]/20"
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
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter your wallet address"
                  className="font-mono text-sm mb-6"
                  disabled={!kycVerified}
                />

                <Alert variant="warning">
                  <strong>⚠️ Important:</strong>
                  <ul className="mt-2 ml-5 list-disc text-sm">
                    <li>Double-check wallet address and network</li>
                    <li>Wrong address or network = permanent loss of funds</li>
                    <li>Minimum withdrawal: ${minWithdraw}</li>
                    <li>Processing time: 24-48 hours</li>
                  </ul>
                </Alert>
              </>
            )}

            {/* Bank Withdrawal Fields */}
            {method === 'bank' && (
              <>
                <div className="space-y-4 mb-6">
                  <Input
                    label="Bank Name *"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Enter bank name"
                    disabled={!kycVerified}
                  />
                  <Input
                    label="Account Number *"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    disabled={!kycVerified}
                  />
                  <Input
                    label="Routing Number"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="Enter routing number"
                    disabled={!kycVerified}
                  />
                </div>

                <Alert variant="info">
                  <strong>ℹ️ Bank Transfer Info:</strong>
                  <ul className="mt-2 ml-5 list-disc text-sm">
                    <li>Processing time: 3-5 business days</li>
                    <li>Fee: {withdrawFeePercent}% of withdrawal amount</li>
                    <li>Only business days are processed</li>
                  </ul>
                </Alert>
              </>
            )}

            {/* PayPal Fields */}
            {method === 'paypal' && (
              <>
                <Input
                  label="PayPal Email *"
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="Enter PayPal email"
                  className="mb-6"
                  disabled={!kycVerified}
                />

                <Alert variant="info">
                  <strong>ℹ️ PayPal Withdrawal:</strong>
                  <ul className="mt-2 ml-5 list-disc text-sm">
                    <li>Processing time: 1-2 business days</li>
                    <li>Fee: {withdrawFeePercent}% of withdrawal amount</li>
                    <li>Ensure email matches your PayPal account</li>
                  </ul>
                </Alert>
              </>
            )}

            {/* Submit Button */}
            <Button
              variant="primary"
              onClick={handleWithdraw}
              disabled={!canWithdraw || isProcessing}
              className="w-full h-14 text-lg mt-6"
            >
              {isProcessing ? 'Processing...' : `Request Withdrawal ${amount ? `$${netAmount.toFixed(2)}` : ''}`}
            </Button>
          </Card>

          {/* Withdrawal Information */}
          <Alert variant="info">
            <strong>ℹ️ Withdrawal Information:</strong>
            <ul className="mt-2 ml-5 list-disc text-sm">
              <li>Minimum withdrawal: ${minWithdraw}</li>
              <li>Maximum withdrawal: ${maxWithdraw.toLocaleString()} (your balance)</li>
              <li>Processing fee: {withdrawFeePercent}% of withdrawal amount</li>
              <li>Processing time: 24-48 hours (crypto), 3-5 days (bank)</li>
              <li>KYC verification required</li>
              <li>2FA verification required for all withdrawals</li>
            </ul>
          </Alert>
        </div>

        {/* Sidebar - Recent Withdrawals */}
        <div>
          <Card className="bg-[#1e293b]">
            <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Recent Withdrawals</h3>
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
                      <span className="text-[#ef4444] font-bold">-${req.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#94a3b8]">Fee:</span>
                      <span className="text-[#f59e0b]">-${req.fee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#94a3b8]">Net Amount:</span>
                      <span className="text-[#10b981] font-bold">${req.netAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#94a3b8]">ID:</span>
                      <span className="text-[#cbd5e1] font-mono text-xs">{req.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94a3b8]">Date:</span>
                      <span className="text-[#cbd5e1] text-xs">
                        {req.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-[#475569]">
                      <span className="text-xs text-[#94a3b8]">To: {req.destination}</span>
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

            <Button variant="outline" onClick={() => navigate('/transactions')} className="w-full mt-4">
              View All Transactions
            </Button>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-[#1e293b] mt-6">
            <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Withdrawal Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Total Withdrawn:</span>
                <span className="text-[#f8fafc] font-bold">$1,750.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">This Month:</span>
                <span className="text-[#ef4444] font-bold">$500.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Pending:</span>
                <span className="text-[#f59e0b] font-bold">$250.00</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirm Withdrawal">
        <div className="space-y-4">
          <Alert variant="warning">
            Please verify your withdrawal details carefully. This action cannot be undone.
          </Alert>

          <div className="p-4 bg-[#1e293b] rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Withdrawal Amount:</span>
              <span className="text-[#f8fafc] font-bold text-lg">${numAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#94a3b8]">Processing Fee:</span>
              <span className="text-[#ef4444] font-bold">-${fee.toFixed(2)}</span>
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
              <span className="text-[#94a3b8]">Destination:</span>
              <span className="text-[#cbd5e1] font-mono text-xs break-all">
                {method === 'crypto' && walletAddress.substring(0, 15) + '...'}
                {method === 'bank' && `${bankName} ${accountNumber}`}
                {method === 'paypal' && paypalEmail}
              </span>
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
            <Button variant="danger" onClick={confirmWithdraw} className="flex-1">
              Proceed to 2FA
            </Button>
          </div>
        </div>
      </Modal>

      {/* 2FA Verification Modal */}
      <Modal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} title="2FA Verification">
        <div className="space-y-4">
          <Alert variant="info">
            Enter the 6-digit code from your authenticator app to confirm this withdrawal.
          </Alert>

          <Input
            label="6-Digit Code *"
            type="text"
            maxLength={6}
            value={twoFACode}
            onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="text-center text-2xl tracking-widest font-mono"
          />

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => {
              setShow2FAModal(false);
              setTwoFACode('');
            }} className="flex-1">
              Cancel
            </Button>
            <Button variant="success" onClick={verify2FA} disabled={twoFACode.length !== 6} className="flex-1">
              Verify & Withdraw
            </Button>
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} title="Withdrawal Request Submitted">
        <div className="text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h3 className="text-2xl font-bold text-[#10b981]">Success!</h3>
          <p className="text-[#cbd5e1]">Your withdrawal request has been submitted and is being processed.</p>

          <Card className="bg-[#334155] text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Request ID:</span>
                <span className="text-[#00C7D1] font-mono font-bold">{requestId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Amount:</span>
                <span className="text-[#f8fafc] font-bold">${netAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Status:</span>
                <Badge variant="warning">PENDING</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Est. Processing:</span>
                <span className="text-[#f8fafc]">24-48 hours</span>
              </div>
            </div>
          </Card>

          <Alert variant="info" className="text-left">
            <strong>What's next?</strong>
            <ul className="mt-2 ml-5 list-disc text-sm">
              <li>Your request is being reviewed by our team</li>
              <li>You'll receive a notification once processed</li>
              <li>Funds will be sent to your specified destination</li>
              <li>Track status in transaction history</li>
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

export default Withdraw;
