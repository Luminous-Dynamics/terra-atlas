/**
 * Admin Data Export Utilities
 *
 * Utilities for exporting data in various formats (CSV, JSON).
 */

import { structuredLogger } from '../logging/structured-logger'
import { measurePerformance } from '../logging/performance-logger'

/**
 * Column configuration for exports
 */
export interface ColumnConfig {
  key: string
  header: string
  format?: (value: any) => string
}

/**
 * Export options
 */
export interface ExportOptions {
  filename?: string
  columns?: ColumnConfig[]
  pretty?: boolean
  dateFormat?: 'iso' | 'locale' | 'timestamp'
}

/**
 * Export result
 */
export interface ExportResult {
  content: string
  filename: string
  mimeType: string
  size: number
}

/**
 * Convert data to CSV format
 */
export function dataToCSV<T extends Record<string, any>>(
  data: T[],
  columns?: ColumnConfig[]
): string {
  if (data.length === 0) {
    return ''
  }

  // Determine columns
  const cols = columns || Object.keys(data[0]).map(key => ({ key, header: key }))

  // Build header row
  const headers = cols.map(col => escapeCSV(col.header)).join(',')

  // Build data rows
  const rows = data.map(row => {
    return cols.map(col => {
      const value = row[col.key]
      const formatted = col.format ? col.format(value) : formatValue(value)
      return escapeCSV(formatted)
    }).join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * Convert data to JSON format
 */
export function dataToJSON<T>(
  data: T[],
  options: { pretty?: boolean } = {}
): string {
  return JSON.stringify(data, null, options.pretty ? 2 : 0)
}

/**
 * Export data to CSV
 */
export async function exportToCSV<T extends Record<string, any>>(
  data: T[],
  options: ExportOptions = {}
): Promise<ExportResult> {
  return measurePerformance('export_to_csv', async () => {
    const { filename = 'export.csv', columns } = options

    const content = dataToCSV(data, columns)

    structuredLogger.info(`Exported ${data.length} records to CSV`, {
      operation: 'export_csv',
      records: data.length,
      size: content.length,
    })

    return {
      content,
      filename: ensureExtension(filename, '.csv'),
      mimeType: 'text/csv',
      size: content.length,
    }
  })
}

/**
 * Export data to JSON
 */
export async function exportToJSON<T>(
  data: T[],
  options: ExportOptions = {}
): Promise<ExportResult> {
  return measurePerformance('export_to_json', async () => {
    const { filename = 'export.json', pretty = false } = options

    const content = dataToJSON(data, { pretty })

    structuredLogger.info(`Exported ${data.length} records to JSON`, {
      operation: 'export_json',
      records: data.length,
      size: content.length,
    })

    return {
      content,
      filename: ensureExtension(filename, '.json'),
      mimeType: 'application/json',
      size: content.length,
    }
  })
}

/**
 * Stream export for large datasets
 * Returns an async generator that yields chunks
 */
export async function* streamExport<T extends Record<string, any>>(
  fetchData: (offset: number, limit: number) => Promise<T[]>,
  format: 'csv' | 'json',
  options: ExportOptions & { batchSize?: number } = {}
): AsyncGenerator<string, void, unknown> {
  const { batchSize = 1000, columns } = options

  let offset = 0
  let isFirstBatch = true
  let hasMore = true

  structuredLogger.info('Starting streaming export', {
    operation: 'stream_export',
    format,
    batchSize,
  })

  while (hasMore) {
    const batch = await fetchData(offset, batchSize)

    if (batch.length === 0) {
      hasMore = false
      break
    }

    if (format === 'csv') {
      if (isFirstBatch && columns) {
        // Yield headers for first batch
        const headers = columns.map(col => escapeCSV(col.header)).join(',')
        yield headers + '\n'
      }

      // Yield data rows
      const rows = dataToCSV(batch, columns)
      yield isFirstBatch ? rows : '\n' + rows
    } else if (format === 'json') {
      if (isFirstBatch) {
        yield '['
      }

      for (let i = 0; i < batch.length; i++) {
        const item = batch[i]
        const json = JSON.stringify(item)

        if (!isFirstBatch || i > 0) {
          yield ','
        }
        yield json
      }
    }

    offset += batch.length
    isFirstBatch = false
    hasMore = batch.length === batchSize

    structuredLogger.debug(`Streamed batch: ${offset} total records`, {
      offset,
      batchSize: batch.length,
    })
  }

  if (format === 'json') {
    yield ']'
  }

  structuredLogger.info(`Streaming export completed: ${offset} total records`, {
    operation: 'stream_export',
    totalRecords: offset,
  })
}

/**
 * Helper: Escape CSV value
 */
function escapeCSV(value: string): string {
  if (value == null) {
    return ''
  }

  const stringValue = String(value)

  // Escape if contains comma, quote, or newline
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Helper: Format value for export
 */
function formatValue(value: any): string {
  if (value == null) {
    return ''
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

/**
 * Helper: Ensure filename has correct extension
 */
function ensureExtension(filename: string, extension: string): string {
  if (filename.endsWith(extension)) {
    return filename
  }
  return filename + extension
}

/**
 * Pre-configured export functions for common entities
 */

// User export columns
const USER_COLUMNS: ColumnConfig[] = [
  { key: 'id', header: 'ID' },
  { key: 'email', header: 'Email' },
  { key: 'username', header: 'Username' },
  { key: 'created_at', header: 'Created At', format: (v) => new Date(v).toISOString() },
  { key: 'last_login', header: 'Last Login', format: (v) => v ? new Date(v).toISOString() : '' },
]

// Project export columns
const PROJECT_COLUMNS: ColumnConfig[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name' },
  { key: 'type', header: 'Type' },
  { key: 'status', header: 'Status' },
  { key: 'country', header: 'Country' },
  { key: 'capacity_mw', header: 'Capacity (MW)' },
  { key: 'irr', header: 'IRR (%)' },
  { key: 'created_at', header: 'Created At', format: (v) => new Date(v).toISOString() },
]

// Investment export columns
const INVESTMENT_COLUMNS: ColumnConfig[] = [
  { key: 'id', header: 'ID' },
  { key: 'user_id', header: 'User ID' },
  { key: 'project_id', header: 'Project ID' },
  { key: 'project_name', header: 'Project Name' },
  { key: 'amount', header: 'Amount' },
  { key: 'status', header: 'Status' },
  { key: 'investment_type', header: 'Type' },
  { key: 'created_at', header: 'Created At', format: (v) => new Date(v).toISOString() },
]

/**
 * Export users to CSV
 */
export async function exportUsers(
  users: any[],
  filename: string = 'users-export.csv'
): Promise<ExportResult> {
  return exportToCSV(users, {
    filename,
    columns: USER_COLUMNS,
  })
}

/**
 * Export projects to CSV
 */
export async function exportProjects(
  projects: any[],
  filename: string = 'projects-export.csv'
): Promise<ExportResult> {
  return exportToCSV(projects, {
    filename,
    columns: PROJECT_COLUMNS,
  })
}

/**
 * Export investments to CSV
 */
export async function exportInvestments(
  investments: any[],
  filename: string = 'investments-export.csv'
): Promise<ExportResult> {
  return exportToCSV(investments, {
    filename,
    columns: INVESTMENT_COLUMNS,
  })
}

/**
 * Create download response for browser
 */
export function createDownloadResponse(result: ExportResult): Response {
  return new Response(result.content, {
    headers: {
      'Content-Type': result.mimeType,
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Content-Length': result.size.toString(),
    },
  })
}
