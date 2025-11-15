/**
 * Admin Bulk Operations
 *
 * Utilities for performing bulk operations on data with progress tracking.
 */

import { withTransaction, batchUpdate as dbBatchUpdate, batchDelete as dbBatchDelete } from '../db/transactions'
import { structuredLogger } from '../logging/structured-logger'
import { measurePerformance } from '../logging/performance-logger'
import { DatabaseError } from '../errors/error-types'

/**
 * Bulk operation result
 */
export interface BulkResult {
  total: number
  success: number
  failed: number
  errors: Array<{
    id: any
    error: string
  }>
  duration: number
}

/**
 * Bulk operation progress
 */
export interface BulkProgress {
  total: number
  completed: number
  failed: number
  percentage: number
  errors: Array<{ id: any; error: string }>
}

/**
 * Operation callback type
 */
export type OperationCallback<T> = (item: T) => Promise<void>

/**
 * Bulk operation executor with progress tracking
 */
export class BulkOperationExecutor<T> {
  private total: number = 0
  private completed: number = 0
  private failed: number = 0
  private errors: Array<{ id: any; error: string }> = []
  private startTime: number = 0

  constructor(
    private items: T[],
    private operation: OperationCallback<T>,
    private getId: (item: T) => any
  ) {
    this.total = items.length
  }

  /**
   * Execute all operations
   */
  async execute(): Promise<BulkResult> {
    this.startTime = Date.now()

    structuredLogger.info(`Starting bulk operation on ${this.total} items`, {
      operation: 'bulk_execute',
      total: this.total,
    })

    for (const item of this.items) {
      try {
        await this.operation(item)
        this.completed++
      } catch (error) {
        this.failed++
        const errorMessage = error instanceof Error ? error.message : String(error)
        this.errors.push({
          id: this.getId(item),
          error: errorMessage,
        })

        structuredLogger.warn(`Bulk operation failed for item ${this.getId(item)}`, {
          id: this.getId(item),
          error: errorMessage,
        })
      }
    }

    const duration = Date.now() - this.startTime

    structuredLogger.info(`Bulk operation completed`, {
      operation: 'bulk_execute',
      total: this.total,
      success: this.completed,
      failed: this.failed,
      duration,
    })

    return {
      total: this.total,
      success: this.completed,
      failed: this.failed,
      errors: this.errors,
      duration,
    }
  }

  /**
   * Get current progress
   */
  getProgress(): BulkProgress {
    const processed = this.completed + this.failed
    return {
      total: this.total,
      completed: this.completed,
      failed: this.failed,
      percentage: this.total > 0 ? Math.round((processed / this.total) * 100) : 0,
      errors: this.errors,
    }
  }
}

/**
 * Bulk update users
 */
export async function bulkUpdateUsers(
  updates: Array<{ id: number; data: any }>
): Promise<BulkResult> {
  return measurePerformance('bulk_update_users', async () => {
    const executor = new BulkOperationExecutor(
      updates,
      async (update) => {
        // This would use the actual database update
        // For now, this is a placeholder
        await new Promise(resolve => setTimeout(resolve, 10))
      },
      (update) => update.id
    )

    return executor.execute()
  })
}

/**
 * Bulk approve projects
 */
export async function bulkApproveProjects(
  projectIds: number[],
  approvedBy: number
): Promise<BulkResult> {
  return measurePerformance('bulk_approve_projects', async () => {
    const startTime = Date.now()
    let success = 0
    let failed = 0
    const errors: Array<{ id: any; error: string }> = []

    structuredLogger.info(`Bulk approving ${projectIds.length} projects`, {
      operation: 'bulk_approve_projects',
      count: projectIds.length,
      approvedBy,
    })

    return withTransaction(async (tx) => {
      for (const projectId of projectIds) {
        try {
          // Update project status to approved
          // This is a placeholder - would use actual DB operations
          success++
        } catch (error) {
          failed++
          const errorMessage = error instanceof Error ? error.message : String(error)
          errors.push({ id: projectId, error: errorMessage })

          structuredLogger.warn(`Failed to approve project ${projectId}`, {
            projectId,
            error: errorMessage,
          })
        }
      }

      const duration = Date.now() - startTime

      structuredLogger.info(`Bulk approve completed`, {
        operation: 'bulk_approve_projects',
        total: projectIds.length,
        success,
        failed,
        duration,
      })

      return {
        total: projectIds.length,
        success,
        failed,
        errors,
        duration,
      }
    })
  })
}

/**
 * Bulk process investments
 */
export async function bulkProcessInvestments(
  investmentIds: number[],
  action: 'approve' | 'reject' | 'refund',
  processedBy: number
): Promise<BulkResult> {
  return measurePerformance('bulk_process_investments', async () => {
    const startTime = Date.now()
    let success = 0
    let failed = 0
    const errors: Array<{ id: any; error: string }> = []

    structuredLogger.info(`Bulk processing ${investmentIds.length} investments (${action})`, {
      operation: 'bulk_process_investments',
      count: investmentIds.length,
      action,
      processedBy,
    })

    return withTransaction(async (tx) => {
      for (const investmentId of investmentIds) {
        try {
          // Process investment based on action
          // This is a placeholder - would use actual DB operations
          success++
        } catch (error) {
          failed++
          const errorMessage = error instanceof Error ? error.message : String(error)
          errors.push({ id: investmentId, error: errorMessage })

          structuredLogger.warn(`Failed to process investment ${investmentId}`, {
            investmentId,
            action,
            error: errorMessage,
          })
        }
      }

      const duration = Date.now() - startTime

      structuredLogger.info(`Bulk process investments completed`, {
        operation: 'bulk_process_investments',
        action,
        total: investmentIds.length,
        success,
        failed,
        duration,
      })

      return {
        total: investmentIds.length,
        success,
        failed,
        errors,
        duration,
      }
    })
  })
}

/**
 * Bulk delete records
 */
export async function bulkDeleteRecords(
  table: any,
  idColumn: any,
  ids: number[]
): Promise<BulkResult> {
  return measurePerformance('bulk_delete_records', async () => {
    const startTime = Date.now()

    structuredLogger.info(`Bulk deleting ${ids.length} records`, {
      operation: 'bulk_delete',
      count: ids.length,
    })

    try {
      const deletedCount = await dbBatchDelete(table, idColumn, ids)

      const duration = Date.now() - startTime

      structuredLogger.info(`Bulk delete completed`, {
        operation: 'bulk_delete',
        total: ids.length,
        deleted: deletedCount,
        duration,
      })

      return {
        total: ids.length,
        success: deletedCount,
        failed: ids.length - deletedCount,
        errors: [],
        duration,
      }
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      structuredLogger.error(`Bulk delete failed`, error, {
        operation: 'bulk_delete',
        count: ids.length,
        duration,
      })

      throw new DatabaseError(`Bulk delete failed: ${errorMessage}`)
    }
  })
}

/**
 * Bulk update with validation
 */
export async function bulkUpdateWithValidation<T>(
  table: any,
  idColumn: any,
  updates: Array<{ id: number; data: Partial<T> }>,
  validate?: (data: Partial<T>) => Promise<boolean>
): Promise<BulkResult> {
  return measurePerformance('bulk_update_with_validation', async () => {
    const startTime = Date.now()
    const errors: Array<{ id: any; error: string }> = []

    // Validate all updates first
    if (validate) {
      for (const update of updates) {
        try {
          const isValid = await validate(update.data)
          if (!isValid) {
            errors.push({
              id: update.id,
              error: 'Validation failed',
            })
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          errors.push({
            id: update.id,
            error: `Validation error: ${errorMessage}`,
          })
        }
      }
    }

    // Filter out failed validations
    const validUpdates = updates.filter(
      (update) => !errors.some((err) => err.id === update.id)
    )

    // Perform bulk update
    const result = await dbBatchUpdate(table, idColumn, validUpdates)

    const duration = Date.now() - startTime

    structuredLogger.info(`Bulk update with validation completed`, {
      operation: 'bulk_update_validation',
      total: updates.length,
      valid: validUpdates.length,
      invalid: errors.length,
      success: result.success,
      failed: result.failed,
      duration,
    })

    return {
      total: updates.length,
      success: result.success,
      failed: result.failed + errors.length,
      errors,
      duration,
    }
  })
}

/**
 * Chunk array for batch processing
 */
export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []

  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }

  return chunks
}

/**
 * Process array in batches with delay
 */
export async function processBatches<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>,
  delayMs: number = 0
): Promise<R[]> {
  const batches = chunkArray(items, batchSize)
  const results: R[] = []

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]

    structuredLogger.debug(`Processing batch ${i + 1}/${batches.length}`, {
      batch: i + 1,
      total: batches.length,
      size: batch.length,
    })

    const batchResults = await processor(batch)
    results.push(...batchResults)

    // Add delay between batches if specified
    if (delayMs > 0 && i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return results
}
