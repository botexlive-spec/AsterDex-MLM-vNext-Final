import React from 'react';
import { useSettings } from '../context/SettingsContext';

/**
 * Example component showing how to use the Settings Context
 *
 * This component demonstrates how any component in the app can access
 * and use the global settings (currency, timezone, logo, etc.)
 */
export const SettingsExample: React.FC = () => {
  const { settings } = useSettings();

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
      <h3 className="text-lg font-semibold text-[#f8fafc] mb-3">
        Current System Settings
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#94a3b8]">Platform Name:</span>
          <span className="text-[#f8fafc] font-medium">{settings.platformName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#94a3b8]">Currency:</span>
          <span className="text-[#f8fafc] font-medium">{settings.currency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#94a3b8]">Timezone:</span>
          <span className="text-[#f8fafc] font-medium">{settings.timezone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#94a3b8]">Date Format:</span>
          <span className="text-[#f8fafc] font-medium">{settings.dateFormat}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#94a3b8]">Language:</span>
          <span className="text-[#f8fafc] font-medium">{settings.language}</span>
        </div>
      </div>
      {settings.logoUrl && (
        <div className="mt-4 p-3 bg-[#0f172a] rounded border border-[#334155]">
          <p className="text-xs text-[#94a3b8] mb-2">Current Logo:</p>
          <img
            src={settings.logoUrl}
            alt="Platform Logo"
            className="max-w-32 max-h-16 object-contain"
          />
        </div>
      )}
    </div>
  );
};
