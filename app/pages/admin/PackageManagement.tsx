import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

// Types
interface Package {
  id: string;
  name: string;
  description: string;
  minInvestment: number;
  maxInvestment: number;
  roiMin: number;
  roiMax: number;
  duration: number;
  features: string[];
  status: 'active' | 'inactive';
  displayOrder: number;
  icon: string;
  createdAt: string;
}

interface ActivePackage {
  id: string;
  userId: string;
  userName: string;
  packageId: string;
  packageName: string;
  investmentAmount: number;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  roiEarned: number;
  status: 'active' | 'completed' | 'cancelled';
}

interface ROISettings {
  frequency: 'daily' | 'weekly';
  distributionTime: string;
  autoDistribution: boolean;
}

export const PackageManagement: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<'packages' | 'active' | 'analytics' | 'roi'>('packages');
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPackage, setFilterPackage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);

  // Mock data - Packages
  const [packages, setPackages] = useState<Package[]>([
    {
      id: 'PKG001',
      name: 'Starter Package',
      description: 'Perfect for beginners looking to start their investment journey',
      minInvestment: 100,
      maxInvestment: 2000,
      roiMin: 5,
      roiMax: 7,
      duration: 365,
      features: ['Daily ROI Distribution', '24/7 Support', 'Trading Dashboard Access', 'Weekly Reports'],
      status: 'active',
      displayOrder: 1,
      icon: '🌱',
      createdAt: '2024-01-15',
    },
    {
      id: 'PKG002',
      name: 'Growth Package',
      description: 'Ideal for investors seeking higher returns with moderate risk',
      minInvestment: 2001,
      maxInvestment: 10000,
      roiMin: 7,
      roiMax: 10,
      duration: 365,
      features: ['Daily ROI Distribution', 'Priority Support', 'Advanced Analytics', 'Weekly Reports', 'Referral Bonus'],
      status: 'active',
      displayOrder: 2,
      icon: '📈',
      createdAt: '2024-01-15',
    },
    {
      id: 'PKG003',
      name: 'Premium Package',
      description: 'Maximum returns for serious investors and high net-worth individuals',
      minInvestment: 10001,
      maxInvestment: 100000,
      roiMin: 10,
      roiMax: 15,
      duration: 365,
      features: ['Daily ROI Distribution', 'VIP Support', 'Full Analytics Suite', 'Daily Reports', 'Referral Bonus', 'Exclusive Rewards'],
      status: 'active',
      displayOrder: 3,
      icon: '💎',
      createdAt: '2024-01-15',
    },
  ]);

  // Mock data - Active Packages
  const activePackages: ActivePackage[] = [
    {
      id: 'AP001',
      userId: 'USR001',
      userName: 'John Doe',
      packageId: 'PKG001',
      packageName: 'Starter Package',
      investmentAmount: 1500,
      startDate: '2024-01-15',
      endDate: '2025-01-15',
      daysRemaining: 289,
      roiEarned: 75.50,
      status: 'active',
    },
    {
      id: 'AP002',
      userId: 'USR002',
      userName: 'Jane Smith',
      packageId: 'PKG002',
      packageName: 'Growth Package',
      investmentAmount: 5000,
      startDate: '2024-02-20',
      endDate: '2025-02-20',
      daysRemaining: 325,
      roiEarned: 210.00,
      status: 'active',
    },
    {
      id: 'AP003',
      userId: 'USR004',
      userName: 'Sarah Williams',
      packageId: 'PKG003',
      packageName: 'Premium Package',
      investmentAmount: 35000,
      startDate: '2024-03-25',
      endDate: '2025-03-25',
      daysRemaining: 358,
      roiEarned: 1450.00,
      status: 'active',
    },
  ];

  // Mock data - Analytics
  const revenueByPackage = [
    { name: 'Starter', value: 12500, percentage: 30 },
    { name: 'Growth', value: 18000, percentage: 43 },
    { name: 'Premium', value: 11200, percentage: 27 },
  ];

  const monthlyRevenue = [
    { month: 'Jan', revenue: 8500, packages: 12 },
    { month: 'Feb', revenue: 12200, packages: 18 },
    { month: 'Mar', revenue: 15800, packages: 23 },
    { month: 'Apr', revenue: 18500, packages: 28 },
    { month: 'May', revenue: 21000, packages: 32 },
  ];

  // ROI Distribution Settings
  const [roiSettings, setROISettings] = useState<ROISettings>({
    frequency: 'daily',
    distributionTime: '00:00',
    autoDistribution: true,
  });

  // Package Form State
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    minInvestment: 0,
    maxInvestment: 0,
    roiMin: 0,
    roiMax: 0,
    duration: 365,
    features: '',
    status: 'active' as 'active' | 'inactive',
    displayOrder: 1,
    icon: '📦',
  });

  // Load packages from localStorage on mount
  useEffect(() => {
    try {
      const savedPackages = localStorage.getItem('finaster_packages');
      if (savedPackages) {
        setPackages(JSON.parse(savedPackages));
        toast.success('Packages loaded from storage');
      }
    } catch (error) {
      console.error('Failed to load packages from localStorage:', error);
    }
  }, []);

  // Save packages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('finaster_packages', JSON.stringify(packages));
    } catch (error) {
      console.error('Failed to save packages to localStorage:', error);
    }
  }, [packages]);

  // Load ROI settings from localStorage
  useEffect(() => {
    try {
      const savedROISettings = localStorage.getItem('finaster_roi_settings');
      if (savedROISettings) {
        setROISettings(JSON.parse(savedROISettings));
      }
    } catch (error) {
      console.error('Failed to load ROI settings from localStorage:', error);
    }
  }, []);

  // Save ROI settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('finaster_roi_settings', JSON.stringify(roiSettings));
    } catch (error) {
      console.error('Failed to save ROI settings to localStorage:', error);
    }
  }, [roiSettings]);

  // Handlers
  const handleAddPackage = () => {
    setSelectedPackage(null);
    setPackageForm({
      name: '',
      description: '',
      minInvestment: 0,
      maxInvestment: 0,
      roiMin: 0,
      roiMax: 0,
      duration: 365,
      features: '',
      status: 'active',
      displayOrder: packages.length + 1,
      icon: '📦',
    });
    setShowPackageModal(true);
  };

  const handleEditPackage = (pkg: Package) => {
    setSelectedPackage(pkg);
    setPackageForm({
      name: pkg.name,
      description: pkg.description,
      minInvestment: pkg.minInvestment,
      maxInvestment: pkg.maxInvestment,
      roiMin: pkg.roiMin,
      roiMax: pkg.roiMax,
      duration: pkg.duration,
      features: pkg.features.join('\n'),
      status: pkg.status,
      displayOrder: pkg.displayOrder,
      icon: pkg.icon,
    });
    setShowPackageModal(true);
  };

  const handleSavePackage = () => {
    // Validate required fields
    if (!packageForm.name || !packageForm.description) {
      toast.error('Please fill all required fields');
      return;
    }

    // Validate name length
    if (packageForm.name.trim().length < 3) {
      toast.error('Package name must be at least 3 characters');
      return;
    }

    // Validate description length
    if (packageForm.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters');
      return;
    }

    // Validate minimum investment
    if (packageForm.minInvestment <= 0) {
      toast.error('Minimum investment must be greater than 0');
      return;
    }

    // Validate maximum investment
    if (packageForm.maxInvestment <= 0) {
      toast.error('Maximum investment must be greater than 0');
      return;
    }

    // Validate investment range
    if (packageForm.minInvestment >= packageForm.maxInvestment) {
      toast.error('Minimum investment must be less than maximum investment');
      return;
    }

    // Validate ROI minimum
    if (packageForm.roiMin <= 0) {
      toast.error('Minimum ROI must be greater than 0');
      return;
    }

    // Validate ROI maximum
    if (packageForm.roiMax <= 0) {
      toast.error('Maximum ROI must be greater than 0');
      return;
    }

    // Validate ROI range
    if (packageForm.roiMin >= packageForm.roiMax) {
      toast.error('Minimum ROI must be less than maximum ROI');
      return;
    }

    // Validate duration
    if (packageForm.duration <= 0) {
      toast.error('Duration must be greater than 0 days');
      return;
    }

    // Validate display order
    if (packageForm.displayOrder <= 0) {
      toast.error('Display order must be greater than 0');
      return;
    }

    // Validate features
    const featuresList = packageForm.features.split('\n').filter(f => f.trim());
    if (featuresList.length === 0) {
      toast.error('Please add at least one feature');
      return;
    }

    const newPackage: Package = {
      id: selectedPackage?.id || `PKG${String(packages.length + 1).padStart(3, '0')}`,
      name: packageForm.name.trim(),
      description: packageForm.description.trim(),
      minInvestment: packageForm.minInvestment,
      maxInvestment: packageForm.maxInvestment,
      roiMin: packageForm.roiMin,
      roiMax: packageForm.roiMax,
      duration: packageForm.duration,
      features: featuresList,
      status: packageForm.status,
      displayOrder: packageForm.displayOrder,
      icon: packageForm.icon,
      createdAt: selectedPackage?.createdAt || new Date().toISOString().split('T')[0],
    };

    if (selectedPackage) {
      setPackages(packages.map(p => p.id === selectedPackage.id ? newPackage : p));
      toast.success('Package updated successfully');
    } else {
      setPackages([...packages, newPackage]);
      toast.success('Package created successfully');
    }

    setShowPackageModal(false);
  };

  const handleDeletePackage = (id: string) => {
    setPackageToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeletePackage = () => {
    if (packageToDelete) {
      const packageName = packages.find(p => p.id === packageToDelete)?.name;
      setPackages(packages.filter(p => p.id !== packageToDelete));
      toast.success(`Package "${packageName}" deleted successfully`);
      setShowDeleteModal(false);
      setPackageToDelete(null);
    }
  };

  const handleToggleStatus = (id: string) => {
    setPackages(packages.map(p =>
      p.id === id ? { ...p, status: p.status === 'active' ? 'inactive' as const : 'active' as const } : p
    ));
    toast.success('Package status updated');
  };

  const handleExtendDuration = (id: string) => {
    toast.success('Duration extended by 30 days');
  };

  const handleCancelPackage = (id: string) => {
    if (confirm('Are you sure you want to cancel this package?')) {
      toast.success('Package cancelled successfully');
    }
  };

  const handleManualDistribution = () => {
    toast.success('Manual ROI distribution initiated');
  };

  const COLORS = ['#00C7D1', '#10b981', '#f59e0b'];

  // Filtered active packages
  const filteredActivePackages = activePackages.filter(ap => {
    const matchesPackage = filterPackage === 'all' || ap.packageId === filterPackage;
    const matchesStatus = filterStatus === 'all' || ap.status === filterStatus;
    const matchesSearch = ap.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ap.userId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPackage && matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Package Management</h1>
        <p className="text-[#94a3b8]">Manage packages, monitor active investments, and configure ROI distribution</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#334155]">
        {[
          { id: 'packages', label: 'Package Configuration', icon: '📦' },
          { id: 'active', label: 'Active Packages', icon: '📊' },
          { id: 'analytics', label: 'Analytics', icon: '📈' },
          { id: 'roi', label: 'ROI Settings', icon: '⚙️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-medium transition-all ${
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

      {/* Package Configuration Tab */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#94a3b8] text-sm mb-1">Total Packages</p>
                  <p className="text-3xl font-bold text-[#f8fafc]">{packages.length}</p>
                </div>
                <div className="text-4xl">📦</div>
              </div>
            </div>

            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#94a3b8] text-sm mb-1">Active Packages</p>
                  <p className="text-3xl font-bold text-[#10b981]">{packages.filter(p => p.status === 'active').length}</p>
                </div>
                <div className="text-4xl">✅</div>
              </div>
            </div>

            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#94a3b8] text-sm mb-1">Total Subscribers</p>
                  <p className="text-3xl font-bold text-[#00C7D1]">{activePackages.length}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>

            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#94a3b8] text-sm mb-1">Total Investment</p>
                  <p className="text-3xl font-bold text-[#10b981]">
                    ${activePackages.reduce((sum, ap) => sum + ap.investmentAmount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          </div>

          {/* Add Package Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#f8fafc]">Configured Packages</h2>
            <button
              onClick={handleAddPackage}
              className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              + Add New Package
            </button>
          </div>

          {/* Packages List */}
          <div className="space-y-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{pkg.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold text-[#f8fafc]">{pkg.name}</h3>
                        <p className="text-[#94a3b8] text-sm">{pkg.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        pkg.status === 'active' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#ef4444]/20 text-[#ef4444]'
                      }`}>
                        {pkg.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-[#94a3b8] text-xs mb-1">Investment Range</p>
                        <p className="text-[#f8fafc] font-semibold">
                          ${pkg.minInvestment.toLocaleString()} - ${pkg.maxInvestment.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#94a3b8] text-xs mb-1">ROI Range</p>
                        <p className="text-[#10b981] font-semibold">
                          {pkg.roiMin}% - {pkg.roiMax}%
                        </p>
                      </div>
                      <div>
                        <p className="text-[#94a3b8] text-xs mb-1">Duration</p>
                        <p className="text-[#f8fafc] font-semibold">{pkg.duration} days</p>
                      </div>
                      <div>
                        <p className="text-[#94a3b8] text-xs mb-1">Display Order</p>
                        <p className="text-[#f8fafc] font-semibold">#{pkg.displayOrder}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[#94a3b8] text-xs mb-2">Features:</p>
                      <div className="flex flex-wrap gap-2">
                        {pkg.features.map((feature, idx) => (
                          <span key={idx} className="bg-[#334155] text-[#cbd5e1] px-3 py-1 rounded-full text-xs">
                            ✓ {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    <button
                      onClick={() => handleEditPackage(pkg)}
                      className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(pkg.id)}
                      className={`${
                        pkg.status === 'active'
                          ? 'bg-[#f59e0b] hover:bg-[#d97706]'
                          : 'bg-[#10b981] hover:bg-[#059669]'
                      } text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors`}
                    >
                      {pkg.status === 'active' ? '⏸️ Disable' : '▶️ Enable'}
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Packages Tab */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Search User</label>
                <input
                  type="text"
                  placeholder="Search by name or user ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                />
              </div>
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Package Type</label>
                <select
                  value={filterPackage}
                  onChange={(e) => setFilterPackage(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                >
                  <option value="all">All Packages</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Packages Table */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#334155]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">Package</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">Investment</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">Start Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">End Date</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">Days Left</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">ROI Earned</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {filteredActivePackages.map((ap) => (
                    <tr key={ap.id} className="hover:bg-[#334155]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-[#f8fafc] font-medium">{ap.userName}</p>
                          <p className="text-[#94a3b8] text-sm">{ap.userId}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#f8fafc]">{ap.packageName}</td>
                      <td className="px-6 py-4 text-right text-[#f8fafc] font-semibold">
                        ${ap.investmentAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-[#94a3b8] text-sm">
                        {format(new Date(ap.startDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-[#94a3b8] text-sm">
                        {format(new Date(ap.endDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-semibold ${
                          ap.daysRemaining > 90 ? 'text-[#10b981]' :
                          ap.daysRemaining > 30 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                        }`}>
                          {ap.daysRemaining} days
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[#10b981] font-semibold">
                        ${ap.roiEarned.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ap.status === 'active' ? 'bg-[#10b981]/20 text-[#10b981]' :
                          ap.status === 'completed' ? 'bg-[#00C7D1]/20 text-[#00C7D1]' :
                          'bg-[#ef4444]/20 text-[#ef4444]'
                        }`}>
                          {ap.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleExtendDuration(ap.id)}
                            className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            title="Extend Duration"
                          >
                            ⏱️
                          </button>
                          <button
                            onClick={() => handleCancelPackage(ap.id)}
                            className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-3 py-1 rounded text-xs font-medium transition-colors"
                            title="Cancel Package"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredActivePackages.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#94a3b8]">No active packages found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <p className="text-[#94a3b8] text-sm mb-1">Total Packages Sold</p>
              <p className="text-3xl font-bold text-[#f8fafc]">63</p>
              <p className="text-[#10b981] text-sm mt-2">↑ 12% vs last month</p>
            </div>

            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <p className="text-[#94a3b8] text-sm mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-[#10b981]">$41,700</p>
              <p className="text-[#10b981] text-sm mt-2">↑ 18% vs last month</p>
            </div>

            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <p className="text-[#94a3b8] text-sm mb-1">Avg Investment</p>
              <p className="text-3xl font-bold text-[#00C7D1]">$662</p>
              <p className="text-[#10b981] text-sm mt-2">↑ 5% vs last month</p>
            </div>

            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <p className="text-[#94a3b8] text-sm mb-1">Conversion Rate</p>
              <p className="text-3xl font-bold text-[#f59e0b]">38.5%</p>
              <p className="text-[#ef4444] text-sm mt-2">↓ 2% vs last month</p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Monthly Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#00C7D1" strokeWidth={2} name="Revenue ($)" />
                  <Line type="monotone" dataKey="packages" stroke="#10b981" strokeWidth={2} name="Packages Sold" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue by Package */}
            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Revenue by Package Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={revenueByPackage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {revenueByPackage.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Most Popular Package */}
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Package Performance</h3>
            <div className="space-y-4">
              {packages.map((pkg, idx) => {
                const packageRevenue = revenueByPackage.find(r => r.name === pkg.name.split(' ')[0])?.value || 0;
                const maxRevenue = Math.max(...revenueByPackage.map(r => r.value));
                const percentage = (packageRevenue / maxRevenue) * 100;

                return (
                  <div key={pkg.id}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{pkg.icon}</span>
                        <span className="text-[#f8fafc] font-medium">{pkg.name}</span>
                      </div>
                      <span className="text-[#10b981] font-semibold">${packageRevenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-[#334155] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-[#00C7D1] to-[#10b981] h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ROI Settings Tab */}
      {activeTab === 'roi' && (
        <div className="space-y-6">
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#f8fafc] mb-6">ROI Distribution Configuration</h3>

            <div className="space-y-6">
              {/* Distribution Frequency */}
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Distribution Frequency</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="daily"
                      checked={roiSettings.frequency === 'daily'}
                      onChange={(e) => setROISettings({ ...roiSettings, frequency: e.target.value as 'daily' })}
                      className="w-4 h-4 text-[#00C7D1] focus:ring-[#00C7D1]"
                    />
                    <span className="text-[#f8fafc]">Daily</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="weekly"
                      checked={roiSettings.frequency === 'weekly'}
                      onChange={(e) => setROISettings({ ...roiSettings, frequency: e.target.value as 'weekly' })}
                      className="w-4 h-4 text-[#00C7D1] focus:ring-[#00C7D1]"
                    />
                    <span className="text-[#f8fafc]">Weekly</span>
                  </label>
                </div>
              </div>

              {/* Distribution Time */}
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Distribution Time (UTC)</label>
                <input
                  type="time"
                  value={roiSettings.distributionTime}
                  onChange={(e) => setROISettings({ ...roiSettings, distributionTime: e.target.value })}
                  className="w-full max-w-xs bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                />
              </div>

              {/* Auto Distribution Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roiSettings.autoDistribution}
                    onChange={(e) => setROISettings({ ...roiSettings, autoDistribution: e.target.checked })}
                    className="w-5 h-5 text-[#00C7D1] rounded focus:ring-[#00C7D1]"
                  />
                  <div>
                    <p className="text-[#f8fafc] font-medium">Enable Automatic Distribution</p>
                    <p className="text-[#94a3b8] text-sm">Automatically distribute ROI based on the schedule above</p>
                  </div>
                </label>
              </div>

              {/* Save Button */}
              <div className="flex gap-4">
                <button
                  onClick={() => toast.success('ROI settings saved successfully')}
                  className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Save Settings
                </button>

                <button
                  onClick={handleManualDistribution}
                  className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  disabled={roiSettings.autoDistribution}
                >
                  Trigger Manual Distribution
                </button>
              </div>
            </div>
          </div>

          {/* Distribution History */}
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Recent Distribution History</h3>
            <div className="space-y-3">
              {[
                { date: '2024-05-15', amount: 1245.50, users: 28, status: 'completed' },
                { date: '2024-05-14', amount: 1180.00, users: 27, status: 'completed' },
                { date: '2024-05-13', amount: 1220.75, users: 28, status: 'completed' },
              ].map((dist, idx) => (
                <div key={idx} className="flex justify-between items-center p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                  <div>
                    <p className="text-[#f8fafc] font-medium">{format(new Date(dist.date), 'MMM dd, yyyy')}</p>
                    <p className="text-[#94a3b8] text-sm">{dist.users} users received distribution</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#10b981] font-semibold">${dist.amount.toFixed(2)}</p>
                    <span className="text-xs text-[#10b981]">✓ {dist.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Package Form Modal */}
      {showPackageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#334155]">
            <div className="p-6 border-b border-[#334155]">
              <h2 className="text-2xl font-bold text-[#f8fafc]">
                {selectedPackage ? 'Edit Package' : 'Add New Package'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Package Name */}
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Package Name *</label>
                <input
                  type="text"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                  placeholder="e.g., Premium Package"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Description *</label>
                <textarea
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                  placeholder="Brief description of the package..."
                />
              </div>

              {/* Investment Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94a3b8] text-sm mb-2">Minimum Investment *</label>
                  <input
                    type="number"
                    value={packageForm.minInvestment}
                    onChange={(e) => setPackageForm({ ...packageForm, minInvestment: Number(e.target.value) })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] text-sm mb-2">Maximum Investment *</label>
                  <input
                    type="number"
                    value={packageForm.maxInvestment}
                    onChange={(e) => setPackageForm({ ...packageForm, maxInvestment: Number(e.target.value) })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                    placeholder="10000"
                  />
                </div>
              </div>

              {/* ROI Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94a3b8] text-sm mb-2">Min ROI % *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={packageForm.roiMin}
                    onChange={(e) => setPackageForm({ ...packageForm, roiMin: Number(e.target.value) })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                    placeholder="5.0"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] text-sm mb-2">Max ROI % *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={packageForm.roiMax}
                    onChange={(e) => setPackageForm({ ...packageForm, roiMax: Number(e.target.value) })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                    placeholder="10.0"
                  />
                </div>
              </div>

              {/* Duration and Display Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94a3b8] text-sm mb-2">Duration (days) *</label>
                  <input
                    type="number"
                    value={packageForm.duration}
                    onChange={(e) => setPackageForm({ ...packageForm, duration: Number(e.target.value) })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                    placeholder="365"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] text-sm mb-2">Display Order *</label>
                  <input
                    type="number"
                    value={packageForm.displayOrder}
                    onChange={(e) => setPackageForm({ ...packageForm, displayOrder: Number(e.target.value) })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Icon and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#94a3b8] text-sm mb-2">Icon (Emoji)</label>
                  <input
                    type="text"
                    value={packageForm.icon}
                    onChange={(e) => setPackageForm({ ...packageForm, icon: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                    placeholder="📦"
                  />
                </div>
                <div>
                  <label className="block text-[#94a3b8] text-sm mb-2">Status</label>
                  <select
                    value={packageForm.status}
                    onChange={(e) => setPackageForm({ ...packageForm, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Features (one per line)</label>
                <textarea
                  value={packageForm.features}
                  onChange={(e) => setPackageForm({ ...packageForm, features: e.target.value })}
                  rows={4}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] focus:outline-none focus:border-[#00C7D1]"
                  placeholder="Daily ROI Distribution&#10;24/7 Support&#10;Trading Dashboard Access"
                />
              </div>
            </div>

            <div className="p-6 border-t border-[#334155] flex justify-end gap-4">
              <button
                onClick={() => setShowPackageModal(false)}
                className="bg-[#334155] hover:bg-[#475569] text-[#f8fafc] px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePackage}
                className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {selectedPackage ? 'Update Package' : 'Create Package'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && packageToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-xl max-w-md w-full border border-[#ef4444]">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#ef4444]/20 rounded-full flex items-center justify-center text-2xl">
                  ⚠️
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#f8fafc]">Delete Package</h2>
                  <p className="text-[#94a3b8] text-sm">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-lg p-4 mb-6 border border-[#334155]">
                <p className="text-[#f8fafc] mb-2">
                  Are you sure you want to delete this package?
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-2xl">
                    {packages.find(p => p.id === packageToDelete)?.icon}
                  </span>
                  <span className="text-[#00C7D1] font-semibold">
                    {packages.find(p => p.id === packageToDelete)?.name}
                  </span>
                </div>
                <p className="text-[#ef4444] text-sm mt-3">
                  Warning: This will permanently remove the package configuration. Users with active packages will not be affected.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setPackageToDelete(null);
                  }}
                  className="flex-1 bg-[#334155] hover:bg-[#475569] text-[#f8fafc] px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePackage}
                  className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Delete Package
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageManagement;
