/**
 * Admin Financial Service
 * Handles deposits, withdrawals, and financial operations
 * Uses Express MySQL backend API
 */

import { requireAdmin } from '../middleware/admin.middleware';

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  proof_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  processed_by?: string;
  processed_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  bank_details?: Record<string, any>;
  wallet_address?: string;
  status: 'pending' | 'approved' | 'rejected' | 'on_hold';
  kyc_status?: string;
  available_balance?: number;
  processed_by?: string;
  processed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at?: string;
}

export interface FinancialStats {
  total_deposits: number;
  total_withdrawals: number;
  pending_deposits: number;
  pending_withdrawals: number;
  total_deposits_amount: number;
  total_withdrawals_amount: number;
  pending_deposits_amount: number;
  pending_withdrawals_amount: number;
}

/**
 * Get API base URL
 */
const getApiUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

/**
 * Get authentication token from storage
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
};

/**
 * Make authenticated API request
 */
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Authentication required');
  }

  const url = `${getApiUrl()}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed: ${response.status}`);
  }

  return response.json();
};

/**
 * Get all deposits with filters
 */
export const getAllDeposits = async (filters?: {
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}): Promise<Deposit[]> => {
  try {
    await requireAdmin();

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const response = await apiRequest<{ success: boolean; data: Deposit[] }>(
      `/api/admin/financial/deposits?${params.toString()}`
    );

    return response.data || [];
  } catch (error: any) {
    console.error('Error getting deposits:', error);
    return [];
  }
};

/**
 * Get all withdrawals with filters
 */
export const getAllWithdrawals = async (filters?: {
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}): Promise<Withdrawal[]> => {
  try {
    await requireAdmin();

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const response = await apiRequest<{ success: boolean; data: Withdrawal[] }>(
      `/api/admin/financial/withdrawals?${params.toString()}`
    );

    return response.data || [];
  } catch (error: any) {
    console.error('Error getting withdrawals:', error);
    return [];
  }
};

/**
 * Approve deposit
 */
export const approveDeposit = async (
  depositId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    await requireAdmin();

    const response = await apiRequest<{ success: boolean; message: string }>(
      `/api/admin/financial/deposits/${depositId}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }
    );

    return response;
  } catch (error: any) {
    console.error('Error approving deposit:', error);
    throw error;
  }
};

/**
 * Reject deposit
 */
export const rejectDeposit = async (
  depositId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  try {
    await requireAdmin();

    const response = await apiRequest<{ success: boolean; message: string }>(
      `/api/admin/financial/deposits/${depositId}/reject`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );

    return response;
  } catch (error: any) {
    console.error('Error rejecting deposit:', error);
    throw error;
  }
};

/**
 * Approve withdrawal
 */
export const approveWithdrawal = async (
  withdrawalId: string,
  notes?: string
): Promise<{ success: boolean; message: string }> => {
  try {
    await requireAdmin();

    const response = await apiRequest<{ success: boolean; message: string }>(
      `/api/admin/withdrawals/approve/${withdrawalId}`,
      {
        method: 'POST',
        body: JSON.stringify({ notes }),
      }
    );

    return response;
  } catch (error: any) {
    console.error('Error approving withdrawal:', error);
    throw error;
  }
};

/**
 * Reject withdrawal
 */
export const rejectWithdrawal = async (
  withdrawalId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  try {
    await requireAdmin();

    const response = await apiRequest<{ success: boolean; message: string }>(
      `/api/admin/withdrawals/reject/${withdrawalId}`,
      {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }
    );

    return response;
  } catch (error: any) {
    console.error('Error rejecting withdrawal:', error);
    throw error;
  }
};

/**
 * Get financial statistics
 */
export const getFinancialStats = async (): Promise<FinancialStats> => {
  try {
    await requireAdmin();

    const response = await apiRequest<{ success: boolean; data: any }>(
      '/api/admin/financial/stats'
    );

    const data = response.data || {};

    return {
      total_deposits: data.total_deposits || 0,
      total_withdrawals: data.total_withdrawals || 0,
      pending_deposits: data.pending_deposits || 0,
      pending_withdrawals: data.pending_withdrawals || 0,
      total_deposits_amount: data.total_deposits_amount || 0,
      total_withdrawals_amount: data.total_withdrawals_amount || 0,
      pending_deposits_amount: data.pending_deposits_amount || 0,
      pending_withdrawals_amount: data.pending_withdrawals_amount || 0,
    };
  } catch (error: any) {
    console.error('Error getting financial stats:', error);
    return {
      total_deposits: 0,
      total_withdrawals: 0,
      pending_deposits: 0,
      pending_withdrawals: 0,
      total_deposits_amount: 0,
      total_withdrawals_amount: 0,
      pending_deposits_amount: 0,
      pending_withdrawals_amount: 0,
    };
  }
};

export interface Transaction {
  id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  transaction_type: string;
  amount: number;
  description?: string;
  status: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Get all transactions with filters
 */
export const getAllTransactions = async (filters?: {
  type?: string;
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}): Promise<Transaction[]> => {
  try {
    await requireAdmin();

    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const response = await apiRequest<{ success: boolean; data: Transaction[] }>(
      `/api/admin/financial/transactions?${params.toString()}`
    );

    return response.data || [];
  } catch (error: any) {
    console.error('Error getting transactions:', error);
    return [];
  }
};
