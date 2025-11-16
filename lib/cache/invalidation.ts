/**
 * Cache Invalidation Utilities
 *
 * Provides tools for invalidating cached data when source data changes
 * Supports pattern-based, tag-based, and entity-specific invalidation
 */

import { CacheAdapter, InvalidationOptions } from './types'
import { getGlobalCache } from './memory'

/**
 * Invalidate cache entries by pattern
 *
 * Supports wildcards in patterns
 *
 * @param pattern - Pattern to match (e.g., "projects:*", "stats:*")
 * @param cache - Cache adapter
 * @returns Number of entries invalidated
 *
 * @example
 * await invalidatePattern('projects:*') // Clear all project caches
 * await invalidatePattern('project:123:*') // Clear all caches for project 123
 */
export async function invalidatePattern(
  pattern: string,
  cache: CacheAdapter = getGlobalCache()
): Promise<number> {
  if ('deleteByPattern' in cache) {
    return await (cache as any).deleteByPattern(pattern)
  }

  // Fallback: manually filter keys
  const keys = 'getKeys' in cache ? (cache as any).getKeys() : []
  const regex = new RegExp(pattern.replace(/\*/g, '.*'))
  let count = 0

  for (const key of keys) {
    if (regex.test(key)) {
      await cache.delete(key)
      count++
    }
  }

  return count
}

/**
 * Invalidate cache entries by tags
 *
 * @param tags - Array of tags to invalidate
 * @param cache - Cache adapter
 * @returns Number of entries invalidated
 *
 * @example
 * await invalidateTags(['projects']) // Clear all caches tagged with 'projects'
 * await invalidateTags(['project:123', 'stats']) // Clear multiple tags
 */
export async function invalidateTags(
  tags: string[],
  cache: CacheAdapter = getGlobalCache()
): Promise<number> {
  if ('deleteByTags' in cache) {
    return await (cache as any).deleteByTags(tags)
  }

  // Fallback: not supported, return 0
  console.warn('[Cache] Tag-based invalidation not supported by cache adapter')
  return 0
}

/**
 * Invalidate cache entries by specific keys
 *
 * @param keys - Array of cache keys to invalidate
 * @param cache - Cache adapter
 * @returns Number of entries invalidated
 *
 * @example
 * await invalidateKeys(['project:123', 'project:456'])
 */
export async function invalidateKeys(
  keys: string[],
  cache: CacheAdapter = getGlobalCache()
): Promise<number> {
  let count = 0

  await Promise.all(
    keys.map(async (key) => {
      const existed = await cache.has(key)
      if (existed) {
        await cache.delete(key)
        count++
      }
    })
  )

  return count
}

/**
 * Flexible invalidation using options
 *
 * @param options - Invalidation options (pattern, tags, or keys)
 * @param cache - Cache adapter
 * @returns Number of entries invalidated
 *
 * @example
 * await invalidate({ pattern: 'projects:*' })
 * await invalidate({ tags: ['projects', 'stats'] })
 * await invalidate({ keys: ['project:123'] })
 */
export async function invalidate(
  options: InvalidationOptions,
  cache: CacheAdapter = getGlobalCache()
): Promise<number> {
  let totalInvalidated = 0

  if (options.pattern) {
    totalInvalidated += await invalidatePattern(options.pattern, cache)
  }

  if (options.tags && options.tags.length > 0) {
    totalInvalidated += await invalidateTags(options.tags, cache)
  }

  if (options.keys && options.keys.length > 0) {
    totalInvalidated += await invalidateKeys(options.keys, cache)
  }

  return totalInvalidated
}

// ============================================================================
// Domain-specific invalidation helpers
// ============================================================================

/**
 * Invalidate all project-related caches
 *
 * @example
 * await invalidateProjects() // Clear all project list caches
 */
export async function invalidateProjects(
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all([
    invalidatePattern('projects:*', cache),
    invalidateTags(['projects'], cache),
  ])
}

/**
 * Invalidate cache for a specific project
 *
 * Also invalidates project lists since they may include this project
 *
 * @param projectId - Project ID
 *
 * @example
 * await invalidateProject(123) // Clear cache for project 123
 */
export async function invalidateProject(
  projectId: number | string,
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all([
    // Invalidate specific project cache
    invalidatePattern(`project:${projectId}*`, cache),
    // Invalidate project lists (they may include this project)
    invalidatePattern('projects:*', cache),
    // Invalidate by tags
    invalidateTags([`project:${projectId}`, 'projects'], cache),
  ])
}

/**
 * Invalidate all statistics caches
 *
 * @example
 * await invalidateStats() // Clear all stats caches
 */
export async function invalidateStats(
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all([
    invalidatePattern('stats:*', cache),
    invalidateTags(['stats'], cache),
  ])
}

/**
 * Invalidate all investment-related caches
 *
 * @param userId - Optional user ID to invalidate only that user's investments
 *
 * @example
 * await invalidateInvestments() // Clear all investment caches
 * await invalidateInvestments(123) // Clear investments for user 123
 */
export async function invalidateInvestments(
  userId?: number | string,
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  if (userId) {
    await Promise.all([
      invalidatePattern(`investments:user:${userId}*`, cache),
      invalidateTags([`user:${userId}:investments`], cache),
    ])
  } else {
    await Promise.all([
      invalidatePattern('investments:*', cache),
      invalidateTags(['investments'], cache),
    ])
  }
}

/**
 * Invalidate cache for a specific investment
 *
 * @param investmentId - Investment ID
 *
 * @example
 * await invalidateInvestment(456) // Clear cache for investment 456
 */
export async function invalidateInvestment(
  investmentId: number | string,
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all([
    invalidatePattern(`investment:${investmentId}*`, cache),
    invalidateTags([`investment:${investmentId}`], cache),
  ])
}

/**
 * Invalidate user-specific caches
 *
 * @param userId - User ID
 *
 * @example
 * await invalidateUser(123) // Clear all caches for user 123
 */
export async function invalidateUser(
  userId: number | string,
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all([
    invalidatePattern(`user:${userId}*`, cache),
    invalidateTags([`user:${userId}`], cache),
  ])
}

/**
 * Invalidate all caches
 *
 * Use with caution - this clears the entire cache
 *
 * @example
 * await invalidateAll() // Clear everything
 */
export async function invalidateAll(
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await cache.clear()
}

// ============================================================================
// Cascade invalidation helpers
// ============================================================================

/**
 * Invalidate caches when a project is created
 *
 * @param projectId - ID of the created project
 *
 * @example
 * await onProjectCreated(123)
 */
export async function onProjectCreated(
  projectId: number | string,
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all([
    invalidateProjects(cache), // Project lists changed
    invalidateStats(cache), // Stats changed (project count, etc.)
  ])
}

/**
 * Invalidate caches when a project is updated
 *
 * @param projectId - ID of the updated project
 *
 * @example
 * await onProjectUpdated(123)
 */
export async function onProjectUpdated(
  projectId: number | string,
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all([
    invalidateProject(projectId, cache), // Specific project changed
    invalidateProjects(cache), // Project lists may have changed
    invalidateStats(cache), // Stats may have changed
  ])
}

/**
 * Invalidate caches when a project is deleted
 *
 * @param projectId - ID of the deleted project
 *
 * @example
 * await onProjectDeleted(123)
 */
export async function onProjectDeleted(
  projectId: number | string,
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all([
    invalidateProject(projectId, cache),
    invalidateProjects(cache),
    invalidateStats(cache),
  ])
}

/**
 * Invalidate caches when an investment is created
 *
 * @param investmentId - ID of the created investment
 * @param userId - ID of the user who created the investment
 *
 * @example
 * await onInvestmentCreated(456, 123)
 */
export async function onInvestmentCreated(
  investmentId: number | string,
  userId: number | string,
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all([
    invalidateInvestments(userId, cache), // User's investment list changed
    invalidateStats(cache), // Investment stats changed
  ])
}

/**
 * Invalidate caches when an investment is updated
 *
 * @param investmentId - ID of the updated investment
 * @param userId - ID of the user who owns the investment
 *
 * @example
 * await onInvestmentUpdated(456, 123)
 */
export async function onInvestmentUpdated(
  investmentId: number | string,
  userId: number | string,
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all([
    invalidateInvestment(investmentId, cache),
    invalidateInvestments(userId, cache),
    invalidateStats(cache),
  ])
}

/**
 * Invalidate caches when an investment is deleted/cancelled
 *
 * @param investmentId - ID of the deleted investment
 * @param userId - ID of the user who owned the investment
 *
 * @example
 * await onInvestmentDeleted(456, 123)
 */
export async function onInvestmentDeleted(
  investmentId: number | string,
  userId: number | string,
  cache: CacheAdapter = getGlobalCache()
): Promise<void> {
  await Promise.all([
    invalidateInvestment(investmentId, cache),
    invalidateInvestments(userId, cache),
    invalidateStats(cache),
  ])
}

/**
 * Export all invalidation helpers as a namespace
 */
export const CacheInvalidation = {
  // Generic invalidation
  invalidatePattern,
  invalidateTags,
  invalidateKeys,
  invalidate,
  invalidateAll,

  // Domain-specific invalidation
  invalidateProjects,
  invalidateProject,
  invalidateStats,
  invalidateInvestments,
  invalidateInvestment,
  invalidateUser,

  // Cascade invalidation
  onProjectCreated,
  onProjectUpdated,
  onProjectDeleted,
  onInvestmentCreated,
  onInvestmentUpdated,
  onInvestmentDeleted,
}
