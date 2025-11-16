/**
 * Cache Type Definitions
 *
 * Core interfaces and types for the caching system
 */

/**
 * Cache adapter interface
 * All cache implementations must implement this interface
 */
export interface CacheAdapter {
  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Value or null if not found or expired
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>

  /**
   * Delete a value from cache
   * @param key - Cache key
   */
  delete(key: string): Promise<void>

  /**
   * Clear all values from cache
   */
  clear(): Promise<void>

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   */
  has(key: string): Promise<boolean>

  /**
   * Get cache statistics
   */
  getStats(): CacheStats

  /**
   * Get current cache size (number of entries)
   */
  getSize(): number
}

/**
 * Cache entry structure
 */
export interface CacheEntry<T = any> {
  /** Cached value */
  value: T
  /** Expiration timestamp (null = never expires) */
  expiresAt: number | null
  /** Creation timestamp */
  createdAt: number
  /** Number of times this entry was accessed */
  hits: number
  /** Size estimate in bytes (optional) */
  size?: number
  /** Tags for grouped invalidation */
  tags?: string[]
}

/**
 * Cache options
 */
export interface CacheOptions {
  /** Time to live in seconds */
  ttl?: number
  /** Tags for grouped invalidation */
  tags?: string[]
  /** Custom cache key generator */
  keyGenerator?: (input: any) => string
  /** Whether to update TTL on access */
  refreshOnAccess?: boolean
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total number of cache hits */
  hits: number
  /** Total number of cache misses */
  misses: number
  /** Current number of entries */
  size: number
  /** Cache hit rate (0-1) */
  hitRate: number
  /** Total memory used (bytes, estimate) */
  memoryUsage: number
  /** Number of evictions performed */
  evictions: number
  /** Number of expired entries removed */
  expirations: number
}

/**
 * Cache invalidation options
 */
export interface InvalidationOptions {
  /** Pattern to match keys (supports wildcards) */
  pattern?: string
  /** Tags to invalidate */
  tags?: string[]
  /** Specific keys to invalidate */
  keys?: string[]
}

/**
 * HTTP cache options
 */
export interface HttpCacheOptions {
  /** Cache-Control max-age in seconds */
  maxAge?: number
  /** Whether cache is public or private */
  visibility?: 'public' | 'private'
  /** Whether to require revalidation */
  mustRevalidate?: boolean
  /** Whether to use ETags */
  useETag?: boolean
  /** Custom ETag generator */
  etagGenerator?: (data: any) => string
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Maximum number of entries */
  maxSize?: number
  /** Default TTL in seconds */
  defaultTTL?: number
  /** Cleanup interval in milliseconds */
  cleanupInterval?: number
  /** Enable statistics tracking */
  enableStats?: boolean
  /** Enable debug logging */
  debug?: boolean
}

/**
 * Cache key builder helper
 */
export class CacheKeyBuilder {
  private parts: string[] = []

  /**
   * Add a part to the cache key
   */
  add(part: string | number): this {
    this.parts.push(String(part))
    return this
  }

  /**
   * Add an object as a JSON-serialized part
   */
  addObject(obj: any): this {
    this.parts.push(JSON.stringify(obj))
    return this
  }

  /**
   * Build the final cache key
   */
  build(): string {
    return this.parts.join(':')
  }

  /**
   * Static helper to create a key from parts
   */
  static create(...parts: (string | number)[]): string {
    return parts.join(':')
  }
}

/**
 * Type guard to check if value is a valid cache entry
 */
export function isCacheEntry(value: any): value is CacheEntry {
  return (
    value !== null &&
    typeof value === 'object' &&
    'value' in value &&
    'createdAt' in value &&
    'hits' in value
  )
}

/**
 * Default cache configuration
 */
export const DEFAULT_CACHE_CONFIG: Required<CacheConfig> = {
  maxSize: 1000,
  defaultTTL: 300, // 5 minutes
  cleanupInterval: 60000, // 1 minute
  enableStats: true,
  debug: false,
}
