/**
 * Database Query Helpers
 *
 * Reusable query patterns for common database operations with Drizzle ORM.
 * Provides type-safe, consistent database access with error handling and logging.
 */

import { eq, and, or, sql, SQL, gte, lte, like, inArray } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import { DatabaseError, NotFoundError } from '../errors/error-types'
import { logger } from '../logger'
import type { PaginationParams } from '../api/pagination'

/**
 * Get database instance
 * Import this from your database configuration
 */
let dbInstance: any = null

export function setDatabaseInstance(db: any) {
  dbInstance = db
}

export function getDb() {
  if (!dbInstance) {
    throw new DatabaseError('Database instance not initialized. Call setDatabaseInstance() first.')
  }
  return dbInstance
}

/**
 * Paginated result type
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

/**
 * Where clause type (simplified for common use cases)
 */
export type WhereClause = SQL | SQL[] | undefined

/**
 * Order by configuration
 */
export interface OrderByConfig {
  column: any
  direction: 'asc' | 'desc'
}

/**
 * Find a single record by ID
 */
export async function findById<T>(
  table: PgTable,
  idColumn: any,
  id: number | string
): Promise<T | null> {
  try {
    const db = getDb()
    const startTime = Date.now()

    const result = await db
      .select()
      .from(table)
      .where(eq(idColumn, id))
      .limit(1)

    const duration = Date.now() - startTime
    logger.debug(`findById query completed in ${duration}ms`, {
      table: table.$inferSelect,
      id,
      duration,
    })

    return result[0] || null
  } catch (error) {
    logger.error('findById failed', error)
    throw new DatabaseError(`Failed to find record by ID: ${id}`, {
      table: table.$inferSelect,
      id,
      error,
    })
  }
}

/**
 * Find a single record by conditions
 */
export async function findOne<T>(
  table: PgTable,
  where: WhereClause
): Promise<T | null> {
  try {
    const db = getDb()
    const startTime = Date.now()

    let query = db.select().from(table)

    if (where) {
      query = query.where(Array.isArray(where) ? and(...where) : where)
    }

    const result = await query.limit(1)

    const duration = Date.now() - startTime
    logger.debug(`findOne query completed in ${duration}ms`, { duration })

    return result[0] || null
  } catch (error) {
    logger.error('findOne failed', error)
    throw new DatabaseError('Failed to find record', { error })
  }
}

/**
 * Find multiple records by conditions
 */
export async function findMany<T>(
  table: PgTable,
  options: {
    where?: WhereClause
    orderBy?: OrderByConfig | OrderByConfig[]
    limit?: number
    offset?: number
  } = {}
): Promise<T[]> {
  try {
    const db = getDb()
    const startTime = Date.now()

    let query = db.select().from(table)

    if (options.where) {
      query = query.where(
        Array.isArray(options.where) ? and(...options.where) : options.where
      )
    }

    if (options.orderBy) {
      const orderByArray = Array.isArray(options.orderBy) ? options.orderBy : [options.orderBy]
      const orderClauses = orderByArray.map((ob) =>
        ob.direction === 'desc' ? sql`${ob.column} DESC` : sql`${ob.column} ASC`
      )
      query = query.orderBy(...orderClauses)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.offset(options.offset)
    }

    const result = await query

    const duration = Date.now() - startTime
    logger.debug(`findMany query completed in ${duration}ms`, {
      count: result.length,
      duration,
    })

    return result as T[]
  } catch (error) {
    logger.error('findMany failed', error)
    throw new DatabaseError('Failed to find records', { error })
  }
}

/**
 * Find records with pagination
 */
export async function findPaginated<T>(
  table: PgTable,
  params: PaginationParams,
  options: {
    where?: WhereClause
    orderBy?: OrderByConfig | OrderByConfig[]
  } = {}
): Promise<PaginatedResult<T>> {
  try {
    const { limit, offset } = params

    // Get total count
    const total = await count(table, options.where)

    // Get paginated data
    const data = await findMany<T>(table, {
      where: options.where,
      orderBy: options.orderBy,
      limit,
      offset,
    })

    return {
      data,
      total,
      limit,
      offset,
      hasMore: offset + data.length < total,
    }
  } catch (error) {
    logger.error('findPaginated failed', error)
    throw new DatabaseError('Failed to fetch paginated results', { error })
  }
}

/**
 * Create a single record
 */
export async function createOne<T>(
  table: PgTable,
  data: any
): Promise<T> {
  try {
    const db = getDb()
    const startTime = Date.now()

    const result = await db.insert(table).values(data).returning()

    const duration = Date.now() - startTime
    logger.debug(`createOne completed in ${duration}ms`, { duration })

    if (!result || result.length === 0) {
      throw new DatabaseError('Failed to create record: no result returned')
    }

    return result[0] as T
  } catch (error) {
    logger.error('createOne failed', error)
    throw new DatabaseError('Failed to create record', { error })
  }
}

/**
 * Update a single record by ID
 */
export async function updateOne<T>(
  table: PgTable,
  idColumn: any,
  id: number | string,
  data: any
): Promise<T> {
  try {
    const db = getDb()
    const startTime = Date.now()

    const result = await db
      .update(table)
      .set(data)
      .where(eq(idColumn, id))
      .returning()

    const duration = Date.now() - startTime
    logger.debug(`updateOne completed in ${duration}ms`, { id, duration })

    if (!result || result.length === 0) {
      throw new NotFoundError('Record', id)
    }

    return result[0] as T
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error
    }
    logger.error('updateOne failed', error)
    throw new DatabaseError(`Failed to update record: ${id}`, { id, error })
  }
}

/**
 * Delete a single record by ID
 */
export async function deleteOne(
  table: PgTable,
  idColumn: any,
  id: number | string
): Promise<boolean> {
  try {
    const db = getDb()
    const startTime = Date.now()

    const result = await db
      .delete(table)
      .where(eq(idColumn, id))
      .returning()

    const duration = Date.now() - startTime
    logger.debug(`deleteOne completed in ${duration}ms`, { id, duration })

    return result && result.length > 0
  } catch (error) {
    logger.error('deleteOne failed', error)
    throw new DatabaseError(`Failed to delete record: ${id}`, { id, error })
  }
}

/**
 * Count records matching conditions
 */
export async function count(
  table: PgTable,
  where?: WhereClause
): Promise<number> {
  try {
    const db = getDb()
    const startTime = Date.now()

    let query = db.select({ count: sql<number>`count(*)` }).from(table)

    if (where) {
      query = query.where(Array.isArray(where) ? and(...where) : where)
    }

    const result = await query

    const duration = Date.now() - startTime
    logger.debug(`count query completed in ${duration}ms`, { duration })

    return Number(result[0]?.count || 0)
  } catch (error) {
    logger.error('count failed', error)
    throw new DatabaseError('Failed to count records', { error })
  }
}

/**
 * Check if a record exists
 */
export async function exists(
  table: PgTable,
  where: WhereClause
): Promise<boolean> {
  try {
    const recordCount = await count(table, where)
    return recordCount > 0
  } catch (error) {
    logger.error('exists check failed', error)
    throw new DatabaseError('Failed to check if record exists', { error })
  }
}

/**
 * Find or create a record
 */
export async function findOrCreate<T>(
  table: PgTable,
  where: WhereClause,
  createData: any
): Promise<{ record: T; created: boolean }> {
  try {
    // Try to find existing record
    const existing = await findOne<T>(table, where)

    if (existing) {
      return { record: existing, created: false }
    }

    // Create new record
    const created = await createOne<T>(table, createData)
    return { record: created, created: true }
  } catch (error) {
    logger.error('findOrCreate failed', error)
    throw new DatabaseError('Failed to find or create record', { error })
  }
}

/**
 * Soft delete (set deleted_at timestamp)
 */
export async function softDelete<T>(
  table: PgTable,
  idColumn: any,
  id: number | string,
  deletedAtColumn: any
): Promise<T> {
  try {
    const db = getDb()
    const startTime = Date.now()

    const result = await db
      .update(table)
      .set({ [deletedAtColumn.name]: new Date() })
      .where(eq(idColumn, id))
      .returning()

    const duration = Date.now() - startTime
    logger.debug(`softDelete completed in ${duration}ms`, { id, duration })

    if (!result || result.length === 0) {
      throw new NotFoundError('Record', id)
    }

    return result[0] as T
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error
    }
    logger.error('softDelete failed', error)
    throw new DatabaseError(`Failed to soft delete record: ${id}`, { id, error })
  }
}

/**
 * Batch insert multiple records
 */
export async function batchInsert<T>(
  table: PgTable,
  items: any[],
  batchSize: number = 100
): Promise<T[]> {
  try {
    const db = getDb()
    const results: T[] = []

    // Process in batches
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const startTime = Date.now()

      const batchResults = await db.insert(table).values(batch).returning()

      const duration = Date.now() - startTime
      logger.debug(
        `Batch insert ${i / batchSize + 1} completed in ${duration}ms`,
        { count: batch.length, duration }
      )

      results.push(...(batchResults as T[]))
    }

    logger.info(`Batch insert completed: ${results.length} records inserted`)
    return results
  } catch (error) {
    logger.error('batchInsert failed', error)
    throw new DatabaseError('Failed to batch insert records', { error })
  }
}

/**
 * Helper: Build search conditions for text fields
 */
export function searchCondition(column: any, searchTerm: string): SQL {
  return like(column, `%${searchTerm}%`)
}

/**
 * Helper: Build date range conditions
 */
export function dateRange(column: any, start: Date, end: Date): SQL {
  return and(gte(column, start), lte(column, end))
}

/**
 * Helper: Build IN condition
 */
export function inCondition<T>(column: any, values: T[]): SQL {
  return inArray(column, values)
}
