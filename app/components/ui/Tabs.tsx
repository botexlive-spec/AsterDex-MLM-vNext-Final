import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={`border-b border-[#475569] ${className}`}>
      <nav className="flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              py-4 px-2 font-medium text-sm border-b-2 transition-all
              ${
                activeTab === tab.id
                  ? 'border-[#00C7D1] text-[#00C7D1]'
                  : 'border-transparent text-[#94a3b8] hover:text-[#cbd5e1] hover:border-[#475569]'
              }
            `}
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

interface TabPanelProps {
  activeTab: string;
  tabId: string;
  children: React.ReactNode;
}

export const TabPanel: React.FC<TabPanelProps> = ({ activeTab, tabId, children }) => {
  if (activeTab !== tabId) return null;

  return (
    <div className="py-6">
      {children}
    </div>
  );
};
