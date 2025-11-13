import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as adminUserService from '../../services/admin-user.service';
import * as kycService from '../../services/kyc.service';
import * as packageService from '../../services/package.service';
import * as impersonateService from '../../services/admin-impersonate.service';
import { KYCSubmission } from '../../types/kyc.types';
import CustomModal from '../../components/ui/CustomModal';

// User interface
interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinDate: string;
  status: 'Active' | 'Suspended' | 'Banned';
  kycStatus: 'Pending' | 'Approved' | 'Rejected' | 'Not Submitted';
  totalInvestment: number;
  walletBalance: number;
  rank: string;
  sponsor: string;
  hasActivePackages: boolean;
  directReferrals: number;
  avatar?: string;
}

// Transaction interface
interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  description: string;
}

// Package interface
interface Package {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: string;
  dailyReturn: number;
}

// Earning interface
interface Earning {
  type: string;
  amount: number;
  percentage: number;
}

// Activity log interface
interface ActivityLog {
  id: string;
  action: string;
  ip: string;
  device: string;
  location: string;
  timestamp: string;
}

// Users are loaded from database via adminUserService.getAllUsers()

const UserManagement: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [sortField, setSortField] = useState<keyof User | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Real users from database
  const [realUsers, setRealUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Real data states for selected user
  const [userDetailedInfo, setUserDetailedInfo] = useState<adminUserService.UserDetailedInfo | null>(null);
  const [userPackages, setUserPackages] = useState<adminUserService.UserPackageInfo[]>([]);
  const [userTransactions, setUserTransactions] = useState<adminUserService.UserTransaction[]>([]);
  const [userTeam, setUserTeam] = useState<adminUserService.TeamMember[]>([]);
  const [userEarnings, setUserEarnings] = useState<adminUserService.UserEarnings | null>(null);
  const [userKYC, setUserKYC] = useState<KYCSubmission | null>(null);
  const [userActivity, setUserActivity] = useState<adminUserService.ActivityLog[]>([]);
  const [loadingTabData, setLoadingTabData] = useState(false);

  // Modal states
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'input' | 'confirm' | 'info';
    title: string;
    message?: string;
    inputLabel?: string;
    inputPlaceholder?: string;
    inputType?: string;
    onConfirm?: (value?: string) => void;
    variant?: 'default' | 'danger' | 'success' | 'warning';
  }>({
    isOpen: false,
    type: 'confirm',
    title: '',
  });

  // Available packages for admin to assign
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);

  // Filter states
  const [filters, setFilters] = useState({
    status: 'All',
    kycStatus: 'All',
    joinDateFrom: '',
    joinDateTo: '',
    investmentMin: '',
    investmentMax: '',
    rank: 'All',
    hasActivePackages: 'All',
  });

  // Items per page
  const itemsPerPage = 10;

  // Fetch all users from database on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const { users } = await adminUserService.getAllUsers({}, 1, 100);

        // Convert database users to UI format
        const formattedUsers: User[] = users.map((user) => ({
          id: user.id,
          name: user.full_name || 'Unknown User',
          email: user.email,
          phone: user.phone || 'N/A',
          joinDate: new Date(user.created_at).toISOString().split('T')[0],
          status: user.is_active ? 'Active' : 'Suspended',
          kycStatus: user.kyc_status === 'approved' ? 'Approved' :
                     user.kyc_status === 'pending' ? 'Pending' :
                     user.kyc_status === 'rejected' ? 'Rejected' : 'Not Submitted',
          totalInvestment: user.total_investment || 0,
          walletBalance: user.wallet_balance || 0,
          rank: user.rank || 'Starter',
          sponsor: user.referred_by || 'N/A',
          hasActivePackages: (user.active_packages || 0) > 0,
          directReferrals: user.direct_count || 0,
        }));

        setRealUsers(formattedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Fetch available packages for admin assignment
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const packages = await packageService.getAvailablePackages();
        setAvailablePackages(packages);
      } catch (error) {
        console.error('Error fetching packages:', error);
      }
    };

    fetchPackages();
  }, []);

  // Fetch user data when selectedUser or activeTab changes
  useEffect(() => {
    const fetchUserData = async () => {
      if (!selectedUser) {
        setUserDetailedInfo(null);
        setUserPackages([]);
        setUserTransactions([]);
        setUserTeam([]);
        setUserEarnings(null);
        setUserKYC(null);
        setUserActivity([]);
        return;
      }

      setLoadingTabData(true);

      try {
        // Fetch data based on active tab for performance
        switch (activeTab) {
          case 'overview':
            const [detailedInfo, team, earnings, recentTransactions] = await Promise.all([
              adminUserService.getUserDetailedInfo(selectedUser.id),
              adminUserService.getUserTeam(selectedUser.id),
              adminUserService.getUserEarnings(selectedUser.id),
              adminUserService.getUserTransactions(selectedUser.id, 10), // Get last 10 for recent activity
            ]);
            setUserDetailedInfo(detailedInfo);
            setUserTeam(team);
            setUserEarnings(earnings);
            setUserTransactions(recentTransactions);

            // Log if user info couldn't be loaded
            if (!detailedInfo) {
              console.warn('Could not load detailed user info for:', selectedUser.id);
            }
            break;

          case 'packages':
            const packages = await adminUserService.getUserPackages(selectedUser.id);
            setUserPackages(packages);
            break;

          case 'transactions':
            const transactions = await adminUserService.getUserTransactions(selectedUser.id);
            setUserTransactions(transactions);
            break;

          case 'team':
            const teamMembers = await adminUserService.getUserTeam(selectedUser.id);
            setUserTeam(teamMembers);
            break;

          case 'earnings':
            const earningsData = await adminUserService.getUserEarnings(selectedUser.id);
            setUserEarnings(earningsData);
            break;

          case 'kyc':
            // Get user's KYC submission
            const kycSubmissions = await kycService.getAllKYCSubmissions();
            const userKycSubmission = kycSubmissions.find(sub => sub.user_id === selectedUser.id);
            setUserKYC(userKycSubmission || null);
            break;

          case 'activity':
            const activityLog = await adminUserService.getUserActivityLog(selectedUser.id);
            setUserActivity(activityLog);
            break;

          case 'admin_actions':
            // Admin actions tab doesn't need to load additional data
            // It just shows action cards that trigger functions
            break;

          default:
            console.warn('Unknown tab:', activeTab);
            break;
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Only show error for genuine exceptions, not for missing data
        if (error instanceof Error) {
          console.error('Exception details:', error.message, error.stack);
          // Don't show toast error - data will just show as empty
        }
      } finally {
        setLoadingTabData(false);
      }
    };

    fetchUserData();
  }, [selectedUser, activeTab]);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return realUsers.filter((user) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        user.id.toLowerCase().includes(searchLower) ||
        user.phone.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Status filter
      if (filters.status !== 'All' && user.status !== filters.status) return false;

      // KYC status filter
      if (filters.kycStatus !== 'All' && user.kycStatus !== filters.kycStatus) return false;

      // Join date filter
      if (filters.joinDateFrom && user.joinDate < filters.joinDateFrom) return false;
      if (filters.joinDateTo && user.joinDate > filters.joinDateTo) return false;

      // Investment filter
      if (filters.investmentMin && user.totalInvestment < parseFloat(filters.investmentMin)) return false;
      if (filters.investmentMax && user.totalInvestment > parseFloat(filters.investmentMax)) return false;

      // Rank filter
      if (filters.rank !== 'All' && user.rank !== filters.rank) return false;

      // Active packages filter
      if (filters.hasActivePackages === 'Yes' && !user.hasActivePackages) return false;
      if (filters.hasActivePackages === 'No' && user.hasActivePackages) return false;

      return true;
    });
  }, [realUsers, searchTerm, filters]);

  // Sort users
  const sortedUsers = useMemo(() => {
    if (!sortField) return filteredUsers;

    return [...filteredUsers].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle different types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }, [filteredUsers, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sorting
  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Select all users on current page
  const toggleSelectAll = () => {
    if (selectedUsers.length === paginatedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(paginatedUsers.map((u) => u.id));
    }
  };

  // Status badge styling
  const getStatusBadge = (status: string) => {
    const styles = {
      Active: 'bg-green-100 text-green-800',
      Suspended: 'bg-yellow-100 text-yellow-800',
      Banned: 'bg-red-100 text-red-800',
      Approved: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Rejected: 'bg-red-100 text-red-800',
      'Not Submitted': 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  // Bulk actions
  const handleBulkExport = () => {
    console.log('Exporting users:', selectedUsers);
    toast.success(`Exporting ${selectedUsers.length} users to CSV...`);
    setShowBulkMenu(false);
  };

  const handleBulkExportPDF = () => {
    console.log('Exporting users to PDF:', selectedUsers);
    toast.success(`Exporting ${selectedUsers.length} users to PDF...`);
    setShowBulkMenu(false);
  };

  const handleBulkEmail = () => {
    console.log('Sending email to:', selectedUsers);
    toast.success(`Opening email composer for ${selectedUsers.length} users...`);
    setShowBulkMenu(false);
  };

  const handleBulkSuspend = () => {
    console.log('Suspending users:', selectedUsers);
    if (confirm(`Are you sure you want to suspend ${selectedUsers.length} users?`)) {
      toast.success(`${selectedUsers.length} users suspended successfully!`);
      setSelectedUsers([]);
      setShowBulkMenu(false);
    }
  };

  const handleBulkActivate = () => {
    console.log('Activating users:', selectedUsers);
    if (confirm(`Are you sure you want to activate ${selectedUsers.length} users?`)) {
      toast.success(`${selectedUsers.length} users activated successfully!`);
      setSelectedUsers([]);
      setShowBulkMenu(false);
    }
  };

  const handleBulkDelete = () => {
    console.log('Deleting users:', selectedUsers);
    if (confirm(`Are you sure you want to DELETE ${selectedUsers.length} users? This action cannot be undone!`)) {
      toast.success(`${selectedUsers.length} users deleted successfully!`);
      setSelectedUsers([]);
      setShowBulkMenu(false);
    }
  };

  const handleBulkChangeRank = () => {
    console.log('Opening rank change modal for users:', selectedUsers);
    toast.success(`Opening rank change dialog for ${selectedUsers.length} users...`);
    setShowBulkMenu(false);
  };

  const handleBulkSendNotification = () => {
    console.log('Sending notification to users:', selectedUsers);
    toast.success(`Opening notification composer for ${selectedUsers.length} users...`);
    setShowBulkMenu(false);
  };

  const handleBulkApproveKYC = () => {
    console.log('Approving KYC for users:', selectedUsers);
    if (confirm(`Are you sure you want to approve KYC for ${selectedUsers.length} users?`)) {
      toast.success(`KYC approved for ${selectedUsers.length} users!`);
      setSelectedUsers([]);
      setShowBulkMenu(false);
    }
  };

  const handleBulkRejectKYC = () => {
    console.log('Rejecting KYC for users:', selectedUsers);
    if (confirm(`Are you sure you want to reject KYC for ${selectedUsers.length} users?`)) {
      toast.success(`KYC rejected for ${selectedUsers.length} users!`);
      setSelectedUsers([]);
      setShowBulkMenu(false);
    }
  };

  // Impersonate user
  const handleImpersonateUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to impersonate this user? You will be redirected to their dashboard.\n\nUser: ${userEmail}`)) {
      return;
    }

    const toastId = toast.loading('Impersonating user...');

    try {
      const result = await impersonateService.impersonateUser(userId);

      if (result.success) {
        toast.success('Successfully impersonating user! Redirecting...', { id: toastId });

        // Redirect to user dashboard using window.location to force full reload with new context
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        toast.error(result.error || 'Failed to impersonate user', { id: toastId });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to impersonate user', { id: toastId });
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      status: 'All',
      kycStatus: 'All',
      joinDateFrom: '',
      joinDateTo: '',
      investmentMin: '',
      investmentMax: '',
      rank: 'All',
      hasActivePackages: 'All',
    });
  };

  // Render user details tabs
  const renderUserDetailsTab = () => {
    if (!selectedUser) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Wallet Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                <div className="text-sm opacity-90">Wallet Balance</div>
                <div className="text-2xl font-bold mt-1">${selectedUser.walletBalance.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
                <div className="text-sm opacity-90">Total Investment</div>
                <div className="text-2xl font-bold mt-1">${selectedUser.totalInvestment.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                <div className="text-sm opacity-90">Current Rank</div>
                <div className="text-2xl font-bold mt-1">{selectedUser.rank}</div>
              </div>
            </div>

            {/* Team Statistics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Direct Referrals</div>
                  <div className="text-xl font-bold text-gray-900">
                    {userDetailedInfo?.total_referrals || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Active Packages</div>
                  <div className="text-xl font-bold text-gray-900">
                    {userDetailedInfo?.active_packages || 0}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Earnings</div>
                  <div className="text-xl font-bold text-gray-900">
                    ${(userEarnings?.total_earnings || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Pending Withdrawals</div>
                  <div className="text-xl font-bold text-gray-900">
                    {userDetailedInfo?.pending_withdrawals || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {loadingTabData ? (
                  <div className="py-8 text-center text-gray-500">
                    Loading recent activity...
                  </div>
                ) : userTransactions.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No recent activity
                  </div>
                ) : (
                  userTransactions.slice(0, 5).map((txn) => {
                    const getActivityType = (type: string) => {
                      if (type.includes('package')) return 'purchase';
                      if (type.includes('withdrawal')) return 'withdrawal';
                      if (type.includes('commission') || type.includes('bonus')) return 'bonus';
                      return 'roi';
                    };

                    const getTimeAgo = (date: string) => {
                      const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
                      if (seconds < 60) return 'just now';
                      if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
                      if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
                      return `${Math.floor(seconds / 86400)} days ago`;
                    };

                    const activityType = getActivityType(txn.transaction_type);
                    const activityLabel = txn.transaction_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                    return (
                      <div key={txn.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activityType === 'purchase' ? 'bg-blue-100 text-blue-600' :
                            activityType === 'withdrawal' ? 'bg-red-100 text-red-600' :
                            activityType === 'bonus' ? 'bg-green-100 text-green-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {activityType === 'purchase' ? '📦' : activityType === 'withdrawal' ? '⬆️' : activityType === 'bonus' ? '🎁' : '💰'}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{activityLabel}</div>
                            <div className="text-sm text-gray-500">{getTimeAgo(txn.created_at)}</div>
                          </div>
                        </div>
                        <div className={`font-semibold ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.amount >= 0 ? '+' : ''}${Math.abs(txn.amount).toLocaleString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );

      case 'packages':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Active Packages</h3>
              <button
                onClick={() => {
                  if (availablePackages.length === 0) {
                    toast.error('No packages available. Please create packages first.');
                    return;
                  }

                  // Create package list message
                  const packageList = availablePackages
                    .map((pkg, idx) => `${idx + 1}. ${pkg.name} - $${pkg.price.toLocaleString()} (${pkg.daily_return_percentage}% daily)`)
                    .join('\n');

                  let selectedPackageIndex = -1;
                  let selectedAmount = '';

                  // Step 1: Select package
                  setModalConfig({
                    isOpen: true,
                    type: 'input',
                    title: 'Select Package',
                    message: `Available Packages:\n\n${packageList}\n\nEnter the package number (1-${availablePackages.length}):`,
                    inputLabel: 'Package Number',
                    inputPlaceholder: 'e.g., 1',
                    inputType: 'number',
                    variant: 'default',
                    onConfirm: async (pkgNum) => {
                      const pkgIndex = parseInt(pkgNum || '0') - 1;
                      if (pkgIndex < 0 || pkgIndex >= availablePackages.length) {
                        toast.error('Invalid package number');
                        return;
                      }

                      selectedPackageIndex = pkgIndex;
                      const selectedPkg = availablePackages[pkgIndex];

                      // Step 2: Enter amount
                      setModalConfig({
                        isOpen: true,
                        type: 'input',
                        title: 'Investment Amount',
                        message: `Package: ${selectedPkg.name}\nMin: $${selectedPkg.min_investment?.toLocaleString() || selectedPkg.price.toLocaleString()}\nMax: $${selectedPkg.max_investment?.toLocaleString() || 'No limit'}\n\nEnter investment amount:`,
                        inputLabel: 'Amount ($)',
                        inputPlaceholder: `e.g., ${selectedPkg.price}`,
                        inputType: 'number',
                        variant: 'default',
                        onConfirm: async (amount) => {
                          selectedAmount = amount || '';
                          const amt = parseFloat(selectedAmount);

                          if (isNaN(amt) || amt <= 0) {
                            toast.error('Invalid amount');
                            return;
                          }

                          const minInvest = selectedPkg.min_investment || selectedPkg.price;
                          if (amt < minInvest) {
                            toast.error(`Minimum investment is $${minInvest.toLocaleString()}`);
                            return;
                          }

                          if (selectedPkg.max_investment && amt > selectedPkg.max_investment) {
                            toast.error(`Maximum investment is $${selectedPkg.max_investment.toLocaleString()}`);
                            return;
                          }

                          // Step 3: Enter reason
                          setModalConfig({
                            isOpen: true,
                            type: 'input',
                            title: 'Reason for Assignment',
                            message: `You are assigning:\n• ${selectedPkg.name}\n• Amount: $${amt.toLocaleString()}\n• User: ${selectedUser?.name}\n\nPlease provide a reason:`,
                            inputLabel: 'Reason',
                            inputPlaceholder: 'e.g., Promotional bonus',
                            variant: 'success',
                            onConfirm: async (reason) => {
                              try {
                                await adminUserService.assignPackageToUser(
                                  selectedUser!.id,
                                  selectedPkg.id,
                                  amt,
                                  reason || 'Admin assigned'
                                );
                                toast.success(`Package assigned successfully!`);

                                // Refresh package list
                                const packages = await adminUserService.getUserPackages(selectedUser!.id);
                                setUserPackages(packages);

                                // Refresh user detailed info to update total investment
                                const detailedInfo = await adminUserService.getUserDetailedInfo(selectedUser!.id);
                                setUserDetailedInfo(detailedInfo);
                              } catch (error: any) {
                                toast.error(error.message || 'Failed to assign package');
                              }
                            },
                          });
                        },
                      });
                    },
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Package
              </button>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Daily Return</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingTabData ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Loading packages...
                      </td>
                    </tr>
                  ) : userPackages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No packages found
                      </td>
                    </tr>
                  ) : (
                    userPackages.map((pkg) => (
                      <tr key={pkg.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{pkg.package_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">${pkg.amount_invested.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(pkg.start_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(pkg.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">${pkg.daily_return.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            pkg.status === 'active' ? 'bg-green-100 text-green-800' :
                            pkg.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            pkg.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {pkg.status.charAt(0).toUpperCase() + pkg.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            className="text-blue-600 hover:text-blue-800 mr-3"
                            onClick={() => toast.info('Edit package feature coming soon')}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={async () => {
                              if (confirm(`Are you sure you want to cancel this package?`)) {
                                try {
                                  await adminUserService.cancelUserPackage(pkg.id, 'Admin cancelled');
                                  toast.success('Package cancelled successfully');
                                  // Refresh packages
                                  const packages = await adminUserService.getUserPackages(selectedUser!.id);
                                  setUserPackages(packages);
                                } catch (error: any) {
                                  toast.error(error.message || 'Failed to cancel package');
                                }
                              }
                            }}
                            disabled={pkg.status === 'cancelled' || pkg.status === 'completed'}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              <button
                onClick={() => {
                  const transactionTypes = [
                    { value: 'admin_credit', label: 'Credit (Add to wallet)', sign: '+' },
                    { value: 'admin_debit', label: 'Debit (Deduct from wallet)', sign: '-' },
                    { value: 'referral_commission', label: 'Referral Commission', sign: '+' },
                    { value: 'binary_commission', label: 'Binary Commission', sign: '+' },
                    { value: 'rank_bonus', label: 'Rank Bonus', sign: '+' },
                    { value: 'package_return', label: 'Package Return', sign: '+' },
                  ];

                  const typeList = transactionTypes
                    .map((type, idx) => `${idx + 1}. ${type.label}`)
                    .join('\n');

                  let selectedType = '';
                  let selectedAmount = '';

                  // Step 1: Select transaction type
                  setModalConfig({
                    isOpen: true,
                    type: 'input',
                    title: 'Select Transaction Type',
                    message: `Transaction Types:\n\n${typeList}\n\nEnter the transaction type number (1-${transactionTypes.length}):`,
                    inputLabel: 'Type Number',
                    inputPlaceholder: 'e.g., 1',
                    inputType: 'number',
                    variant: 'default',
                    onConfirm: async (typeNum) => {
                      const typeIndex = parseInt(typeNum || '0') - 1;
                      if (typeIndex < 0 || typeIndex >= transactionTypes.length) {
                        toast.error('Invalid transaction type number');
                        return;
                      }

                      const selectedTxType = transactionTypes[typeIndex];
                      selectedType = selectedTxType.value;

                      // Step 2: Enter amount
                      setModalConfig({
                        isOpen: true,
                        type: 'input',
                        title: 'Transaction Amount',
                        message: `Type: ${selectedTxType.label}\n\nEnter amount (will be ${selectedTxType.sign === '+' ? 'added to' : 'deducted from'} wallet if credit/debit):`,
                        inputLabel: 'Amount ($)',
                        inputPlaceholder: 'e.g., 1000',
                        inputType: 'number',
                        variant: selectedTxType.sign === '+' ? 'success' : 'warning',
                        onConfirm: async (amount) => {
                          selectedAmount = amount || '';
                          const amt = parseFloat(selectedAmount);

                          if (isNaN(amt) || amt <= 0) {
                            toast.error('Invalid amount');
                            return;
                          }

                          // Step 3: Enter description
                          setModalConfig({
                            isOpen: true,
                            type: 'input',
                            title: 'Transaction Description',
                            message: `Type: ${selectedTxType.label}\nAmount: ${selectedTxType.sign}$${amt.toLocaleString()}\nUser: ${selectedUser?.name}\n\nProvide a description:`,
                            inputLabel: 'Description',
                            inputPlaceholder: 'e.g., Manual adjustment for...',
                            variant: 'default',
                            onConfirm: async (description) => {
                              try {
                                // Calculate final amount based on sign
                                const finalAmount = selectedTxType.sign === '-' ? -Math.abs(amt) : Math.abs(amt);

                                await adminUserService.createManualTransaction(
                                  selectedUser!.id,
                                  selectedType,
                                  finalAmount,
                                  description || 'Admin manual transaction'
                                );
                                toast.success('Transaction created successfully!');

                                // Refresh transaction list
                                const transactions = await adminUserService.getUserTransactions(selectedUser!.id);
                                setUserTransactions(transactions);

                                // Refresh user detailed info to update wallet balance if credit/debit
                                if (selectedType === 'admin_credit' || selectedType === 'admin_debit') {
                                  const detailedInfo = await adminUserService.getUserDetailedInfo(selectedUser!.id);
                                  setUserDetailedInfo(detailedInfo);
                                }
                              } catch (error: any) {
                                toast.error(error.message || 'Failed to create transaction');
                              }
                            },
                          });
                        },
                      });
                    },
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Manual Entry
              </button>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingTabData ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : userTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    userTransactions.map((txn) => (
                      <tr key={txn.id}>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                          {txn.id.substring(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {txn.transaction_type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </td>
                        <td className={`px-4 py-3 text-sm font-semibold ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {txn.amount >= 0 ? '+' : ''}${Math.abs(txn.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            txn.status === 'completed' ? 'bg-green-100 text-green-800' :
                            txn.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            txn.status === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {txn.status.charAt(0).toUpperCase() + txn.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(txn.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {txn.metadata?.description || txn.transaction_type}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Direct Referrals ({userTeam.length})
              </h3>
              <div className="space-y-3">
                {loadingTabData ? (
                  <div className="py-8 text-center text-gray-500">
                    Loading team members...
                  </div>
                ) : userTeam.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    No team members found
                  </div>
                ) : (
                  userTeam.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {referral.full_name ? referral.full_name[0].toUpperCase() : '?'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{referral.full_name || 'Unknown'}</div>
                          <div className="text-sm text-gray-500">
                            {referral.email} • Joined {new Date(referral.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Rank: {referral.rank || 'Starter'}</div>
                        <div className="font-semibold text-gray-900">${referral.total_investment.toLocaleString()}</div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          referral.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {referral.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'earnings':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Earnings Breakdown</h3>
              <button
                onClick={() => {
                  const earningTypes = [
                    { value: 'package_return', label: 'ROI/Package Return' },
                    { value: 'referral_commission', label: 'Referral Commission' },
                    { value: 'binary_commission', label: 'Binary Commission' },
                    { value: 'rank_bonus', label: 'Rank Bonus' },
                  ];

                  const typeList = earningTypes
                    .map((type, idx) => `${idx + 1}. ${type.label}`)
                    .join('\n');

                  let selectedType = '';
                  let selectedAmount = '';

                  // Step 1: Select earning type
                  setModalConfig({
                    isOpen: true,
                    type: 'input',
                    title: 'Select Earning Type',
                    message: `Earning Types:\n\n${typeList}\n\nEnter the earning type number (1-${earningTypes.length}):`,
                    inputLabel: 'Type Number',
                    inputPlaceholder: 'e.g., 1',
                    inputType: 'number',
                    variant: 'default',
                    onConfirm: async (typeNum) => {
                      const typeIndex = parseInt(typeNum || '0') - 1;
                      if (typeIndex < 0 || typeIndex >= earningTypes.length) {
                        toast.error('Invalid earning type number');
                        return;
                      }

                      const selectedEarnType = earningTypes[typeIndex];
                      selectedType = selectedEarnType.value;

                      // Step 2: Enter amount
                      setModalConfig({
                        isOpen: true,
                        type: 'input',
                        title: 'Earning Amount',
                        message: `Type: ${selectedEarnType.label}\n\nThis amount will be added to the user's wallet and earnings record.\n\nEnter amount:`,
                        inputLabel: 'Amount ($)',
                        inputPlaceholder: 'e.g., 500',
                        inputType: 'number',
                        variant: 'success',
                        onConfirm: async (amount) => {
                          selectedAmount = amount || '';
                          const amt = parseFloat(selectedAmount);

                          if (isNaN(amt) || amt <= 0) {
                            toast.error('Invalid amount');
                            return;
                          }

                          // Step 3: Enter reason
                          setModalConfig({
                            isOpen: true,
                            type: 'input',
                            title: 'Reason for Adjustment',
                            message: `Type: ${selectedEarnType.label}\nAmount: +$${amt.toLocaleString()}\nUser: ${selectedUser?.name}\n\nProvide a reason:`,
                            inputLabel: 'Reason',
                            inputPlaceholder: 'e.g., Performance bonus',
                            variant: 'success',
                            onConfirm: async (reason) => {
                              try {
                                // Create earning transaction with positive amount
                                await adminUserService.createManualTransaction(
                                  selectedUser!.id,
                                  selectedType,
                                  amt, // Always positive for earnings
                                  reason || 'Admin manual earning adjustment'
                                );
                                toast.success('Earning adjustment created successfully!');

                                // Refresh earnings data
                                const earnings = await adminUserService.getUserEarnings(selectedUser!.id);
                                setUserEarnings(earnings);

                                // Refresh user detailed info to update wallet balance
                                const detailedInfo = await adminUserService.getUserDetailedInfo(selectedUser!.id);
                                setUserDetailedInfo(detailedInfo);
                              } catch (error: any) {
                                toast.error(error.message || 'Failed to create earning adjustment');
                              }
                            },
                          });
                        },
                      });
                    },
                  });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manual Adjustment
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingTabData ? (
                <div className="col-span-2 py-8 text-center text-gray-500">
                  Loading earnings data...
                </div>
              ) : !userEarnings ? (
                <div className="col-span-2 py-8 text-center text-gray-500">
                  No earnings data found
                </div>
              ) : (
                [
                  { type: 'ROI Earnings', amount: userEarnings.roi_earnings, key: 'roi' },
                  { type: 'Referral Earnings', amount: userEarnings.referral_earnings, key: 'referral' },
                  { type: 'Binary Earnings', amount: userEarnings.binary_earnings, key: 'binary' },
                  { type: 'Rank Bonus', amount: userEarnings.rank_bonus, key: 'rank' },
                ].map((earning) => {
                  const percentage = userEarnings.total_earnings > 0
                    ? (earning.amount / userEarnings.total_earnings) * 100
                    : 0;
                  return (
                    <div key={earning.key} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-sm font-medium text-gray-600">{earning.type}</div>
                        <div className="text-xs font-semibold text-gray-500">{percentage.toFixed(1)}%</div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">${earning.amount.toLocaleString()}</div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'kyc':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">KYC Documents</h3>
                {userKYC && (
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    userKYC.status === 'approved' ? 'bg-green-100 text-green-800' :
                    userKYC.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    userKYC.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {userKYC.status.charAt(0).toUpperCase() + userKYC.status.slice(1)}
                  </span>
                )}
              </div>

              {loadingTabData ? (
                <div className="py-8 text-center text-gray-500">
                  Loading KYC data...
                </div>
              ) : !userKYC ? (
                <div className="py-8 text-center text-gray-500">
                  No KYC submission found
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Full Name</div>
                      <div className="font-medium">{userKYC.full_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Date of Birth</div>
                      <div className="font-medium">{userKYC.date_of_birth}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Nationality</div>
                      <div className="font-medium">{userKYC.nationality}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Document Type</div>
                      <div className="font-medium">{userKYC.document_type}</div>
                    </div>
                  </div>

                  {userKYC.front_document_url && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-900 mb-2">Front Document</div>
                      <div className="bg-gray-100 rounded-lg p-8 text-center">
                        <div className="text-4xl mb-2">🆔</div>
                        <a
                          href={userKYC.front_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                  )}

                  {userKYC.back_document_url && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-900 mb-2">Back Document</div>
                      <div className="bg-gray-100 rounded-lg p-8 text-center">
                        <div className="text-4xl mb-2">🆔</div>
                        <a
                          href={userKYC.back_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                  )}

                  {userKYC.selfie_url && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-900 mb-2">Selfie</div>
                      <div className="bg-gray-100 rounded-lg p-8 text-center">
                        <div className="text-4xl mb-2">🤳</div>
                        <a
                          href={userKYC.selfie_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          View Selfie
                        </a>
                      </div>
                    </div>
                  )}

                  {userKYC.proof_of_address_url && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-900 mb-2">Proof of Address</div>
                      <div className="bg-gray-100 rounded-lg p-8 text-center">
                        <div className="text-4xl mb-2">📄</div>
                        <a
                          href={userKYC.proof_of_address_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          View Document
                        </a>
                      </div>
                    </div>
                  )}

                  {userKYC.status === 'pending' && (
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to approve this KYC submission?')) {
                            try {
                              await kycService.approveKYC(userKYC.id, 'Approved by admin');
                              toast.success('KYC approved successfully');
                              // Refresh KYC data
                              const kycSubmissions = await kycService.getAllKYCSubmissions();
                              const userKycSubmission = kycSubmissions.find(sub => sub.user_id === selectedUser!.id);
                              setUserKYC(userKycSubmission || null);
                            } catch (error: any) {
                              toast.error(error.message || 'Failed to approve KYC');
                            }
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        Approve KYC
                      </button>
                      <button
                        onClick={async () => {
                          const reason = prompt('Enter rejection reason:');
                          if (reason) {
                            try {
                              await kycService.rejectKYC(userKYC.id, reason, 'Rejected by admin');
                              toast.success('KYC rejected');
                              // Refresh KYC data
                              const kycSubmissions = await kycService.getAllKYCSubmissions();
                              const userKycSubmission = kycSubmissions.find(sub => sub.user_id === selectedUser!.id);
                              setUserKYC(userKycSubmission || null);
                            } catch (error: any) {
                              toast.error(error.message || 'Failed to reject KYC');
                            }
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        Reject KYC
                      </button>
                    </div>
                  )}

                  {userKYC.rejection_reason && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-sm font-medium text-red-900">Rejection Reason</div>
                      <div className="text-sm text-red-700 mt-1">{userKYC.rejection_reason}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loadingTabData ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Loading activity log...
                      </td>
                    </tr>
                  ) : userActivity.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No activity log available
                      </td>
                    </tr>
                  ) : (
                    userActivity.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{log.action}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                          {log.metadata?.ip || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.metadata?.device || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {log.metadata?.location || 'N/A'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'admin-actions':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Admin Actions</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Adjust Wallet Balance */}
                <button
                  onClick={() => {
                    let tempAmount = '';
                    setModalConfig({
                      isOpen: true,
                      type: 'input',
                      title: 'Adjust Wallet Balance',
                      message: 'Enter the amount to adjust (use negative for deduction)',
                      inputLabel: 'Amount',
                      inputPlaceholder: 'e.g., 100 or -50',
                      inputType: 'number',
                      variant: 'default',
                      onConfirm: async (amount) => {
                        tempAmount = amount || '';
                        setModalConfig({
                          isOpen: true,
                          type: 'input',
                          title: 'Reason for Adjustment',
                          message: 'Please provide a reason for this wallet adjustment',
                          inputLabel: 'Reason',
                          inputPlaceholder: 'e.g., Manual correction',
                          variant: 'default',
                          onConfirm: async (reason) => {
                            try {
                              const amt = parseFloat(tempAmount);
                              await adminUserService.adjustWalletBalance(selectedUser!.id, amt, reason || '');
                              toast.success('Wallet balance adjusted successfully!');
                              const detailedInfo = await adminUserService.getUserDetailedInfo(selectedUser!.id);
                              setUserDetailedInfo(detailedInfo);
                            } catch (error: any) {
                              toast.error(error.message || 'Failed to adjust wallet balance');
                            }
                          },
                        });
                      },
                    });
                  }}
                  className="group p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all text-left bg-gradient-to-br from-white to-blue-50/30 hover:to-blue-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      💰
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-base mb-1">Adjust Wallet Balance</div>
                      <div className="text-sm text-gray-600">Add or deduct from user's wallet</div>
                    </div>
                  </div>
                </button>

                {/* Change Rank */}
                <button
                  onClick={() => {
                    let tempRank = '';
                    setModalConfig({
                      isOpen: true,
                      type: 'input',
                      title: 'Change User Rank',
                      message: 'Enter the new rank for this user',
                      inputLabel: 'New Rank',
                      inputPlaceholder: 'e.g., Starter, Bronze, Silver, Gold, Platinum, Diamond',
                      variant: 'default',
                      onConfirm: async (rank) => {
                        tempRank = rank || '';
                        setModalConfig({
                          isOpen: true,
                          type: 'input',
                          title: 'Reason for Rank Change',
                          message: 'Please provide a reason for this rank change',
                          inputLabel: 'Reason',
                          inputPlaceholder: 'e.g., Performance achievement',
                          variant: 'default',
                          onConfirm: async (reason) => {
                            try {
                              await adminUserService.changeUserRank(selectedUser!.id, tempRank, reason || '');
                              toast.success('User rank changed successfully!');
                              const detailedInfo = await adminUserService.getUserDetailedInfo(selectedUser!.id);
                              setUserDetailedInfo(detailedInfo);
                            } catch (error: any) {
                              toast.error(error.message || 'Failed to change rank');
                            }
                          },
                        });
                      },
                    });
                  }}
                  className="group p-6 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all text-left bg-gradient-to-br from-white to-purple-50/30 hover:to-purple-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🏆
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-base mb-1">Change Rank</div>
                      <div className="text-sm text-gray-600">Manually update user's rank</div>
                    </div>
                  </div>
                </button>

                {/* Suspend Account */}
                <button
                  onClick={() => {
                    setModalConfig({
                      isOpen: true,
                      type: 'input',
                      title: 'Suspend User Account',
                      message: `Are you sure you want to suspend ${selectedUser!.name}'s account? This will temporarily disable their access.`,
                      inputLabel: 'Reason for Suspension',
                      inputPlaceholder: 'e.g., Policy violation',
                      variant: 'warning',
                      onConfirm: async (reason) => {
                        try {
                          await adminUserService.suspendUser(selectedUser!.id, reason || '');
                          toast.success('User suspended successfully!');
                          const detailedInfo = await adminUserService.getUserDetailedInfo(selectedUser!.id);
                          setUserDetailedInfo(detailedInfo);
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to suspend user');
                        }
                      },
                    });
                  }}
                  className="group p-6 border-2 border-gray-200 rounded-xl hover:border-yellow-500 hover:shadow-lg transition-all text-left bg-gradient-to-br from-white to-yellow-50/30 hover:to-yellow-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      ⏸️
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-base mb-1">Suspend Account</div>
                      <div className="text-sm text-gray-600">Temporarily disable user access</div>
                    </div>
                  </div>
                </button>

                {/* Activate Account */}
                <button
                  onClick={() => {
                    setModalConfig({
                      isOpen: true,
                      type: 'confirm',
                      title: 'Activate User Account',
                      message: `Are you sure you want to activate ${selectedUser!.name}'s account? This will enable their access.`,
                      variant: 'success',
                      onConfirm: async () => {
                        try {
                          await adminUserService.activateUser(selectedUser!.id);
                          toast.success('User activated successfully!');
                          const detailedInfo = await adminUserService.getUserDetailedInfo(selectedUser!.id);
                          setUserDetailedInfo(detailedInfo);
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to activate user');
                        }
                      },
                    });
                  }}
                  className="group p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:shadow-lg transition-all text-left bg-gradient-to-br from-white to-green-50/30 hover:to-green-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      ✅
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-base mb-1">Activate Account</div>
                      <div className="text-sm text-gray-600">Enable user access</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    toast.info('Password reset feature coming soon');
                  }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">🔑</div>
                  <div className="font-medium text-gray-900">Reset Password</div>
                  <div className="text-sm text-gray-600 mt-1">Send password reset link</div>
                </button>

                <button
                  onClick={() => {
                    toast.info('Send email feature coming soon');
                  }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">📧</div>
                  <div className="font-medium text-gray-900">Send Email</div>
                  <div className="text-sm text-gray-600 mt-1">Send custom email to user</div>
                </button>

                <button
                  onClick={() => {
                    toast.info('Add admin note feature coming soon');
                  }}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <div className="font-medium text-gray-900">Add Admin Note</div>
                  <div className="text-sm text-gray-600 mt-1">Add internal note about user</div>
                </button>

                <button
                  onClick={() => handleImpersonateUser(selectedUser!.id, selectedUser!.email)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">👤</div>
                  <div className="font-medium text-gray-900">Impersonate User</div>
                  <div className="text-sm text-gray-600 mt-1">Login as this user</div>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all users, view details, and perform admin actions</p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by name, email, user ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute left-3 top-2.5 text-gray-400">🔍</div>
              </div>
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Create User Button */}
            <button
              onClick={() => setShowCreateUser(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Create User
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All">All</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Banned">Banned</option>
                  </select>
                </div>

                {/* KYC Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">KYC Status</label>
                  <select
                    value={filters.kycStatus}
                    onChange={(e) => setFilters({ ...filters, kycStatus: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All">All</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Not Submitted">Not Submitted</option>
                  </select>
                </div>

                {/* Rank Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
                  <select
                    value={filters.rank}
                    onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All">All</option>
                    <option value="Starter">Starter</option>
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Diamond">Diamond</option>
                  </select>
                </div>

                {/* Active Packages Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Active Packages</label>
                  <select
                    value={filters.hasActivePackages}
                    onChange={(e) => setFilters({ ...filters, hasActivePackages: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="All">All</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>

                {/* Join Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Join Date From</label>
                  <input
                    type="date"
                    value={filters.joinDateFrom}
                    onChange={(e) => setFilters({ ...filters, joinDateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Join Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Join Date To</label>
                  <input
                    type="date"
                    value={filters.joinDateTo}
                    onChange={(e) => setFilters({ ...filters, joinDateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Investment Min */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Investment</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.investmentMin}
                    onChange={(e) => setFilters({ ...filters, investmentMin: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Investment Max */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Investment</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={filters.investmentMax}
                    onChange={(e) => setFilters({ ...filters, investmentMax: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Reset Filters Button */}
              <div className="mt-4">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-blue-900 font-medium">
                  {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
                </div>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="text-sm text-blue-700 hover:text-blue-900 underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <span>Bulk Actions</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showBulkMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowBulkMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 py-2">
                      {/* Export Section */}
                      <div className="px-3 py-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Export</div>
                      </div>
                      <button
                        onClick={handleBulkExport}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">📊</span>
                        <div>
                          <div className="font-medium">Export to CSV</div>
                          <div className="text-xs text-gray-500">Download user data</div>
                        </div>
                      </button>
                      <button
                        onClick={handleBulkExportPDF}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">📄</span>
                        <div>
                          <div className="font-medium">Export to PDF</div>
                          <div className="text-xs text-gray-500">Generate PDF report</div>
                        </div>
                      </button>

                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Communication Section */}
                      <div className="px-3 py-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Communication</div>
                      </div>
                      <button
                        onClick={handleBulkEmail}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">📧</span>
                        <div>
                          <div className="font-medium">Send Email</div>
                          <div className="text-xs text-gray-500">Compose bulk email</div>
                        </div>
                      </button>
                      <button
                        onClick={handleBulkSendNotification}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">🔔</span>
                        <div>
                          <div className="font-medium">Send Notification</div>
                          <div className="text-xs text-gray-500">Push notification</div>
                        </div>
                      </button>

                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Account Actions Section */}
                      <div className="px-3 py-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Account Actions</div>
                      </div>
                      <button
                        onClick={handleBulkActivate}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">✅</span>
                        <div>
                          <div className="font-medium">Activate Accounts</div>
                          <div className="text-xs text-gray-500">Enable user access</div>
                        </div>
                      </button>
                      <button
                        onClick={handleBulkSuspend}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-yellow-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">⏸️</span>
                        <div>
                          <div className="font-medium">Suspend Accounts</div>
                          <div className="text-xs text-gray-500">Temporarily disable</div>
                        </div>
                      </button>
                      <button
                        onClick={handleBulkChangeRank}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-purple-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">🏆</span>
                        <div>
                          <div className="font-medium">Change Rank</div>
                          <div className="text-xs text-gray-500">Update user ranks</div>
                        </div>
                      </button>

                      <div className="border-t border-gray-200 my-2"></div>

                      {/* KYC Section */}
                      <div className="px-3 py-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">KYC Management</div>
                      </div>
                      <button
                        onClick={handleBulkApproveKYC}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-green-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">✓</span>
                        <div>
                          <div className="font-medium">Approve KYC</div>
                          <div className="text-xs text-gray-500">Bulk approve verification</div>
                        </div>
                      </button>
                      <button
                        onClick={handleBulkRejectKYC}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-red-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">✗</span>
                        <div>
                          <div className="font-medium">Reject KYC</div>
                          <div className="text-xs text-gray-500">Bulk reject verification</div>
                        </div>
                      </button>

                      <div className="border-t border-gray-200 my-2"></div>

                      {/* Danger Zone */}
                      <button
                        onClick={handleBulkDelete}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                      >
                        <span className="text-lg">🗑️</span>
                        <div>
                          <div className="font-medium">Delete Users</div>
                          <div className="text-xs text-red-500">Permanently remove</div>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {paginatedUsers.length} of {sortedUsers.length} users
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      User ID
                      {sortField === 'id' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {sortField === 'name' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-1">
                      Email
                      {sortField === 'email' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('phone')}
                  >
                    <div className="flex items-center gap-1">
                      Phone
                      {sortField === 'phone' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('joinDate')}
                  >
                    <div className="flex items-center gap-1">
                      Join Date
                      {sortField === 'joinDate' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === 'status' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('kycStatus')}
                  >
                    <div className="flex items-center gap-1">
                      KYC
                      {sortField === 'kycStatus' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('totalInvestment')}
                  >
                    <div className="flex items-center gap-1">
                      Investment
                      {sortField === 'totalInvestment' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('walletBalance')}
                  >
                    <div className="flex items-center gap-1">
                      Balance
                      {sortField === 'walletBalance' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort('directReferrals')}
                  >
                    <div className="flex items-center gap-1">
                      Direct Referrals
                      {sortField === 'directReferrals' && (
                        <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-gray-900">{user.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="text-xl">{user.avatar}</div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.joinDate}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user.kycStatus)}`}>
                        {user.kycStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">${user.totalInvestment.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">${user.walletBalance.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.directReferrals}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setActiveTab('overview');
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Details Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedUser(null)} />

          <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{selectedUser.avatar}</div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-gray-600">{selectedUser.id}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedUser.status)}`}>
                        {selectedUser.status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedUser.kycStatus)}`}>
                        {selectedUser.kycStatus}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Info Quick View */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm font-medium text-gray-900">{selectedUser.email}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="text-sm font-medium text-gray-900">{selectedUser.phone}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Joined</div>
                  <div className="text-sm font-medium text-gray-900">{selectedUser.joinDate}</div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 bg-gray-50 px-6">
              <div className="flex gap-1 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'packages', label: 'Packages', icon: '📦' },
                  { id: 'transactions', label: 'Transactions', icon: '💳' },
                  { id: 'team', label: 'Team', icon: '👥' },
                  { id: 'earnings', label: 'Earnings', icon: '💵' },
                  { id: 'kyc', label: 'KYC', icon: '🆔' },
                  { id: 'activity', label: 'Activity', icon: '📝' },
                  { id: 'admin-actions', label: 'Admin Actions', icon: '⚙️' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {renderUserDetailsTab()}
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateUser(false)} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New User</h2>

              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+1 234-567-8900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sponsor ID</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="USR001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendWelcome"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="sendWelcome" className="ml-2 text-sm text-gray-700">
                    Send welcome email to user
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal */}
      <CustomModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        inputLabel={modalConfig.inputLabel}
        inputPlaceholder={modalConfig.inputPlaceholder}
        inputType={modalConfig.inputType}
        inputRequired={true}
        variant={modalConfig.variant}
      >
        {modalConfig.message}
      </CustomModal>
    </div>
  );
};

export default UserManagement;
