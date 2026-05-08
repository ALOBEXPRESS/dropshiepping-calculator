/**
 * LeadsTableErrorBoundary Component
 * 
 * Error boundary specifically for the LeadsTable component.
 * Catches and displays errors gracefully with retry option.
 * 
 * Requirements: 1.7, 6.9, 7.7, 8.6
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
 * LeadsTableErrorBoundary Component
 * 
 * React error boundary that catches errors in the LeadsTable component tree.
 * Displays a user-friendly error message with retry option.
 * 
 * Usage:
 * ```tsx
 * <LeadsTableErrorBoundary>
 *   <LeadsTable />
 * </LeadsTableErrorBoundary>
 * ```
 */
export class LeadsTableErrorBoundary extends Component<Props, State> {
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
    console.error('LeadsTable Error:', error, errorInfo);
    
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
        <Card className="bg-white dark:bg-[#1c1c1c] border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <div className="bg-red-500/10 p-3 rounded-full">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
            <CardTitle className="text-gray-900 dark:text-white text-xl font-semibold">
              Erro ao Carregar Tabela de Leads
            </CardTitle>
          </CardHeader>

          <CardContent className="text-center space-y-3 pb-4">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Encontramos um erro ao carregar a tabela de leads. Isso pode ser um problema temporário.
            </p>

            {/* Show error message in development mode */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-gray-100 dark:bg-[#2a2a2a] rounded-lg p-3 text-left">
                <p className="text-red-600 dark:text-red-400 text-xs font-mono break-words">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-gray-600 dark:text-gray-400 text-xs cursor-pointer hover:text-gray-900 dark:hover:text-white">
                      Stack trace
                    </summary>
                    <pre className="text-gray-600 dark:text-gray-400 text-xs mt-2 overflow-auto max-h-32">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
            <Button
              onClick={this.handleReset}
              className="flex items-center justify-center gap-2"
              aria-label="Tentar novamente"
            >
              <RefreshCw className="w-4 h-4" />
              Tentar Novamente
            </Button>
            
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              aria-label="Recarregar página"
            >
              Recarregar Página
            </Button>
          </CardFooter>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default LeadsTableErrorBoundary;
