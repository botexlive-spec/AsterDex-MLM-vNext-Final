import React from 'react';
import { Outlet } from 'react-router-dom';
import { UserSidebar } from '../components/layout/UserSidebar';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';

export const UserLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* User Sidebar */}
      <UserSidebar isAdmin={false} />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-0 pb-16 md:pb-0">
        <div className="container-padding py-4 sm:py-6 lg:py-8">
          <Breadcrumbs />
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default UserLayout;
