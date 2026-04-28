import { useMemo, useState } from 'react'
import { gameResults, quizzes } from '../mockData.js'

export function LeaderboardPage() {
  const [sortBy, setSortBy] = useState('score')

  const quizTitleById = useMemo(
    () =>
      quizzes.reduce((acc, quiz) => {
        acc[quiz.id] = quiz.title
        return acc
      }, {}),
    [],
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
  }, [sortBy])

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
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value="score">Score</option>
            <option value="date">Date</option>
            <option value="player">Player name</option>
          </select>
        </div>
      </div>

      <article className="card shadow-sm">
        <div className="card-body">
          {topResults.length === 0 ? (
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
