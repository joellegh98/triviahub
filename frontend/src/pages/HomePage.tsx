import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, fetchGlobalLeaderboard, fetchQuizzes } from '../api'

/**
 * Landing page. Displays summary statistics (total quizzes, questions, games played)
 * and quick-navigation buttons to the quiz browser and leaderboard.
 * Stats are loaded from the backend via {@link fetchQuizzes} and {@link fetchGlobalLeaderboard}.
 */
export function HomePage() {
  const [totalQuizzes, setTotalQuizzes] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(0)
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [quizList, leaderboard] = await Promise.all([
          fetchQuizzes(),
          fetchGlobalLeaderboard(),
        ])
        if (cancelled) {
          return
        }
        const questionSum = quizList.reduce(
          (sum, quiz) => sum + (quiz.questionCount ?? 0),
          0,
        )
        setTotalQuizzes(quizList.length)
        setTotalQuestions(questionSum)
        setTotalGamesPlayed(leaderboard.length)
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError ? err.message : 'Could not load home statistics.'
          setError(message)
          setTotalQuizzes(0)
          setTotalQuestions(0)
          setTotalGamesPlayed(0)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section>
      <div className="text-center mb-4">
        <h1 className="display-6 fw-semibold mb-2">Welcome to TriviaHub</h1>
        <p className="text-muted mb-0">
          Practice quizzes, track progress, and climb the leaderboard.
        </p>
      </div>

      {error && (
        <div className="alert alert-warning" role="status">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted text-center">Loading statistics…</p>
      ) : (
        <>
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
                  <p className="text-muted mb-2">Games on leaderboard</p>
                  <p className="display-6 fw-semibold mb-0">{totalGamesPlayed}</p>
                  <p className="small text-muted mb-0">Top global entries (up to 20)</p>
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
        </>
      )}
    </section>
  )
}
