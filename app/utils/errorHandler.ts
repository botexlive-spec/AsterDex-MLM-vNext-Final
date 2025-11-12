/**
 * Global Error Handler
 * Prevents duplicate toast notifications and handles API errors gracefully
 */

import toast from 'react-hot-toast';

// Track recent errors to prevent duplicates
const recentErrors = new Map<string, number>();
const ERROR_THROTTLE_MS = 3000; // Don't show same error within 3 seconds

/**
 * Show error toast with deduplication
 */
export const showError = (message: string, options?: any) => {
  const now = Date.now();
  const lastShown = recentErrors.get(message);

  // Skip if same error was shown recently
  if (lastShown && (now - lastShown) < ERROR_THROTTLE_MS) {
    console.warn('Skipping duplicate error toast:', message);
    return;
  }

  recentErrors.set(message, now);
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
    ...options
  });

  // Cleanup old entries
  setTimeout(() => {
    recentErrors.delete(message);
  }, ERROR_THROTTLE_MS);
};

/**
 * Handle API errors gracefully
 */
export const handleApiError = (error: any, context: string = 'Operation') => {
  console.error(`[${context}] Error:`, error);

  // Don't show toasts for these common non-critical errors
  const silentErrors = [
    'No data available',
    'Empty result set',
    'No records found'
  ];

  const errorMessage = error.message || error.toString();

  if (silentErrors.some(msg => errorMessage.includes(msg))) {
    console.warn(`[${context}] Silent error (no toast):`, errorMessage);
    return;
  }

  // Show user-friendly error message
  if (errorMessage.includes('not authenticated') || errorMessage.includes('Authentication required')) {
    showError('Please log in to continue');
  } else if (errorMessage.includes('Admin access required') || errorMessage.includes('permission')) {
    showError('Admin access required');
  } else if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
    showError('Network error. Please check your connection.');
  } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
    console.warn(`[${context}] Resource not found (suppressed toast)`);
    // Don't show "Resource not found" toasts - they're often non-critical
  } else {
    showError(`${context} failed: ${errorMessage.substring(0, 50)}${errorMessage.length > 50 ? '...' : ''}`);
  }
};

/**
 * Wrap async function with error handling
 */
export const withErrorHandler = <T>(
  fn: () => Promise<T>,
  context: string,
  defaultValue: T
): Promise<T> => {
  return fn().catch((error) => {
    handleApiError(error, context);
    return defaultValue;
  });
};
