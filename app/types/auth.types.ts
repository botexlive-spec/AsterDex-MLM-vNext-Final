/**
 * Authentication Type Definitions
 * For Finaster MLM Platform - Role-Based Access Control
 */

// User Role Enum for strict type checking
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export type UserRoleString = 'admin' | 'user' | 'trader'; // Keep for backwards compatibility

export interface User {
  id: string;
  email: string;
  full_name?: string;
  fullName?: string; // Alias for consistency
  role: UserRole | UserRoleString;
  userId: string; // MLM User ID
  avatar?: string;
  phone?: string;
  wallet_address?: string;
  privy_id?: string;
  is_active: boolean;
  isActive?: boolean; // Alias for consistency
  email_verified: boolean;
  kycStatus?: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  twoFAEnabled?: boolean;
  rank?: string; // MLM Rank
  sponsorId?: string; // MLM Sponsor ID
  created_at: string;
  updated_at: string;
  lastLogin?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  wallet_address?: string;
  referral_code?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface UpdateProfileData {
  full_name?: string;
  wallet_address?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Permission interface for role-based access control
export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

// Token payload for JWT decoding
export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole | UserRoleString;
  iat: number;
  exp: number;
}
