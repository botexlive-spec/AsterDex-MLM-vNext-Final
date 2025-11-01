/**
 * API Cache Utility
 * Implements in-memory caching with TTL, stale-while-revalidate, and request deduplication
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleTime?: number; // Time before data is considered stale
  maxSize?: number; // Maximum number of cache entries
}

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_STALE_TIME = 2 * 60 * 1000; // 2 minutes
const DEFAULT_MAX_SIZE = 100;

class APICache {
  private cache: Map<string, CacheEntry<any>>;
  private pendingRequests: Map<string, PendingRequest>;
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.options = {
      ttl: options.ttl || DEFAULT_TTL,
      staleTime: options.staleTime || DEFAULT_STALE_TIME,
      maxSize: options.maxSize || DEFAULT_MAX_SIZE,
    };
  }

  /**
   * Generates a cache key from the request parameters
   */
  private generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}:${paramString}`;
  }

  /**
   * Checks if cached data is still valid (not expired)
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() < entry.expiresAt;
  }

  /**
   * Checks if cached data is stale (valid but needs refresh)
   */
  private isStale(entry: CacheEntry<any>): boolean {
    const staleThreshold = entry.timestamp + this.options.staleTime;
    return Date.now() > staleThreshold;
  }

  /**
   * Enforces cache size limit by removing oldest entries
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.options.maxSize) return;

    // Convert to array and sort by timestamp
    const entries = Array.from(this.cache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp
    );

    // Remove oldest entries
    const toRemove = entries.slice(0, this.cache.size - this.options.maxSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  /**
   * Gets cached data if available and valid
   */
  get<T>(url: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Remove if expired
    if (!this.isValid(entry)) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Sets data in cache
   */
  set<T>(url: string, data: T, params?: Record<string, any>): void {
    const key = this.generateKey(url, params);
    const now = Date.now();

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + this.options.ttl,
    });

    this.enforceMaxSize();
  }

  /**
   * Checks if data exists in cache and is stale
   */
  isStaleData(url: string, params?: Record<string, any>): boolean {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (!entry || !this.isValid(entry)) return false;

    return this.isStale(entry);
  }

  /**
   * Checks if there's a pending request for the given key
   */
  hasPendingRequest(url: string, params?: Record<string, any>): boolean {
    const key = this.generateKey(url, params);
    const pending = this.pendingRequests.get(key);

    if (!pending) return false;

    // Clean up old pending requests (older than 30 seconds)
    if (Date.now() - pending.timestamp > 30000) {
      this.pendingRequests.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Gets the pending request promise
   */
  getPendingRequest(url: string, params?: Record<string, any>): Promise<any> | null {
    const key = this.generateKey(url, params);
    return this.pendingRequests.get(key)?.promise || null;
  }

  /**
   * Registers a pending request
   */
  setPendingRequest(url: string, promise: Promise<any>, params?: Record<string, any>): void {
    const key = this.generateKey(url, params);
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    // Clean up after promise resolves or rejects
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
  }

  /**
   * Invalidates cache entry
   */
  invalidate(url: string, params?: Record<string, any>): void {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
  }

  /**
   * Invalidates all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }

  /**
   * Clears all cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Gets cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    pendingRequests: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      pendingRequests: this.pendingRequests.size,
    };
  }

  /**
   * Preloads data into cache
   */
  preload<T>(url: string, data: T, params?: Record<string, any>): void {
    this.set(url, data, params);
  }
}

// Global cache instance
export const apiCache = new APICache({
  ttl: 5 * 60 * 1000, // 5 minutes
  staleTime: 2 * 60 * 1000, // 2 minutes
  maxSize: 100,
});

// Export class for custom instances
export default APICache;
