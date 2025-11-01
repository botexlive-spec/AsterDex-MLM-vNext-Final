import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getAllRanks,
  getUserRankAchievements,
  updateUserRank,
  getRankStats,
  calculateRankEligibility,
} from '../../services/admin-rank.service';

type TabType = 'configuration' | 'achievements' | 'adjustments' | 'statistics';

interface Rank {
  id: string;
  name: string;
  order: number;
  badge: string;
  personalInvestment: number;
  teamVolume: number;
  directReferrals: number;
  activeTeamMembers: number;
  rewardAmount: number;
  benefits: string;
  color: string;
  status: 'active' | 'inactive';
}

interface RankAchievement {
  id: string;
  userId: string;
  userName: string;
  email: string;
  rankId: string;
  rankName: string;
  achievedDate: string;
  rewardAmount: number;
  rewardStatus: 'pending' | 'paid' | 'cancelled';
  paidDate?: string;
}

interface RankAdjustment {
  id: string;
  userId: string;
  userName: string;
  email: string;
  currentRank: string;
  newRank: string;
  reason: string;
  adjustmentType: 'upgrade' | 'downgrade';
  adjustedBy: string;
  adjustedDate: string;
}

// Mock data for 10 ranks
const initialRanks: Rank[] = [
  {
    id: 'r1',
    name: 'Bronze',
    order: 1,
    badge: '🥉',
    personalInvestment: 100,
    teamVolume: 500,
    directReferrals: 2,
    activeTeamMembers: 5,
    rewardAmount: 50,
    benefits: 'Welcome bonus, Basic trading access',
    color: '#CD7F32',
    status: 'active',
  },
  {
    id: 'r2',
    name: 'Silver',
    order: 2,
    badge: '🥈',
    personalInvestment: 500,
    teamVolume: 2500,
    directReferrals: 5,
    activeTeamMembers: 15,
    rewardAmount: 200,
    benefits: '5% Level commission boost, Priority support',
    color: '#C0C0C0',
    status: 'active',
  },
  {
    id: 'r3',
    name: 'Gold',
    order: 3,
    badge: '🥇',
    personalInvestment: 1000,
    teamVolume: 5000,
    directReferrals: 10,
    activeTeamMembers: 30,
    rewardAmount: 500,
    benefits: '10% Level commission boost, VIP support',
    color: '#FFD700',
    status: 'active',
  },
  {
    id: 'r4',
    name: 'Platinum',
    order: 4,
    badge: '💎',
    personalInvestment: 2500,
    teamVolume: 15000,
    directReferrals: 15,
    activeTeamMembers: 50,
    rewardAmount: 1500,
    benefits: '15% Level boost, Binary matching bonus, Travel incentive',
    color: '#E5E4E2',
    status: 'active',
  },
  {
    id: 'r5',
    name: 'Ruby',
    order: 5,
    badge: '💍',
    personalInvestment: 5000,
    teamVolume: 30000,
    directReferrals: 20,
    activeTeamMembers: 100,
    rewardAmount: 3000,
    benefits: '20% Level boost, Car fund, Annual trip',
    color: '#E0115F',
    status: 'active',
  },
  {
    id: 'r6',
    name: 'Emerald',
    order: 6,
    badge: '🟢',
    personalInvestment: 10000,
    teamVolume: 60000,
    directReferrals: 25,
    activeTeamMembers: 200,
    rewardAmount: 7500,
    benefits: '25% Level boost, House fund, Quarterly luxury trips',
    color: '#50C878',
    status: 'active',
  },
  {
    id: 'r7',
    name: 'Sapphire',
    order: 7,
    badge: '🔷',
    personalInvestment: 25000,
    teamVolume: 150000,
    directReferrals: 30,
    activeTeamMembers: 500,
    rewardAmount: 15000,
    benefits: '30% Level boost, Global recognition, Leadership seminars',
    color: '#0F52BA',
    status: 'active',
  },
  {
    id: 'r8',
    name: 'Diamond',
    order: 8,
    badge: '💠',
    personalInvestment: 50000,
    teamVolume: 300000,
    directReferrals: 40,
    activeTeamMembers: 1000,
    rewardAmount: 30000,
    benefits: '35% Level boost, Yacht club membership, Equity participation',
    color: '#B9F2FF',
    status: 'active',
  },
  {
    id: 'r9',
    name: 'Crown',
    order: 9,
    badge: '👑',
    personalInvestment: 100000,
    teamVolume: 750000,
    directReferrals: 50,
    activeTeamMembers: 2500,
    rewardAmount: 75000,
    benefits: '40% Level boost, Private jet access, Board advisor role',
    color: '#FFD700',
    status: 'active',
  },
  {
    id: 'r10',
    name: 'Royal Crown',
    order: 10,
    badge: '🔱',
    personalInvestment: 250000,
    teamVolume: 2000000,
    directReferrals: 75,
    activeTeamMembers: 5000,
    rewardAmount: 200000,
    benefits: '50% Level boost, Company shares, Global ambassador',
    color: '#9400D3',
    status: 'active',
  },
];

// Mock achievements
const mockAchievements: RankAchievement[] = [
  {
    id: 'a1',
    userId: 'u1',
    userName: 'John Doe',
    email: 'john@example.com',
    rankId: 'r3',
    rankName: 'Gold',
    achievedDate: '2025-01-15',
    rewardAmount: 500,
    rewardStatus: 'paid',
    paidDate: '2025-01-16',
  },
  {
    id: 'a2',
    userId: 'u2',
    userName: 'Sarah Smith',
    email: 'sarah@example.com',
    rankId: 'r4',
    rankName: 'Platinum',
    achievedDate: '2025-01-20',
    rewardAmount: 1500,
    rewardStatus: 'pending',
  },
  {
    id: 'a3',
    userId: 'u3',
    userName: 'Michael Johnson',
    email: 'michael@example.com',
    rankId: 'r2',
    rankName: 'Silver',
    achievedDate: '2025-01-10',
    rewardAmount: 200,
    rewardStatus: 'paid',
    paidDate: '2025-01-11',
  },
];

const RankManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('configuration');
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [achievements, setAchievements] = useState<RankAchievement[]>([]);
  const [adjustments, setAdjustments] = useState<RankAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankStats, setRankStats] = useState<any>(null);

  // Filters
  const [achievementRankFilter, setAchievementRankFilter] = useState<string>('all');
  const [achievementStatusFilter, setAchievementStatusFilter] = useState<string>('all');
  const [achievementDateFrom, setAchievementDateFrom] = useState<string>('');
  const [achievementDateTo, setAchievementDateTo] = useState<string>('');

  // Load rank data from database
  useEffect(() => {
    const loadRankData = async () => {
      try {
        setLoading(true);

        // Load ranks, achievements, and stats in parallel
        const [ranksData, achievementsData, stats] = await Promise.all([
          getAllRanks(),
          getUserRankAchievements(),
          getRankStats(),
        ]);

        // Format ranks for UI
        const formattedRanks: Rank[] = ranksData.map((rank: any, index: number) => ({
          id: `r${index + 1}`,
          name: rank.name,
          order: rank.level,
          badge: rank.icon,
          personalInvestment: rank.min_personal_volume,
          teamVolume: rank.min_team_volume,
          directReferrals: rank.min_directs,
          activeTeamMembers: rank.min_directs * 2, // Estimate
          rewardAmount: rank.reward_amount,
          benefits: rank.benefits.join(', '),
          color: rank.color,
          status: 'active' as const,
        }));

        // Format achievements for UI
        const formattedAchievements: RankAchievement[] = achievementsData.map((ach: any, index: number) => ({
          id: `ach${index + 1}`,
          userId: ach.user_id,
          userName: ach.user_name,
          email: ach.user_email,
          rankId: `r${ranksData.findIndex(r => r.name === ach.current_rank) + 1}`,
          rankName: ach.current_rank,
          achievedDate: new Date(ach.achieved_at).toISOString().split('T')[0],
          rewardAmount: ranksData.find((r: any) => r.name === ach.current_rank)?.reward_amount || 0,
          rewardStatus: 'paid' as const,
          paidDate: new Date(ach.achieved_at).toISOString().split('T')[0],
        }));

        setRanks(formattedRanks);
        setAchievements(formattedAchievements);
        setRankStats(stats);

        toast.success('Rank data loaded');
      } catch (error) {
        console.error('Error loading rank data:', error);
        toast.error('Failed to load rank data');
      } finally {
        setLoading(false);
      }
    };

    loadRankData();
  }, []);

  // Edit rank modal
  const [showEditRankModal, setShowEditRankModal] = useState(false);
  const [editingRank, setEditingRank] = useState<Rank | null>(null);

  // Manual adjustment modal
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustmentUserId, setAdjustmentUserId] = useState('');
  const [adjustmentUserName, setAdjustmentUserName] = useState('');
  const [adjustmentUserEmail, setAdjustmentUserEmail] = useState('');
  const [adjustmentCurrentRank, setAdjustmentCurrentRank] = useState('');
  const [adjustmentNewRank, setAdjustmentNewRank] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Rank preview modal
  const [showRankPreviewModal, setShowRankPreviewModal] = useState(false);
  const [previewRank, setPreviewRank] = useState<Rank | null>(null);

  // Note: All data now loaded from database via useEffect above (lines 268-324)
  // localStorage sync removed to prevent conflicts with database data

  const tabs = [
    { id: 'configuration' as TabType, label: 'Rank Configuration', icon: '⚙️' },
    { id: 'achievements' as TabType, label: 'Rank Achievements', icon: '🏆' },
    { id: 'adjustments' as TabType, label: 'Manual Adjustments', icon: '✏️' },
    { id: 'statistics' as TabType, label: 'Statistics', icon: '📊' },
  ];

  const handleEditRank = (rank: Rank) => {
    setEditingRank({ ...rank });
    setShowEditRankModal(true);
  };

  const handleSaveRank = () => {
    if (!editingRank) return;

    // Validate rank name
    if (!editingRank.name || editingRank.name.trim().length < 2) {
      toast.error('Rank name must be at least 2 characters');
      return;
    }

    // Validate badge
    if (!editingRank.badge || editingRank.badge.trim().length === 0) {
      toast.error('Please provide a badge emoji');
      return;
    }

    // Validate personal investment
    if (editingRank.personalInvestment <= 0) {
      toast.error('Personal investment must be greater than 0');
      return;
    }

    // Validate team volume
    if (editingRank.teamVolume <= 0) {
      toast.error('Team volume must be greater than 0');
      return;
    }

    // Validate that team volume is greater than personal investment
    if (editingRank.teamVolume < editingRank.personalInvestment) {
      toast.error('Team volume should be greater than or equal to personal investment');
      return;
    }

    // Validate direct referrals
    if (editingRank.directReferrals < 0) {
      toast.error('Direct referrals cannot be negative');
      return;
    }

    // Validate active team members
    if (editingRank.activeTeamMembers < 0) {
      toast.error('Active team members cannot be negative');
      return;
    }

    // Validate that active team members is at least equal to direct referrals
    if (editingRank.activeTeamMembers < editingRank.directReferrals) {
      toast.error('Active team members should be at least equal to direct referrals');
      return;
    }

    // Validate reward amount
    if (editingRank.rewardAmount < 0) {
      toast.error('Reward amount cannot be negative');
      return;
    }

    // Validate benefits
    if (!editingRank.benefits || editingRank.benefits.trim().length < 5) {
      toast.error('Benefits description must be at least 5 characters');
      return;
    }

    // Check for duplicate rank names (excluding current rank)
    const duplicateName = ranks.find(r =>
      r.id !== editingRank.id && r.name.toLowerCase() === editingRank.name.toLowerCase()
    );
    if (duplicateName) {
      toast.error('A rank with this name already exists');
      return;
    }

    setRanks(ranks.map(r => r.id === editingRank.id ? editingRank : r));
    toast.success(`${editingRank.name} rank updated successfully!`, {
      icon: '✅',
      duration: 3000,
    });
    setShowEditRankModal(false);
    setEditingRank(null);
  };

  const handlePreviewRank = (rank: Rank) => {
    setPreviewRank(rank);
    setShowRankPreviewModal(true);
  };

  const handleMoveRankUp = (index: number) => {
    if (index === 0) return;
    const newRanks = [...ranks];
    [newRanks[index - 1], newRanks[index]] = [newRanks[index], newRanks[index - 1]];
    newRanks[index - 1].order = index;
    newRanks[index].order = index + 1;
    setRanks(newRanks);
    toast.success('Rank order updated');
  };

  const handleMoveRankDown = (index: number) => {
    if (index === ranks.length - 1) return;
    const newRanks = [...ranks];
    [newRanks[index], newRanks[index + 1]] = [newRanks[index + 1], newRanks[index]];
    newRanks[index].order = index + 1;
    newRanks[index + 1].order = index + 2;
    setRanks(newRanks);
    toast.success('Rank order updated');
  };

  const handlePayReward = (achievementId: string) => {
    setAchievements(achievements.map(a =>
      a.id === achievementId
        ? { ...a, rewardStatus: 'paid', paidDate: format(new Date(), 'yyyy-MM-dd') }
        : a
    ));
    toast.success('Reward marked as paid!');
  };

  const handleCancelReward = (achievementId: string) => {
    setAchievements(achievements.map(a =>
      a.id === achievementId
        ? { ...a, rewardStatus: 'cancelled' }
        : a
    ));
    toast.success('Reward cancelled');
  };

  const handleSubmitAdjustment = async () => {
    if (!adjustmentUserId || !adjustmentNewRank || !adjustmentReason) {
      toast.error('Please fill all required fields');
      return;
    }

    const currentRankObj = ranks.find(r => r.name === adjustmentCurrentRank);
    const newRankObj = ranks.find(r => r.name === adjustmentNewRank);

    if (!currentRankObj || !newRankObj) return;

    const adjustmentType = newRankObj.order > currentRankObj.order ? 'upgrade' : 'downgrade';

    try {
      // Update rank in database
      await updateUserRank(adjustmentUserId, adjustmentNewRank, true);

      // Create local adjustment record for display
      const newAdjustment: RankAdjustment = {
        id: `adj-${Date.now()}`,
        userId: adjustmentUserId,
        userName: adjustmentUserName,
        email: adjustmentUserEmail,
        currentRank: adjustmentCurrentRank,
        newRank: adjustmentNewRank,
        reason: adjustmentReason,
        adjustmentType,
        adjustedBy: 'Admin User',
        adjustedDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      };

      setAdjustments([newAdjustment, ...adjustments]);
      toast.success(`Rank ${adjustmentType} successful! User updated in database.`);

      // Reset form
      setAdjustmentUserId('');
      setAdjustmentUserName('');
      setAdjustmentUserEmail('');
      setAdjustmentCurrentRank('');
      setAdjustmentNewRank('');
      setAdjustmentReason('');
      setShowAdjustmentModal(false);
    } catch (error: any) {
      console.error('Error updating user rank:', error);
      toast.error(error.message || 'Failed to update user rank');
    }
  };

  // Filter achievements
  const filteredAchievements = achievements.filter(a => {
    if (achievementRankFilter !== 'all' && a.rankName !== achievementRankFilter) return false;
    if (achievementStatusFilter !== 'all' && a.rewardStatus !== achievementStatusFilter) return false;
    if (achievementDateFrom && a.achievedDate < achievementDateFrom) return false;
    if (achievementDateTo && a.achievedDate > achievementDateTo) return false;
    return true;
  });

  // Statistics data from database
  const rankDistributionData = ranks.map(rank => ({
    name: rank.name,
    users: rankStats?.by_rank?.[rank.name] || 0,
    color: rank.color,
  }));

  // Calculate achievement trend from actual achievements data
  const achievementTrendData = (() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const last7Months: any[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const count = achievements.filter(a => a.achievedDate.startsWith(monthKey)).length;
      last7Months.push({
        month: monthNames[date.getMonth()],
        achievements: count,
      });
    }

    return last7Months;
  })();

  const rewardPayoutsData = ranks.map(rank => {
    const achievementsForRank = achievements.filter(a => a.rankName === rank.name && a.rewardStatus === 'paid');
    return {
      rank: rank.name,
      amount: achievementsForRank.reduce((sum, a) => sum + a.rewardAmount, 0),
    };
  });

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Rank Management</h1>
          <p className="text-[#cbd5e1]">Manage rank structure, achievements, and rewards</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#00C7D1] text-[#0f172a]'
                  : 'bg-[#1e293b] text-[#cbd5e1] hover:bg-[#334155]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#1e293b] rounded-lg shadow-xl">
          {/* Rank Configuration Tab */}
          {activeTab === 'configuration' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#f8fafc]">Rank Configuration</h2>
                <div className="text-sm text-[#94a3b8]">
                  Total Ranks: <span className="text-[#00C7D1] font-semibold">{ranks.length}</span>
                </div>
              </div>

              <div className="space-y-4">
                {ranks.map((rank, index) => (
                  <div
                    key={rank.id}
                    className="bg-[#0f172a] rounded-lg p-6 border border-[#334155] hover:border-[#00C7D1]/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Drag Handle / Order Controls */}
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleMoveRankUp(index)}
                            disabled={index === 0}
                            className={`p-1 rounded ${
                              index === 0
                                ? 'text-[#475569] cursor-not-allowed'
                                : 'text-[#cbd5e1] hover:bg-[#334155]'
                            }`}
                          >
                            ▲
                          </button>
                          <button
                            onClick={() => handleMoveRankDown(index)}
                            disabled={index === ranks.length - 1}
                            className={`p-1 rounded ${
                              index === ranks.length - 1
                                ? 'text-[#475569] cursor-not-allowed'
                                : 'text-[#cbd5e1] hover:bg-[#334155]'
                            }`}
                          >
                            ▼
                          </button>
                        </div>

                        {/* Rank Info */}
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{rank.badge}</div>
                          <div>
                            <h3 className="text-lg font-bold text-[#f8fafc]">{rank.name}</h3>
                            <p className="text-xs text-[#94a3b8]">Rank #{rank.order}</p>
                          </div>
                        </div>

                        {/* Requirements */}
                        <div className="ml-8 flex flex-wrap gap-4">
                          <div className="text-sm">
                            <span className="text-[#94a3b8]">Investment:</span>
                            <span className="ml-2 text-[#00C7D1] font-semibold">${rank.personalInvestment}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-[#94a3b8]">Team Vol:</span>
                            <span className="ml-2 text-[#00C7D1] font-semibold">${rank.teamVolume}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-[#94a3b8]">Referrals:</span>
                            <span className="ml-2 text-[#00C7D1] font-semibold">{rank.directReferrals}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-[#94a3b8]">Team:</span>
                            <span className="ml-2 text-[#00C7D1] font-semibold">{rank.activeTeamMembers}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-[#94a3b8]">Reward:</span>
                            <span className="ml-2 text-[#10b981] font-semibold">${rank.rewardAmount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            rank.status === 'active'
                              ? 'bg-[#10b981]/10 text-[#10b981]'
                              : 'bg-[#94a3b8]/10 text-[#94a3b8]'
                          }`}
                        >
                          {rank.status}
                        </span>
                        <button
                          onClick={() => handlePreviewRank(rank)}
                          className="px-4 py-2 bg-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#475569] transition-all"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleEditRank(rank)}
                          className="px-4 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="mt-4 pt-4 border-t border-[#334155]">
                      <p className="text-sm text-[#cbd5e1]">
                        <span className="text-[#94a3b8] font-medium">Benefits:</span> {rank.benefits}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rank Achievements Tab */}
          {activeTab === 'achievements' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#f8fafc]">Rank Achievements</h2>
                <div className="text-sm text-[#94a3b8]">
                  Total Achievements: <span className="text-[#00C7D1] font-semibold">{achievements.length}</span>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Rank</label>
                  <select
                    value={achievementRankFilter}
                    onChange={(e) => setAchievementRankFilter(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                  >
                    <option value="all">All Ranks</option>
                    {ranks.map(rank => (
                      <option key={rank.id} value={rank.name}>{rank.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Status</label>
                  <select
                    value={achievementStatusFilter}
                    onChange={(e) => setAchievementStatusFilter(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">From Date</label>
                  <input
                    type="date"
                    value={achievementDateFrom}
                    onChange={(e) => setAchievementDateFrom(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">To Date</label>
                  <input
                    type="date"
                    value={achievementDateTo}
                    onChange={(e) => setAchievementDateTo(e.target.value)}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                  />
                </div>
              </div>

              {/* Achievements Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#334155]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">User</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Rank</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Achieved Date</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Reward</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]">
                    {filteredAchievements.map((achievement) => (
                      <tr key={achievement.id} className="hover:bg-[#334155]/50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-[#f8fafc] font-medium">{achievement.userName}</div>
                            <div className="text-sm text-[#94a3b8]">{achievement.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[#00C7D1] font-semibold">{achievement.rankName}</span>
                        </td>
                        <td className="px-6 py-4 text-[#cbd5e1]">
                          {format(new Date(achievement.achievedDate), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-right text-[#10b981] font-semibold">
                          ${achievement.rewardAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              achievement.rewardStatus === 'paid'
                                ? 'bg-[#10b981]/10 text-[#10b981]'
                                : achievement.rewardStatus === 'pending'
                                ? 'bg-[#f59e0b]/10 text-[#f59e0b]'
                                : 'bg-[#ef4444]/10 text-[#ef4444]'
                            }`}
                          >
                            {achievement.rewardStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            {achievement.rewardStatus === 'pending' && (
                              <>
                                <button
                                  onClick={() => handlePayReward(achievement.id)}
                                  className="px-3 py-1 bg-[#10b981] text-white rounded hover:bg-[#059669] text-sm"
                                >
                                  Pay
                                </button>
                                <button
                                  onClick={() => handleCancelReward(achievement.id)}
                                  className="px-3 py-1 bg-[#ef4444] text-white rounded hover:bg-[#dc2626] text-sm"
                                >
                                  Cancel
                                </button>
                              </>
                            )}
                            {achievement.rewardStatus === 'paid' && achievement.paidDate && (
                              <span className="text-xs text-[#94a3b8]">
                                Paid: {format(new Date(achievement.paidDate), 'MMM dd')}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Manual Adjustments Tab */}
          {activeTab === 'adjustments' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#f8fafc]">Manual Rank Adjustments</h2>
                <button
                  onClick={() => setShowAdjustmentModal(true)}
                  className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
                >
                  New Adjustment
                </button>
              </div>

              {/* Adjustments History */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#334155]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">User</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Rank Change</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Reason</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Adjusted By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]">
                    {adjustments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-[#94a3b8]">
                          No manual adjustments yet
                        </td>
                      </tr>
                    ) : (
                      adjustments.map((adj) => (
                        <tr key={adj.id} className="hover:bg-[#334155]/50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-[#f8fafc] font-medium">{adj.userName}</div>
                              <div className="text-sm text-[#94a3b8]">{adj.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                adj.adjustmentType === 'upgrade'
                                  ? 'bg-[#10b981]/10 text-[#10b981]'
                                  : 'bg-[#ef4444]/10 text-[#ef4444]'
                              }`}
                            >
                              {adj.adjustmentType}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[#94a3b8]">{adj.currentRank}</span>
                              <span className="text-[#00C7D1]">→</span>
                              <span className="text-[#00C7D1] font-semibold">{adj.newRank}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#cbd5e1]">{adj.reason}</td>
                          <td className="px-6 py-4 text-[#cbd5e1]">{adj.adjustedDate}</td>
                          <td className="px-6 py-4 text-[#cbd5e1]">{adj.adjustedBy}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <div className="p-6 space-y-8">
              <h2 className="text-xl font-semibold text-[#f8fafc] mb-6">Rank Statistics</h2>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                  <div className="text-sm text-[#94a3b8] mb-1">Total Users</div>
                  <div className="text-2xl font-bold text-[#f8fafc]">
                    {rankDistributionData.reduce((sum, d) => sum + d.users, 0)}
                  </div>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                  <div className="text-sm text-[#94a3b8] mb-1">Total Achievements</div>
                  <div className="text-2xl font-bold text-[#00C7D1]">{achievements.length}</div>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                  <div className="text-sm text-[#94a3b8] mb-1">Pending Rewards</div>
                  <div className="text-2xl font-bold text-[#f59e0b]">
                    {achievements.filter(a => a.rewardStatus === 'pending').length}
                  </div>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                  <div className="text-sm text-[#94a3b8] mb-1">Total Payouts</div>
                  <div className="text-2xl font-bold text-[#10b981]">
                    ${rewardPayoutsData.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Rank Distribution Chart */}
              <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Rank Distribution</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rankDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
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
                    <Bar dataKey="users" name="Users" fill="#00C7D1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Achievement Trend Chart */}
              <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Rank Achievement Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={achievementTrendData}>
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
                    <Line
                      type="monotone"
                      dataKey="achievements"
                      name="Achievements"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Reward Payouts Chart */}
              <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155]">
                <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Reward Payouts by Rank</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rewardPayoutsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="rank" stroke="#94a3b8" />
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
                    <Bar dataKey="amount" name="Total Payouts ($)" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Rank Modal */}
      {showEditRankModal && editingRank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-xl font-semibold text-[#f8fafc]">Edit Rank: {editingRank.name}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Rank Name</label>
                  <input
                    type="text"
                    value={editingRank.name}
                    onChange={(e) => setEditingRank({ ...editingRank, name: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Badge (Emoji)</label>
                  <input
                    type="text"
                    value={editingRank.badge}
                    onChange={(e) => setEditingRank({ ...editingRank, badge: e.target.value })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] text-2xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Personal Investment ($)</label>
                  <input
                    type="number"
                    value={editingRank.personalInvestment}
                    onChange={(e) => setEditingRank({ ...editingRank, personalInvestment: Number(e.target.value) })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                    min="1"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Team Volume ($)</label>
                  <input
                    type="number"
                    value={editingRank.teamVolume}
                    onChange={(e) => setEditingRank({ ...editingRank, teamVolume: Number(e.target.value) })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Direct Referrals</label>
                  <input
                    type="number"
                    value={editingRank.directReferrals}
                    onChange={(e) => setEditingRank({ ...editingRank, directReferrals: Number(e.target.value) })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                    min="0"
                    step="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Active Team Members</label>
                  <input
                    type="number"
                    value={editingRank.activeTeamMembers}
                    onChange={(e) => setEditingRank({ ...editingRank, activeTeamMembers: Number(e.target.value) })}
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                    min="0"
                    step="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Reward Amount ($)</label>
                <input
                  type="number"
                  value={editingRank.rewardAmount}
                  onChange={(e) => setEditingRank({ ...editingRank, rewardAmount: Number(e.target.value) })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Benefits Description</label>
                <textarea
                  value={editingRank.benefits}
                  onChange={(e) => setEditingRank({ ...editingRank, benefits: e.target.value })}
                  rows={3}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Status</label>
                <select
                  value={editingRank.status}
                  onChange={(e) => setEditingRank({ ...editingRank, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-[#334155] flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditRankModal(false);
                  setEditingRank(null);
                }}
                className="px-6 py-2 bg-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#475569] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRank}
                className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rank Preview Modal */}
      {showRankPreviewModal && previewRank && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-xl font-semibold text-[#f8fafc]">Rank Preview</h3>
            </div>
            <div className="p-8 text-center">
              <div className="text-8xl mb-4">{previewRank.badge}</div>
              <h2 className="text-3xl font-bold text-[#f8fafc] mb-2">{previewRank.name}</h2>
              <p className="text-[#94a3b8] mb-6">Rank #{previewRank.order}</p>

              <div className="bg-[#0f172a] rounded-lg p-6 mb-6 space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Personal Investment:</span>
                  <span className="text-[#00C7D1] font-semibold">${previewRank.personalInvestment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Team Volume:</span>
                  <span className="text-[#00C7D1] font-semibold">${previewRank.teamVolume}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Direct Referrals:</span>
                  <span className="text-[#00C7D1] font-semibold">{previewRank.directReferrals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#94a3b8]">Active Team Members:</span>
                  <span className="text-[#00C7D1] font-semibold">{previewRank.activeTeamMembers}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-[#334155]">
                  <span className="text-[#94a3b8]">Achievement Reward:</span>
                  <span className="text-[#10b981] font-bold text-lg">${previewRank.rewardAmount}</span>
                </div>
              </div>

              <div className="bg-[#0f172a] rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-[#cbd5e1] mb-2">Benefits</h4>
                <p className="text-sm text-[#94a3b8]">{previewRank.benefits}</p>
              </div>
            </div>
            <div className="p-6 border-t border-[#334155] flex justify-center">
              <button
                onClick={() => setShowRankPreviewModal(false)}
                className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-xl font-semibold text-[#f8fafc]">Manual Rank Adjustment</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">User ID</label>
                <input
                  type="text"
                  value={adjustmentUserId}
                  onChange={(e) => setAdjustmentUserId(e.target.value)}
                  placeholder="Enter user ID"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">User Name</label>
                <input
                  type="text"
                  value={adjustmentUserName}
                  onChange={(e) => setAdjustmentUserName(e.target.value)}
                  placeholder="Enter user name"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">User Email</label>
                <input
                  type="email"
                  value={adjustmentUserEmail}
                  onChange={(e) => setAdjustmentUserEmail(e.target.value)}
                  placeholder="Enter user email"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Current Rank</label>
                <select
                  value={adjustmentCurrentRank}
                  onChange={(e) => setAdjustmentCurrentRank(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                >
                  <option value="">Select current rank</option>
                  {ranks.map(rank => (
                    <option key={rank.id} value={rank.name}>{rank.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">New Rank</label>
                <select
                  value={adjustmentNewRank}
                  onChange={(e) => setAdjustmentNewRank(e.target.value)}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                >
                  <option value="">Select new rank</option>
                  {ranks.map(rank => (
                    <option key={rank.id} value={rank.name}>{rank.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Reason</label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Enter reason for adjustment..."
                  rows={3}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
            </div>
            <div className="p-6 border-t border-[#334155] flex justify-end gap-3">
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="px-6 py-2 bg-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#475569] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAdjustment}
                className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
              >
                Submit Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankManagement;
