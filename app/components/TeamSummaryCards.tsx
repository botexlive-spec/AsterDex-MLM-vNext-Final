/**
 * Team Summary Cards Component
 * Displays key metrics: Direct Members vs Total Team Members
 */

import React from 'react';

interface TeamSummaryCardsProps {
  directMembersCount: number;
  totalTeamCount: number;
  totalInvestment: number;
  totalBalance: number;
  maxDepth: number;
}

export const TeamSummaryCards: React.FC<TeamSummaryCardsProps> = ({
  directMembersCount,
  totalTeamCount,
  totalInvestment,
  totalBalance,
  maxDepth,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Direct Members Card */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white bg-opacity-30 rounded-lg">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-white bg-opacity-30 rounded-full">
            Level 1
          </span>
        </div>
        <h3 className="text-4xl font-bold mb-2">{directMembersCount}</h3>
        <p className="text-green-100 text-sm font-medium">Direct Members</p>
        <p className="text-green-200 text-xs mt-1">
          Users who joined using your referral link
        </p>
      </div>

      {/* Total Team Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white bg-opacity-30 rounded-lg">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <span className="text-xs font-semibold px-2 py-1 bg-white bg-opacity-30 rounded-full">
            {maxDepth} Levels
          </span>
        </div>
        <h3 className="text-4xl font-bold mb-2">{totalTeamCount}</h3>
        <p className="text-blue-100 text-sm font-medium">Total Team Members</p>
        <p className="text-blue-200 text-xs mt-1">
          All downline across {maxDepth} levels
        </p>
      </div>

      {/* Total Investment Card */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white bg-opacity-30 rounded-lg">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-4xl font-bold mb-2">{formatCurrency(totalInvestment)}</h3>
        <p className="text-purple-100 text-sm font-medium">Total Investment</p>
        <p className="text-purple-200 text-xs mt-1">
          Combined team investment
        </p>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white bg-opacity-30 rounded-lg">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-4xl font-bold mb-2">{formatCurrency(totalBalance)}</h3>
        <p className="text-orange-100 text-sm font-medium">Total Balance</p>
        <p className="text-orange-200 text-xs mt-1">
          Combined wallet balance
        </p>
      </div>
    </div>
  );
};
