import { useEffect, useMemo, useState } from 'react'
import { ApiError, fetchGlobalLeaderboard } from '../api'
import { useAppData } from '../context/AppDataContext'
import type { GameResult } from '../types'

type LeaderboardSort = 'score' | 'date' | 'player'

/**
 * Global leaderboard page. Quiz titles come from {@link useAppData}; result rows are
 * loaded from the API in {@code useEffect}.
 */
export function LeaderboardPage() {
  const [sortBy, setSortBy] = useState<LeaderboardSort>('score')
  const { quizzes, loading: quizzesLoading } = useAppData()
  const [gameResults, setGameResults] = useState<GameResult[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLeaderboardLoading(true)
      setLeaderboardError(null)
      try {
        const results = await fetchGlobalLeaderboard()
        if (!cancelled) {
          setGameResults(results)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : 'Could not load leaderboard data from the server.'
          setLeaderboardError(message)
          setGameResults([])
        }
      } finally {
        if (!cancelled) {
          setLeaderboardLoading(false)
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

  const loading = quizzesLoading || leaderboardLoading

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

      {leaderboardError && (
        <div className="alert alert-warning mb-3" role="status">
          {leaderboardError}
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
