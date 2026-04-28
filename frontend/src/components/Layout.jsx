import { NavLink, Outlet } from 'react-router-dom'

const getNavLinkClassName = ({ isActive }) =>
  `nav-link${isActive ? ' active' : ''}`

export function Layout() {
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
        <Outlet />
      </main>
    </div>
  )
}

