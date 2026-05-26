import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { ErrorLocationState } from '../pages/ErrorPage'

type ErrorBoundaryProps = {
  children: ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

/**
 * Catches rendering errors and redirects to `/error` so the URL matches the
 * error page and the normal route (with Layout) is shown.
 */
class ErrorBoundaryInner extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI error caught by ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const state: ErrorLocationState = {
        title: 'Something went wrong',
        message:
          this.state.error?.message ??
          'An unexpected error occurred. You can return to the home page and try again.',
      }
      return <Navigate to="/error" replace state={state} />
    }
    return this.props.children
  }
}

/**
 * Remounts the error boundary when the route changes so recovery navigation
 * (e.g. "Back to home") renders the new page instead of staying on the error UI.
 */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return <ErrorBoundaryInner key={pathname}>{children}</ErrorBoundaryInner>
}
