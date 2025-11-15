/**
 * Tests for lib/utils.ts
 *
 * Testing all utility functions for formatting, validation, and helpers
 */

import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatCompactNumber,
  formatCapacity,
  formatRelativeTime,
  formatDate,
  truncate,
  capitalize,
  slugify,
  getInitials,
  groupBy,
  unique,
  sortBy,
  isEmpty,
  getIRRColor,
  getStatusColor,
  debounce,
  sleep,
} from '../../lib/utils'

describe('Number Formatting', () => {
  describe('formatCurrency', () => {
    it('should format basic numbers as currency', () => {
      expect(formatCurrency(1000)).toBe('$1,000')
      expect(formatCurrency(1234567)).toBe('$1,234,567')
    })

    it('should handle decimal places', () => {
      expect(formatCurrency(1000.5)).toBe('$1,001')
      expect(formatCurrency(1000.123)).toBe('$1,000')
    })

    it('should handle negative numbers', () => {
      expect(formatCurrency(-1000)).toBe('-$1,000')
    })

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('$0')
    })
  })

  describe('formatNumber', () => {
    it('should format numbers with default 0 decimals', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
    })

    it('should format numbers with custom decimals', () => {
      expect(formatNumber(1000.567, 2)).toBe('1,000.57')
      expect(formatNumber(1000, 2)).toBe('1,000.00')
    })
  })

  describe('formatPercentage', () => {
    it('should format percentages with default 1 decimal', () => {
      expect(formatPercentage(0.125)).toBe('12.5%')
      expect(formatPercentage(0.5)).toBe('50.0%')
    })

    it('should format percentages with custom decimals', () => {
      expect(formatPercentage(0.12345, 2)).toBe('12.35%')
      expect(formatPercentage(1, 0)).toBe('100%')
    })
  })

  describe('formatCompactNumber', () => {
    it('should format thousands', () => {
      expect(formatCompactNumber(1500)).toBe('1.5K')
      expect(formatCompactNumber(10000)).toBe('10K')
    })

    it('should format millions', () => {
      expect(formatCompactNumber(1500000)).toBe('1.5M')
      expect(formatCompactNumber(10000000)).toBe('10M')
    })

    it('should format billions', () => {
      expect(formatCompactNumber(1500000000)).toBe('1.5B')
      expect(formatCompactNumber(10000000000)).toBe('10B')
    })

    it('should handle small numbers', () => {
      expect(formatCompactNumber(500)).toBe('500')
      expect(formatCompactNumber(0)).toBe('0')
    })
  })

  describe('formatCapacity', () => {
    it('should format as MW for values < 1000', () => {
      expect(formatCapacity(500)).toBe('500 MW')
      expect(formatCapacity(999)).toBe('999 MW')
    })

    it('should format as GW for values >= 1000', () => {
      expect(formatCapacity(1000)).toBe('1 GW')
      expect(formatCapacity(1500)).toBe('1.5 GW')
      expect(formatCapacity(10000)).toBe('10 GW')
    })
  })
})

describe('Date Formatting', () => {
  describe('formatRelativeTime', () => {
    it('should format recent times', () => {
      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
      const result = formatRelativeTime(fiveMinutesAgo)
      expect(result).toMatch(/\d+ minutes? ago/)
    })

    it('should handle dates in the past', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const result = formatRelativeTime(yesterday)
      expect(result).toMatch(/(1 day ago|yesterday)/i)
    })
  })

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2025-01-15')
      const result = formatDate(date)
      expect(result).toMatch(/Jan|January/)
      expect(result).toContain('15')
      expect(result).toContain('2025')
    })

    it('should handle string dates', () => {
      const result = formatDate('2025-01-15')
      expect(result).toBeTruthy()
    })
  })
})

describe('String Utilities', () => {
  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...')
      expect(truncate('Test', 10)).toBe('Test')
    })

    it('should use custom suffix', () => {
      expect(truncate('Hello World', 5, '…')).toBe('Hello…')
    })
  })

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('WORLD')).toBe('WORLD')
    })

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('')
    })
  })

  describe('slugify', () => {
    it('should create URL-friendly slugs', () => {
      expect(slugify('Hello World')).toBe('hello-world')
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
    })

    it('should handle special characters', () => {
      expect(slugify('Hello, World!')).toBe('hello-world')
      expect(slugify('café-résumé')).toBe('caf-rsum')
    })
  })

  describe('getInitials', () => {
    it('should extract initials from names', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Mary Smith')).toBe('JM')
    })

    it('should handle single names', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should respect max length', () => {
      expect(getInitials('John Mary Jane Doe', 2)).toBe('JM')
    })
  })
})

describe('Array Utilities', () => {
  describe('groupBy', () => {
    it('should group objects by key', () => {
      const items = [
        { type: 'solar', name: 'A' },
        { type: 'wind', name: 'B' },
        { type: 'solar', name: 'C' },
      ]
      const result = groupBy(items, 'type')
      expect(result.solar).toHaveLength(2)
      expect(result.wind).toHaveLength(1)
    })
  })

  describe('unique', () => {
    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
      expect(unique(['a', 'b', 'a'])).toEqual(['a', 'b'])
    })
  })

  describe('sortBy', () => {
    it('should sort objects by key ascending', () => {
      const items = [
        { value: 3 },
        { value: 1 },
        { value: 2 },
      ]
      const result = sortBy(items, 'value', 'asc')
      expect(result[0].value).toBe(1)
      expect(result[2].value).toBe(3)
    })

    it('should sort objects by key descending', () => {
      const items = [
        { value: 1 },
        { value: 3 },
        { value: 2 },
      ]
      const result = sortBy(items, 'value', 'desc')
      expect(result[0].value).toBe(3)
      expect(result[2].value).toBe(1)
    })
  })
})

describe('Validation Utilities', () => {
  describe('isEmpty', () => {
    it('should detect empty values', () => {
      expect(isEmpty(null)).toBe(true)
      expect(isEmpty(undefined)).toBe(true)
      expect(isEmpty('')).toBe(true)
      expect(isEmpty('  ')).toBe(true)
      expect(isEmpty([])).toBe(true)
      expect(isEmpty({})).toBe(true)
    })

    it('should detect non-empty values', () => {
      expect(isEmpty('hello')).toBe(false)
      expect(isEmpty([1])).toBe(false)
      expect(isEmpty({ a: 1 })).toBe(false)
      expect(isEmpty(0)).toBe(false)
      expect(isEmpty(false)).toBe(false)
    })
  })
})

describe('Color Utilities', () => {
  describe('getIRRColor', () => {
    it('should return correct colors for IRR ranges', () => {
      expect(getIRRColor(20)).toBe('text-green-600')  // Excellent
      expect(getIRRColor(13)).toBe('text-emerald-600') // Good
      expect(getIRRColor(11)).toBe('text-yellow-600') // Fair
      expect(getIRRColor(5)).toBe('text-red-600')     // Poor
    })
  })

  describe('getStatusColor', () => {
    it('should return correct colors for statuses', () => {
      expect(getStatusColor('active')).toBe('text-green-600')
      expect(getStatusColor('pending')).toBe('text-yellow-600')
      expect(getStatusColor('failed')).toBe('text-red-600')
      expect(getStatusColor('unknown')).toBe('text-gray-600')
    })
  })
})

describe('Performance Utilities', () => {
  describe('debounce', () => {
    jest.useFakeTimers()

    it('should debounce function calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn()
      debouncedFn()
      debouncedFn()

      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(100)

      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    afterAll(() => {
      jest.useRealTimers()
    })
  })

  describe('sleep', () => {
    it('should delay execution', async () => {
      const start = Date.now()
      await sleep(100)
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(90) // Allow some margin
    })
  })
})
