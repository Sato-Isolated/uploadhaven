/**
 * Simple in-memory cache with TTL support
 */

interface CacheItem<T> {
  value: T;
  expiry: number;
}

class SimpleCache<T = unknown> {
  private cache = new Map<string, CacheItem<T>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private defaultTTL: number = 300000) { // 5 minutes default
    // Cleanup expired items every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  set(key: string, value: T, ttl?: number): void {
    const expiry = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Global cache instances
export const fileInfoCache = new SimpleCache(30000); // 30 seconds for file info

// Cache utilities
export const getCacheKey = (prefix: string, ...parts: string[]): string => {
  return `${prefix}:${parts.join(':')}`;
};

// Rate limiting cache
interface RateLimitItem {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private cache = new Map<string, RateLimitItem>();

  check(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const item = this.cache.get(key);

    if (!item || now > item.resetTime) {
      // New window or expired
      const resetTime = now + windowMs;
      this.cache.set(key, { count: 1, resetTime });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime,
      };
    }

    if (item.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: item.resetTime,
      };
    }

    item.count++;
    return {
      allowed: true,
      remaining: limit - item.count,
      resetTime: item.resetTime,
    };
  }

  reset(key: string): void {
    this.cache.delete(key);
  }
}

export const rateLimiter = new RateLimiter();

// Cache middleware for API routes
export const withCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  const cached = fileInfoCache.get(key) as T | null;
  if (cached !== null) {
    return Promise.resolve(cached);
  }

  return fetcher().then(result => {
    fileInfoCache.set(key, result, ttl);
    return result;
  });
};
