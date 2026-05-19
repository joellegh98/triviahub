import { useEffect, useMemo, useState } from 'react'
import { ApiError, fetchGlobalLeaderboard, fetchQuizzes, type QuizListItem } from '../api'
import type { GameResult } from '../types'

type LeaderboardSort = 'score' | 'date' | 'player'

/**
 * Global leaderboard page. Shows the top 20 game results across all quizzes,
 * sortable by score, date, or player name. Data is loaded from the API on mount.
 */
export function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<LeaderboardSort>('score')
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([])
  const [gameResults, setGameResults] = useState<GameResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [quizList, results] = await Promise.all([
          fetchQuizzes(),
          fetchGlobalLeaderboard(),
        ])
        if (!cancelled) {
          setQuizzes(quizList)
          setGameResults(results)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : 'Could not load leaderboard data from the server.'
          setError(message)
          setQuizzes([])
          setGameResults([])
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

  const quizTitleById = useMemo(
    () =>
      quizzes.reduce<Record<string, string>>((acc, quiz) => {
        acc[quiz.id] = quiz.title
        return acc
      }, {}),
    [quizzes],
  )

  const topResults = useMemo(() => {
    const copy = [...gameResults]

    copy.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
      }

      if (sortBy === 'player') {
        return a.playerName.localeCompare(b.playerName)
      }

      return b.score - a.score
    })

    return copy.slice(0, 20)
  }, [gameResults, sortBy])

  return (
    <section>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">Global Leaderboard</h1>
          <p className="text-muted mb-0">Top 20 results across all quizzes.</p>
        </div>

        <div>
          <label htmlFor="leaderboardSort" className="form-label mb-1">
            Sort by
          </label>
          <select
            id="leaderboardSort"
            className="form-select"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as LeaderboardSort)}
          >
            <option value="score">Score</option>
            <option value="date">Date</option>
            <option value="player">Player name</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning mb-3" role="status">
          {error}
        </div>
      )}

      <article className="card shadow-sm">
        <div className="card-body">
          {loading ? (
            <p className="text-muted mb-0">Loading leaderboard…</p>
          ) : topResults.length === 0 ? (
            <p className="text-muted mb-0">No results available yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Player</th>
                    <th scope="col">Quiz</th>
                    <th scope="col">Score</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {topResults.map((result, index) => (
                    <tr key={result.id}>
                      <th scope="row">{index + 1}</th>
                      <td>{result.playerName}</td>
                      <td>{quizTitleById[result.quizId] || result.quizId}</td>
                      <td>{result.score}</td>
                      <td>{new Date(result.playedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </article>
    </section>
  )
}
