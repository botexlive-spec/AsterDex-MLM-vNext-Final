import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path: string;
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Route label mapping
  const routeLabels: Record<string, string> = {
    // User routes
    dashboard: 'Dashboard',
    packages: 'Packages',
    robot: 'Trading Robot',
    wallet: 'Wallet',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    team: 'My Team',
    referrals: 'Referrals',
    genealogy: 'Genealogy',
    earnings: 'Earnings',
    reports: 'Reports',
    transactions: 'Transactions',
    ranks: 'Ranks & Rewards',
    profile: 'Profile',
    kyc: 'KYC Verification',
    settings: 'Settings',
    support: 'Support',

    // Admin routes
    admin: 'Admin',
    users: 'User Management',
    financial: 'Financial Management',
    commissions: 'Commission Management',
    binary: 'Binary Tree',
    communications: 'Communications',
    audit: 'Audit Logs',
  };

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/' },
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      // Don't add if it's the same as the previous label
      if (breadcrumbs[breadcrumbs.length - 1]?.label !== label) {
        breadcrumbs.push({
          label,
          path: currentPath,
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="Breadcrumb">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 px-3 py-1.5 bg-[#1e293b] border border-[#334155] rounded-lg text-[#cbd5e1] hover:bg-[#334155] hover:text-[#00C7D1] transition-all"
        aria-label="Go back"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="font-medium">Back</span>
      </button>

      <div className="flex items-center gap-2 overflow-x-auto">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <div key={crumb.path} className="flex items-center gap-2">
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-[#64748b]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              {isLast ? (
                <span className="font-medium text-[#00C7D1] whitespace-nowrap">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="text-[#94a3b8] hover:text-[#00C7D1] transition-colors whitespace-nowrap"
                >
                  {crumb.label}
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default Breadcrumbs;
