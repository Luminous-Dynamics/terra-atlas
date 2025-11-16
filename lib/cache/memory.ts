/**
 * In-Memory LRU Cache Implementation
 *
 * Provides a production-grade Least Recently Used (LRU) cache
 * with TTL support, automatic eviction, and statistics tracking
 */

import {
  CacheAdapter,
  CacheEntry,
  CacheStats,
  CacheConfig,
  DEFAULT_CACHE_CONFIG,
  isCacheEntry,
} from './types'

/**
 * LRU Cache Implementation
 *
 * Features:
 * - Least Recently Used eviction policy
 * - Per-entry TTL support with automatic expiration
 * - Configurable max size with automatic eviction
 * - Statistics tracking (hits, misses, evictions)
 * - Periodic cleanup of expired entries
 * - Memory usage estimation
 * - Tag-based invalidation support
 */
export class LRUCache implements CacheAdapter {
  private cache: Map<string, CacheEntry>
  private config: Required<CacheConfig>
  private stats: CacheStats
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config: CacheConfig = {}) {
    this.cache = new Map()
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config }
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0,
      memoryUsage: 0,
      evictions: 0,
      expirations: 0,
    }

    // Start periodic cleanup if enabled
    if (this.config.cleanupInterval > 0) {
      this.startCleanup()
    }

    if (this.config.debug) {
      console.log('[LRUCache] Initialized with config:', this.config)
    }
  }

  /**
   * Get a value from cache
   * Returns null if not found or expired
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      this.log('Cache MISS:', key)
      return null
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.expirations++
      this.stats.misses++
      this.updateHitRate()
      this.log('Cache EXPIRED:', key)
      return null
    }

    // Update access tracking
    entry.hits++

    // Move to end (most recently used) by deleting and re-adding
    this.cache.delete(key)
    this.cache.set(key, entry)

    this.stats.hits++
    this.updateHitRate()
    this.log('Cache HIT:', key, `(hits: ${entry.hits})`)

    return entry.value as T
  }

  /**
   * Set a value in cache
   * Automatically evicts LRU entry if cache is full
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const effectiveTTL = ttl ?? this.config.defaultTTL
    const now = Date.now()

    // Check if we need to evict
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: effectiveTTL > 0 ? now + effectiveTTL * 1000 : null,
      createdAt: now,
      hits: 0,
      size: this.estimateSize(value),
    }

    // If updating existing entry, preserve it by deleting first
    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    this.cache.set(key, entry as CacheEntry)
    this.stats.size = this.cache.size
    this.updateMemoryUsage()

    this.log('Cache SET:', key, `(TTL: ${effectiveTTL}s)`)
  }

  /**
   * Set a value with tags for grouped invalidation
   */
  async setWithTags<T>(
    key: string,
    value: T,
    tags: string[],
    ttl?: number
  ): Promise<void> {
    const effectiveTTL = ttl ?? this.config.defaultTTL
    const now = Date.now()

    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt: effectiveTTL > 0 ? now + effectiveTTL * 1000 : null,
      createdAt: now,
      hits: 0,
      size: this.estimateSize(value),
      tags,
    }

    if (this.cache.has(key)) {
      this.cache.delete(key)
    }

    this.cache.set(key, entry as CacheEntry)
    this.stats.size = this.cache.size
    this.updateMemoryUsage()

    this.log('Cache SET with tags:', key, tags, `(TTL: ${effectiveTTL}s)`)
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    const deleted = this.cache.delete(key)
    if (deleted) {
      this.stats.size = this.cache.size
      this.updateMemoryUsage()
      this.log('Cache DELETE:', key)
    }
  }

  /**
   * Delete all entries matching tags
   */
  async deleteByTags(tags: string[]): Promise<number> {
    let deletedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && tags.some((tag) => entry.tags!.includes(tag))) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      this.stats.size = this.cache.size
      this.updateMemoryUsage()
      this.log('Cache DELETE by tags:', tags, `(${deletedCount} entries)`)
    }

    return deletedCount
  }

  /**
   * Delete all entries matching a pattern (wildcard support)
   */
  async deleteByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    let deletedCount = 0

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    if (deletedCount > 0) {
      this.stats.size = this.cache.size
      this.updateMemoryUsage()
      this.log('Cache DELETE by pattern:', pattern, `(${deletedCount} entries)`)
    }

    return deletedCount
  }

  /**
   * Clear all values from cache
   */
  async clear(): Promise<void> {
    const size = this.cache.size
    this.cache.clear()
    this.stats.size = 0
    this.updateMemoryUsage()
    this.log('Cache CLEAR:', `(${size} entries removed)`)
  }

  /**
   * Check if a key exists in cache (and is not expired)
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      this.stats.expirations++
      return false
    }

    return true
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Get current cache size
   */
  getSize(): number {
    return this.cache.size
  }

  /**
   * Get all cache keys
   */
  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get all entries (for debugging)
   */
  getEntries(): Array<{ key: string; entry: CacheEntry }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry,
    }))
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hits = 0
    this.stats.misses = 0
    this.stats.evictions = 0
    this.stats.expirations = 0
    this.updateHitRate()
  }

  /**
   * Stop cleanup interval and clear cache
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
    this.log('Cache DESTROYED')
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Check if an entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    if (entry.expiresAt === null) return false
    return Date.now() > entry.expiresAt
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    // First key is the least recently used (Map maintains insertion order)
    const firstKey = this.cache.keys().next().value
    if (firstKey) {
      this.cache.delete(firstKey)
      this.stats.evictions++
      this.stats.size = this.cache.size
      this.updateMemoryUsage()
      this.log('Cache EVICT (LRU):', firstKey)
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired()
    }, this.config.cleanupInterval)

    // Don't keep the process running if this is the only active timer
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  /**
   * Remove all expired entries
   */
  private cleanupExpired(): void {
    let expiredCount = 0
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.cache.delete(key)
        expiredCount++
      }
    }

    if (expiredCount > 0) {
      this.stats.expirations += expiredCount
      this.stats.size = this.cache.size
      this.updateMemoryUsage()
      this.log('Cache CLEANUP:', `${expiredCount} expired entries removed`)
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  /**
   * Update memory usage estimate
   */
  private updateMemoryUsage(): void {
    let totalSize = 0
    for (const entry of this.cache.values()) {
      totalSize += entry.size || 0
    }
    this.stats.memoryUsage = totalSize
  }

  /**
   * Estimate size of a value in bytes
   */
  private estimateSize(value: any): number {
    try {
      const json = JSON.stringify(value)
      // Rough estimate: 2 bytes per character (UTF-16)
      return json.length * 2
    } catch {
      // If can't serialize, estimate based on type
      if (typeof value === 'string') return value.length * 2
      if (typeof value === 'number') return 8
      if (typeof value === 'boolean') return 4
      return 100 // Default estimate
    }
  }

  /**
   * Log debug messages if debug mode is enabled
   */
  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[LRUCache]', ...args)
    }
  }
}

/**
 * Create a singleton cache instance for the application
 */
let globalCache: LRUCache | null = null

export function getGlobalCache(config?: CacheConfig): LRUCache {
  if (!globalCache) {
    globalCache = new LRUCache(config)
  }
  return globalCache
}

/**
 * Reset the global cache instance (useful for testing)
 */
export function resetGlobalCache(): void {
  if (globalCache) {
    globalCache.destroy()
    globalCache = null
  }
}

/**
 * Export default instance for convenience
 */
export const cache = getGlobalCache()
