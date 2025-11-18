// Analytics utility for tracking user interactions
// This is a placeholder that can be connected to any analytics service

type EventProperties = Record<string, string | number | boolean | undefined>

interface AnalyticsEvent {
  name: string
  properties?: EventProperties
  timestamp: string
}

// Store events in memory (in production, send to analytics service)
const eventQueue: AnalyticsEvent[] = []

/**
 * Track an analytics event
 */
export function trackEvent(name: string, properties?: EventProperties): void {
  const event: AnalyticsEvent = {
    name,
    properties,
    timestamp: new Date().toISOString(),
  }

  eventQueue.push(event)

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', name, properties)
  }

  // In production, you would send to your analytics service:
  // - Google Analytics 4
  // - Mixpanel
  // - Amplitude
  // - PostHog
  // - etc.
}

/**
 * Track a page view
 */
export function trackPageView(path: string, title?: string): void {
  trackEvent('page_view', { path, title })
}

/**
 * Track a form submission
 */
export function trackFormSubmission(formName: string, success: boolean): void {
  trackEvent('form_submission', { form_name: formName, success })
}

/**
 * Track a button click
 */
export function trackClick(elementName: string, context?: string): void {
  trackEvent('click', { element: elementName, context })
}

/**
 * Track investment-related events
 */
export function trackInvestmentEvent(
  action: 'view' | 'start' | 'complete' | 'cancel',
  projectId: string,
  amount?: number
): void {
  trackEvent('investment', {
    action,
    project_id: projectId,
    amount,
  })
}

/**
 * Get all queued events (for debugging)
 */
export function getEventQueue(): AnalyticsEvent[] {
  return [...eventQueue]
}

/**
 * Clear the event queue
 */
export function clearEventQueue(): void {
  eventQueue.length = 0
}

export default {
  trackEvent,
  trackPageView,
  trackFormSubmission,
  trackClick,
  trackInvestmentEvent,
  getEventQueue,
  clearEventQueue,
}
