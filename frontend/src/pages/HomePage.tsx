import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, fetchGlobalLeaderboard } from '../api'
import { useAppData } from '../context/AppDataContext'

/**
 * Landing page. Displays summary statistics (total quizzes, questions, games played)
 * and quick-navigation buttons. Quiz totals come from {@link useAppData}; leaderboard
 * length is loaded in {@code useEffect}.
 */
export function HomePage() {
  const { quizzes, loading: quizzesLoading } = useAppData()
  const [totalGamesPlayed, setTotalGamesPlayed] = useState(0)
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)

  const { totalQuizzes, totalQuestions } = useMemo(() => {
    const questionSum = quizzes.reduce(
      (sum, quiz) => sum + (quiz.questionCount ?? 0),
      0,
    )
    return {
      totalQuizzes: quizzes.length,
      totalQuestions: questionSum,
    }
  }, [quizzes])

  useEffect(() => {
    let cancelled = false

    async function loadLeaderboard() {
      setLeaderboardLoading(true)
      setLeaderboardError(null)
      try {
        const leaderboard = await fetchGlobalLeaderboard()
        if (!cancelled) {
          setTotalGamesPlayed(leaderboard.length)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : 'Could not load leaderboard count from the server.'
          setLeaderboardError(message)
          setTotalGamesPlayed(0)
        }
      } finally {
        if (!cancelled) {
          setLeaderboardLoading(false)
        }
      }
    }

    void loadLeaderboard()
    return () => {
      cancelled = true
    }
  }, [])

  const loading = quizzesLoading || leaderboardLoading

  return (
    <section>
      <div className="text-center mb-4">
        <h1 className="display-6 fw-semibold mb-2">Welcome to TriviaHub</h1>
        <p className="text-muted mb-0">
          Practice quizzes, track progress, and climb the leaderboard.
        </p>
      </div>

      {leaderboardError && (
        <div className="alert alert-secondary" role="status">
          {leaderboardError}
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
