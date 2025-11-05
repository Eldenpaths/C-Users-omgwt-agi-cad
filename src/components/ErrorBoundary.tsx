'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking (Sentry, LogRocket, etc.)
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    try {
      // In production, this would send to an error tracking service
      console.log('Error logged to tracking service:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'unknown',
      });
    } catch (e) {
      console.error('Failed to log error:', e);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-gray-900/60 border border-red-500/30 rounded-xl p-8">
            {/* Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-amber-400 text-center mb-4">
              The FORGE Encountered an Error
            </h1>

            {/* Description */}
            <p className="text-gray-400 text-center mb-6">
              Something unexpected happened. This error has been logged and we'll investigate it.
            </p>

            {/* Error Details (dev mode only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 bg-gray-950/60 border border-gray-700 rounded-lg p-4 overflow-auto max-h-48">
                <p className="text-xs font-mono text-red-300 mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.error.stack && (
                  <pre className="text-xs text-gray-500 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Restart FORGE
              </button>

              <Link
                href="/"
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-amber-400 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Home className="w-4 h-4" />
                Go Home
              </Link>
            </div>

            {/* Help Text */}
            <p className="text-center text-gray-500 text-sm mt-6">
              If this problem persists, please contact support or check the{' '}
              <a
                href="https://github.com/anthropics/claude-code/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline"
              >
                issue tracker
              </a>
              .
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
