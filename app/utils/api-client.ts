/**
 * API Client for Backend Communication
 * Replaces Supabase calls with direct MySQL backend API calls
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Get auth token from localStorage or sessionStorage
 */
function getAuthToken(): string | null {
  try {
    // Check localStorage first (for "Remember me" logins)
    const localToken = localStorage.getItem('auth_token');
    if (localToken) return localToken;

    // Fall back to sessionStorage (for non-persistent logins)
    const sessionToken = sessionStorage.getItem('auth_token');
    return sessionToken;
  } catch {
    return null;
  }
}

/**
 * Make authenticated API request
 */
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || data.message || `Request failed with status ${response.status}`,
        data: undefined,
      };
    }

    return { data };
  } catch (error) {
    console.error('[API Client] Error:', error);
    return {
      error: error instanceof Error ? error.message : 'Network error',
      data: undefined,
    };
  }
}

/**
 * API methods
 */
export const apiClient = {
  get: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export default apiClient;
