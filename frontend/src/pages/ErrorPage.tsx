import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Shape of optional state that callers can pass via `navigate('/error', { state })`
 * to customise the message shown on the error page.
 */
export type ErrorLocationState = {
  title?: string
  message?: string
}

/**
 * Default error page shown when something goes wrong.
 * Renders a friendly message and a button that takes the user back to the home page.
 *
 * Can be reached either:
 *   - Automatically by the {@link ErrorBoundary} when a rendering error is thrown.
 *   - Manually via `navigate('/error', { state: { title, message } })`.
 */
export function ErrorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as ErrorLocationState | null) ?? null

  const title = state?.title ?? 'Something went wrong'
  const message =
    state?.message ??
    'An unexpected error occurred. You can return to the home page and try again.'

  return (
    <section className="text-center">
      <div className="card shadow-sm mx-auto" style={{ maxWidth: '32rem' }}>
        <div className="card-body">
          <h1 className="h2 mb-3 text-danger">{title}</h1>
          <p className="text-muted mb-4">{message}</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/', { replace: true })}
          >
            Back to home
          </button>
        </div>
      </div>
    </section>
  )
}
