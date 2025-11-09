/**
 * Plan Settings Context
 * Manages plan active/inactive status across the app
 * Used for conditional rendering of features based on admin toggles
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

interface PlanSettings {
  binary_plan: boolean;
  generation_plan: boolean;
  robot_plan: boolean;
  investment_plan: boolean;
  booster_income: boolean;
  principal_withdrawal: boolean;
  monthly_rewards: boolean;
}

interface PlanSettingsContextType {
  settings: PlanSettings;
  isLoading: boolean;
  isPlanActive: (featureKey: keyof PlanSettings) => boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: PlanSettings = {
  binary_plan: true,
  generation_plan: true,
  robot_plan: true,
  investment_plan: true,
  booster_income: true,
  principal_withdrawal: true,
  monthly_rewards: true,
};

const PlanSettingsContext = createContext<PlanSettingsContextType | undefined>(undefined);

export function PlanSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlanSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/plan-settings/active-plans/summary');

      if (res.data?.active_plans) {
        setSettings(res.data.active_plans);
      }
    } catch (error) {
      console.error('❌ Error fetching plan settings:', error);
      // Keep default settings on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const isPlanActive = (featureKey: keyof PlanSettings): boolean => {
    return settings[featureKey] ?? true; // Default to true if not found
  };

  const refreshSettings = async () => {
    await fetchSettings();
  };

  return (
    <PlanSettingsContext.Provider
      value={{
        settings,
        isLoading,
        isPlanActive,
        refreshSettings,
      }}
    >
      {children}
    </PlanSettingsContext.Provider>
  );
}

export function usePlanSettings() {
  const context = useContext(PlanSettingsContext);
  if (context === undefined) {
    throw new Error('usePlanSettings must be used within a PlanSettingsProvider');
  }
  return context;
}
