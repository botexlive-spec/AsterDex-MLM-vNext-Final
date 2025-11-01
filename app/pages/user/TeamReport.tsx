/**
 * Team Report Page
 * Comprehensive view of team structure with level-wise breakdown
 * Clearly distinguishes Direct Members (Level 1) from Total Team (All Levels)
 */

import React, { useEffect, useState } from 'react';
import { TeamSummaryCards } from '../../components/TeamSummaryCards';
import { TeamLevelChart } from '../../components/TeamLevelChart';
import { LevelBreakdownTable } from '../../components/LevelBreakdownTable';
import { getTeamReport, exportLevelReport, TeamReportData } from '../../services/team-report.service';

export const TeamReport: React.FC = () => {
  const [report, setReport] = useState<TeamReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<number | null>(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTeamReport();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load team report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (level: number) => {
    try {
      setExporting(level);
      const csv = await exportLevelReport(level);

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `level-${level}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Failed to export: ${err.message}`);
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 text-lg">Loading team report...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <svg
              className="w-12 h-12 text-red-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Report</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={loadReport}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Report</h1>
              <p className="mt-2 text-gray-600">
                Comprehensive breakdown of your direct referrals and total team structure
              </p>
            </div>
            <button
              onClick={loadReport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Understanding Your Team Structure</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>Direct Members (Level 1):</strong> Users who joined using your personal referral link
                    </li>
                    <li>
                      <strong>Total Team:</strong> All downline members from Level 1 through Level {report.max_depth}
                    </li>
                    <li>Each level shows members referred by the previous level</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <TeamSummaryCards
          directMembersCount={report.direct_members_count}
          totalTeamCount={report.total_team_count}
          totalInvestment={report.total_investment}
          totalBalance={report.total_balance}
          maxDepth={report.max_depth}
        />

        {/* Level Distribution Chart */}
        {report.levels.length > 0 && <TeamLevelChart levels={report.levels} />}

        {/* Empty State */}
        {report.levels.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Members Yet</h3>
            <p className="text-gray-600 mb-4">
              Start building your team by sharing your referral link with others
            </p>
            <button
              onClick={() => window.location.href = '/referrals'}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              View Referral Link
            </button>
          </div>
        )}

        {/* Level Breakdown Table */}
        {report.levels.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Level-Wise Breakdown</h2>
            <LevelBreakdownTable levels={report.levels} onExport={handleExport} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamReport;
