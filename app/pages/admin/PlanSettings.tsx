/**
 * Admin Plan Settings Page
 * Dynamic controls for enabling/disabling MLM features
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

interface PlanSetting {
  feature_key: string;
  feature_name: string;
  is_active: boolean;
  description?: string;
  payload?: any;
}

export default function PlanSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<PlanSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    if (!token) return;

    try {
      setLoading(true);
      // Token is automatically added by axios interceptor
      const res = await api.get('/plan-settings/all');

      if (res.data?.settings) {
        setSettings(res.data.settings);
      }
    } catch (error) {
      console.error('Error fetching plan settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (featureKey: string, currentStatus: boolean) => {
    if (!token) return;

    try {
      setSaving(featureKey);

      const newStatus = !currentStatus;

      // Token is automatically added by axios interceptor
      const res = await api.post(
        `/plan-settings/${featureKey}/toggle`,
        { is_active: newStatus }
      );

      if (res.data?.success) {
        // Update local state
        setSettings(prev =>
          prev.map(s =>
            s.feature_key === featureKey
              ? { ...s, is_active: newStatus }
              : s
          )
        );

        console.log(`✅ ${featureKey} ${newStatus ? 'activated' : 'deactivated'}`);
      }
    } catch (error: any) {
      console.error('Error toggling plan:', error);
      alert(`Failed to toggle plan: ${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-surface-light rounded w-64 mb-6"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-surface-light rounded mb-4"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Plan Settings</h1>
        <p className="text-text-secondary">
          Control which features are active in your MLM system
        </p>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">⚠️</div>
          <div>
            <div className="font-semibold text-yellow-400 mb-1">Important</div>
            <p className="text-sm text-text-secondary">
              Disabling a plan will hide related UI elements and prevent API actions.
              This takes effect immediately for all users.
            </p>
          </div>
        </div>
      </div>

      {/* Plan Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {settings.map((setting) => {
          const isSaving = saving === setting.feature_key;
          const isActive = setting.is_active;

          return (
            <div
              key={setting.feature_key}
              className={`card p-6 transition-all duration-200 ${
                isActive
                  ? 'border-green-500/30 bg-green-500/5'
                  : 'border-red-500/30 bg-red-500/5'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {setting.feature_name}
                  </h3>
                  <p className="text-sm text-text-secondary mb-2">
                    {setting.feature_key}
                  </p>
                  {setting.description && (
                    <p className="text-xs text-text-secondary">
                      {setting.description}
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    isActive
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </div>
              </div>

              {/* Toggle Button */}
              <button
                onClick={() => handleToggle(setting.feature_key, isActive)}
                disabled={isSaving}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${
                  isSaving
                    ? 'bg-surface-light text-text-secondary cursor-not-allowed'
                    : isActive
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isSaving ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Saving...</span>
                  </span>
                ) : isActive ? (
                  'Deactivate Plan'
                ) : (
                  'Activate Plan'
                )}
              </button>

              {/* Feature Info */}
              {setting.payload && Object.keys(setting.payload).length > 0 && (
                <details className="mt-4">
                  <summary className="text-sm text-theme cursor-pointer hover:underline">
                    View Configuration
                  </summary>
                  <pre className="mt-2 text-xs bg-surface/50 p-3 rounded overflow-auto">
                    {JSON.stringify(setting.payload, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Section */}
      <div className="mt-8 card p-6">
        <h3 className="text-lg font-semibold text-white mb-3">Feature Descriptions</h3>
        <div className="space-y-2 text-sm text-text-secondary">
          <p><strong className="text-white">Binary Plan:</strong> Binary tree structure and matching bonuses</p>
          <p><strong className="text-white">Generation Plan:</strong> Level income and ROI-on-ROI distribution (30 levels)</p>
          <p><strong className="text-white">Robot Plan:</strong> Automated trading/robot subscription features</p>
          <p><strong className="text-white">Investment Plan:</strong> Package purchases and ROI distribution</p>
          <p><strong className="text-white">Booster Income:</strong> 30-day booster challenges for extra ROI</p>
          <p><strong className="text-white">Principal Withdrawal:</strong> Ability to withdraw principal investment</p>
          <p><strong className="text-white">Monthly Rewards:</strong> 3-leg business volume rewards (40:40:20 ratio)</p>
        </div>
      </div>
    </div>
  );
}
