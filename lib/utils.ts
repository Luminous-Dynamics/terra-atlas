/**
 * Terra Atlas Shared Utilities
 *
 * Common utility functions used throughout the application
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// ============================================================================
// Tailwind CSS Utilities
// ============================================================================

/**
 * Merge Tailwind CSS classes (existing utility)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Format number as currency (USD)
 */
export function formatCurrency(amount: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  }).format(amount)
}

/**
 * Format number with commas (e.g., 1,234,567)
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

/**
 * Format number as percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return num.toString()
}

/**
 * Format capacity in MW or GW
 */
export function formatCapacity(mw: number): string {
  if (mw >= 1000) {
    return `${(mw / 1000).toFixed(2)} GW`
  }
  return `${mw.toFixed(2)} MW`
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`
  if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`
  return `${Math.floor(seconds / 31536000)} years ago`
}

/**
 * Format date as readable string
 */
export function formatDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }).format(d)
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Truncate string to max length
 */
export function truncate(str: string, maxLength: number = 100, suffix: string = '...'): string {
  if (str.length <= maxLength) return str
  return str.substring(0, maxLength - suffix.length) + suffix
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Convert to slug (URL-friendly string)
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Generate initials from name
 */
export function getInitials(name: string, maxLength: number = 2): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, maxLength)
}

// ============================================================================
// Array Utilities
// ============================================================================

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const group = String(item[key])
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Remove duplicates from array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

/**
 * Sort array by key
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Get color based on IRR value
 */
export function getIRRColor(irr: number): string {
  if (irr >= 15) return 'text-green-500'
  if (irr >= 12) return 'text-emerald-500'
  if (irr >= 10) return 'text-yellow-500'
  if (irr >= 8) return 'text-orange-500'
  return 'text-red-500'
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    planning: 'text-blue-500',
    funding: 'text-yellow-500',
    construction: 'text-orange-500',
    operational: 'text-green-500',
    completed: 'text-emerald-500',
    cancelled: 'text-red-500'
  }
  return statusColors[status.toLowerCase()] || 'text-gray-500'
}

// ============================================================================
// Storage Utilities
// ============================================================================

/**
 * Safe localStorage access
 */
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  },

  set(key: string, value: any): void {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to remove from localStorage:', error)
    }
  }
}

// ============================================================================
// Debounce & Throttle
// ============================================================================

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Sleep/delay function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
