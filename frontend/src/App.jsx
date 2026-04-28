import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout.jsx'
import { AboutPage } from './pages/AboutPage.jsx'
import { AdminPage } from './pages/AdminPage.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { LeaderboardPage } from './pages/LeaderboardPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { PlayPage } from './pages/PlayPage.jsx'
import { QuizzesPage } from './pages/QuizzesPage.jsx'
import { ResultsPage } from './pages/ResultsPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/quizzes" element={<QuizzesPage />} />
          <Route path="/play/:quizId" element={<PlayPage />} />
          <Route path="/results/:quizId" element={<ResultsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
