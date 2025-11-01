import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';
import { Button, Card, Input, Alert, Badge } from '../../components/ui/DesignSystem';
import { Modal } from '../../components/ui/Modal';

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

export const Deposit: React.FC = () => {
  const navigate = useNavigate();

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

  // Mock transaction history
  const [transactions] = useState<Transaction[]>([
    { id: 'DEP001', date: new Date(Date.now() - 86400000), amount: 500, method: 'USDT (ERC20)', status: 'completed', txHash: '0xabcd...1234' },
    { id: 'DEP002', date: new Date(Date.now() - 172800000), amount: 1000, method: 'Bank Transfer', status: 'completed' },
    { id: 'DEP003', date: new Date(Date.now() - 259200000), amount: 250, method: 'USDC (TRC20)', status: 'pending', txHash: '0xefgh...5678' },
  ]);

  // Crypto addresses per network
  const cryptoAddresses: Record<NetworkType, string> = {
    ERC20: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEbF',
    TRC20: 'TXYZabcd1234567890ABCDEFGHIJKLMNOP',
    BEP20: '0xABCDEF1234567890abcdef1234567890ABCDEF12',
  };

  const depositAddress = cryptoAddresses[network];

  // Validation & Fee Calculation
  const minDeposit = 10;
  const maxDeposit = 50000;
  const depositFeePercent = 1.5; // 1.5% deposit fee

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

  const confirmDeposit = () => {
    setShowConfirmModal(false);
    setIsProcessing(true);

    // Simulate payment processing
    const promise = new Promise((resolve) => setTimeout(resolve, 3000));

    toast.promise(promise, {
      loading: 'Processing deposit...',
      success: 'Deposit request submitted successfully!',
      error: 'Failed to process deposit',
    });

    promise.then(() => {
      setIsProcessing(false);
      const txId = 'DEP' + Math.random().toString(36).substring(2, 9).toUpperCase();
      setTransactionId(txId);
      setShowSuccessModal(true);
      setAmount('');
    });
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
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
                  { value: 'crypto' as const, icon: '🪙', label: 'Crypto' },
                  { value: 'bank' as const, icon: '🏦', label: 'Bank' },
                  { value: 'upi' as const, icon: '💳', label: 'UPI' },
                  { value: 'card' as const, icon: '💵', label: 'Card' },
                ].map((method) => (
                  <button
                    key={method.value}
                    onClick={() => {
                      setPaymentMethod(method.value);
                      setShowDepositAddress(false); // Reset when changing payment method
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      paymentMethod === method.value
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
                  </Card>
                )}
              </>
            )}

            {/* Bank Transfer */}
            {paymentMethod === 'bank' && (
              <Card className="bg-[#334155] mb-6">
                <h4 className="text-[#f8fafc] font-bold mb-4">Bank Transfer Details</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg">
                    <span className="text-[#94a3b8]">Account Name:</span>
                    <span className="text-[#f8fafc] font-medium">Finaster Platform Inc.</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg">
                    <span className="text-[#94a3b8]">Account Number:</span>
                    <span className="text-[#f8fafc] font-medium">1234567890</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg">
                    <span className="text-[#94a3b8]">Routing Number:</span>
                    <span className="text-[#f8fafc] font-medium">987654321</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg">
                    <span className="text-[#94a3b8]">Bank Name:</span>
                    <span className="text-[#f8fafc] font-medium">Global Bank</span>
                  </div>
                  <div className="flex justify-between p-3 bg-[#1e293b] rounded-lg">
                    <span className="text-[#94a3b8]">SWIFT Code:</span>
                    <span className="text-[#f8fafc] font-medium">GLBUS33</span>
                  </div>
                </div>
                <Alert variant="info" className="mt-4">
                  <strong>ℹ️ Note:</strong> Bank transfers take 1-3 business days. Please include your User ID (USR123456) in the transfer reference.
                </Alert>
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

            <Button variant="outline" onClick={() => navigate('/transactions')} className="w-full mt-4">
              View All Transactions
            </Button>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-[#1e293b] mt-6">
            <h3 className="text-lg font-bold text-[#f8fafc] mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">Total Deposits:</span>
                <span className="text-[#f8fafc] font-bold">$1,750.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#94a3b8]">This Month:</span>
                <span className="text-[#10b981] font-bold">$500.00</span>
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
