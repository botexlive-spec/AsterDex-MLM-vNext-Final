/**
 * Team Level Chart Component
 * Visual bar chart showing member distribution across levels
 */

import React from 'react';
import { LevelStats } from '../services/team-report.service';

interface TeamLevelChartProps {
  levels: LevelStats[];
}

export const TeamLevelChart: React.FC<TeamLevelChartProps> = ({ levels }) => {
  if (levels.length === 0) {
    return null;
  }

  const maxCount = Math.max(...levels.map(l => l.member_count));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Team Distribution by Level</h3>

      <div className="space-y-3">
        {levels.map((level) => {
          const widthPercentage = (level.member_count / maxCount) * 100;

          return (
            <div key={level.level} className="flex items-center">
              {/* Level Label */}
              <div className="w-24 flex-shrink-0">
                <span
                  className={`inline-flex items-center justify-center w-16 px-2 py-1 text-xs font-semibold rounded ${
                    level.level === 1
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  Level {level.level}
                </span>
              </div>

              {/* Bar */}
              <div className="flex-1 ml-4">
                <div className="relative">
                  <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full rounded-lg transition-all duration-500 ${
                        level.level === 1
                          ? 'bg-gradient-to-r from-green-400 to-green-600'
                          : 'bg-gradient-to-r from-blue-400 to-blue-600'
                      }`}
                      style={{ width: `${widthPercentage}%` }}
                    >
                      <div className="h-full flex items-center justify-end pr-2">
                        {level.member_count > 0 && (
                          <span className="text-xs font-bold text-white">
                            {level.member_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hover Info */}
                  <div className="absolute left-0 top-full mt-1 text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {level.percentage.toFixed(1)}% of team
                  </div>
                </div>
              </div>

              {/* Count */}
              <div className="w-20 flex-shrink-0 text-right ml-4">
                <span className="text-sm font-semibold text-gray-700">{level.member_count}</span>
                <span className="text-xs text-gray-500 ml-1">
                  ({level.percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-green-400 to-green-600 mr-2"></div>
          <span className="text-gray-600">Level 1 (Direct)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-400 to-blue-600 mr-2"></div>
          <span className="text-gray-600">Levels 2-30</span>
        </div>
      </div>
    </div>
  );
};
