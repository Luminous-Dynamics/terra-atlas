/**
 * Database Transaction Utilities
 *
 * Safe transaction management with automatic rollback on errors.
 */

import { DatabaseError } from '../errors/error-types'
import { logger } from '../logger'
import { getDb } from './query-helpers'

/**
 * Transaction callback type
 */
export type TransactionCallback<T> = (tx: any) => Promise<T>

/**
 * Execute a function within a database transaction
 * Automatically commits on success, rolls back on error
 */
export async function withTransaction<T>(
  callback: TransactionCallback<T>
): Promise<T> {
  const db = getDb()
  const startTime = Date.now()

  try {
    logger.debug('Starting database transaction')

    // Execute callback within transaction
    const result = await db.transaction(async (tx: any) => {
      return await callback(tx)
    })

    const duration = Date.now() - startTime
    logger.info(`Transaction committed successfully in ${duration}ms`, { duration })

    return result
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(`Transaction rolled back after ${duration}ms`, error)

    throw new DatabaseError('Transaction failed and was rolled back', {
      duration,
      error,
    })
  }
}

/**
 * Batch update multiple records within a transaction
 */
export async function batchUpdate<T>(
  table: any,
  idColumn: any,
  updates: Array<{ id: number | string; data: Partial<T> }>
): Promise<{ success: number; failed: number }> {
  return withTransaction(async (tx) => {
    let success = 0
    let failed = 0

    const startTime = Date.now()

    for (const update of updates) {
      try {
        await tx
          .update(table)
          .set(update.data)
          .where(tx.eq(idColumn, update.id))

        success++
      } catch (error) {
        logger.warn(`Failed to update record ${update.id}`, error)
        failed++
      }
    }

    const duration = Date.now() - startTime
    logger.info(`Batch update completed in ${duration}ms`, {
      success,
      failed,
      total: updates.length,
      duration,
    })

    return { success, failed }
  })
}

/**
 * Batch delete multiple records within a transaction
 */
export async function batchDelete(
  table: any,
  idColumn: any,
  ids: Array<number | string>
): Promise<number> {
  return withTransaction(async (tx) => {
    const startTime = Date.now()

    const result = await tx
      .delete(table)
      .where(tx.inArray(idColumn, ids))
      .returning()

    const duration = Date.now() - startTime
    const deletedCount = result?.length || 0

    logger.info(`Batch delete completed in ${duration}ms`, {
      requested: ids.length,
      deleted: deletedCount,
      duration,
    })

    return deletedCount
  })
}

/**
 * Execute multiple operations atomically
 * All operations succeed or all fail
 */
export async function atomicOperations<T>(
  operations: Array<(tx: any) => Promise<any>>
): Promise<T[]> {
  return withTransaction(async (tx) => {
    const results: T[] = []
    const startTime = Date.now()

    for (const [index, operation] of operations.entries()) {
      try {
        const result = await operation(tx)
        results.push(result)
        logger.debug(`Operation ${index + 1}/${operations.length} completed`)
      } catch (error) {
        logger.error(`Operation ${index + 1} failed, rolling back all operations`, error)
        throw error
      }
    }

    const duration = Date.now() - startTime
    logger.info(`Atomic operations completed in ${duration}ms`, {
      count: operations.length,
      duration,
    })

    return results
  })
}

/**
 * Transfer operation with validation
 * Useful for moving data between tables or updating related records
 */
export async function transferOperation<T>(
  sourceOperation: (tx: any) => Promise<void>,
  targetOperation: (tx: any) => Promise<T>,
  validation?: (tx: any) => Promise<boolean>
): Promise<T> {
  return withTransaction(async (tx) => {
    const startTime = Date.now()

    // Run validation if provided
    if (validation) {
      const isValid = await validation(tx)
      if (!isValid) {
        throw new DatabaseError('Transfer validation failed')
      }
      logger.debug('Transfer validation passed')
    }

    // Execute source operation (e.g., delete from source)
    await sourceOperation(tx)
    logger.debug('Source operation completed')

    // Execute target operation (e.g., insert to target)
    const result = await targetOperation(tx)
    logger.debug('Target operation completed')

    const duration = Date.now() - startTime
    logger.info(`Transfer operation completed in ${duration}ms`, { duration })

    return result
  })
}

/**
 * Upsert operation (insert or update)
 * Uses transaction to ensure atomicity
 */
export async function upsert<T>(
  table: any,
  uniqueColumn: any,
  uniqueValue: any,
  data: any
): Promise<{ record: T; created: boolean }> {
  return withTransaction(async (tx) => {
    const startTime = Date.now()

    // Try to find existing record
    const existing = await tx
      .select()
      .from(table)
      .where(tx.eq(uniqueColumn, uniqueValue))
      .limit(1)

    if (existing && existing.length > 0) {
      // Update existing
      const updated = await tx
        .update(table)
        .set(data)
        .where(tx.eq(uniqueColumn, uniqueValue))
        .returning()

      const duration = Date.now() - startTime
      logger.debug(`Upsert (update) completed in ${duration}ms`, { duration })

      return { record: updated[0] as T, created: false }
    } else {
      // Insert new
      const inserted = await tx
        .insert(table)
        .values({ ...data, [uniqueColumn.name]: uniqueValue })
        .returning()

      const duration = Date.now() - startTime
      logger.debug(`Upsert (insert) completed in ${duration}ms`, { duration })

      return { record: inserted[0] as T, created: true }
    }
  })
}

/**
 * Retry a transaction with exponential backoff
 * Useful for handling temporary database issues
 */
export async function withRetryableTransaction<T>(
  callback: TransactionCallback<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000 } = options

  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await withTransaction(callback)
    } catch (error) {
      lastError = error as Error

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt)
        logger.warn(
          `Transaction failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`,
          error
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  logger.error(`Transaction failed after ${maxRetries} retries`)
  throw lastError || new DatabaseError('Transaction failed after retries')
}

/**
 * Savepoint management for nested transactions
 */
export class Savepoint {
  private name: string
  private tx: any

  constructor(tx: any, name: string) {
    this.tx = tx
    this.name = name
  }

  async create(): Promise<void> {
    await this.tx.execute(`SAVEPOINT ${this.name}`)
    logger.debug(`Savepoint created: ${this.name}`)
  }

  async rollback(): Promise<void> {
    await this.tx.execute(`ROLLBACK TO SAVEPOINT ${this.name}`)
    logger.debug(`Rolled back to savepoint: ${this.name}`)
  }

  async release(): Promise<void> {
    await this.tx.execute(`RELEASE SAVEPOINT ${this.name}`)
    logger.debug(`Savepoint released: ${this.name}`)
  }
}

/**
 * Create a savepoint within a transaction
 */
export async function withSavepoint<T>(
  tx: any,
  name: string,
  callback: (savepoint: Savepoint) => Promise<T>
): Promise<T> {
  const savepoint = new Savepoint(tx, name)

  try {
    await savepoint.create()
    const result = await callback(savepoint)
    await savepoint.release()
    return result
  } catch (error) {
    await savepoint.rollback()
    throw error
  }
}
