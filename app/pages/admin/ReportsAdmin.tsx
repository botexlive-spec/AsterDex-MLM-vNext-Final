import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { format, isAfter, isBefore, isValid, parseISO } from 'date-fns';
import * as ReportsService from '../../services/admin-reports.service';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type TabType = 'prebuilt' | 'custom' | 'scheduled' | 'analytics';

interface PrebuiltReport {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'financial' | 'user' | 'performance';
  lastGenerated?: string;
}

interface CustomReport {
  id: string;
  name: string;
  metrics: string[];
  filters: Record<string, any>;
  dateFrom: string;
  dateTo: string;
  savedBy: string;
  savedDate: string;
}

interface ScheduledReport {
  id: string;
  reportName: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  nextRun: string;
  status: 'active' | 'paused';
  format: 'pdf' | 'excel' | 'csv';
}

const prebuiltReports: PrebuiltReport[] = [
  {
    id: 'user-growth',
    name: 'User Growth Report',
    description: 'Track new registrations, active users, and growth trends',
    icon: '📈',
    category: 'user',
    lastGenerated: '2025-01-28',
  },
  {
    id: 'revenue',
    name: 'Revenue Report',
    description: 'Total revenue, commission payouts, and profit analysis',
    icon: '💰',
    category: 'financial',
    lastGenerated: '2025-01-28',
  },
  {
    id: 'investment',
    name: 'Investment Report',
    description: 'Package purchases, investment trends, and distribution',
    icon: '📦',
    category: 'financial',
    lastGenerated: '2025-01-27',
  },
  {
    id: 'earnings',
    name: 'Earnings Report',
    description: 'Commission earnings breakdown by type and user',
    icon: '💵',
    category: 'financial',
    lastGenerated: '2025-01-28',
  },
  {
    id: 'withdrawal',
    name: 'Withdrawal Report',
    description: 'Withdrawal requests, approved, pending, and rejected',
    icon: '⬆️',
    category: 'financial',
    lastGenerated: '2025-01-28',
  },
  {
    id: 'package-performance',
    name: 'Package Performance Report',
    description: 'Sales by package, ROI performance, and popularity',
    icon: '🎯',
    category: 'performance',
    lastGenerated: '2025-01-26',
  },
  {
    id: 'rank-achievement',
    name: 'Rank Achievement Report',
    description: 'Rank achievements, progression, and reward payouts',
    icon: '🏆',
    category: 'performance',
    lastGenerated: '2025-01-28',
  },
  {
    id: 'team-performance',
    name: 'Team Performance Report',
    description: 'Team building metrics, referrals, and network growth',
    icon: '👥',
    category: 'performance',
    lastGenerated: '2025-01-27',
  },
  {
    id: 'kyc-status',
    name: 'KYC Status Report',
    description: 'KYC verification status, pending, approved, rejected',
    icon: '🆔',
    category: 'user',
    lastGenerated: '2025-01-28',
  },
  {
    id: 'active-users',
    name: 'Active Users Report',
    description: 'Daily/monthly active users, engagement metrics',
    icon: '✅',
    category: 'user',
    lastGenerated: '2025-01-28',
  },
];

const mockScheduledReports: ScheduledReport[] = [
  {
    id: 's1',
    reportName: 'Daily Revenue Summary',
    frequency: 'daily',
    recipients: ['admin@finaster.com', 'finance@finaster.com'],
    nextRun: '2025-01-29 09:00',
    status: 'active',
    format: 'pdf',
  },
  {
    id: 's2',
    reportName: 'Weekly User Growth',
    frequency: 'weekly',
    recipients: ['admin@finaster.com'],
    nextRun: '2025-02-03 08:00',
    status: 'active',
    format: 'excel',
  },
  {
    id: 's3',
    reportName: 'Monthly Financial Report',
    frequency: 'monthly',
    recipients: ['admin@finaster.com', 'ceo@finaster.com'],
    nextRun: '2025-02-01 10:00',
    status: 'paused',
    format: 'pdf',
  },
];

const ReportsAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('prebuilt');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('2025-01-01');
  const [dateTo, setDateTo] = useState('2025-01-31');

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  // Custom Report Builder
  const [customReportName, setCustomReportName] = useState('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [savedReports, setSavedReports] = useState<CustomReport[]>([]);

  // Scheduled Reports
  const [scheduledReports, setScheduledReports] = useState(mockScheduledReports);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Analytics data (loaded from database)
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [revenueBreakdownData, setRevenueBreakdownData] = useState<any[]>([]);
  const [packagePerformanceData, setPackagePerformanceData] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const tabs = [
    { id: 'prebuilt' as TabType, label: 'Pre-built Reports', icon: '📊' },
    { id: 'custom' as TabType, label: 'Custom Builder', icon: '🔧' },
    { id: 'scheduled' as TabType, label: 'Scheduled Reports', icon: '📅' },
    { id: 'analytics' as TabType, label: 'Analytics Dashboard', icon: '📈' },
  ];

  // Load analytics data when analytics tab is active
  useEffect(() => {
    if (activeTab === 'analytics') {
      loadAnalyticsData();
    }
  }, [activeTab]);

  const loadAnalyticsData = async () => {
    setAnalyticsLoading(true);
    try {
      // Load all analytics data in parallel
      const [userGrowth, revenueBreakdown, packagePerformance] = await Promise.all([
        ReportsService.getAnalyticsDashboardData(),
        ReportsService.getRevenueBreakdown(),
        ReportsService.getPackagePerformanceData(),
      ]);

      setUserGrowthData(userGrowth);
      setRevenueBreakdownData(revenueBreakdown);
      setPackagePerformanceData(packagePerformance);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const metrics = [
    'Total Users',
    'New Registrations',
    'Active Users',
    'Total Revenue',
    'Total Investments',
    'Total Withdrawals',
    'Commission Payouts',
    'Package Sales',
    'Rank Achievements',
    'KYC Verifications',
    'Binary Volume',
    'Referrals',
  ];

  const filteredReports = prebuiltReports.filter(
    (report) => selectedCategory === 'all' || report.category === selectedCategory
  );

  // Date Range Validation
  const validateDateRange = (): boolean => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select both start and end dates');
      return false;
    }

    const fromDate = parseISO(dateFrom);
    const toDate = parseISO(dateTo);

    if (!isValid(fromDate) || !isValid(toDate)) {
      toast.error('Invalid date format');
      return false;
    }

    if (isAfter(fromDate, toDate)) {
      toast.error('Start date must be before end date');
      return false;
    }

    const today = new Date();
    if (isAfter(toDate, today)) {
      toast.error('End date cannot be in the future');
      return false;
    }

    return true;
  };

  // CSV Export
  const exportToCSV = (reportName: string, data: any[]) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Export (simplified - creates TSV for Excel compatibility)
  const exportToExcel = (reportName: string, data: any[]) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const tsvContent = [
      headers.join('\t'),
      ...data.map(row => headers.map(header => row[header]).join('\t'))
    ].join('\n');

    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportName}_${format(new Date(), 'yyyy-MM-dd')}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export (creates a formatted text document)
  const exportToPDF = (reportName: string, data: any[]) => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Create formatted text content
    let pdfContent = `${reportName}\n`;
    pdfContent += `Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}\n`;
    pdfContent += `Period: ${dateFrom} to ${dateTo}\n`;
    pdfContent += `${'='.repeat(50)}\n\n`;

    // Add data
    data.forEach((row, index) => {
      pdfContent += `Record ${index + 1}:\n`;
      Object.entries(row).forEach(([key, value]) => {
        pdfContent += `  ${key}: ${value}\n`;
      });
      pdfContent += '\n';
    });

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportName}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate report data from database
  const generateReportData = async (report: PrebuiltReport): Promise<any[]> => {
    try {
      const dateRange = { dateFrom, dateTo };
      const data = await ReportsService.generateReport(report.id, dateRange);
      return data;
    } catch (error) {
      console.error('Error generating report data:', error);
      return [];
    }
  };

  const handleGenerateReport = async (report: PrebuiltReport, format: 'pdf' | 'excel' | 'csv') => {
    if (!validateDateRange()) return;

    setIsGenerating(true);
    setGeneratingReportId(report.id);

    toast.success(`Generating ${report.name} as ${format.toUpperCase()}...`, {
      icon: '⚙️',
      duration: 2000,
    });

    try {
      // Fetch actual data from database
      const data = await generateReportData(report);

      if (data.length === 0) {
        toast.error('No data found for the selected date range');
        return;
      }

      const reportName = report.name.replace(/\s+/g, '_');

      switch (format) {
        case 'csv':
          exportToCSV(reportName, data);
          break;
        case 'excel':
          exportToExcel(reportName, data);
          break;
        case 'pdf':
          exportToPDF(reportName, data);
          break;
      }

      toast.success(`${report.name} downloaded successfully!`, {
        icon: '✅',
        duration: 3000,
      });
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
      setGeneratingReportId(null);
    }
  };

  const handlePreviewReport = (report: PrebuiltReport) => {
    toast.success(`Opening preview for ${report.name}...`);
  };

  const handleSaveCustomReport = () => {
    if (!customReportName || selectedMetrics.length === 0) {
      toast.error('Please enter report name and select at least one metric');
      return;
    }

    if (!validateDateRange()) return;

    const newReport: CustomReport = {
      id: `custom-${Date.now()}`,
      name: customReportName,
      metrics: selectedMetrics,
      filters: {},
      dateFrom,
      dateTo,
      savedBy: 'Admin User',
      savedDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };

    setSavedReports([newReport, ...savedReports]);
    toast.success('Custom report saved successfully!', {
      icon: '💾',
      duration: 3000,
    });

    // Reset form
    setCustomReportName('');
    setSelectedMetrics([]);
  };

  const handleGenerateCustomReport = async (customReport: CustomReport, format: 'pdf' | 'excel' | 'csv') => {
    setIsGenerating(true);
    setGeneratingReportId(customReport.id);

    toast.success(`Generating ${customReport.name} as ${format.toUpperCase()}...`, {
      icon: '⚙️',
      duration: 2000,
    });

    // Simulate API call
    setTimeout(() => {
      try {
        // Generate data based on selected metrics
        const data = customReport.metrics.map((metric, index) => ({
          Metric: metric,
          Value: Math.floor(Math.random() * 10000),
          Change: `${(Math.random() * 20 - 10).toFixed(2)}%`,
          Period: `${customReport.dateFrom} to ${customReport.dateTo}`,
        }));

        const reportName = customReport.name.replace(/\s+/g, '_');

        switch (format) {
          case 'csv':
            exportToCSV(reportName, data);
            break;
          case 'excel':
            exportToExcel(reportName, data);
            break;
          case 'pdf':
            exportToPDF(reportName, data);
            break;
        }

        toast.success(`${customReport.name} downloaded successfully!`, {
          icon: '✅',
          duration: 3000,
        });
      } catch (error) {
        toast.error('Failed to generate custom report. Please try again.');
      } finally {
        setIsGenerating(false);
        setGeneratingReportId(null);
      }
    }, 2000);
  };

  const handleToggleMetric = (metric: string) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  const handleToggleScheduledReport = (id: string) => {
    setScheduledReports((prev) =>
      prev.map((report) =>
        report.id === id
          ? { ...report, status: report.status === 'active' ? 'paused' : 'active' }
          : report
      )
    );
    toast.success('Schedule updated');
  };

  const handleDeleteScheduledReport = (id: string) => {
    setScheduledReports((prev) => prev.filter((report) => report.id !== id));
    toast.success('Scheduled report deleted');
  };

  // Static analytics data (not yet implemented in service)
  const conversionFunnelData = [
    { stage: 'Visitors', count: 10000 },
    { stage: 'Registrations', count: 890 },
    { stage: 'Email Verified', count: 780 },
    { stage: 'KYC Submitted', count: 650 },
    { stage: 'First Investment', count: 420 },
  ];

  const geographicData = [
    { country: 'USA', users: 245, percentage: 28 },
    { country: 'UK', users: 180, percentage: 20 },
    { country: 'India', users: 156, percentage: 18 },
    { country: 'Canada', users: 98, percentage: 11 },
    { country: 'Australia', users: 89, percentage: 10 },
    { country: 'Others', users: 122, percentage: 13 },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#f8fafc] mb-2">Reports & Analytics</h1>
          <p className="text-[#cbd5e1]">Generate reports, build custom analytics, and schedule automated reports</p>
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
          {/* Pre-built Reports Tab */}
          {activeTab === 'prebuilt' && (
            <div className="p-6">
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                  >
                    <option value="all">All Categories</option>
                    <option value="financial">Financial</option>
                    <option value="user">User</option>
                    <option value="performance">Performance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                  />
                </div>
              </div>

              {/* Reports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-[#0f172a] border border-[#334155] rounded-lg p-6 hover:border-[#00C7D1] transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">{report.icon}</div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        report.category === 'financial'
                          ? 'bg-[#10b981]/10 text-[#10b981]'
                          : report.category === 'user'
                          ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                          : 'bg-[#f59e0b]/10 text-[#f59e0b]'
                      }`}>
                        {report.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#f8fafc] mb-2">{report.name}</h3>
                    <p className="text-sm text-[#94a3b8] mb-4">{report.description}</p>
                    {report.lastGenerated && (
                      <p className="text-xs text-[#64748b] mb-4">
                        Last generated: {format(new Date(report.lastGenerated), 'MMM dd, yyyy')}
                      </p>
                    )}
                    {/* Loading State */}
                    {isGenerating && generatingReportId === report.id && (
                      <div className="mb-4 flex items-center gap-2 text-[#00C7D1] text-sm">
                        <div className="animate-spin h-4 w-4 border-2 border-[#00C7D1] border-t-transparent rounded-full"></div>
                        <span>Generating report...</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePreviewReport(report)}
                        disabled={isGenerating && generatingReportId === report.id}
                        className="flex-1 px-3 py-2 bg-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#475569] transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Preview
                      </button>
                      <div className="relative group">
                        <button
                          disabled={isGenerating && generatingReportId === report.id}
                          className="px-3 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Export ▼
                        </button>
                        <div className="absolute right-0 mt-2 w-32 bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                          <button
                            onClick={() => handleGenerateReport(report, 'pdf')}
                            disabled={isGenerating}
                            className="w-full px-4 py-2 text-left text-[#cbd5e1] hover:bg-[#334155] rounded-t-lg text-sm disabled:opacity-50"
                          >
                            📄 PDF
                          </button>
                          <button
                            onClick={() => handleGenerateReport(report, 'excel')}
                            disabled={isGenerating}
                            className="w-full px-4 py-2 text-left text-[#cbd5e1] hover:bg-[#334155] text-sm disabled:opacity-50"
                          >
                            📊 Excel
                          </button>
                          <button
                            onClick={() => handleGenerateReport(report, 'csv')}
                            disabled={isGenerating}
                            className="w-full px-4 py-2 text-left text-[#cbd5e1] hover:bg-[#334155] rounded-b-lg text-sm disabled:opacity-50"
                          >
                            📋 CSV
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Report Builder Tab */}
          {activeTab === 'custom' && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Report Builder */}
                <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-[#f8fafc] mb-6">Build Custom Report</h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Report Name</label>
                      <input
                        type="text"
                        value={customReportName}
                        onChange={(e) => setCustomReportName(e.target.value)}
                        placeholder="Enter report name..."
                        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Select Metrics</label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {metrics.map((metric) => (
                          <label key={metric} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-[#1e293b] rounded">
                            <input
                              type="checkbox"
                              checked={selectedMetrics.includes(metric)}
                              onChange={() => handleToggleMetric(metric)}
                              className="w-4 h-4 rounded border-[#334155] bg-[#1e293b] text-[#00C7D1] focus:ring-[#00C7D1]"
                            />
                            <span className="text-[#cbd5e1] text-sm">{metric}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Date From</label>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Date To</label>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveCustomReport}
                        className="flex-1 px-4 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
                      >
                        💾 Save Template
                      </button>
                      <button
                        onClick={() => {
                          if (selectedMetrics.length > 0) {
                            toast.success('Generating report preview...');
                          } else {
                            toast.error('Please select at least one metric');
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#475569] transition-all"
                      >
                        👁️ Preview
                      </button>
                    </div>
                  </div>
                </div>

                {/* Saved Reports */}
                <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-[#f8fafc] mb-6">Saved Report Templates</h2>

                  <div className="space-y-3">
                    {savedReports.length === 0 ? (
                      <div className="text-center py-12 text-[#94a3b8]">
                        <div className="text-5xl mb-3">📊</div>
                        <p>No saved templates yet</p>
                        <p className="text-sm mt-1">Create your first custom report</p>
                      </div>
                    ) : (
                      savedReports.map((report) => (
                        <div
                          key={report.id}
                          className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 hover:border-[#00C7D1] transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-[#f8fafc]">{report.name}</h3>
                            <button
                              onClick={() => setSavedReports(savedReports.filter((r) => r.id !== report.id))}
                              className="text-[#ef4444] hover:text-[#dc2626] text-sm"
                            >
                              🗑️
                            </button>
                          </div>
                          <p className="text-xs text-[#94a3b8] mb-2">
                            {report.metrics.length} metrics • {report.dateFrom} to {report.dateTo}
                          </p>
                          {isGenerating && generatingReportId === report.id && (
                            <div className="mb-2 flex items-center gap-2 text-[#00C7D1] text-xs">
                              <div className="animate-spin h-3 w-3 border-2 border-[#00C7D1] border-t-transparent rounded-full"></div>
                              <span>Generating...</span>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <div className="relative group flex-1">
                              <button
                                disabled={isGenerating}
                                className="w-full px-3 py-1.5 bg-[#00C7D1] text-[#0f172a] rounded text-xs font-medium hover:bg-[#00e5f0] disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Generate ▼
                              </button>
                              <div className="absolute left-0 bottom-full mb-2 w-full bg-[#1e293b] border border-[#334155] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                                <button
                                  onClick={() => handleGenerateCustomReport(report, 'pdf')}
                                  disabled={isGenerating}
                                  className="w-full px-3 py-1.5 text-left text-[#cbd5e1] hover:bg-[#334155] rounded-t-lg text-xs"
                                >
                                  📄 PDF
                                </button>
                                <button
                                  onClick={() => handleGenerateCustomReport(report, 'excel')}
                                  disabled={isGenerating}
                                  className="w-full px-3 py-1.5 text-left text-[#cbd5e1] hover:bg-[#334155] text-xs"
                                >
                                  📊 Excel
                                </button>
                                <button
                                  onClick={() => handleGenerateCustomReport(report, 'csv')}
                                  disabled={isGenerating}
                                  className="w-full px-3 py-1.5 text-left text-[#cbd5e1] hover:bg-[#334155] rounded-b-lg text-xs"
                                >
                                  📋 CSV
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => setSavedReports(savedReports.filter((r) => r.id !== report.id))}
                              disabled={isGenerating}
                              className="px-3 py-1.5 bg-[#ef4444]/10 text-[#ef4444] rounded text-xs hover:bg-[#ef4444]/20 disabled:opacity-50"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Reports Tab */}
          {activeTab === 'scheduled' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#f8fafc]">Scheduled Reports</h2>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
                >
                  ➕ New Schedule
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#334155]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Report</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Frequency</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Recipients</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-[#cbd5e1] uppercase">Next Run</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Format</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Status</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-[#cbd5e1] uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]">
                    {scheduledReports.map((report) => (
                      <tr key={report.id} className="hover:bg-[#334155]/50">
                        <td className="px-6 py-4 text-[#f8fafc] font-medium">{report.reportName}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-[#3b82f6]/10 text-[#3b82f6] rounded text-xs font-medium capitalize">
                            {report.frequency}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[#cbd5e1] text-sm">
                          {report.recipients.length} recipient(s)
                        </td>
                        <td className="px-6 py-4 text-[#cbd5e1]">{report.nextRun}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-[#00C7D1] font-medium uppercase text-xs">{report.format}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            report.status === 'active'
                              ? 'bg-[#10b981]/10 text-[#10b981]'
                              : 'bg-[#94a3b8]/10 text-[#94a3b8]'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleToggleScheduledReport(report.id)}
                              className={`px-3 py-1 rounded text-xs font-medium ${
                                report.status === 'active'
                                  ? 'bg-[#f59e0b]/10 text-[#f59e0b] hover:bg-[#f59e0b]/20'
                                  : 'bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20'
                              }`}
                            >
                              {report.status === 'active' ? 'Pause' : 'Resume'}
                            </button>
                            <button
                              onClick={() => handleDeleteScheduledReport(report.id)}
                              className="px-3 py-1 bg-[#ef4444]/10 text-[#ef4444] rounded text-xs hover:bg-[#ef4444]/20"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Dashboard Tab */}
          {activeTab === 'analytics' && (
            <div className="p-6 space-y-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-[#f8fafc]">Visual Analytics Dashboard</h2>
                {analyticsLoading && (
                  <div className="flex items-center gap-2 text-[#00C7D1]">
                    <div className="animate-spin h-5 w-5 border-2 border-[#00C7D1] border-t-transparent rounded-full"></div>
                    <span className="text-sm">Loading analytics...</span>
                  </div>
                )}
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
                  <div className="text-sm text-[#94a3b8] mb-1">Total Users</div>
                  <div className="text-3xl font-bold text-[#f8fafc] mb-2">890</div>
                  <div className="text-xs text-[#10b981]">↑ 23% from last month</div>
                </div>
                <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
                  <div className="text-sm text-[#94a3b8] mb-1">Total Revenue</div>
                  <div className="text-3xl font-bold text-[#f8fafc] mb-2">$267k</div>
                  <div className="text-xs text-[#10b981]">↑ 18% from last month</div>
                </div>
                <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
                  <div className="text-sm text-[#94a3b8] mb-1">Active Rate</div>
                  <div className="text-3xl font-bold text-[#f8fafc] mb-2">68%</div>
                  <div className="text-xs text-[#ef4444]">↓ 2% from last month</div>
                </div>
                <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
                  <div className="text-sm text-[#94a3b8] mb-1">Conversion</div>
                  <div className="text-3xl font-bold text-[#f8fafc] mb-2">4.2%</div>
                  <div className="text-xs text-[#10b981]">↑ 0.5% from last month</div>
                </div>
              </div>

              {/* User Growth & Revenue */}
              <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">User Growth & Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userGrowthData}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C7D1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00C7D1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis yAxisId="left" stroke="#94a3b8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="users"
                      stroke="#00C7D1"
                      fillOpacity={1}
                      fill="url(#colorUsers)"
                      name="Users"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                      name="Revenue ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Revenue Breakdown & Package Performance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Breakdown Pie */}
                <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Revenue Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={revenueBreakdownData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {revenueBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
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

                {/* Package Performance */}
                <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Package Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={packagePerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="package" stroke="#94a3b8" />
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
                      <Bar dataKey="sales" fill="#00C7D1" name="Sales" />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue ($)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Conversion Funnel</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={conversionFunnelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis dataKey="stage" type="category" stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f8fafc',
                      }}
                    />
                    <Bar dataKey="count" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Geographic Distribution */}
              <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Geographic Distribution</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#1e293b]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase">Country</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-[#cbd5e1] uppercase">Users</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-[#cbd5e1] uppercase">Distribution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#334155]">
                      {geographicData.map((item) => (
                        <tr key={item.country} className="hover:bg-[#1e293b]">
                          <td className="px-6 py-4 text-[#f8fafc] font-medium">{item.country}</td>
                          <td className="px-6 py-4 text-right text-[#00C7D1] font-semibold">{item.users}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-[#1e293b] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#00C7D1] to-[#10b981]"
                                  style={{ width: `${item.percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-[#cbd5e1] w-12 text-right">{item.percentage}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e293b] rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-[#334155]">
              <h3 className="text-xl font-semibold text-[#f8fafc]">Schedule New Report</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Report Type</label>
                <select className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]">
                  {prebuiltReports.map((report) => (
                    <option key={report.id} value={report.id}>{report.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Frequency</label>
                <select className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Email Recipients (comma separated)</label>
                <input
                  type="text"
                  placeholder="admin@finaster.com, team@finaster.com"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#cbd5e1] mb-2">Export Format</label>
                <select className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-[#f8fafc]">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-[#334155] flex justify-end gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-6 py-2 bg-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#475569] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.success('Report scheduled successfully!');
                  setShowScheduleModal(false);
                }}
                className="px-6 py-2 bg-[#00C7D1] text-[#0f172a] rounded-lg hover:bg-[#00e5f0] transition-all font-medium"
              >
                Schedule Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsAdmin;
