import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserRole, AuthState, LoginCredentials, AuthResponse } from '../types/auth.types';
import toast from 'react-hot-toast';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isUser: boolean;
  hasPermission: (permission: string) => boolean;
  checkAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Load auth state from localStorage on mount
  const checkAuth = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      const refreshToken = localStorage.getItem('refreshToken');

      if (token && userStr) {
        const user = JSON.parse(userStr) as User;

        // Verify token is not expired (basic check)
        // In production, you'd verify with backend
        setAuthState({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.clear();
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // TODO: Replace with actual API call
      // For now, mock login based on email
      await new Promise(resolve => setTimeout(resolve, 1000));

      const isAdmin = email.includes('admin');
      const mockUser: User = {
        id: '1',
        email,
        fullName: isAdmin ? 'Admin User' : 'John Doe',
        full_name: isAdmin ? 'Admin User' : 'John Doe',
        role: isAdmin ? UserRole.ADMIN : UserRole.USER,
        userId: isAdmin ? 'ADM001' : 'USR12345',
        avatar: undefined,
        phone: undefined,
        is_active: true,
        isActive: true,
        email_verified: true,
        kycStatus: 'approved',
        twoFAEnabled: false,
        rank: isAdmin ? undefined : 'Bronze',
        sponsorId: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      const mockToken = 'mock-jwt-token-' + Math.random().toString(36).substring(7);
      const mockRefreshToken = 'mock-refresh-token-' + Math.random().toString(36).substring(7);

      // Save to localStorage
      localStorage.setItem('token', mockToken);
      localStorage.setItem('refreshToken', mockRefreshToken);
      localStorage.setItem('user', JSON.stringify(mockUser));

      setAuthState({
        user: mockUser,
        token: mockToken,
        refreshToken: mockRefreshToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      toast.success(`Welcome ${mockUser.fullName}!`);
    } catch (error: any) {
      const errorMessage = error.message || 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
      throw error;
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    setAuthState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    toast.success('Logged out successfully');
  }, []);

  const isAdmin = authState.user?.role === UserRole.ADMIN || authState.user?.role === 'admin';
  const isUser = authState.user?.role === UserRole.USER || authState.user?.role === 'user';

  const hasPermission = (permission: string): boolean => {
    if (!authState.user) return false;
    if (isAdmin) return true; // Admin has all permissions

    // Add your permission logic here based on user role
    // Example: if (permission === 'create:package' && isUser) return true;

    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        isAdmin,
        isUser,
        hasPermission,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
