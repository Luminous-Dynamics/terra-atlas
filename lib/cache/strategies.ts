/**
 * Caching Strategies
 *
 * High-level caching patterns and utilities for common use cases
 */

import { CacheAdapter, CacheOptions, CacheKeyBuilder } from './types'
import { getGlobalCache } from './memory'

/**
 * Cache-aside pattern (lazy loading)
 *
 * Most common caching pattern:
 * 1. Check cache first
 * 2. If miss, fetch from source
 * 3. Store in cache
 * 4. Return data
 *
 * @param key - Cache key
 * @param fetcher - Function to fetch data if cache miss
 * @param options - Cache options
 * @param cache - Cache adapter (defaults to global cache)
 * @returns Cached or freshly fetched data
 *
 * @example
 * const projects = await withCache(
 *   'projects:list:active',
 *   () => db.query('SELECT * FROM projects WHERE status = ?', ['active']),
 *   { ttl: 300 }
 * )
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {},
  cache: CacheAdapter = getGlobalCache()
): Promise<T> {
  // Try to get from cache
  const cached = await cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Cache miss - fetch from source
  const data = await fetcher()

  // Store in cache
  await cache.set(key, data, options.ttl)

  return data
}

/**
 * Cache-aside with tags for grouped invalidation
 *
 * @example
 * const project = await withCacheAndTags(
 *   'project:123',
 *   () => fetchProject(123),
 *   ['projects', 'project:123'],
 *   { ttl: 600 }
 * )
 */
export async function withCacheAndTags<T>(
  key: string,
  fetcher: () => Promise<T>,
  tags: string[],
  options: CacheOptions = {},
  cache: CacheAdapter = getGlobalCache()
): Promise<T> {
  const cached = await cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  const data = await fetcher()

  // Use setWithTags if available (LRUCache supports this)
  if ('setWithTags' in cache) {
    await (cache as any).setWithTags(key, data, tags, options.ttl)
  } else {
    await cache.set(key, data, options.ttl)
  }

  return data
}

/**
 * Write-through cache pattern
 *
 * Updates both cache and source simultaneously
 * Ensures cache is always up to date
 *
 * @param key - Cache key
 * @param value - Value to write
 * @param writer - Function to write to source
 * @param options - Cache options
 * @param cache - Cache adapter
 *
 * @example
 * await writeThrough(
 *   'project:123',
 *   updatedProject,
 *   (data) => db.update('projects', data),
 *   { ttl: 600 }
 * )
 */
export async function writeThrough<T>(
  key: string,
  value: T,
  writer: (value: T) => Promise<void>,
  options: CacheOptions = {},
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  // Write to both cache and source
  await Promise.all([cache.set(key, value, options.ttl), writer(value)])
}

/**
 * Write-behind (lazy write) cache pattern
 *
 * Updates cache immediately, writes to source asynchronously
 * Faster but less consistent
 *
 * @param key - Cache key
 * @param value - Value to write
 * @param writer - Function to write to source
 * @param options - Cache options
 * @param cache - Cache adapter
 *
 * @example
 * await writeBehind(
 *   'stats:overview',
 *   stats,
 *   (data) => db.update('stats', data)
 * )
 */
export async function writeBehind<T>(
  key: string,
  value: T,
  writer: (value: T) => Promise<void>,
  options: CacheOptions = {},
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  // Update cache immediately
  await cache.set(key, value, options.ttl)

  // Write to source asynchronously (don't await)
  writer(value).catch((error) => {
    console.error('[Cache] Write-behind error:', error)
  })
}

/**
 * Cache warming
 *
 * Pre-populate cache with data before it's requested
 * Useful for frequently accessed data
 *
 * @param entries - Array of cache entries to warm
 * @param cache - Cache adapter
 *
 * @example
 * await warmCache([
 *   { key: 'stats:overview', fetcher: () => calculateStats(), ttl: 900 },
 *   { key: 'projects:top', fetcher: () => getTopProjects(), ttl: 600 }
 * ])
 */
export async function warmCache(
  entries: Array<{
    key: string
    fetcher: () => Promise<any>
    ttl?: number
    tags?: string[]
  }>,
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all(
    entries.map(async ({ key, fetcher, ttl, tags }) => {
      try {
        const data = await fetcher()
        if (tags && 'setWithTags' in cache) {
          await (cache as any).setWithTags(key, data, tags, ttl)
        } else {
          await cache.set(key, data, ttl)
        }
      } catch (error) {
        console.error(`[Cache] Failed to warm cache for key "${key}":`, error)
      }
    })
  )
}

/**
 * Refresh cache in background
 *
 * Returns cached data immediately, refreshes in background if stale
 * Ensures fast response times while keeping data fresh
 *
 * @param key - Cache key
 * @param fetcher - Function to fetch fresh data
 * @param options - Cache options with staleness threshold
 * @param cache - Cache adapter
 *
 * @example
 * const stats = await refreshInBackground(
 *   'stats:overview',
 *   () => calculateStats(),
 *   { ttl: 900, staleAfter: 600 }
 * )
 */
export async function refreshInBackground<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions & { staleAfter?: number } = {},
  cache: CacheAdapter = getGlobalCache()
): Promise<T> {
  const cached = await cache.get<T>(key)

  if (cached !== null) {
    // Check if stale (if staleAfter is specified)
    if (options.staleAfter) {
      // Trigger background refresh without awaiting
      fetcher()
        .then((data) => cache.set(key, data, options.ttl))
        .catch((error) => {
          console.error('[Cache] Background refresh error:', error)
        })
    }

    return cached
  }

  // Cache miss - fetch synchronously
  const data = await fetcher()
  await cache.set(key, data, options.ttl)
  return data
}

/**
 * Memoize function with cache
 *
 * Creates a cached version of a function
 * Automatically generates cache keys from arguments
 *
 * @param fn - Function to memoize
 * @param options - Cache options with key generator
 * @param cache - Cache adapter
 *
 * @example
 * const cachedGetProject = memoize(
 *   (id: number) => db.getProject(id),
 *   { ttl: 600, keyGenerator: (id) => `project:${id}` }
 * )
 */
export function memoize<Args extends any[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: CacheOptions & { prefix?: string } = {},
  cache: CacheAdapter = getGlobalCache()
): (...args: Args) => Promise<Result> {
  return async (...args: Args): Promise<Result> => {
    // Generate cache key
    const key = options.keyGenerator
      ? options.keyGenerator(args)
      : `${options.prefix || 'memo'}:${JSON.stringify(args)}`

    return withCache(key, () => fn(...args), options, cache)
  }
}

/**
 * Batch cache operations
 *
 * Fetch multiple cache entries efficiently
 *
 * @param keys - Array of cache keys
 * @param cache - Cache adapter
 * @returns Map of key to value (only includes hits)
 *
 * @example
 * const cached = await batchGet(['project:1', 'project:2', 'project:3'])
 * // { 'project:1': {...}, 'project:2': {...} }
 */
export async function batchGet<T>(
  keys: string[],
  cache: CacheAdapter = getGlobalCache()
): Promise<Map<string, T>> {
  const results = new Map<string, T>()

  await Promise.all(
    keys.map(async (key) => {
      const value = await cache.get<T>(key)
      if (value !== null) {
        results.set(key, value)
      }
    })
  )

  return results
}

/**
 * Batch cache set operations
 *
 * @param entries - Array of cache entries to set
 * @param cache - Cache adapter
 *
 * @example
 * await batchSet([
 *   { key: 'project:1', value: project1, ttl: 600 },
 *   { key: 'project:2', value: project2, ttl: 600 }
 * ])
 */
export async function batchSet<T>(
  entries: Array<{ key: string; value: T; ttl?: number }>,
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all(
    entries.map(({ key, value, ttl }) => cache.set(key, value, ttl))
  )
}

/**
 * Cache with fallback
 *
 * Try primary cache, fallback to secondary fetcher if miss
 *
 * @param key - Cache key
 * @param primaryFetcher - Primary data source
 * @param fallbackFetcher - Fallback data source
 * @param options - Cache options
 * @param cache - Cache adapter
 *
 * @example
 * const project = await withFallback(
 *   'project:123',
 *   () => db.getProject(123),
 *   () => api.getProject(123),
 *   { ttl: 600 }
 * )
 */
export async function withFallback<T>(
  key: string,
  primaryFetcher: () => Promise<T>,
  fallbackFetcher: () => Promise<T>,
  options: CacheOptions = {},
  cache: CacheAdapter = getGlobalCache()
): Promise<T> {
  const cached = await cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  try {
    const data = await primaryFetcher()
    await cache.set(key, data, options.ttl)
    return data
  } catch (error) {
    console.warn('[Cache] Primary fetcher failed, using fallback:', error)
    const fallbackData = await fallbackFetcher()
    await cache.set(key, fallbackData, options.ttl)
    return fallbackData
  }
}

/**
 * Conditional cache
 *
 * Only cache if condition is met
 *
 * @param key - Cache key
 * @param fetcher - Function to fetch data
 * @param condition - Function to determine if data should be cached
 * @param options - Cache options
 * @param cache - Cache adapter
 *
 * @example
 * const projects = await conditionalCache(
 *   'projects:active',
 *   () => getProjects(),
 *   (data) => data.length > 0, // Only cache if there are results
 *   { ttl: 300 }
 * )
 */
export async function conditionalCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  condition: (data: T) => boolean,
  options: CacheOptions = {},
  cache: CacheAdapter = getGlobalCache()
): Promise<T> {
  const cached = await cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  const data = await fetcher()

  if (condition(data)) {
    await cache.set(key, data, options.ttl)
  }

  return data
}

/**
 * Time-based cache strategy
 *
 * Different TTLs based on time of day
 * Useful for data that changes at specific times
 *
 * @param key - Cache key
 * @param fetcher - Function to fetch data
 * @param ttlConfig - TTL configuration by hour
 * @param cache - Cache adapter
 *
 * @example
 * const stats = await timeBasedCache(
 *   'stats:daily',
 *   () => getDailyStats(),
 *   {
 *     // Longer cache during off-peak hours
 *     0: 3600,  // 1 hour from midnight-1am
 *     9: 300,   // 5 minutes during business hours
 *     17: 1800  // 30 minutes after business hours
 *   }
 * )
 */
export async function timeBasedCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlConfig: Record<number, number>,
  cache: CacheAdapter = getGlobalCache()
): Promise<T> {
  const currentHour = new Date().getHours()

  // Find the appropriate TTL for current hour
  const ttl =
    ttlConfig[currentHour] ??
    Object.keys(ttlConfig)
      .map(Number)
      .filter((hour) => hour <= currentHour)
      .reduce((prev, curr) => (curr > prev ? curr : prev), 0)

  return withCache(key, fetcher, { ttl }, cache)
}

/**
 * Export all strategies as a namespace for convenience
 */
export const CacheStrategies = {
  withCache,
  withCacheAndTags,
  writeThrough,
  writeBehind,
  warmCache,
  refreshInBackground,
  memoize,
  batchGet,
  batchSet,
  withFallback,
  conditionalCache,
  timeBasedCache,
}
