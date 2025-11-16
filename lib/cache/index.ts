/**
 * Cache Module
 *
 * Production-grade caching infrastructure for Terra Atlas
 *
 * Features:
 * - LRU in-memory cache with TTL support
 * - High-level caching strategies (cache-aside, write-through, etc.)
 * - Pattern and tag-based invalidation
 * - HTTP caching with ETags and Cache-Control
 * - Statistics tracking and monitoring
 *
 * @example Basic usage
 * ```typescript
 * import { withCache, cache } from '@/lib/cache'
 *
 * const projects = await withCache(
 *   'projects:list',
 *   () => db.getProjects(),
 *   { ttl: 300 }
 * )
 * ```
 *
 * @example With invalidation
 * ```typescript
 * import { invalidateProjects } from '@/lib/cache'
 *
 * await updateProject(id, data)
 * await invalidateProjects() // Clear all project caches
 * ```
 *
 * @example HTTP caching
 * ```typescript
 * import { generateETag, hasMatchingETag } from '@/lib/cache'
 *
 * const etag = generateETag(project)
 * if (hasMatchingETag(request, etag)) {
 *   return new Response(null, { status: 304 })
 * }
 * ```
 */

// ============================================================================
// Core Cache Implementation
// ============================================================================

export { LRUCache, getGlobalCache, resetGlobalCache, cache } from './memory'

// ============================================================================
// Type Definitions
// ============================================================================

export type {
  CacheAdapter,
  CacheEntry,
  CacheOptions,
  CacheStats,
  InvalidationOptions,
  HttpCacheOptions,
  CacheConfig,
} from './types'

export {
  CacheKeyBuilder,
  isCacheEntry,
  DEFAULT_CACHE_CONFIG,
} from './types'

// ============================================================================
// Caching Strategies
// ============================================================================

export {
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
  CacheStrategies,
} from './strategies'

// ============================================================================
// Cache Invalidation
// ============================================================================

export {
  invalidatePattern,
  invalidateTags,
  invalidateKeys,
  invalidate,
  invalidateAll,
  invalidateProjects,
  invalidateProject,
  invalidateStats,
  invalidateInvestments,
  invalidateInvestment,
  invalidateUser,
  onProjectCreated,
  onProjectUpdated,
  onProjectDeleted,
  onInvestmentCreated,
  onInvestmentUpdated,
  onInvestmentDeleted,
  CacheInvalidation,
} from './invalidation'

// ============================================================================
// HTTP Caching
// ============================================================================

export {
  generateETag,
  generateETagFromTimestamp,
  hasMatchingETag,
  isModifiedSince,
  buildCacheControl,
  addETagHeader,
  addCacheControlHeader,
  addHttpCacheHeaders,
  handleConditionalRequest,
  notModifiedResponse,
  withETag,
  withCacheControl,
  withHttpCache,
  HttpCache,
} from './middleware'

// ============================================================================
// Cache Configuration Constants
// ============================================================================

/**
 * Recommended TTL values for different data types
 */
export const CACHE_DURATIONS = {
  /** Very short cache - 1 minute */
  VERY_SHORT: 60,
  /** Short cache - 5 minutes (default for most data) */
  SHORT: 300,
  /** Medium cache - 15 minutes (for stats, aggregations) */
  MEDIUM: 900,
  /** Long cache - 1 hour (for static/rarely changing data) */
  LONG: 3600,
  /** Very long cache - 24 hours (for historical data) */
  VERY_LONG: 86400,
} as const

/**
 * Cache key prefixes for organizing cache entries
 */
export const CACHE_PREFIXES = {
  PROJECTS: 'projects',
  PROJECT: 'project',
  INVESTMENTS: 'investments',
  INVESTMENT: 'investment',
  STATS: 'stats',
  USER: 'user',
  PORTFOLIO: 'portfolio',
  ANALYTICS: 'analytics',
} as const

/**
 * Create a cache key with consistent formatting
 *
 * @example
 * createCacheKey('projects', 'list', { status: 'active' })
 * // => "projects:list:{\"status\":\"active\"}"
 */
export function createCacheKey(...parts: Array<string | number | object>): string {
  return parts
    .map((part) => {
      if (typeof part === 'object') {
        return JSON.stringify(part)
      }
      return String(part)
    })
    .join(':')
}

/**
 * Get cache statistics from global cache
 */
export function getCacheStats() {
  return getGlobalCache().getStats()
}

/**
 * Clear all caches
 */
export async function clearAllCaches() {
  await getGlobalCache().clear()
}
