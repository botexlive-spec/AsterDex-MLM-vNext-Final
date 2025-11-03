import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TrendingUp, Users, Wallet, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavItem {
  name: string;
  icon: React.ReactNode;
  path: string;
  label: string;
}

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Don't show on login/register pages or if not authenticated
  if (!isAuthenticated || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/auth/login') {
    return null;
  }

  const navItems: NavItem[] = [
    {
      name: 'Home',
      icon: <Home className="w-5 h-5" />,
      path: '/dashboard',
      label: 'Home'
    },
    {
      name: 'Trading',
      icon: <TrendingUp className="w-5 h-5" />,
      path: '/perp',
      label: 'Trade'
    },
    {
      name: 'Team',
      icon: <Users className="w-5 h-5" />,
      path: '/team',
      label: 'Team'
    },
    {
      name: 'Wallet',
      icon: <Wallet className="w-5 h-5" />,
      path: '/wallet',
      label: 'Wallet'
    },
    {
      name: 'Profile',
      icon: <User className="w-5 h-5" />,
      path: '/profile',
      label: 'Profile'
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe md:hidden"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(51, 65, 85, 0.5)',
      }}
    >
      <div className="flex justify-around items-center h-20 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex flex-col items-center justify-center min-w-[64px] h-full gap-1.5 transition-all duration-300 ${
                active
                  ? 'text-[#00C7D1]'
                  : 'text-[#94a3b8] active:text-[#00C7D1]'
              }`}
              aria-label={item.label}
            >
              <div className={`relative transition-all duration-300 ${active ? 'scale-125 -translate-y-0.5' : 'scale-100'}`}>
                <div className={`p-2 rounded-xl transition-all duration-300 ${active ? 'bg-[#00C7D1]/20' : ''}`}>
                  <div style={{ width: '24px', height: '24px' }}>
                    {item.icon}
                  </div>
                </div>
                {active && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-[#00C7D1] rounded-full animate-pulse" />
                )}
              </div>
              {active && (
                <span className="text-[10px] font-semibold tracking-wide animate-fadeIn">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
