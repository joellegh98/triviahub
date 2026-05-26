import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { AppDataProvider } from './context/AppDataContext'
import { AboutPage } from './pages/AboutPage'
import { AdminPage } from './pages/AdminPage'
import { ErrorPage } from './pages/ErrorPage'
import { HomePage } from './pages/HomePage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PlayPage } from './pages/PlayPage'
import { QuizzesPage } from './pages/QuizzesPage'
import { ResultsPage } from './pages/ResultsPage'

/**
 * Root application component. Sets up client-side routing and renders the shared Layout
 * around all page routes. An ErrorBoundary wraps the whole tree so any uncaught
 * rendering error falls back to the default error page.
 */
function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <AppDataProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/quizzes" element={<QuizzesPage />} />
              <Route path="/play/:quizId" element={<PlayPage />} />
              <Route path="/results/:quizId" element={<ResultsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/error" element={<ErrorPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AppDataProvider>
      </AppErrorBoundary>
    </BrowserRouter>
  )
}

export default App
