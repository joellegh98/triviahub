import { Link } from 'react-router-dom'

/**
 * Catch-all 404 page rendered for any unrecognised route.
 */
export function NotFoundPage() {
  return (
    <section>
      <h1 className="h2 mb-3">Page not found</h1>
      <p className="text-muted">The page you requested does not exist.</p>
      <Link className="btn btn-outline-primary" to="/">
        Back to home
      </Link>
    </section>
  )
}
