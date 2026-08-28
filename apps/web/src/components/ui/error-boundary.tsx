"use client";

/**
 * Error Boundary Component
 * Catches React errors and displays user-friendly error UI with reporting
 */

import { AlertTriangle, Home, MessageSquare, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

// ============================================================================
// Types
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// ============================================================================
// Error Boundary Class Component
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Show user-friendly toast so the error isn't silent
    // Using a simple console fallback since toast may not be available here
    console.error("Error caught by boundary:", error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReportIssue = () => {
    const { error, errorInfo } = this.state;
    const errorDetails = {
      message: error?.message || "Unknown error",
      stack: error?.stack || "",
      componentStack: errorInfo?.componentStack || "",
      url: typeof window !== "undefined" ? window.location.href : "",
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    };

    // Create mailto link with error details
    const subject = encodeURIComponent(`Bug Report: ${error?.message || "Application Error"}`);
    const body = encodeURIComponent(
      "Hi Sahabat Kreator Team,\n\n" +
        "I encountered an error while using the application.\n\n" +
        "--- Error Details ---\n" +
        `Message: ${errorDetails.message}\n` +
        `URL: ${errorDetails.url}\n` +
        `Timestamp: ${errorDetails.timestamp}\n\n` +
        "--- Steps to Reproduce ---\n" +
        "[Please describe what you were doing when this error occurred]\n\n" +
        "--- Additional Context ---\n" +
        "[Any other relevant information]\n\n" +
        "--- Technical Details ---\n" +
        `${errorDetails.stack?.slice(0, 500)}`,
    );

    window.open(`mailto:support@sahabatkreator.id?subject=${subject}&body=${body}`, "_blank");
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-8">
          <div className="w-full max-w-md text-center">
            {/* Error Icon */}
            <div className="mb-6 flex justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--error-light)]">
                <AlertTriangle className="h-10 w-10 text-[var(--error)]" />
              </div>
            </div>

            {/* Error Message */}
            <h2 className="mb-2 font-semibold text-[var(--text-primary)] text-xl">
              Something went wrong
            </h2>
            <p className="mb-6 text-[var(--text-secondary)]">
              We&apos;re sorry, but something unexpected happened.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 max-h-40 overflow-auto rounded-lg bg-[var(--bg-tertiary)] p-4 text-left">
                <p className="font-mono text-[var(--error)] text-xs">{this.state.error.message}</p>
                {this.state.error.stack && (
                  <pre className="mt-2 whitespace-pre-wrap font-mono text-[var(--text-muted)] text-xs">
                    {this.state.error.stack.slice(0, 300)}...
                  </pre>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={this.handleRetry} className="btn-interactive">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button variant="secondary" onClick={() => (window.location.href = "/dashboard")}>
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
              <Button
                variant="ghost"
                onClick={this.handleReportIssue}
                className="text-[var(--accent-gold)]"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Report Issue
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Hook for Functional Components
// ============================================================================

/**
 * Wrapper component for easier use in functional components
 */
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallbackMessage?: string;
}

export function WithErrorBoundary({ children, fallbackMessage }: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      fallback={
        fallbackMessage ? (
          <div className="rounded-lg bg-[var(--error-light)] p-4 text-[var(--error)] text-sm">
            {fallbackMessage}
          </div>
        ) : undefined
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// ============================================================================
// Reset Error Boundary Context
// ============================================================================

import { createContext, useContext } from "react";

const ErrorBoundaryContext = createContext<{ reset: () => void } | null>(null);

export function useErrorBoundary() {
  const context = useContext(ErrorBoundaryContext);
  if (!context) {
    throw new Error("useErrorBoundary must be used within an ErrorBoundary");
  }
  return context;
}
