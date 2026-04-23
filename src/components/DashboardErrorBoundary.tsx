/**
 * DashboardErrorBoundary Component
 * 
 * Error boundary for the LeadsDashboard component.
 * Catches and displays errors gracefully with retry option.
 * 
 * Requirements: 10.1, 10.9
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * DashboardErrorBoundary Component
 * 
 * React error boundary that catches errors in the dashboard component tree.
 * Displays a user-friendly error message with retry option.
 * 
 * Usage:
 * ```tsx
 * <DashboardErrorBoundary>
 *   <LeadsDashboard />
 * </DashboardErrorBoundary>
 * ```
 */
export class DashboardErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to console for debugging
    console.error('Dashboard Error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo,
    });

    // Future: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = (): void => {
    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Call optional onReset callback
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
          <Card className="bg-[#1c1c1c] border-none rounded-2xl shadow-xl max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-red-500/10 p-4 rounded-full">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
              </div>
              <CardTitle className="text-white text-2xl font-semibold">
                Dashboard Error
              </CardTitle>
            </CardHeader>

            <CardContent className="text-center space-y-4">
              <p className="text-[#a3a3a3] text-base">
                We encountered an error while loading the dashboard. This might be a temporary issue.
              </p>

              {/* Show error message in development mode */}
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-[#2a2a2a] rounded-lg p-4 text-left">
                  <p className="text-red-400 text-sm font-mono break-words">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-[#a3a3a3] text-xs cursor-pointer hover:text-white">
                        Stack trace
                      </summary>
                      <pre className="text-[#a3a3a3] text-xs mt-2 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-lg font-medium transition-colors"
                aria-label="Retry loading dashboard"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg font-medium transition-colors"
                aria-label="Reload page"
              >
                Reload Page
              </button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
