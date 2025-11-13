/**
 * Axios Configuration with Authentication Interceptors
 * For Finaster MLM Platform - Role-Based API Access
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Create main axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle 401 errors (Unauthorized - Token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't auto-logout on first 401 - might be a temporary issue
      const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');

      // Only try to refresh if we have a refresh token
      if (refreshToken) {
        try {
          // Try to refresh token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { token } = response.data;
          localStorage.setItem('auth_token', token);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed - only logout if this is an auth endpoint
          if (originalRequest.url?.includes('/auth/') || originalRequest.url?.includes('/login')) {
            localStorage.clear();
            window.location.href = '/login';
            toast.error('Session expired. Please login again.');
          } else {
            // For other endpoints, just log the error and continue
            console.error('Token refresh failed, but not forcing logout:', refreshError);
            toast.error('Authentication error. Please refresh the page.');
          }
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token - this is expected on first load or after logout
        console.warn('No refresh token available for 401 retry');
      }
    }

    // Handle 403 errors (Forbidden - Insufficient permissions)
    if (error.response?.status === 403) {
      toast.error('Access denied: You do not have permission to perform this action');
    }

    // Handle 404 errors - Suppress toast, just log
    if (error.response?.status === 404) {
      console.warn('API 404 Error:', error.config?.url);
      // Don't show toast for 404s - they're often non-critical
    }

    // Handle 500 errors
    if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

// Create separate instances for user and admin APIs
export const userAPI = axios.create({
  baseURL: `${API_BASE_URL}/user`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const adminAPI = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Apply same interceptors to user API
userAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

userAPI.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    if (error.response?.status === 403) {
      toast.error('Access denied');
    }
    return Promise.reject(error);
  }
);

// Apply same interceptors to admin API
adminAPI.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Add admin role check header
    if (config.headers) {
      config.headers['X-Required-Role'] = 'admin';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

adminAPI.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    if (error.response?.status === 403) {
      toast.error('Admin access required');
      // Redirect to user dashboard if not admin
      window.location.href = '/dashboard';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
