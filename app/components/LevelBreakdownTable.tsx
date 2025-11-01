/**
 * Level Breakdown Table Component
 * Shows team members breakdown by level with expandable member details
 */

import React, { useState } from 'react';
import { LevelStats } from '../services/team-report.service';
import { LevelMembersList } from './LevelMembersList';

interface LevelBreakdownTableProps {
  levels: LevelStats[];
  onExport?: (level: number) => void;
}

export const LevelBreakdownTable: React.FC<LevelBreakdownTableProps> = ({ levels, onExport }) => {
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const toggleLevel = (level: number) => {
    setExpandedLevel(expandedLevel === level ? null : level);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totals = levels.reduce(
    (acc, level) => ({
      members: acc.members + level.member_count,
      investment: acc.investment + level.total_investment,
      active: acc.active + level.active_count,
    }),
    { members: 0, investment: 0, active: 0 }
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                Level
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                Members
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                % of Team
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                Total Investment
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                Active Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {levels.map((level) => (
              <React.Fragment key={level.level}>
                <tr
                  className={`hover:bg-gray-50 transition-colors ${
                    expandedLevel === level.level ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          level.level === 1
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}
                      >
                        {level.level}
                      </div>
                      {level.level === 1 && (
                        <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Direct
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{level.member_count}</div>
                    <div className="text-xs text-gray-500">
                      {level.active_count} active, {level.inactive_count} inactive
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm text-gray-900">{level.percentage.toFixed(1)}%</div>
                      <div className="ml-2 w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${level.percentage}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatCurrency(level.total_investment)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatCurrency(level.total_balance)} balance
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1">
                        <div className="text-xs text-gray-600 mb-1">
                          {level.active_count}/{level.member_count}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(level.active_count / level.member_count) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => toggleLevel(level.level)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      {expandedLevel === level.level ? (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Hide
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          View
                        </>
                      )}
                    </button>
                    {onExport && (
                      <button
                        onClick={() => onExport(level.level)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Export
                      </button>
                    )}
                  </td>
                </tr>
                {expandedLevel === level.level && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 bg-gray-50">
                      <LevelMembersList level={level.level} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 border-t-2 border-gray-300">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">TOTAL</td>
              <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                {totals.members}
                <div className="text-xs text-gray-600 font-normal">
                  {totals.active} active
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">100%</td>
              <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                {formatCurrency(totals.investment)}
              </td>
              <td colSpan={2} className="px-6 py-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
