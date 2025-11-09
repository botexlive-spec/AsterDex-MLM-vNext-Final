/**
 * Cache Service
 * Simple in-memory caching with TTL support
 * Can be upgraded to Redis in production
 */

interface CacheEntry {
  value: any;
  expiry: number;
}

class CacheService {
  private cache: Map<string, CacheEntry>;
  private stats: {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
  };

  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    };

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value as T;
  }

  /**
   * Set value in cache with TTL in seconds
   */
  set(key: string, value: any, ttlSeconds: number = 300): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiry });
    this.stats.sets++;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) this.stats.deletes++;
    return result;
  }

  /**
   * Delete all keys matching a pattern
   */
  deletePattern(pattern: string): number {
    const regex = new RegExp(pattern);
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    this.stats.deletes += count;
    return count;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get or set pattern - fetch from cache or execute function and cache result
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetcher();
    this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
    }
  }
}

// Export singleton instance
export const cache = new CacheService();

// Cache key builders for consistency
export const CacheKeys = {
  userDashboard: (userId: string) => `dashboard:user:${userId}`,
  genealogyTree: (userId: string, depth: number) => `genealogy:${userId}:${depth}`,
  userStats: (userId: string) => `stats:user:${userId}`,
  binaryStats: (userId: string) => `binary:stats:${userId}`,
  adminAnalytics: (period: string) => `admin:analytics:${period}`,
  reportsData: (type: string, filters: string) => `reports:${type}:${filters}`,
  planSettings: () => `plan_settings:all`,
  activePackages: () => `packages:active`,
  userBusinessVolumes: (userId: string, month: number, year: number) =>
    `volumes:${userId}:${year}-${month}`,
};

// Cache TTL constants (in seconds)
export const CacheTTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 1800,          // 30 minutes
  VERY_LONG: 3600,     // 1 hour
  DAY: 86400,          // 24 hours
};
