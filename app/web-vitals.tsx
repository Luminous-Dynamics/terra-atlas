'use client'

/**
 * Web Vitals Performance Tracking
 *
 * Tracks Core Web Vitals and sends them to analytics
 * https://nextjs.org/docs/app/building-your-application/optimizing/analytics
 */

import { useReportWebVitals } from 'next/web-vitals'
import { logger } from '../lib/logger'
import { MONITORING } from '../lib/config'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Only track in production or when explicitly enabled
    if (!MONITORING.performance.enableWebVitals) {
      return
    }

    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Web Vitals:', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
        delta: metric.delta,
        id: metric.id,
      })
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      // Send to Google Analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_category: 'Web Vitals',
          event_label: metric.id,
          non_interaction: true,
        })
      }

      // Send to Vercel Analytics
      if (typeof window !== 'undefined' && (window as any).va) {
        ;(window as any).va('event', {
          name: metric.name,
          data: {
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
          },
        })
      }

      // Send to custom analytics endpoint (optional)
      // Uncomment if you want to store Web Vitals in your own database
      /*
      fetch('/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
        }),
      }).catch((error) => {
        logger.error('Failed to send Web Vitals to analytics:', error)
      })
      */
    }

    // Log poor performance in production
    if (process.env.NODE_ENV === 'production' && metric.rating === 'poor') {
      logger.warn('Poor Web Vital detected:', {
        name: metric.name,
        value: metric.value,
        id: metric.id,
      })
    }
  })

  return null
}
