/**
 * Level Members List Component
 * Displays detailed member information for a specific level
 */

import React, { useEffect, useState } from 'react';
import { getLevelMembers, TeamMemberDetail } from '../services/team-report.service';

interface LevelMembersListProps {
  level: number;
}

export const LevelMembersList: React.FC<LevelMembersListProps> = ({ level }) => {
  const [members, setMembers] = useState<TeamMemberDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(10);

  useEffect(() => {
    loadMembers();
  }, [level]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLevelMembers(level);
      setMembers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
    }
    return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Inactive</span>;
  };

  const getKYCBadge = (kycStatus: string) => {
    const statusConfig: Record<string, { bg: string; text: string }> = {
      approved: { bg: 'bg-green-100', text: 'text-green-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
      not_submitted: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    const config = statusConfig[kycStatus] || statusConfig.not_submitted;

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {kycStatus.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getRankBadge = (rank: string) => {
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 capitalize">
        {rank.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading members...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">❌ {error}</div>
        <button
          onClick={loadMembers}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No members found at level {level}
      </div>
    );
  }

  const displayedMembers = members.slice(0, displayCount);
  const hasMore = members.length > displayCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">
          Level {level} Members ({members.length} total)
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {member.full_name.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Member Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-sm font-semibold text-gray-900 truncate">
                    {member.full_name}
                  </h5>
                  {getStatusBadge(member.is_active)}
                </div>

                <p className="text-xs text-gray-600 truncate mb-2">{member.email}</p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-gray-500">ID:</span>
                    <span className="ml-1 text-gray-900 font-mono">
                      {member.id.substring(0, 8)}...
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Joined:</span>
                    <span className="ml-1 text-gray-900">{formatDate(member.created_at)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-gray-500">Investment:</span>
                    <span className="ml-1 text-gray-900 font-semibold">
                      {formatCurrency(member.total_investment)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Balance:</span>
                    <span className="ml-1 text-gray-900 font-semibold">
                      {formatCurrency(member.wallet_balance)}
                    </span>
                  </div>
                </div>

                {member.sponsor_name && (
                  <div className="text-xs mb-2">
                    <span className="text-gray-500">Sponsor:</span>
                    <span className="ml-1 text-gray-900">{member.sponsor_name}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2 mb-2">
                  {getRankBadge(member.current_rank)}
                  {getKYCBadge(member.kyc_status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Direct:</span>
                    <span className="ml-1 text-blue-600 font-semibold">{member.direct_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Team:</span>
                    <span className="ml-1 text-blue-600 font-semibold">{member.team_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={() => setDisplayCount(displayCount + 10)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Load More ({members.length - displayCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};
