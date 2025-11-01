import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Settings interface
interface SystemSettings {
  platformName: string;
  logoUrl: string;
  faviconUrl: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  language: string;
}

interface SettingsContextType {
  settings: SystemSettings;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: SystemSettings = {
  platformName: 'Finaster Exchange',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  timezone: 'UTC',
  currency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  language: 'en',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    // Load settings from localStorage on initialization
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        try {
          return { ...defaultSettings, ...JSON.parse(savedSettings) };
        } catch (error) {
          console.error('Failed to parse saved settings:', error);
        }
      }
    }
    return defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('systemSettings', JSON.stringify(settings));

      // Update document title
      document.title = settings.platformName;

      // Update favicon
      const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (favicon) {
        favicon.href = settings.faviconUrl;
      }
    }
  }, [settings]);

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ...newSettings,
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('systemSettings');
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
