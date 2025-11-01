import { useState, useEffect, useCallback, useRef } from 'react';
import { apiCache } from '../utils/apiCache';

export interface UseApiQueryOptions<T> {
  enabled?: boolean; // Whether to automatically fetch on mount
  refetchOnMount?: boolean; // Refetch even if cached data exists
  refetchOnWindowFocus?: boolean; // Refetch when window regains focus
  staleTime?: number; // Override default stale time
  cacheTime?: number; // Override default cache time
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retry?: number; // Number of retries on error
  retryDelay?: number; // Delay between retries in ms
}

export interface UseApiQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isStale: boolean;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Custom hook for API queries with caching and optimization
 *
 * Features:
 * - Automatic caching with TTL
 * - Request deduplication
 * - Stale-while-revalidate
 * - Retry logic
 * - Refetch on window focus
 *
 * @example
 * const { data, isLoading, error, refetch } = useApiQuery(
 *   '/api/users',
 *   { userId: 123 },
 *   { enabled: true }
 * );
 */
export const useApiQuery = <T = any>(
  url: string,
  params?: Record<string, any>,
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> => {
  const {
    enabled = true,
    refetchOnMount = false,
    refetchOnWindowFocus = true,
    onSuccess,
    onError,
    retry = 3,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T | null>(() => {
    // Initialize with cached data if available
    return apiCache.get<T>(url, params);
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // Only set loading if no cached data
    return enabled && !apiCache.get<T>(url, params);
  });
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  const retryCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Fetch function with caching and deduplication
  const fetchData = useCallback(async (forceRefetch: boolean = false): Promise<void> => {
    if (!enabled && !forceRefetch) return;

    // Check cache first
    const cachedData = apiCache.get<T>(url, params);
    if (cachedData && !forceRefetch && !refetchOnMount) {
      setData(cachedData);
      setIsStale(apiCache.isStaleData(url, params));
      setIsLoading(false);
      return;
    }

    // Check for pending request (deduplication)
    const pendingRequest = apiCache.getPendingRequest(url, params);
    if (pendingRequest) {
      try {
        const result = await pendingRequest;
        if (isMountedRef.current) {
          setData(result);
          setIsLoading(false);
          setIsStale(false);
        }
        return;
      } catch (err) {
        // Error will be handled by the original request
        return;
      }
    }

    // Set loading state (but keep old data if stale-while-revalidate)
    if (!cachedData) {
      setIsLoading(true);
    }
    setIsError(false);
    setError(null);

    // Create request
    const fetchPromise = fetch(`${url}${params ? `?${new URLSearchParams(params)}` : ''}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      });

    // Register pending request
    apiCache.setPendingRequest(url, fetchPromise, params);

    try {
      const result = await fetchPromise;

      if (!isMountedRef.current) return;

      // Cache the result
      apiCache.set(url, result, params);

      // Update state
      setData(result);
      setIsLoading(false);
      setIsStale(false);
      setIsError(false);
      setError(null);
      retryCountRef.current = 0;

      // Call success callback
      onSuccess?.(result);
    } catch (err) {
      if (!isMountedRef.current) return;

      const error = err instanceof Error ? err : new Error('An error occurred');

      // Retry logic
      if (retryCountRef.current < retry) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchData(forceRefetch);
        }, retryDelay * retryCountRef.current);
        return;
      }

      // Set error state
      setIsLoading(false);
      setIsError(true);
      setError(error);
      retryCountRef.current = 0;

      // Call error callback
      onError?.(error);
    }
  }, [url, params, enabled, refetchOnMount, onSuccess, onError, retry, retryDelay]);

  // Refetch function
  const refetch = useCallback(async (): Promise<void> => {
    return fetchData(true);
  }, [fetchData]);

  // Invalidate cache
  const invalidate = useCallback((): void => {
    apiCache.invalidate(url, params);
    setIsStale(true);
  }, [url, params]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [url, JSON.stringify(params), enabled]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (apiCache.isStaleData(url, params)) {
        fetchData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, url, params, fetchData]);

  // Check if data is stale periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (apiCache.isStaleData(url, params)) {
        setIsStale(true);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [url, params]);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    data,
    isLoading,
    isError,
    error,
    isStale,
    refetch,
    invalidate,
  };
};

/**
 * Hook for API mutations (POST, PUT, DELETE)
 */
export interface UseApiMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  invalidateQueries?: string[]; // URL patterns to invalidate on success
}

export interface UseApiMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: TData | null;
  reset: () => void;
}

export const useApiMutation = <TData = any, TVariables = any>(
  url: string,
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options: UseApiMutationOptions<TData, TVariables> = {}
): UseApiMutationResult<TData, TVariables> => {
  const { onSuccess, onError, invalidateQueries = [] } = options;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      setIsLoading(true);
      setIsError(false);
      setError(null);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(variables),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        setData(result);
        setIsLoading(false);

        // Invalidate related queries
        invalidateQueries.forEach((pattern) => {
          apiCache.invalidatePattern(pattern);
        });

        onSuccess?.(result, variables);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred');
        setIsError(true);
        setError(error);
        setIsLoading(false);

        onError?.(error, variables);

        throw error;
      }
    },
    [url, method, onSuccess, onError, invalidateQueries]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setIsError(false);
    setError(null);
    setData(null);
  }, []);

  return {
    mutate,
    isLoading,
    isError,
    error,
    data,
    reset,
  };
};
