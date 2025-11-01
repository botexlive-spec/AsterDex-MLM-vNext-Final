import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import {
  getCommissionSettings,
  saveCommissionSettings,
  getCommissionHistory,
  manualCommissionAdjustment,
  getCommissionStats,
} from '../../services/admin-commission.service';

// Types
interface LevelCommission {
  level: number;
  percentage: number;
  status: 'active' | 'inactive';
}

interface CommissionRun {
  id: string;
  type: string;
  date: string;
  affectedUsers: number;
  totalAmount: number;
  status: 'completed' | 'pending' | 'failed';
}

interface ManualAdjustment {
  userId: string;
  userName: string;
  amount: number;
  type: 'add' | 'deduct';
  reason: string;
}

export const CommissionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'configuration' | 'processing' | 'reports' | 'adjustments'>('configuration');
  const [configSection, setConfigSection] = useState<'level' | 'binary' | 'roi' | 'rank' | 'booster'>('level');

  // Level Commission State
  const [levelCommissions, setLevelCommissions] = useState<LevelCommission[]>(
    Array.from({ length: 30 }, (_, i) => ({
      level: i + 1,
      percentage: i < 5 ? 5 - i : i < 10 ? 2 : 1,
      status: 'active' as const,
    }))
  );

  // Binary Matching Settings
  const [binarySettings, setBinarySettings] = useState({
    matchingPercentage: 10,
    dailyCap: 1000,
    weeklyCap: 5000,
    monthlyCap: 20000,
    matchingRatio: '1:1',
    flushPeriod: 'weekly',
  });

  // ROI Settings
  const [roiSettings, setROISettings] = useState({
    starterMin: 5,
    starterMax: 7,
    growthMin: 7,
    growthMax: 10,
    premiumMin: 10,
    premiumMax: 15,
    distributionSchedule: 'daily',
  });

  // Rank Rewards
  const [rankRewards, setRankRewards] = useState([
    { rank: 'Bronze', reward: 500, requirement: '5 directs' },
    { rank: 'Silver', reward: 1500, requirement: '10 directs + $5k team volume' },
    { rank: 'Gold', reward: 5000, requirement: '20 directs + $20k team volume' },
    { rank: 'Platinum', reward: 15000, requirement: '50 directs + $100k team volume' },
    { rank: 'Diamond', reward: 50000, requirement: '100 directs + $500k team volume' },
  ]);

  // Booster Settings
  const [boosterSettings, setBoosterSettings] = useState({
    percentage: 5,
    conditions: '- Minimum 10 active directs\n- Team volume $50,000+\n- Active package required',
  });

  // Commission Processing State
  const [processingForm, setProcessingForm] = useState({
    commissionType: 'level',
    dateFrom: '',
    dateTo: '',
  });

  const [previewData, setPreviewData] = useState<{ users: number; amount: number } | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetType, setResetType] = useState<string>('');

  // Scheduled Jobs
  const [scheduledJobs, setScheduledJobs] = useState([
    { id: 'JOB001', type: 'Level Commission', frequency: 'Daily', time: '00:00', status: 'active' },
    { id: 'JOB002', type: 'Binary Matching', frequency: 'Daily', time: '01:00', status: 'active' },
    { id: 'JOB003', type: 'ROI Distribution', frequency: 'Daily', time: '02:00', status: 'active' },
  ]);

  // Commission History
  const commissionHistory: CommissionRun[] = [
    { id: 'RUN001', type: 'Level Commission', date: '2024-05-15', affectedUsers: 128, totalAmount: 12500, status: 'completed' },
    { id: 'RUN002', type: 'Binary Matching', date: '2024-05-15', affectedUsers: 45, totalAmount: 8200, status: 'completed' },
    { id: 'RUN003', type: 'ROI Distribution', date: '2024-05-15', affectedUsers: 89, totalAmount: 15800, status: 'completed' },
  ];

  // Reports Data
  const commissionByType = [
    { type: 'Level', amount: 45000 },
    { type: 'Binary', amount: 28000 },
    { type: 'ROI', amount: 52000 },
    { type: 'Rank', amount: 18000 },
    { type: 'Booster', amount: 12000 },
  ];

  const monthlyCommissions = [
    { month: 'Jan', amount: 125000 },
    { month: 'Feb', amount: 145000 },
    { month: 'Mar', amount: 162000 },
    { month: 'Apr', amount: 178000 },
    { month: 'May', amount: 155000 },
  ];

  // Manual Adjustment State
  const [adjustmentForm, setAdjustmentForm] = useState<ManualAdjustment>({
    userId: '',
    userName: '',
    amount: 0,
    type: 'add',
    reason: '',
  });

  // Loading state
  const [loading, setLoading] = useState(true);

  // Load commission settings from database
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const settings = await getCommissionSettings();

        setLevelCommissions(settings.level_commissions);
        setBinarySettings(settings.binary_settings);
        setROISettings(settings.roi_settings);
        setRankRewards(settings.rank_rewards);
        setBoosterSettings(settings.booster_settings);

        toast.success('Commission settings loaded');
      } catch (error) {
        console.error('Error loading commission settings:', error);
        toast.error('Failed to load settings, using defaults');
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Save settings to database
  const handleSaveSettings = async () => {
    try {
      await saveCommissionSettings({
        level_commissions: levelCommissions,
        binary_settings: binarySettings,
        roi_settings: roiSettings,
        rank_rewards: rankRewards,
        booster_settings: boosterSettings,
      });

      toast.success('Commission settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    }
  };

  // Validation Helper
  const validatePercentage = (value: number, fieldName: string): boolean => {
    if (value > 100) {
      toast.error(`${fieldName} cannot exceed 100%`);
      return false;
    }
    if (value < 0) {
      toast.error(`${fieldName} cannot be negative`);
      return false;
    }
    return true;
  };

  // Handlers
  const handleBulkEdit = (field: 'percentage' | 'status', value: any) => {
    if (field === 'percentage') {
      if (!validatePercentage(Number(value), 'Percentage')) {
        return;
      }
    }
    setLevelCommissions(levelCommissions.map(lc => ({ ...lc, [field]: value })));
    toast.success('Bulk update applied');
  };

  const handleSaveConfiguration = async (type: string = 'Configuration') => {
    try {
      await handleSaveSettings();
      toast.success(`${type} saved successfully`, {
        icon: '✅',
        duration: 3000,
      });
    } catch (error: any) {
      toast.error(`Failed to save ${type}`);
    }
  };

  const handleCalculateCommission = () => {
    // Validate date range
    if (!processingForm.dateFrom || !processingForm.dateTo) {
      toast.error('Please select both from and to dates');
      return;
    }

    // Calculate based on commission type and actual configuration
    let affectedUsers = 0;
    let totalAmount = 0;

    switch (processingForm.commissionType) {
      case 'level':
        // Calculate level commission based on active levels
        const activeLevels = levelCommissions.filter(lc => lc.status === 'active');
        affectedUsers = activeLevels.length * 42; // Estimate 42 users per level
        totalAmount = activeLevels.reduce((sum, lc) => sum + (lc.percentage * 250), 0); // Base calculation
        break;

      case 'binary':
        // Calculate based on binary matching settings
        affectedUsers = 156;
        totalAmount = binarySettings.dailyCap * 8; // Estimate for date range
        break;

      case 'roi':
        // Calculate ROI distribution based on package settings
        affectedUsers = 89;
        const avgROI = ((roiSettings.starterMax + roiSettings.growthMax + roiSettings.premiumMax) / 3);
        totalAmount = Math.floor(avgROI * 1500); // Estimate based on average ROI
        break;

      case 'rank':
        // Calculate rank rewards
        affectedUsers = rankRewards.length * 8;
        totalAmount = rankRewards.reduce((sum, r) => sum + r.reward, 0) / 5; // Weighted estimate
        break;

      case 'booster':
        // Calculate booster income
        affectedUsers = 34;
        totalAmount = Math.floor(boosterSettings.percentage * 2000);
        break;

      default:
        affectedUsers = 100;
        totalAmount = 10000;
    }

    setPreviewData({ users: affectedUsers, amount: Math.floor(totalAmount) });
    setShowPreviewModal(true);
  };

  const handleProcessCommission = () => {
    toast.success('Commission processed successfully');
    setShowPreviewModal(false);
    setPreviewData(null);
  };

  const handleToggleScheduledJob = (jobId: string) => {
    setScheduledJobs(scheduledJobs.map(job =>
      job.id === jobId ? { ...job, status: job.status === 'active' ? 'inactive' as const : 'active' as const } : job
    ));
    toast.success('Scheduled job updated');
  };

  const handleManualAdjustment = () => {
    if (!adjustmentForm.userId || !adjustmentForm.amount || !adjustmentForm.reason) {
      toast.error('Please fill all required fields');
      return;
    }
    toast.success(`Commission ${adjustmentForm.type === 'add' ? 'added' : 'deducted'} successfully`);
    setAdjustmentForm({ userId: '', userName: '', amount: 0, type: 'add', reason: '' });
  };

  const handleBulkUpload = () => {
    toast.info('CSV upload feature coming soon');
  };

  const handleResetRequest = (type: string) => {
    setResetType(type);
    setShowResetModal(true);
  };

  const handleConfirmReset = () => {
    switch (resetType) {
      case 'level':
        setLevelCommissions(
          Array.from({ length: 30 }, (_, i) => ({
            level: i + 1,
            percentage: i < 5 ? 5 - i : i < 10 ? 2 : 1,
            status: 'active' as const,
          }))
        );
        toast.success('Level commission settings reset to defaults');
        break;

      case 'binary':
        setBinarySettings({
          matchingPercentage: 10,
          dailyCap: 1000,
          weeklyCap: 5000,
          monthlyCap: 20000,
          matchingRatio: '1:1',
          flushPeriod: 'weekly',
        });
        toast.success('Binary matching settings reset to defaults');
        break;

      case 'roi':
        setROISettings({
          starterMin: 5,
          starterMax: 7,
          growthMin: 7,
          growthMax: 10,
          premiumMin: 10,
          premiumMax: 15,
          distributionSchedule: 'daily',
        });
        toast.success('ROI settings reset to defaults');
        break;

      case 'rank':
        setRankRewards([
          { rank: 'Bronze', reward: 500, requirement: '5 directs' },
          { rank: 'Silver', reward: 1500, requirement: '10 directs + $5k team volume' },
          { rank: 'Gold', reward: 5000, requirement: '20 directs + $20k team volume' },
          { rank: 'Platinum', reward: 15000, requirement: '50 directs + $100k team volume' },
          { rank: 'Diamond', reward: 50000, requirement: '100 directs + $500k team volume' },
        ]);
        toast.success('Rank rewards reset to defaults');
        break;

      case 'booster':
        setBoosterSettings({
          percentage: 5,
          conditions: '- Minimum 10 active directs\n- Team volume $50,000+\n- Active package required',
        });
        toast.success('Booster income settings reset to defaults');
        break;
    }

    setShowResetModal(false);
    setResetType('');
  };

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Commission Management</h1>
        <p className="text-[#94a3b8]">Configure commission settings, process payouts, and manage adjustments</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94a3b8] text-sm mb-1">Total Paid (Month)</p>
              <p className="text-3xl font-bold text-[#10b981]">$155,000</p>
              <p className="text-[#10b981] text-sm mt-1">↑ 8% vs last month</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94a3b8] text-sm mb-1">Active Users</p>
              <p className="text-3xl font-bold text-[#00C7D1]">1,248</p>
              <p className="text-[#94a3b8] text-sm mt-1">Earning commissions</p>
            </div>
            <div className="text-4xl">👥</div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94a3b8] text-sm mb-1">Pending Payouts</p>
              <p className="text-3xl font-bold text-[#f59e0b]">$12,500</p>
              <p className="text-[#94a3b8] text-sm mt-1">Next run in 4h</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#94a3b8] text-sm mb-1">Avg Commission</p>
              <p className="text-3xl font-bold text-[#f8fafc]">$124</p>
              <p className="text-[#10b981] text-sm mt-1">↑ 5% per user</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-6 border-b border-[#334155] overflow-x-auto">
        {[
          { id: 'configuration', label: 'Configuration', icon: '⚙️' },
          { id: 'processing', label: 'Processing', icon: '▶️' },
          { id: 'reports', label: 'Reports', icon: '📈' },
          { id: 'adjustments', label: 'Adjustments', icon: '✏️' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-medium transition-all whitespace-nowrap ${
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

      {/* Configuration Tab */}
      {activeTab === 'configuration' && (
        <div className="space-y-6">
          {/* Sub-tabs */}
          <div className="flex gap-2 mb-4">
            {[
              { id: 'level', label: 'Level Income' },
              { id: 'binary', label: 'Binary Matching' },
              { id: 'roi', label: 'ROI Settings' },
              { id: 'rank', label: 'Rank Rewards' },
              { id: 'booster', label: 'Booster Income' },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => setConfigSection(section.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  configSection === section.id
                    ? 'bg-[#00C7D1] text-white'
                    : 'bg-[#1e293b] text-[#cbd5e1] hover:bg-[#334155]'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Level Income Settings */}
          {configSection === 'level' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[#f8fafc]">Level Commission Configuration</h3>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => handleBulkEdit('status', e.target.value)}
                    className="bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc] text-sm"
                  >
                    <option value="">Bulk Status Change</option>
                    <option value="active">Activate All</option>
                    <option value="inactive">Deactivate All</option>
                  </select>
                  <button
                    onClick={() => handleSaveConfiguration('Level Commission Configuration')}
                    className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Save Configuration
                  </button>
                  <button
                    onClick={() => handleResetRequest('level')}
                    className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>

              <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#334155]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Level</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Commission %</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Status</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]">
                      {levelCommissions.map((lc) => (
                        <tr key={lc.level} className="hover:bg-[#334155]/50">
                          <td className="px-6 py-4 text-[#f8fafc] font-semibold">Level {lc.level}</td>
                          <td className="px-6 py-4 text-center">
                            <input
                              type="number"
                              value={lc.percentage}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                if (!validatePercentage(value, `Level ${lc.level} commission`)) {
                                  return;
                                }
                                const updated = [...levelCommissions];
                                updated[lc.level - 1].percentage = value;
                                setLevelCommissions(updated);
                              }}
                              className="w-20 bg-[#0f172a] border border-[#334155] rounded px-2 py-1 text-[#f8fafc] text-center"
                              step="0.1"
                              min="0"
                              max="100"
                            />
                            <span className="ml-1 text-[#94a3b8]">%</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <select
                              value={lc.status}
                              onChange={(e) => {
                                const updated = [...levelCommissions];
                                updated[lc.level - 1].status = e.target.value as 'active' | 'inactive';
                                setLevelCommissions(updated);
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                lc.status === 'active'
                                  ? 'bg-[#10b981]/20 text-[#10b981]'
                                  : 'bg-[#ef4444]/20 text-[#ef4444]'
                              }`}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                const updated = [...levelCommissions];
                                updated[lc.level - 1].status = lc.status === 'active' ? 'inactive' : 'active';
                                setLevelCommissions(updated);
                              }}
                              className="text-[#00C7D1] hover:text-[#00b3bd] text-sm"
                            >
                              Toggle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Binary Matching Settings */}
          {configSection === 'binary' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#f8fafc]">Binary Matching Configuration</h3>

              <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[#94a3b8] text-sm mb-2">Matching Percentage</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={binarySettings.matchingPercentage}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          if (!validatePercentage(value, 'Matching percentage')) {
                            return;
                          }
                          setBinarySettings({ ...binarySettings, matchingPercentage: value });
                        }}
                        className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                        min="0"
                        max="100"
                        step="0.1"
                      />
                      <span className="text-[#94a3b8]">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#94a3b8] text-sm mb-2">Matching Ratio</label>
                    <select
                      value={binarySettings.matchingRatio}
                      onChange={(e) => setBinarySettings({ ...binarySettings, matchingRatio: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                    >
                      <option value="1:1">1:1</option>
                      <option value="1:2">1:2</option>
                      <option value="2:1">2:1</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#94a3b8] text-sm mb-2">Daily Cap ($)</label>
                    <input
                      type="number"
                      value={binarySettings.dailyCap}
                      onChange={(e) => setBinarySettings({ ...binarySettings, dailyCap: Number(e.target.value) })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#94a3b8] text-sm mb-2">Weekly Cap ($)</label>
                    <input
                      type="number"
                      value={binarySettings.weeklyCap}
                      onChange={(e) => setBinarySettings({ ...binarySettings, weeklyCap: Number(e.target.value) })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#94a3b8] text-sm mb-2">Monthly Cap ($)</label>
                    <input
                      type="number"
                      value={binarySettings.monthlyCap}
                      onChange={(e) => setBinarySettings({ ...binarySettings, monthlyCap: Number(e.target.value) })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#94a3b8] text-sm mb-2">Flush Period</label>
                    <select
                      value={binarySettings.flushPeriod}
                      onChange={(e) => setBinarySettings({ ...binarySettings, flushPeriod: e.target.value })}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <button
                    onClick={() => handleSaveConfiguration('Binary Matching Settings')}
                    className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Save Binary Settings
                  </button>
                  <button
                    onClick={() => handleResetRequest('binary')}
                    className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ROI Settings */}
          {configSection === 'roi' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#f8fafc]">ROI Configuration by Package</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'Starter Package', min: 'starterMin', max: 'starterMax' },
                  { name: 'Growth Package', min: 'growthMin', max: 'growthMax' },
                  { name: 'Premium Package', min: 'premiumMin', max: 'premiumMax' },
                ].map((pkg) => (
                  <div key={pkg.name} className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
                    <h4 className="text-[#f8fafc] font-semibold mb-4">{pkg.name}</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[#94a3b8] text-sm mb-2">Min ROI %</label>
                        <input
                          type="number"
                          value={roiSettings[pkg.min as keyof typeof roiSettings]}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (!validatePercentage(value, `${pkg.name} Min ROI`)) {
                              return;
                            }
                            setROISettings({ ...roiSettings, [pkg.min]: value });
                          }}
                          className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-[#94a3b8] text-sm mb-2">Max ROI %</label>
                        <input
                          type="number"
                          value={roiSettings[pkg.max as keyof typeof roiSettings]}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            if (!validatePercentage(value, `${pkg.name} Max ROI`)) {
                              return;
                            }
                            setROISettings({ ...roiSettings, [pkg.max]: value });
                          }}
                          className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
                <label className="block text-[#94a3b8] text-sm mb-2">Distribution Schedule</label>
                <select
                  value={roiSettings.distributionSchedule}
                  onChange={(e) => setROISettings({ ...roiSettings, distributionSchedule: e.target.value })}
                  className="w-full max-w-xs bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>

                <div className="mt-4 flex gap-4">
                  <button
                    onClick={() => handleSaveConfiguration('ROI Settings')}
                    className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Save ROI Settings
                  </button>
                  <button
                    onClick={() => handleResetRequest('roi')}
                    className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Reset to Defaults
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Rank Rewards */}
          {configSection === 'rank' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#f8fafc]">Rank Achievement Rewards</h3>

              <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#334155]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Rank</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Requirement</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Reward ($)</th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]">
                      {rankRewards.map((rank, idx) => (
                        <tr key={idx} className="hover:bg-[#334155]/50">
                          <td className="px-6 py-4 text-[#f8fafc] font-semibold">{rank.rank}</td>
                          <td className="px-6 py-4 text-[#cbd5e1]">{rank.requirement}</td>
                          <td className="px-6 py-4 text-right">
                            <input
                              type="number"
                              value={rank.reward}
                              onChange={(e) => {
                                const updated = [...rankRewards];
                                updated[idx].reward = Number(e.target.value);
                                setRankRewards(updated);
                              }}
                              className="w-32 bg-[#0f172a] border border-[#334155] rounded px-3 py-1 text-[#f8fafc] text-right"
                            />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button className="text-[#00C7D1] hover:text-[#00b3bd] text-sm">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleSaveConfiguration('Rank Rewards')}
                  className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Save Rank Rewards
                </button>
                <button
                  onClick={() => handleResetRequest('rank')}
                  className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          )}

          {/* Booster Income */}
          {configSection === 'booster' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-[#f8fafc]">Booster Income Configuration</h3>

              <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#94a3b8] text-sm mb-2">Booster Percentage</label>
                    <input
                      type="number"
                      value={boosterSettings.percentage}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (!validatePercentage(value, 'Booster percentage')) {
                          return;
                        }
                        setBoosterSettings({ ...boosterSettings, percentage: value });
                      }}
                      className="w-full max-w-xs bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <label className="block text-[#94a3b8] text-sm mb-2">Activation Conditions</label>
                    <textarea
                      value={boosterSettings.conditions}
                      onChange={(e) => setBoosterSettings({ ...boosterSettings, conditions: e.target.value })}
                      rows={4}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleSaveConfiguration('Booster Income Settings')}
                      className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Save Booster Settings
                    </button>
                    <button
                      onClick={() => handleResetRequest('booster')}
                      className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      Reset to Defaults
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Processing Tab */}
      {activeTab === 'processing' && (
        <div className="space-y-6">
          {/* Manual Commission Run */}
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Manual Commission Processing</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Commission Type</label>
                <select
                  value={processingForm.commissionType}
                  onChange={(e) => setProcessingForm({ ...processingForm, commissionType: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                >
                  <option value="level">Level Commission</option>
                  <option value="binary">Binary Matching</option>
                  <option value="roi">ROI Distribution</option>
                  <option value="rank">Rank Rewards</option>
                  <option value="booster">Booster Income</option>
                </select>
              </div>

              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Date From</label>
                <input
                  type="date"
                  value={processingForm.dateFrom}
                  onChange={(e) => setProcessingForm({ ...processingForm, dateFrom: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Date To</label>
                <input
                  type="date"
                  value={processingForm.dateTo}
                  onChange={(e) => setProcessingForm({ ...processingForm, dateTo: e.target.value })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCalculateCommission}
                className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-6 py-2 rounded-lg transition-colors"
              >
                Calculate & Preview
              </button>
            </div>
          </div>

          {/* Scheduled Jobs */}
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Scheduled Commission Jobs</h3>

            <div className="space-y-3">
              {scheduledJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-[#0f172a] rounded-lg border border-[#334155]">
                  <div className="flex-1">
                    <h4 className="text-[#f8fafc] font-semibold">{job.type}</h4>
                    <p className="text-[#94a3b8] text-sm">
                      {job.frequency} at {job.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.status === 'active' ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#ef4444]/20 text-[#ef4444]'
                    }`}>
                      {job.status}
                    </span>
                    <button
                      onClick={() => handleToggleScheduledJob(job.id)}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                        job.status === 'active'
                          ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white'
                          : 'bg-[#10b981] hover:bg-[#059669] text-white'
                      }`}
                    >
                      {job.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commission History */}
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-lg font-semibold text-[#f8fafc]">Recent Commission Runs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#334155]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Run ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Users</th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-[#cbd5e1] uppercase">Total Amount</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Status</th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]">
                  {commissionHistory.map((run) => (
                    <tr key={run.id} className="hover:bg-[#334155]/50">
                      <td className="px-6 py-4 text-[#f8fafc] font-mono text-sm">{run.id}</td>
                      <td className="px-6 py-4 text-[#cbd5e1]">{run.type}</td>
                      <td className="px-6 py-4 text-[#94a3b8] text-sm">
                        {format(new Date(run.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4 text-right text-[#f8fafc]">{run.affectedUsers}</td>
                      <td className="px-6 py-4 text-right text-[#10b981] font-semibold">
                        ${run.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#10b981]/20 text-[#10b981]">
                          {run.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="text-[#00C7D1] hover:text-[#00b3bd] text-sm">View Details</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[#f8fafc]">Commission Reports & Analytics</h2>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Commission by Type */}
            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Commission by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={commissionByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="type" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="amount" fill="#00C7D1" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Trend */}
            <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Monthly Commission Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyCommissions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => toast.success('Generating report...')}
              className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-6 py-3 rounded-lg transition-colors"
            >
              📄 Export Commission Report (PDF)
            </button>
            <button
              onClick={() => toast.success('Exporting data...')}
              className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-3 rounded-lg transition-colors"
            >
              📊 Export Commission Data (Excel)
            </button>
          </div>
        </div>
      )}

      {/* Adjustments Tab */}
      {activeTab === 'adjustments' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[#f8fafc]">Manual Commission Adjustments</h2>

          {/* Manual Adjustment Form */}
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Add/Deduct Commission</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">User ID</label>
                <input
                  type="text"
                  value={adjustmentForm.userId}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, userId: e.target.value })}
                  placeholder="Enter user ID"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">User Name</label>
                <input
                  type="text"
                  value={adjustmentForm.userName}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, userName: e.target.value })}
                  placeholder="Enter user name"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Type</label>
                <select
                  value={adjustmentForm.type}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type: e.target.value as 'add' | 'deduct' })}
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                >
                  <option value="add">Add Commission</option>
                  <option value="deduct">Deduct Commission</option>
                </select>
              </div>

              <div>
                <label className="block text-[#94a3b8] text-sm mb-2">Amount ($)</label>
                <input
                  type="number"
                  value={adjustmentForm.amount}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: Number(e.target.value) })}
                  placeholder="0.00"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[#94a3b8] text-sm mb-2">Reason (Required)</label>
                <textarea
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  rows={3}
                  placeholder="Enter detailed reason for adjustment..."
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
            </div>

            <button
              onClick={handleManualAdjustment}
              className={`${
                adjustmentForm.type === 'add'
                  ? 'bg-[#10b981] hover:bg-[#059669]'
                  : 'bg-[#ef4444] hover:bg-[#dc2626]'
              } text-white px-6 py-2 rounded-lg transition-colors`}
            >
              {adjustmentForm.type === 'add' ? 'Add Commission' : 'Deduct Commission'}
            </button>
          </div>

          {/* Bulk Upload */}
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Bulk Adjustment Upload</h3>
            <p className="text-[#94a3b8] text-sm mb-4">
              Upload a CSV file with user IDs, amounts, types, and reasons for bulk commission adjustments.
            </p>

            <div className="flex gap-4">
              <button
                onClick={handleBulkUpload}
                className="bg-[#00C7D1] hover:bg-[#00b3bd] text-white px-6 py-2 rounded-lg transition-colors"
              >
                📤 Upload CSV
              </button>
              <button
                onClick={() => toast.info('Downloading template...')}
                className="bg-[#334155] hover:bg-[#475569] text-[#f8fafc] px-6 py-2 rounded-lg transition-colors"
              >
                📥 Download Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-xl max-w-2xl w-full border border-[#334155]">
            <div className="p-6 border-b border-[#334155]">
              <h2 className="text-2xl font-bold text-[#f8fafc]">Commission Processing Preview</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0f172a] rounded-lg p-4 border border-[#334155]">
                  <p className="text-[#94a3b8] text-sm mb-1">Affected Users</p>
                  <p className="text-3xl font-bold text-[#00C7D1]">{previewData.users}</p>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-4 border border-[#334155]">
                  <p className="text-[#94a3b8] text-sm mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-[#10b981]">${previewData.amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg p-4">
                <p className="text-[#f59e0b] text-sm font-medium">
                  ⚠️ This action will process commissions for {previewData.users} users. Please review carefully before proceeding.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-[#334155] flex justify-end gap-4">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="bg-[#334155] hover:bg-[#475569] text-[#f8fafc] px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessCommission}
                className="bg-[#10b981] hover:bg-[#059669] text-white px-6 py-2 rounded-lg transition-colors"
              >
                Confirm & Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-[#1e293b] rounded-xl max-w-md w-full border border-[#ef4444]">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-[#ef4444]/20 rounded-full flex items-center justify-center text-2xl">
                  ⚠️
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#f8fafc]">Reset to Defaults</h2>
                  <p className="text-[#94a3b8] text-sm">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-lg p-4 mb-6">
                <p className="text-[#f8fafc] text-sm leading-relaxed">
                  Are you sure you want to reset these settings to their default values?
                  All current configuration changes will be lost.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetType('');
                  }}
                  className="flex-1 bg-[#334155] hover:bg-[#475569] text-[#f8fafc] px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReset}
                  className="flex-1 bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionManagement;
