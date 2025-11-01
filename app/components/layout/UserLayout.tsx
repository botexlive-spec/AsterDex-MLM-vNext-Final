import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import UserSidebar from './UserSidebar';

interface UserLayoutProps {
  children?: React.ReactNode;
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      {/* Sidebar Navigation */}
      <UserSidebar />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-0">
        {/* Top Bar for Mobile - adds spacing for hamburger button */}
        <div className="h-16 lg:hidden" />

        {/* Page Content */}
        <div className="w-full">
          {children || <Outlet />}
        </div>
      </main>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#334155',
            color: '#f8fafc',
            border: '1px solid #475569',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default UserLayout;
