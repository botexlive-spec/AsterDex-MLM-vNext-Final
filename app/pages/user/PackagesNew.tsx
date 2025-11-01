import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { format, differenceInDays, addMonths } from 'date-fns';
import { Button, Card, Badge } from '../../components/ui/DesignSystem';
import { Modal } from '../../components/ui/Modal';
import { Tabs, TabPanel } from '../../components/ui/Tabs';
import {
  getAvailablePackages,
  getUserPackages,
  purchasePackage,
  claimPackageReturns,
  calculateAvailableReturns,
  getPackageStats,
  type Package,
  type UserPackage,
  type PackageStats,
} from '../../services/package.service';
import { getWalletBalance, type WalletBalance } from '../../services/wallet.service';

// Package tier definitions
const packageTiers = [
  {
    id: 1,
    name: 'Starter',
    tier: 'tier_1',
    minAmount: 100,
    maxAmount: 2000,
    roiMin: 5.0,
    roiMax: 7.0,
    duration: 12, // months
    description: 'Perfect for beginners looking to start their investment journey',
    icon: '🌱',
    gradient: 'from-[#10b981] to-[#059669]',
    features: [
      'Daily ROI: 5-7%',
      'Level Income: Up to 10 levels',
      'Binary Bonus: 10%',
      'Rank Rewards',
      'Email Support',
    ],
    benefits: [
      'Low entry barrier',
      'Risk-managed investment',
      'Steady passive income',
      'Learn the system',
    ],
  },
  {
    id: 2,
    name: 'Growth',
    tier: 'tier_2',
    minAmount: 2001,
    maxAmount: 5000,
    roiMin: 7.0,
    roiMax: 9.0,
    duration: 12,
    description: 'Ideal for growing your wealth with enhanced earning potential',
    icon: '📈',
    gradient: 'from-[#3b82f6] to-[#2563eb]',
    features: [
      'Daily ROI: 7-9%',
      'Level Income: Up to 15 levels',
      'Binary Bonus: 12%',
      'Rank Rewards',
      'Priority Email Support',
      'Weekly Reports',
    ],
    benefits: [
      'Higher returns',
      'Increased team bonuses',
      'Priority processing',
      'Advanced analytics',
    ],
  },
  {
    id: 3,
    name: 'Premium',
    tier: 'tier_3',
    minAmount: 5001,
    maxAmount: 50000,
    roiMin: 10.0,
    roiMax: 12.0,
    duration: 12,
    description: 'Maximum earning potential for serious investors',
    icon: '💎',
    gradient: 'from-[#8b5cf6] to-[#7c3aed]',
    features: [
      'Daily ROI: 10-12%',
      'Level Income: Unlimited levels',
      'Binary Bonus: 15%',
      'Rank Rewards',
      '24/7 VIP Support',
      'Daily Reports',
      'Exclusive Bonuses',
      'Personal Account Manager',
    ],
    benefits: [
      'Maximum ROI',
      'Unlimited earning potential',
      'VIP treatment',
      'Exclusive opportunities',
    ],
  },
];

// Mock active packages data
const mockActivePackages = [
  {
    id: 'PKG-001',
    packageName: 'Starter',
    amount: 1500,
    roiPercent: 6.0,
    startDate: new Date('2024-01-15'),
    endDate: new Date('2025-01-15'),
    status: 'active',
    dailyEarnings: 90,
    totalEarned: 8100,
    tier: 'tier_1',
  },
  {
    id: 'PKG-002',
    packageName: 'Growth',
    amount: 3000,
    roiPercent: 8.0,
    startDate: new Date('2024-02-01'),
    endDate: new Date('2025-02-01'),
    status: 'active',
    dailyEarnings: 240,
    totalEarned: 19200,
    tier: 'tier_2',
  },
];

// Mock package history
const mockPackageHistory = [
  {
    id: 'PKG-H-001',
    packageName: 'Starter',
    amount: 1000,
    startDate: new Date('2023-06-01'),
    endDate: new Date('2024-06-01'),
    totalEarned: 21900,
    status: 'completed',
  },
  {
    id: 'PKG-H-002',
    packageName: 'Growth',
    amount: 2500,
    startDate: new Date('2023-08-15'),
    endDate: new Date('2024-08-15'),
    totalEarned: 68250,
    status: 'completed',
  },
];

// Purchase validation schema
const purchaseSchema = z.object({
  amount: z.number().min(100, 'Minimum amount is $100'),
  paymentPassword: z.string().min(6, 'Payment password is required'),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type PurchaseFormData = z.infer<typeof purchaseSchema>;

export const PackagesNew: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'available' | 'active' | 'history' | 'compare'>('available');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedActivePackage, setSelectedActivePackage] = useState<UserPackage | null>(null);
  const [purchaseAmount, setPurchaseAmount] = useState(100);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Real data from API
  const [availablePackages, setAvailablePackages] = useState<Package[]>([]);
  const [activePackages, setActivePackages] = useState<UserPackage[]>([]);
  const [packageHistory, setPackageHistory] = useState<UserPackage[]>([]);
  const [packageStats, setPackageStats] = useState<PackageStats | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      termsAccepted: false,
    },
  });

  // Load data on mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadAvailablePackages(),
        loadActivePackages(),
        loadPackageHistory(),
        loadPackageStats(),
        loadWalletBalance(),
      ]);
    } catch (error) {
      console.error('Error loading package data:', error);
      toast.error('Failed to load package data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailablePackages = async () => {
    try {
      const packages = await getAvailablePackages();
      setAvailablePackages(packages);
    } catch (error: any) {
      console.error('Error loading available packages:', error);
    }
  };

  const loadActivePackages = async () => {
    try {
      const packages = await getUserPackages('active');
      setActivePackages(packages);
    } catch (error: any) {
      console.error('Error loading active packages:', error);
    }
  };

  const loadPackageHistory = async () => {
    try {
      const packages = await getUserPackages('completed');
      setPackageHistory(packages);
    } catch (error: any) {
      console.error('Error loading package history:', error);
    }
  };

  const loadPackageStats = async () => {
    try {
      const stats = await getPackageStats();
      setPackageStats(stats);
    } catch (error: any) {
      console.error('Error loading package stats:', error);
    }
  };

  const loadWalletBalance = async () => {
    try {
      const balance = await getWalletBalance();
      setWalletBalance(balance);
    } catch (error: any) {
      console.error('Error loading wallet balance:', error);
    }
  };

  const handlePurchaseClick = (pkg: Package) => {
    // Check wallet balance
    if (walletBalance && walletBalance.available < (pkg.min_investment || pkg.price)) {
      toast.error(`Insufficient balance. You need at least $${pkg.min_investment || pkg.price} to purchase this package.`);
      return;
    }

    setSelectedPackage(pkg);
    setPurchaseAmount(pkg.min_investment || pkg.price);
    setValue('amount', pkg.min_investment || pkg.price);
    setShowPurchaseModal(true);
  };

  const handleViewDetails = (pkg: UserPackage) => {
    setSelectedActivePackage(pkg);
    setShowDetailsModal(true);
  };

  const handleClaimReturns = async (userPackage: UserPackage) => {
    try {
      const availableReturns = calculateAvailableReturns(userPackage);

      if (availableReturns <= 0) {
        toast.error('No returns available to claim yet');
        return;
      }

      const promise = claimPackageReturns({ user_package_id: userPackage.id });

      toast.promise(promise, {
        loading: 'Claiming your returns...',
        success: (result) => `Successfully claimed $${result.claimed_amount.toFixed(2)}!`,
        error: (err) => err.message || 'Failed to claim returns',
      });

      await promise;

      // Refresh data
      await loadActivePackages();
      await loadPackageHistory();
      await loadPackageStats();
      await loadWalletBalance();
    } catch (error: any) {
      console.error('Error claiming returns:', error);
    }
  };

  const calculateROI = (amount: number, roiPercent: number, duration: number) => {
    const dailyROI = (amount * roiPercent) / 100;
    const totalDays = duration * 30; // approximate days
    return {
      daily: dailyROI,
      monthly: dailyROI * 30,
      total: dailyROI * totalDays,
    };
  };

  const onPurchaseSubmit = async (data: PurchaseFormData) => {
    if (!selectedPackage) return;

    try {
      const promise = purchasePackage({
        package_id: selectedPackage.id,
        amount: purchaseAmount,
        payment_password: data.paymentPassword,
      });

      toast.promise(promise, {
        loading: 'Processing your purchase...',
        success: 'Package purchased successfully!',
        error: (err) => err.message || 'Purchase failed. Please try again.',
      });

      const result = await promise;

      setShowSuccessAnimation(true);
      setTimeout(async () => {
        setShowPurchaseModal(false);
        setShowSuccessAnimation(false);
        reset();

        // Refresh all data
        await loadActivePackages();
        await loadPackageStats();
        await loadWalletBalance();

        setActiveTab('active');
      }, 2000);
    } catch (error: any) {
      console.error('Purchase error:', error);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setPurchaseAmount(value);
    setValue('amount', value);
  };

  // Real-time ROI calculations with useMemo for instant updates
  const roiCalculations = useMemo(() => {
    if (!selectedPackage) return null;

    const duration = selectedPackage.duration_days / 30; // Convert days to months for calculation
    return {
      min: calculateROI(purchaseAmount, selectedPackage.daily_return_percentage, duration),
      max: calculateROI(purchaseAmount, selectedPackage.daily_return_percentage, duration),
    };
  }, [purchaseAmount, selectedPackage]);

  const getProgressPercentage = (startDate: Date, endDate: Date) => {
    const total = differenceInDays(endDate, startDate);
    const elapsed = differenceInDays(new Date(), startDate);
    return Math.min(Math.max((elapsed / total) * 100, 0), 100);
  };

  const canRenew = (endDate: Date) => {
    return differenceInDays(endDate, new Date()) <= 30;
  };

  return (
    <div className="min-h-screen bg-[#1e293b] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="secondary" onClick={() => navigate('/dashboard')} className="mb-4">
            ← Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-[#f8fafc] mb-2">Investment Packages</h1>
          <p className="text-[#cbd5e1] text-lg">
            Choose a package that fits your investment goals and start earning today
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { id: 'available', label: 'Available Packages' },
            { id: 'active', label: 'My Active Packages', badge: activePackages.length },
            { id: 'history', label: 'Package History' },
            { id: 'compare', label: 'Compare Packages' },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />

        {/* Available Packages Tab */}
        <TabPanel isActive={activeTab === 'available'}>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">⏳</div>
              <p className="text-[#cbd5e1]">Loading packages...</p>
            </div>
          ) : availablePackages.length === 0 ? (
            <Card className="text-center py-12 mt-6">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-[#f8fafc] mb-2">No Packages Available</h3>
              <p className="text-[#cbd5e1]">Check back later for investment opportunities</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {availablePackages.map((pkg) => {
                const gradients = [
                  'from-[#10b981] to-[#059669]',
                  'from-[#3b82f6] to-[#2563eb]',
                  'from-[#8b5cf6] to-[#7c3aed]',
                  'from-[#f59e0b] to-[#d97706]',
                ];
                const gradient = gradients[(availablePackages.indexOf(pkg)) % gradients.length];

                return (
                  <Card
                    key={pkg.id}
                    className="relative overflow-hidden hover:scale-105 transition-transform duration-300"
                  >
                    {/* Gradient Header */}
                    <div className={`bg-gradient-to-r ${gradient} p-6 text-center`}>
                      <div className="text-6xl mb-3">💎</div>
                      <h2 className="text-3xl font-bold text-white mb-2">{pkg.name}</h2>
                      <div className="text-5xl font-bold text-white mb-2">
                        {pkg.daily_return_percentage}%
                      </div>
                      <p className="text-white/80 text-sm">Daily ROI</p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <p className="text-[#cbd5e1] mb-4">{pkg.description}</p>

                      {/* Investment Range */}
                      <div className="mb-4 p-4 bg-[#1e293b] rounded-lg">
                        <p className="text-[#94a3b8] text-sm mb-1">Investment Amount</p>
                        <p className="text-2xl font-bold text-[#00C7D1]">
                          ${pkg.price.toLocaleString()}
                        </p>
                        {pkg.min_investment && pkg.max_investment && (
                          <p className="text-[#94a3b8] text-xs mt-1">
                            Range: ${pkg.min_investment.toLocaleString()} - ${pkg.max_investment.toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Duration */}
                      <div className="mb-4 p-4 bg-[#1e293b] rounded-lg">
                        <p className="text-[#94a3b8] text-sm mb-1">Duration</p>
                        <p className="text-xl font-bold text-[#f8fafc]">
                          {pkg.duration_days} days ({Math.floor(pkg.duration_days / 30)} months)
                        </p>
                      </div>

                      {/* Returns Info */}
                      <div className="mb-4 p-4 bg-[#1e293b] rounded-lg">
                        <p className="text-[#94a3b8] text-sm mb-1">Total Return</p>
                        <p className="text-xl font-bold text-[#10b981]">
                          {pkg.max_return_percentage}% (${pkg.total_return?.toLocaleString() || 0})
                        </p>
                      </div>

                      {/* Features */}
                      {pkg.features && pkg.features.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-[#f8fafc] font-semibold mb-3 flex items-center gap-2">
                            ✨ Features
                          </h3>
                          <ul className="space-y-2">
                            {pkg.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-[#cbd5e1]">
                                <span className="text-[#10b981] mt-1">✓</span>
                                <span className="text-sm">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Purchase Button */}
                      <Button
                        variant="primary"
                        className={`w-full bg-gradient-to-r ${gradient} hover:opacity-90`}
                        onClick={() => handlePurchaseClick(pkg)}
                        disabled={walletBalance ? walletBalance.available < (pkg.min_investment || pkg.price) : false}
                      >
                        {walletBalance && walletBalance.available < (pkg.min_investment || pkg.price)
                          ? 'Insufficient Balance'
                          : 'Purchase Package'}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabPanel>

        {/* Active Packages Tab */}
        <TabPanel isActive={activeTab === 'active'}>
          <div className="mt-6 space-y-6">
            {activePackages.length === 0 ? (
              <Card className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-2xl font-bold text-[#f8fafc] mb-2">No Active Packages</h3>
                <p className="text-[#cbd5e1] mb-6">
                  You don't have any active packages yet. Purchase a package to start earning!
                </p>
                <Button variant="primary" onClick={() => setActiveTab('available')}>
                  Browse Packages
                </Button>
              </Card>
            ) : (
              <>
                {activePackages.map((pkg) => {
                  const startDate = new Date(pkg.start_date);
                  const endDate = new Date(pkg.end_date);
                  const progress = getProgressPercentage(startDate, endDate);
                  const daysRemaining = differenceInDays(endDate, new Date());
                  const renewable = canRenew(endDate);
                  const availableReturns = calculateAvailableReturns(pkg);

                  return (
                    <Card key={pkg.id} className="overflow-hidden">
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                          <div className="flex items-center gap-4 mb-4 md:mb-0">
                            <div className="text-5xl">💎</div>
                            <div>
                              <h3 className="text-2xl font-bold text-[#f8fafc]">
                                {pkg.package?.name} Package
                              </h3>
                              <p className="text-[#94a3b8]">Package ID: {pkg.id.substring(0, 8)}</p>
                            </div>
                          </div>
                          <Badge
                            variant={pkg.status === 'active' ? 'success' : 'warning'}
                            className="self-start md:self-auto"
                          >
                            {pkg.status.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-[#1e293b] p-4 rounded-lg">
                            <p className="text-[#94a3b8] text-sm mb-1">Investment</p>
                            <p className="text-2xl font-bold text-[#00C7D1]">
                              ${pkg.amount_invested.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-[#1e293b] p-4 rounded-lg">
                            <p className="text-[#94a3b8] text-sm mb-1">Daily Return</p>
                            <p className="text-2xl font-bold text-[#10b981]">
                              ${pkg.daily_return.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-[#1e293b] p-4 rounded-lg">
                            <p className="text-[#94a3b8] text-sm mb-1">Total Claimed</p>
                            <p className="text-2xl font-bold text-[#10b981]">
                              ${pkg.claimed_return.toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-[#1e293b] p-4 rounded-lg">
                            <p className="text-[#94a3b8] text-sm mb-1">Available to Claim</p>
                            <p className="text-2xl font-bold text-[#f59e0b]">
                              ${availableReturns.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Duration Progress */}
                        <div className="mb-6">
                          <div className="flex justify-between text-sm text-[#cbd5e1] mb-2">
                            <span>
                              Started: {format(startDate, 'MMM dd, yyyy')}
                            </span>
                            <span>
                              Ends: {format(endDate, 'MMM dd, yyyy')}
                            </span>
                          </div>
                          <div className="w-full bg-[#475569] rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-[#10b981] to-[#059669] h-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <p className="text-center text-[#cbd5e1] text-sm mt-2">
                            {daysRemaining > 0
                              ? `${daysRemaining} days remaining (${progress.toFixed(1)}% complete)`
                              : 'Package completed'}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          <Button variant="primary" size="sm" onClick={() => handleViewDetails(pkg)}>
                            View Details
                          </Button>
                          {availableReturns > 0 && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleClaimReturns(pkg)}
                            >
                              💰 Claim ${availableReturns.toFixed(2)}
                            </Button>
                          )}
                          {renewable && pkg.package && (
                            <Button variant="secondary" size="sm" onClick={() => handlePurchaseClick(pkg.package!)}>
                              🔄 Renew Package
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        </TabPanel>

        {/* Package History Tab */}
        <TabPanel isActive={activeTab === 'history'}>
          <div className="mt-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-gradient-to-br from-[#334155] to-[#1e293b]">
                <div className="text-center py-6">
                  <p className="text-[#cbd5e1] mb-2">Total Invested</p>
                  <p className="text-4xl font-bold text-[#00C7D1]">
                    $
                    {packageStats?.total_invested.toLocaleString() || 0}
                  </p>
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-[#334155] to-[#1e293b]">
                <div className="text-center py-6">
                  <p className="text-[#cbd5e1] mb-2">Total Earned</p>
                  <p className="text-4xl font-bold text-[#10b981]">
                    $
                    {packageStats?.total_earned.toLocaleString() || 0}
                  </p>
                </div>
              </Card>
              <Card className="bg-gradient-to-br from-[#334155] to-[#1e293b]">
                <div className="text-center py-6">
                  <p className="text-[#cbd5e1] mb-2">Available to Claim</p>
                  <p className="text-4xl font-bold text-[#f59e0b]">
                    $
                    {packageStats?.available_to_claim.toFixed(2) || 0}
                  </p>
                </div>
              </Card>
            </div>

            {/* History Table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#475569]">
                      <th className="text-left py-4 px-4 text-[#cbd5e1]">Package ID</th>
                      <th className="text-left py-4 px-4 text-[#cbd5e1]">Package Name</th>
                      <th className="text-right py-4 px-4 text-[#cbd5e1]">Investment</th>
                      <th className="text-left py-4 px-4 text-[#cbd5e1]">Duration</th>
                      <th className="text-right py-4 px-4 text-[#cbd5e1]">Total Earned</th>
                      <th className="text-right py-4 px-4 text-[#cbd5e1]">Profit</th>
                      <th className="text-center py-4 px-4 text-[#cbd5e1]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packageHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#94a3b8]">
                          No completed packages yet
                        </td>
                      </tr>
                    ) : (
                      packageHistory.map((pkg) => (
                        <tr
                          key={pkg.id}
                          className="border-b border-[#475569] hover:bg-[#334155] transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span className="text-[#cbd5e1] font-mono text-sm">{pkg.id.substring(0, 8)}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-[#f8fafc] font-medium">{pkg.package?.name}</span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-[#00C7D1] font-semibold">
                              ${pkg.amount_invested.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-[#cbd5e1] text-sm">
                              <div>{format(new Date(pkg.start_date), 'MMM dd, yyyy')}</div>
                              <div>{format(new Date(pkg.end_date), 'MMM dd, yyyy')}</div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-[#10b981] font-semibold">
                              ${pkg.claimed_return.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <span className="text-[#10b981] font-semibold">
                              +${(pkg.claimed_return - pkg.amount_invested).toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <Badge variant="success">{pkg.status.toUpperCase()}</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabPanel>

        {/* Compare Packages Tab */}
        <TabPanel isActive={activeTab === 'compare'}>
          <div className="mt-6">
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#475569]">
                      <th className="text-left py-4 px-4 text-[#cbd5e1]">Feature</th>
                      {packageTiers.map((pkg) => (
                        <th key={pkg.id} className="text-center py-4 px-4">
                          <div className={`inline-block px-4 py-2 rounded-lg bg-gradient-to-r ${pkg.gradient}`}>
                            <div className="text-2xl mb-1">{pkg.icon}</div>
                            <div className="text-white font-bold">{pkg.name}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#475569]">
                      <td className="py-4 px-4 text-[#f8fafc] font-medium">Investment Range</td>
                      {packageTiers.map((pkg) => (
                        <td key={pkg.id} className="py-4 px-4 text-center text-[#00C7D1] font-semibold">
                          ${pkg.minAmount.toLocaleString()} - ${pkg.maxAmount.toLocaleString()}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-[#475569] bg-[#1e293b]">
                      <td className="py-4 px-4 text-[#f8fafc] font-medium">Daily ROI</td>
                      {packageTiers.map((pkg) => (
                        <td key={pkg.id} className="py-4 px-4 text-center">
                          <span className="text-2xl font-bold text-[#10b981]">
                            {pkg.roiMin}% - {pkg.roiMax}%
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-[#475569]">
                      <td className="py-4 px-4 text-[#f8fafc] font-medium">Duration</td>
                      {packageTiers.map((pkg) => (
                        <td key={pkg.id} className="py-4 px-4 text-center text-[#cbd5e1]">
                          {pkg.duration} months
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-[#475569]">
                      <td className="py-4 px-4 text-[#f8fafc] font-medium">Level Income</td>
                      {packageTiers.map((pkg) => (
                        <td key={pkg.id} className="py-4 px-4 text-center text-[#cbd5e1]">
                          {pkg.id === 1 && 'Up to 10 levels'}
                          {pkg.id === 2 && 'Up to 15 levels'}
                          {pkg.id === 3 && 'Unlimited'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-[#475569] bg-[#1e293b]">
                      <td className="py-4 px-4 text-[#f8fafc] font-medium">Binary Bonus</td>
                      {packageTiers.map((pkg) => (
                        <td key={pkg.id} className="py-4 px-4 text-center text-[#cbd5e1]">
                          {pkg.id === 1 && '10%'}
                          {pkg.id === 2 && '12%'}
                          {pkg.id === 3 && '15%'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-[#475569]">
                      <td className="py-4 px-4 text-[#f8fafc] font-medium">Support</td>
                      {packageTiers.map((pkg) => (
                        <td key={pkg.id} className="py-4 px-4 text-center text-[#cbd5e1]">
                          {pkg.id === 1 && 'Email'}
                          {pkg.id === 2 && 'Priority Email'}
                          {pkg.id === 3 && '24/7 VIP'}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-[#475569] bg-[#1e293b]">
                      <td className="py-4 px-4 text-[#f8fafc] font-medium">Reports</td>
                      {packageTiers.map((pkg) => (
                        <td key={pkg.id} className="py-4 px-4 text-center text-[#cbd5e1]">
                          {pkg.id === 1 && 'Monthly'}
                          {pkg.id === 2 && 'Weekly'}
                          {pkg.id === 3 && 'Daily'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-4 px-4 text-[#f8fafc] font-medium">Action</td>
                      {packageTiers.map((pkg) => (
                        <td key={pkg.id} className="py-4 px-4 text-center">
                          <Button
                            variant="primary"
                            size="sm"
                            className={`bg-gradient-to-r ${pkg.gradient}`}
                            onClick={() => handlePurchaseClick(pkg)}
                          >
                            Purchase
                          </Button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </TabPanel>
      </div>

      {/* Purchase Modal */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title={`Purchase ${selectedPackage?.name} Package`}
        maxWidth="lg"
      >
        {showSuccessAnimation ? (
          <div className="text-center py-12">
            <div className="text-8xl mb-4 animate-bounce">🎉</div>
            <h3 className="text-3xl font-bold text-[#10b981] mb-2">Purchase Successful!</h3>
            <p className="text-[#cbd5e1]">Your package has been activated</p>
          </div>
        ) : (
          selectedPackage && (
            <form onSubmit={handleSubmit(onPurchaseSubmit)} className="space-y-6">
              {/* Package Info */}
              <div className={`bg-gradient-to-r ${selectedPackage.gradient} p-6 rounded-lg text-center`}>
                <div className="text-5xl mb-2">{selectedPackage.icon}</div>
                <h3 className="text-2xl font-bold text-white mb-1">{selectedPackage.name}</h3>
                <p className="text-white/80">{selectedPackage.description}</p>
              </div>

              {/* Amount Slider */}
              <div>
                <label className="block text-[#cbd5e1] mb-3 text-lg font-semibold">
                  Investment Amount: <span className="text-[#00C7D1]">${purchaseAmount.toLocaleString()}</span>
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min={selectedPackage.minAmount}
                    max={selectedPackage.maxAmount}
                    step={100}
                    value={purchaseAmount}
                    onChange={handleAmountChange}
                    className="w-full h-3 bg-[#475569] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-[#00C7D1] [&::-webkit-slider-thumb]:to-[#00e5f0] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gradient-to-r [&::-moz-range-thumb]:from-[#00C7D1] [&::-moz-range-thumb]:to-[#00e5f0] [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110 transition-all duration-150"
                    style={{
                      background: `linear-gradient(to right, #00C7D1 0%, #00C7D1 ${((purchaseAmount - selectedPackage.minAmount) / (selectedPackage.maxAmount - selectedPackage.minAmount)) * 100}%, #475569 ${((purchaseAmount - selectedPackage.minAmount) / (selectedPackage.maxAmount - selectedPackage.minAmount)) * 100}%, #475569 100%)`
                    }}
                  />
                  {/* Progress indicator */}
                  <div
                    className="absolute -top-10 bg-[#00C7D1] text-white px-3 py-1 rounded-md text-sm font-semibold shadow-lg transition-all duration-150"
                    style={{
                      left: `calc(${((purchaseAmount - selectedPackage.minAmount) / (selectedPackage.maxAmount - selectedPackage.minAmount)) * 100}% - 40px)`
                    }}
                  >
                    ${purchaseAmount.toLocaleString()}
                  </div>
                </div>
                <div className="flex justify-between text-[#94a3b8] text-sm mt-4">
                  <span>Min: ${selectedPackage.minAmount.toLocaleString()}</span>
                  <span>Max: ${selectedPackage.maxAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* ROI Calculation Preview - Real-time Updates */}
              <div className="bg-[#1e293b] p-6 rounded-lg space-y-4">
                <h4 className="text-[#f8fafc] font-semibold mb-3 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Earnings Estimate (Real-time)
                </h4>

                {roiCalculations && (
                  <>
                    {/* Minimum ROI */}
                    <div className="bg-[#334155] p-4 rounded-lg">
                      <p className="text-[#94a3b8] text-sm mb-3 font-semibold">
                        At {selectedPackage.roiMin}% Daily ROI (Minimum)
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-[#94a3b8] text-xs mb-1">Daily</p>
                          <p className="text-[#10b981] font-bold text-lg">
                            ${roiCalculations.min.daily.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#94a3b8] text-xs mb-1">Monthly</p>
                          <p className="text-[#10b981] font-bold text-lg">
                            ${roiCalculations.min.monthly.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#94a3b8] text-xs mb-1">Total</p>
                          <p className="text-[#10b981] font-bold text-lg">
                            ${roiCalculations.min.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Maximum ROI */}
                    <div className="bg-[#334155] p-4 rounded-lg border-2 border-[#00C7D1]">
                      <p className="text-[#00C7D1] text-sm mb-3 font-semibold">
                        At {selectedPackage.roiMax}% Daily ROI (Maximum)
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-[#94a3b8] text-xs mb-1">Daily</p>
                          <p className="text-[#00C7D1] font-bold text-xl">
                            ${roiCalculations.max.daily.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#94a3b8] text-xs mb-1">Monthly</p>
                          <p className="text-[#00C7D1] font-bold text-xl">
                            ${roiCalculations.max.monthly.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#94a3b8] text-xs mb-1">Total</p>
                          <p className="text-[#00C7D1] font-bold text-xl">
                            ${roiCalculations.max.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Investment Summary */}
                    <div className="pt-3 border-t border-[#475569]">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[#94a3b8] text-xs">Your Investment</p>
                          <p className="text-[#f8fafc] font-bold text-2xl">
                            ${purchaseAmount.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#94a3b8] text-xs">Potential Total Return</p>
                          <p className="text-[#10b981] font-bold text-2xl">
                            ${(roiCalculations.max.total + purchaseAmount).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 text-center">
                        <p className="text-[#00C7D1] text-sm font-semibold">
                          Profit: ${roiCalculations.max.total.toFixed(2)} ({((roiCalculations.max.total / purchaseAmount) * 100).toFixed(1)}% ROI)
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Wallet Balance Info */}
              {walletBalance && (
                <div className="bg-[#1e293b] p-4 rounded-lg border-2 border-[#00C7D1]">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[#94a3b8] text-sm mb-1">Your Wallet Balance</p>
                      <p className="text-2xl font-bold text-[#00C7D1]">
                        ${walletBalance.available.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#94a3b8] text-sm mb-1">After Purchase</p>
                      <p className="text-xl font-bold text-[#f8fafc]">
                        ${(walletBalance.available - purchaseAmount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Password */}
              <div>
                <label className="block text-[#cbd5e1] mb-3">
                  Payment Password <span className="text-[#ef4444]">*</span>
                </label>
                <input
                  type="password"
                  {...register('paymentPassword')}
                  className="w-full px-4 py-3 bg-[#1e293b] border border-[#475569] rounded-lg text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#00C7D1] transition-colors"
                  placeholder="Enter your account password"
                />
                {errors.paymentPassword && (
                  <p className="text-[#ef4444] text-sm mt-2">{errors.paymentPassword.message}</p>
                )}
                <p className="text-[#94a3b8] text-xs mt-2">
                  💡 This is your account password for security verification
                </p>
              </div>

              {/* Terms and Conditions */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('termsAccepted')}
                    className="mt-1 w-5 h-5 text-[#00C7D1] bg-[#475569] border-[#64748b] rounded focus:ring-[#00C7D1]"
                  />
                  <span className="text-[#cbd5e1] text-sm">
                    I agree to the terms and conditions, and understand that this investment is subject
                    to the package duration and ROI policies.
                  </span>
                </label>
                {errors.termsAccepted && (
                  <p className="text-[#ef4444] text-sm mt-2">{errors.termsAccepted.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className={`flex-1 bg-gradient-to-r ${selectedPackage.gradient}`}
                >
                  Confirm Purchase - ${purchaseAmount.toLocaleString()}
                </Button>
              </div>
            </form>
          )
        )}
      </Modal>

      {/* Package Details Modal */}
      {selectedActivePackage && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          title={`${selectedActivePackage.packageName} Package Details`}
          maxWidth="2xl"
        >
          <div className="space-y-6">
            {/* Header with Package Icon */}
            <div className="text-center p-6 bg-gradient-to-br from-[#334155] to-[#1e293b] rounded-lg">
              <div className="text-7xl mb-3">
                {packageTiers.find(t => t.tier === selectedActivePackage.tier)?.icon}
              </div>
              <h2 className="text-3xl font-bold text-[#f8fafc] mb-2">
                {selectedActivePackage.packageName} Package
              </h2>
              <Badge variant={selectedActivePackage.status === 'active' ? 'success' : 'warning'}>
                {selectedActivePackage.status.toUpperCase()}
              </Badge>
            </div>

            {/* Package Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="bg-[#1e293b] p-5 rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-2">Package ID</p>
                  <p className="text-[#f8fafc] font-mono text-lg">{selectedActivePackage.id}</p>
                </div>

                <div className="bg-[#1e293b] p-5 rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-2">Investment Amount</p>
                  <p className="text-3xl font-bold text-[#00C7D1]">
                    ${selectedActivePackage.amount.toLocaleString()}
                  </p>
                </div>

                <div className="bg-[#1e293b] p-5 rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-2">Daily ROI Rate</p>
                  <p className="text-3xl font-bold text-[#10b981]">
                    {selectedActivePackage.roiPercent}%
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="bg-[#1e293b] p-5 rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-2">Daily Earnings</p>
                  <p className="text-3xl font-bold text-[#10b981]">
                    ${selectedActivePackage.dailyEarnings.toFixed(2)}
                  </p>
                  <p className="text-[#94a3b8] text-xs mt-1">
                    ({selectedActivePackage.roiPercent}% of ${selectedActivePackage.amount.toLocaleString()})
                  </p>
                </div>

                <div className="bg-[#1e293b] p-5 rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-2">Total Earned to Date</p>
                  <p className="text-3xl font-bold text-[#10b981]">
                    ${selectedActivePackage.totalEarned.toLocaleString()}
                  </p>
                </div>

                <div className="bg-[#1e293b] p-5 rounded-lg">
                  <p className="text-[#94a3b8] text-sm mb-2">Current Profit</p>
                  <p className="text-3xl font-bold text-[#10b981]">
                    +${(selectedActivePackage.totalEarned - selectedActivePackage.amount).toLocaleString()}
                  </p>
                  <p className="text-[#94a3b8] text-xs mt-1">
                    {(((selectedActivePackage.totalEarned - selectedActivePackage.amount) / selectedActivePackage.amount) * 100).toFixed(1)}% ROI
                  </p>
                </div>
              </div>
            </div>

            {/* Duration Timeline */}
            <div className="bg-[#1e293b] p-6 rounded-lg">
              <h3 className="text-[#f8fafc] font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span>
                Package Duration
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-[#94a3b8] mb-1">Start Date</p>
                    <p className="text-[#f8fafc] font-semibold">
                      {format(selectedActivePackage.startDate, 'MMMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#94a3b8] mb-1">End Date</p>
                    <p className="text-[#f8fafc] font-semibold">
                      {format(selectedActivePackage.endDate, 'MMMM dd, yyyy')}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-[#475569] rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#10b981] to-[#059669] h-full transition-all duration-300 flex items-center justify-center text-white text-xs font-semibold"
                    style={{ width: `${getProgressPercentage(selectedActivePackage.startDate, selectedActivePackage.endDate)}%` }}
                  >
                    {getProgressPercentage(selectedActivePackage.startDate, selectedActivePackage.endDate).toFixed(1)}%
                  </div>
                </div>

                <div className="flex justify-between text-sm">
                  <p className="text-[#94a3b8]">
                    Elapsed: {differenceInDays(new Date(), selectedActivePackage.startDate)} days
                  </p>
                  <p className="text-[#94a3b8]">
                    Remaining: {Math.max(0, differenceInDays(selectedActivePackage.endDate, new Date()))} days
                  </p>
                </div>
              </div>
            </div>

            {/* Earnings Projection */}
            <div className="bg-[#1e293b] p-6 rounded-lg">
              <h3 className="text-[#f8fafc] font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">📊</span>
                Projected Earnings
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-[#334155] rounded-lg">
                  <p className="text-[#94a3b8] text-xs mb-2">Next 7 Days</p>
                  <p className="text-[#10b981] font-bold text-xl">
                    ${(selectedActivePackage.dailyEarnings * 7).toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-[#334155] rounded-lg">
                  <p className="text-[#94a3b8] text-xs mb-2">Next 30 Days</p>
                  <p className="text-[#10b981] font-bold text-xl">
                    ${(selectedActivePackage.dailyEarnings * 30).toFixed(2)}
                  </p>
                </div>
                <div className="text-center p-4 bg-[#334155] rounded-lg">
                  <p className="text-[#94a3b8] text-xs mb-2">At Maturity</p>
                  <p className="text-[#00C7D1] font-bold text-xl">
                    ${(selectedActivePackage.dailyEarnings * differenceInDays(selectedActivePackage.endDate, selectedActivePackage.startDate)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Package Features */}
            <div className="bg-[#1e293b] p-6 rounded-lg">
              <h3 className="text-[#f8fafc] font-semibold mb-4 flex items-center gap-2">
                <span className="text-2xl">✨</span>
                Package Features
              </h3>
              <ul className="space-y-3">
                {packageTiers.find(t => t.tier === selectedActivePackage.tier)?.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-[#10b981] mt-1 text-lg">✓</span>
                    <span className="text-[#cbd5e1]">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDetailsModal(false)}
                className="flex-1"
              >
                Close
              </Button>
              {canRenew(selectedActivePackage.endDate) && (
                <Button
                  variant="success"
                  className="flex-1"
                  onClick={() => {
                    setShowDetailsModal(false);
                    const pkg = packageTiers.find(t => t.tier === selectedActivePackage.tier);
                    if (pkg) handlePurchaseClick(pkg);
                  }}
                >
                  🔄 Renew Package
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PackagesNew;
