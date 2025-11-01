/**
 * Protected Route Component
 * Role-Based Access Control for Finaster MLM Platform
 * Ensures user is authenticated and has proper role before accessing routes
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth.types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: (UserRole | string)[];
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
}) => {
  const { isAuthenticated, user, isLoading, isImpersonating, actualUser } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#00C7D1] mx-auto mb-4"></div>
          <p className="text-[#cbd5e1] text-lg font-medium">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    // Redirect to login, save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && user) {
    const userRole = user.role;

    // When impersonating, admin can access user routes
    const isAdminImpersonatingUser = isImpersonating &&
      actualUser &&
      (actualUser.role === UserRole.ADMIN || actualUser.role === 'admin') &&
      allowedRoles.some(role => role === UserRole.USER || role.toLowerCase() === 'user');

    const hasAccess = isAdminImpersonatingUser || allowedRoles.some(
      role => role === userRole || role.toLowerCase() === userRole.toLowerCase()
    );

    if (!hasAccess) {
      // Redirect to appropriate dashboard based on role
      const redirectPath =
        userRole === UserRole.ADMIN || userRole === 'admin'
          ? '/admin/dashboard'
          : '/dashboard';

      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Admin-only Route Component
 * Shorthand for admin-protected routes
 */
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute allowedRoles={[UserRole.ADMIN, 'admin']}>{children}</ProtectedRoute>;
};

/**
 * User-only Route Component
 * Shorthand for user-protected routes
 */
export const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute allowedRoles={[UserRole.USER, 'user']}>{children}</ProtectedRoute>;
};

export default ProtectedRoute;
