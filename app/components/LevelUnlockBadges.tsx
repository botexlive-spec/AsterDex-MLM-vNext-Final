/**
 * Level Unlock Badges Component
 * Displays user's unlocked levels with visual badges and progress
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

interface LevelStatus {
  level: number;
  is_unlocked: boolean;
}

interface LevelUnlockData {
  direct_count: number;
  unlocked_levels: number;
  levels: LevelStatus[];
  next_milestone?: {
    threshold: number;
    levelsToUnlock: number[];
    directsNeeded: number;
  };
}

interface ProgressData {
  current_directs: number;
  current_unlocked_levels: number;
  next_unlock_at_directs: number | null;
  next_unlock_levels: number[] | null;
  directs_needed: number;
  progress_percentage: number;
  is_max_level: boolean;
}

export const LevelUnlockBadges: React.FC = () => {
  const { token } = useAuth();
  const [levelData, setLevelData] = useState<LevelUnlockData | null>(null);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLevelData();
  }, [token]);

  const fetchLevelData = async () => {
    if (!token) return;

    try {
      setLoading(true);

      // Fetch both status and progress in parallel
      const [statusRes, progressRes] = await Promise.all([
        api.get('/level-unlocks/status', token),
        api.get('/level-unlocks/progress', token)
      ]);

      if (statusRes.data?.level_unlocks) {
        setLevelData(statusRes.data.level_unlocks);
      }

      if (progressRes.data?.progress) {
        setProgressData(progressRes.data.progress);
      }
    } catch (error) {
      console.error('Error fetching level unlock data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-surface-light rounded w-48 mb-4"></div>
          <div className="grid grid-cols-10 gap-2">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-light rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!levelData) {
    return null;
  }

  const { levels, direct_count, unlocked_levels, next_milestone } = levelData;
  const unlockedCount = levels.filter(l => l.is_unlocked).length;

  return (
    <div className="space-y-6">
      {/* Header with Progress */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Generation Plan - Level Unlocks</h2>
            <p className="text-text-secondary">
              Unlock more levels by referring direct members
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-theme">{unlockedCount}</div>
            <div className="text-sm text-text-secondary">Levels Unlocked</div>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-surface-light rounded-lg p-4">
            <div className="text-sm text-text-secondary mb-1">Direct Referrals</div>
            <div className="text-2xl font-bold text-white">{direct_count}</div>
          </div>

          <div className="bg-surface-light rounded-lg p-4">
            <div className="text-sm text-text-secondary mb-1">Unlocked Levels</div>
            <div className="text-2xl font-bold text-theme">{unlockedCount} / 30</div>
          </div>

          {progressData && !progressData.is_max_level && (
            <div className="bg-surface-light rounded-lg p-4">
              <div className="text-sm text-text-secondary mb-1">Next Unlock</div>
              <div className="text-2xl font-bold text-yellow-400">
                {progressData.directs_needed} {progressData.directs_needed === 1 ? 'Direct' : 'Directs'}
              </div>
              <div className="text-xs text-text-secondary mt-1">
                Levels {progressData.next_unlock_levels?.join(', ')}
              </div>
            </div>
          )}

          {progressData?.is_max_level && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg p-4">
              <div className="text-sm text-yellow-400 mb-1">Status</div>
              <div className="text-xl font-bold text-white">All Levels Unlocked! 🎉</div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {progressData && !progressData.is_max_level && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-text-secondary mb-2">
              <span>Progress to Next Unlock</span>
              <span>{progressData.progress_percentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-surface-light rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-theme to-purple-400 transition-all duration-500"
                style={{ width: `${progressData.progress_percentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Level Badges Grid */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Your Levels</h3>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
            {levels.map((level) => (
              <div
                key={level.level}
                className={`
                  relative aspect-square rounded-lg flex items-center justify-center
                  font-bold text-sm transition-all duration-300
                  ${level.is_unlocked
                    ? 'bg-gradient-to-br from-theme to-purple-500 text-white shadow-lg shadow-theme/30 scale-100'
                    : 'bg-surface-light text-text-secondary scale-95 opacity-50'
                  }
                `}
              >
                <span>L{level.level}</span>
                {level.is_unlocked && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-xs">
                    ✓
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Unlock Rules */}
        <div className="mt-6 p-4 bg-surface-light rounded-lg">
          <h4 className="text-sm font-semibold text-white mb-3">Unlock Rules</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-text-secondary">1-8 Directs:</span>
              <span className="text-white font-medium">L1-L8 (1 per direct)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-text-secondary">9 Directs:</span>
              <span className="text-white font-medium">L9-L10</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-text-secondary">10 Directs:</span>
              <span className="text-white font-medium">L11-L15</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-text-secondary">15 Directs:</span>
              <span className="text-white font-medium">L16-L20</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-text-secondary">20 Directs:</span>
              <span className="text-white font-medium">L21-L25</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-text-secondary">25 Directs:</span>
              <span className="text-white font-medium">L26-L30</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LevelUnlockBadges;
