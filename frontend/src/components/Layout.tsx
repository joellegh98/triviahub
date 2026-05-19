import { NavLink, Outlet } from 'react-router-dom'
import { useAppData } from '../context/AppDataContext'

/**
 * Returns the Bootstrap nav-link class string, appending 'active' when the link
 * matches the current route.
 */
const getNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `nav-link${isActive ? ' active' : ''}`

/**
 * Shared page shell: top navigation bar and a centred main content area.
 * Child routes are rendered via React Router's <Outlet>.
 */
export function Layout() {
  const { error, serverUnavailable, dismissError, refreshQuizzes } = useAppData()

  return (
    <div className="min-vh-100 d-flex flex-column">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <NavLink className="navbar-brand fw-semibold" to="/">
            TriviaHub
          </NavLink>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <NavLink className={getNavLinkClassName} to="/" end>
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={getNavLinkClassName} to="/quizzes">
                  Quizzes
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={getNavLinkClassName} to="/leaderboard">
                  Leaderboard
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={getNavLinkClassName} to="/admin">
                  Admin
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className={getNavLinkClassName} to="/about">
                  About
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="container py-4 flex-grow-1">
        {error ? (
          <div
            className="alert alert-danger alert-dismissible shadow-sm mb-4"
            role="alert"
          >
            <strong>
              {serverUnavailable ? 'Server unavailable.' : 'Could not refresh quiz data.'}
            </strong>{' '}
            {serverUnavailable
              ? 'Quiz data could not be loaded. Play is disabled until the connection is restored.'
              : error}
            <div className="mt-2 d-flex gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => refreshQuizzes()}
              >
                Retry
              </button>
            </div>
            <button
              type="button"
              className="btn-close"
              aria-label="Dismiss"
              onClick={dismissError}
            />
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  )
}
