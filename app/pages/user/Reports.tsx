import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';
import { Button, Card } from '../../components/ui/DesignSystem';

// Report types
type ReportType = 'earnings' | 'referrals' | 'team' | 'roi' | 'commissions';
type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'all';
type ExportFormat = 'csv' | 'pdf' | 'excel';

interface EarningsData {
  date: string;
  total: number;
  roi: number;
  commission: number;
  binary: number;
  rankBonus: number;
}

interface TeamPerformer {
  id: string;
  name: string;
  rank: string;
  earnings: number;
  team: number;
  avatar?: string;
}

interface Activity {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
}

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [reportType, setReportType] = useState<ReportType>('earnings');
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Mock earnings data (last 30 days)
  const earningsData: EarningsData[] = [
    { date: '2025-01-01', total: 120, roi: 60, commission: 30, binary: 20, rankBonus: 10 },
    { date: '2025-01-03', total: 150, roi: 75, commission: 40, binary: 25, rankBonus: 10 },
    { date: '2025-01-05', total: 140, roi: 70, commission: 35, binary: 25, rankBonus: 10 },
    { date: '2025-01-07', total: 180, roi: 90, commission: 45, binary: 30, rankBonus: 15 },
    { date: '2025-01-09', total: 200, roi: 100, commission: 50, binary: 35, rankBonus: 15 },
    { date: '2025-01-11', total: 190, roi: 95, commission: 48, binary: 32, rankBonus: 15 },
    { date: '2025-01-13', total: 220, roi: 110, commission: 55, binary: 40, rankBonus: 15 },
    { date: '2025-01-15', total: 250, roi: 125, commission: 65, binary: 45, rankBonus: 15 },
    { date: '2025-01-17', total: 240, roi: 120, commission: 60, binary: 45, rankBonus: 15 },
    { date: '2025-01-19', total: 280, roi: 140, commission: 70, binary: 50, rankBonus: 20 },
    { date: '2025-01-21', total: 300, roi: 150, commission: 75, binary: 55, rankBonus: 20 },
    { date: '2025-01-23', total: 290, roi: 145, commission: 73, binary: 52, rankBonus: 20 },
    { date: '2025-01-25', total: 320, roi: 160, commission: 80, binary: 60, rankBonus: 20 },
    { date: '2025-01-27', total: 350, roi: 175, commission: 88, binary: 67, rankBonus: 20 },
    { date: '2025-01-29', total: 340, roi: 170, commission: 85, binary: 65, rankBonus: 20 },
    { date: '2025-01-31', total: 380, roi: 190, commission: 95, binary: 75, rankBonus: 20 },
  ];

  // Earnings breakdown for pie chart
  const earningsBreakdown = useMemo(() => {
    const totals = earningsData.reduce(
      (acc, day) => ({
        roi: acc.roi + day.roi,
        commission: acc.commission + day.commission,
        binary: acc.binary + day.binary,
        rankBonus: acc.rankBonus + day.rankBonus,
      }),
      { roi: 0, commission: 0, binary: 0, rankBonus: 0 }
    );

    return [
      { name: 'ROI', value: totals.roi, color: '#10b981', percentage: 53 },
      { name: 'Commission', value: totals.commission, color: '#00C7D1', percentage: 27 },
      { name: 'Binary', value: totals.binary, color: '#667eea', percentage: 13 },
      { name: 'Rank Bonus', value: totals.rankBonus, color: '#f59e0b', percentage: 7 },
    ];
  }, []);

  // Top performers
  const topPerformers: TeamPerformer[] = [
    { id: '1', name: 'Alice Johnson', rank: 'Platinum', earnings: 15000, team: 50 },
    { id: '2', name: 'Bob Smith', rank: 'Gold', earnings: 12000, team: 35 },
    { id: '3', name: 'Carol White', rank: 'Gold', earnings: 10000, team: 30 },
    { id: '4', name: 'David Brown', rank: 'Silver', earnings: 8000, team: 25 },
    { id: '5', name: 'Emma Davis', rank: 'Silver', earnings: 7000, team: 20 },
  ];

  // Recent activities
  const recentActivities: Activity[] = [
    { id: '1', date: '2025-01-31', type: 'ROI', description: 'Daily ROI from Gold Package', amount: 50 },
    { id: '2', date: '2025-01-31', type: 'Commission', description: 'Direct referral bonus', amount: 25 },
    { id: '3', date: '2025-01-30', type: 'Binary', description: 'Binary bonus payout', amount: 35 },
    { id: '4', date: '2025-01-30', type: 'Rank Bonus', description: 'Gold rank achievement bonus', amount: 100 },
    { id: '5', date: '2025-01-29', type: 'Commission', description: 'Level 2 commission', amount: 15 },
  ];

  // Calculate metrics based on date range
  const metrics = useMemo(() => {
    const filteredData = earningsData; // In real app, filter by dateRange
    const totalEarnings = filteredData.reduce((sum, day) => sum + day.total, 0);
    const roiEarnings = filteredData.reduce((sum, day) => sum + day.roi, 0);
    const commissionEarnings = filteredData.reduce((sum, day) => sum + day.commission, 0);
    const newTeamMembers = 12; // Mock value

    return {
      totalEarnings,
      roiEarnings,
      commissionEarnings,
      newTeamMembers,
      growth: 24.5, // Mock percentage
    };
  }, [dateRange]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    toast.loading('Generating report...', { id: 'generate' });

    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`, { id: 'generate' });
    }, 1500);
  };

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    toast.loading(`Exporting as ${format.toUpperCase()}...`, { id: 'export' });

    // Simulate export
    setTimeout(() => {
      setIsExporting(false);
      toast.success(`Report exported as ${format.toUpperCase()} successfully!`, { id: 'export' });

      // In real app, trigger download
      const filename = `${reportType}-report-${dateRange}-${format}`;
      console.log('Exporting:', filename);
    }, 1500);
  };

  const getRankBadgeColor = (rank: string) => {
    const colors: Record<string, string> = {
      Platinum: 'from-[#e5e7eb] to-[#9ca3af]',
      Gold: 'from-[#fbbf24] to-[#f59e0b]',
      Silver: 'from-[#cbd5e1] to-[#94a3b8]',
      Bronze: 'from-[#d97706] to-[#92400e]',
    };
    return colors[rank] || 'from-[#475569] to-[#334155]';
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      ROI: '📈',
      Commission: '💰',
      Binary: '🔄',
      'Rank Bonus': '🏆',
      Deposit: '⬇️',
      Withdraw: '⬆️',
    };
    return icons[type] || '💵';
  };

  return (
    <div className="min-h-screen bg-[#0f172a] p-5 max-w-7xl mx-auto">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Reports & Analytics</h1>
        <p className="text-[#94a3b8]">Comprehensive insights into your performance</p>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6 bg-[#1e293b]">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              className="w-full px-4 py-2 bg-[#334155] text-[#f8fafc] rounded-lg border border-[#475569] focus:border-[#00C7D1] focus:outline-none transition-colors"
            >
              <option value="earnings">Earnings Report</option>
              <option value="referrals">Referral Report</option>
              <option value="team">Team Performance</option>
              <option value="roi">ROI Analysis</option>
              <option value="commissions">Commission Breakdown</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="w-full px-4 py-2 bg-[#334155] text-[#f8fafc] rounded-lg border border-[#475569] focus:border-[#00C7D1] focus:outline-none transition-colors"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  📊 Generate
                </>
              )}
            </Button>

            <div className="relative group">
              <Button
                variant="success"
                size="md"
                disabled={isExporting}
                className="flex items-center gap-2"
              >
                📥 Export
              </Button>

              {/* Export dropdown */}
              <div className="absolute top-full right-0 mt-2 w-40 bg-[#334155] rounded-lg shadow-xl border border-[#475569] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-[#f8fafc] hover:bg-[#475569] rounded-t-lg transition-colors"
                  disabled={isExporting}
                >
                  📄 Export CSV
                </button>
                <button
                  onClick={() => handleExport('excel')}
                  className="w-full px-4 py-2 text-left text-[#f8fafc] hover:bg-[#475569] transition-colors"
                  disabled={isExporting}
                >
                  📊 Export Excel
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full px-4 py-2 text-left text-[#f8fafc] hover:bg-[#475569] rounded-b-lg transition-colors"
                  disabled={isExporting}
                >
                  📑 Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="bg-gradient-to-br from-[#10b981] to-[#059669]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white/90 font-medium text-sm">Total Earnings</h3>
            <div className="text-3xl">💰</div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">${metrics.totalEarnings.toLocaleString()}</p>
          <p className="text-white/80 text-sm">+{metrics.growth}% from last period</p>
        </Card>

        <Card className="bg-gradient-to-br from-[#00C7D1] to-[#0891b2]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white/90 font-medium text-sm">ROI Earnings</h3>
            <div className="text-3xl">📈</div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">${metrics.roiEarnings.toLocaleString()}</p>
          <p className="text-white/80 text-sm">+18.2% from last period</p>
        </Card>

        <Card className="bg-gradient-to-br from-[#f59e0b] to-[#d97706]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white/90 font-medium text-sm">Commission</h3>
            <div className="text-3xl">🤝</div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">${metrics.commissionEarnings.toLocaleString()}</p>
          <p className="text-white/80 text-sm">+32.5% from last period</p>
        </Card>

        <Card className="bg-gradient-to-br from-[#667eea] to-[#764ba2]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white/90 font-medium text-sm">New Team Members</h3>
            <div className="text-3xl">👥</div>
          </div>
          <p className="text-3xl font-bold text-white mb-2">{metrics.newTeamMembers}</p>
          <p className="text-white/80 text-sm">+{metrics.newTeamMembers} from last period</p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Performance Chart */}
        <Card className="bg-[#1e293b]">
          <h3 className="text-xl font-bold text-[#f8fafc] mb-4">Performance Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  style={{ fontSize: 12 }}
                  tickFormatter={(value) => format(new Date(value), 'MMM dd')}
                />
                <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#334155',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }}
                  labelFormatter={(value) => format(new Date(value), 'MMM dd, yyyy')}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Total Earnings"
                />
                <Line
                  type="monotone"
                  dataKey="roi"
                  stroke="#00C7D1"
                  strokeWidth={2}
                  dot={{ fill: '#00C7D1', r: 3 }}
                  name="ROI"
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 3 }}
                  name="Commission"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Earnings Breakdown Pie Chart */}
        <Card className="bg-[#1e293b]">
          <h3 className="text-xl font-bold text-[#f8fafc] mb-4">Earnings Breakdown</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={earningsBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {earningsBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#334155',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#f8fafc'
                  }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Earnings Breakdown Table */}
      <Card className="mb-6 bg-[#1e293b]">
        <h3 className="text-xl font-bold text-[#f8fafc] mb-4">Earnings Breakdown Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-[#334155]">
                <th className="px-4 py-3 text-left text-[#cbd5e1] font-semibold">Source</th>
                <th className="px-4 py-3 text-right text-[#cbd5e1] font-semibold">Amount</th>
                <th className="px-4 py-3 text-right text-[#cbd5e1] font-semibold">Percentage</th>
                <th className="px-4 py-3 text-center text-[#cbd5e1] font-semibold">Trend</th>
              </tr>
            </thead>
            <tbody>
              {earningsBreakdown.map((item, index) => (
                <tr key={index} className="border-b border-[#334155] hover:bg-[#334155] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[#f8fafc] font-medium">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-[#f8fafc] font-bold">
                    ${item.value.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-[#94a3b8]">
                    {item.percentage}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-[#10b981] flex items-center justify-center gap-1">
                      ↑ <span className="text-sm">+{Math.floor(Math.random() * 20 + 10)}%</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card className="bg-[#1e293b]">
          <h3 className="text-xl font-bold text-[#f8fafc] mb-4">Top Performers</h3>
          <div className="space-y-3">
            {topPerformers.map((performer, index) => (
              <div
                key={performer.id}
                className="flex items-center gap-4 p-3 bg-[#334155] rounded-lg hover:bg-[#475569] transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl font-bold text-[#94a3b8]">#{index + 1}</div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00C7D1] to-[#00e5f0] flex items-center justify-center text-white font-bold">
                    {performer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[#f8fafc] font-medium">{performer.name}</p>
                    <div className={`inline-block px-2 py-0.5 rounded text-xs font-bold bg-gradient-to-r ${getRankBadgeColor(performer.rank)} text-white`}>
                      {performer.rank}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[#10b981] font-bold text-lg">${performer.earnings.toLocaleString()}</p>
                  <p className="text-[#94a3b8] text-sm">{performer.team} team members</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-[#1e293b]">
          <h3 className="text-xl font-bold text-[#f8fafc] mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 p-3 bg-[#334155] rounded-lg hover:bg-[#475569] transition-colors"
              >
                <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <p className="text-[#f8fafc] font-medium">{activity.description}</p>
                  <p className="text-xs text-[#94a3b8]">{format(new Date(activity.date), 'MMM dd, yyyy')}</p>
                </div>
                <p className="text-[#10b981] font-bold text-lg">+${activity.amount}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
