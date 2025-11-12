/**
 * API Endpoint Validator
 * Checks if API endpoints exist before making requests
 */

const endpointCache = new Map<string, boolean>();

/**
 * Check if an API endpoint exists
 */
export const validateEndpoint = async (endpoint: string): Promise<boolean> => {
  // Check cache first
  if (endpointCache.has(endpoint)) {
    return endpointCache.get(endpoint)!;
  }

  try {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'HEAD', // HEAD request to check if endpoint exists
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      }
    });

    const exists = response.status !== 404;
    endpointCache.set(endpoint, exists);
    return exists;
  } catch (error) {
    console.warn(`Could not validate endpoint ${endpoint}:  `, error);
    return true; // Assume it exists to avoid blocking
  }
};

/**
 * Safely call an API endpoint with validation
 */
export const safeApiCall = async <T>(
  endpoint: string,
  fetchFn: () => Promise<T>,
  defaultValue: T
): Promise<T> => {
  try {
    return await fetchFn();
  } catch (error: any) {
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      console.warn(`Endpoint not found (using default): ${endpoint}`);
      return defaultValue;
    }
    throw error;
  }
};
