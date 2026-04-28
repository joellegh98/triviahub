import { Link } from 'react-router-dom'
import { gameResults, questions, quizzes } from '../mockData.js'

export function HomePage() {
  const totalQuizzes = quizzes.length
  const totalQuestions = questions.length
  const totalGamesPlayed = gameResults.length

  return (
    <section>
      <div className="text-center mb-4">
        <h1 className="display-6 fw-semibold mb-2">Welcome to TriviaHub</h1>
        <p className="text-muted mb-0">
          Practice quizzes, track progress, and climb the leaderboard.
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <p className="text-muted mb-2">Total quizzes</p>
              <p className="display-6 fw-semibold mb-0">{totalQuizzes}</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <p className="text-muted mb-2">Total questions</p>
              <p className="display-6 fw-semibold mb-0">{totalQuestions}</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card h-100 shadow-sm">
            <div className="card-body text-center">
              <p className="text-muted mb-2">Games played</p>
              <p className="display-6 fw-semibold mb-0">{totalGamesPlayed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 justify-content-center flex-wrap">
        <Link className="btn btn-primary btn-lg" to="/quizzes">
          Browse Quizzes
        </Link>
        <Link className="btn btn-outline-secondary btn-lg" to="/leaderboard">
          View Leaderboard
        </Link>
      </div>
    </section>
  )
}
