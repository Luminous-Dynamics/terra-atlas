'use client'

import React, { Component, ReactNode } from 'react'
import { logger } from '../lib/logger'
import { canRecover, getRecoveryAction } from '../lib/errors/error-recovery'
import { logError, getErrorMessage } from '../lib/errors/error-handler'
import { isTerraAtlasError } from '../lib/errors/error-types'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  onReset?: () => void
  maxRetries?: number
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  retryCount: number
  isRecovering: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  private resetTimeout?: NodeJS.Timeout

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      retryCount: 0,
      isRecovering: false,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Store error info in state
    this.setState({ errorInfo })

    // Log error using centralized error handler
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Attempt automatic recovery if possible
    this.attemptRecovery(error)
  }

  componentWillUnmount() {
    // Clear timeout on unmount
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout)
    }
  }

  attemptRecovery(error: Error) {
    // Check if error can be recovered
    if (!canRecover(error)) {
      logger.warn('Error cannot be recovered automatically')
      return
    }

    const recoveryAction = getRecoveryAction(error)

    // Handle retry recovery
    if (recoveryAction.type === 'retry') {
      const maxRetries = this.props.maxRetries ?? recoveryAction.maxRetries ?? 3

      if (this.state.retryCount < maxRetries) {
        this.setState({ isRecovering: true })

        const delay = recoveryAction.delay ?? 1000
        logger.info(`Attempting recovery in ${delay}ms (attempt ${this.state.retryCount + 1}/${maxRetries})`)

        this.resetTimeout = setTimeout(() => {
          this.handleReset()
        }, delay)
      } else {
        logger.warn('Max retry attempts exceeded')
      }
    }
  }

  handleReset = () => {
    // Clear timeout
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout)
      this.resetTimeout = undefined
    }

    // Increment retry count
    const newRetryCount = this.state.retryCount + 1

    // Reset error state
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: newRetryCount,
      isRecovering: false,
    })

    // Call custom reset handler if provided
    if (this.props.onReset) {
      this.props.onReset()
    }

    logger.info('Error boundary reset successfully')
  }

  handleManualReset = () => {
    // Reset without incrementing retry count for manual resets
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
      isRecovering: false,
    })

    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Show recovery message if recovering
      if (this.state.isRecovering) {
        return (
          <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-4">
            <div className="max-w-md w-full">
              <div className="bg-blue-900/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">🔄</div>
                <h1 className="text-2xl font-bold text-white mb-4">Recovering...</h1>
                <p className="text-gray-300 mb-6">
                  Attempting to recover from the error. Please wait...
                </p>
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            </div>
          </div>
        )
      }

      // Get user-friendly error message
      const errorMessage = getErrorMessage(this.state.error)
      const isRecoverable = canRecover(this.state.error)
      const isDevelopment = process.env.NODE_ENV === 'development'

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-red-900/20 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
              <p className="text-gray-300 mb-6">{errorMessage}</p>

              <div className="flex gap-3 justify-center">
                {isRecoverable && (
                  <button
                    onClick={this.handleManualReset}
                    className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
                >
                  Refresh Page
                </button>
              </div>

              {this.state.retryCount > 0 && (
                <p className="mt-4 text-sm text-gray-400">
                  Retry attempts: {this.state.retryCount}
                </p>
              )}

              {isDevelopment && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="text-gray-400 cursor-pointer hover:text-gray-300">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 text-xs space-y-2">
                    <div>
                      <p className="text-gray-500 font-semibold">Error Type:</p>
                      <p className="text-red-400">{this.state.error.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-semibold">Message:</p>
                      <p className="text-red-400">{this.state.error.message}</p>
                    </div>
                    {isTerraAtlasError(this.state.error) && (
                      <>
                        <div>
                          <p className="text-gray-500 font-semibold">Error Code:</p>
                          <p className="text-red-400">{this.state.error.code}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-semibold">Status Code:</p>
                          <p className="text-red-400">{this.state.error.statusCode}</p>
                        </div>
                        {this.state.error.context && (
                          <div>
                            <p className="text-gray-500 font-semibold">Context:</p>
                            <pre className="text-red-400 overflow-auto">
                              {JSON.stringify(this.state.error.context, null, 2)}
                            </pre>
                          </div>
                        )}
                      </>
                    )}
                    {this.state.error.stack && (
                      <div>
                        <p className="text-gray-500 font-semibold">Stack Trace:</p>
                        <pre className="text-red-400 overflow-auto max-h-48">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-gray-500 font-semibold">Component Stack:</p>
                        <pre className="text-red-400 overflow-auto max-h-48">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}