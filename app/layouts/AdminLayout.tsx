import React from 'react';
import { Outlet } from 'react-router-dom';
import { UserSidebar } from '../components/layout/UserSidebar';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* Admin Sidebar (UserSidebar with isAdmin=true shows admin menu) */}
      <UserSidebar isAdmin={true} />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-0">
        <div className="p-6 lg:p-8">
          <Breadcrumbs />
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
