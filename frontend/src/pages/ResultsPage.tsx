import { Link, useLocation, useParams } from 'react-router-dom'
import { gameResults, quizzes } from '../mockData.js'
import type { ResultsLocationState } from '../types'

/**
 * Computes a 0–100 score from game stats.
 * Accuracy contributes 80 points, time bonus up to 20 points (capped at 180 s),
 * and each hint costs 4 points.
 */
function computeScore({
  correctAnswers,
  totalQuestions,
  durationSec,
  hintsUsed,
}: {
  correctAnswers: number
  totalQuestions: number
  durationSec: number
  hintsUsed: number
}) {
  if (!totalQuestions || totalQuestions <= 0) {
    return 0
  }

  const accuracyRatio = correctAnswers / totalQuestions
  const accuracyPart = accuracyRatio * 80

  const maxDurationForBonus = 180
  const boundedDuration = Math.min(Math.max(durationSec, 0), maxDurationForBonus)
  const timePart = ((maxDurationForBonus - boundedDuration) / maxDurationForBonus) * 20

  const hintPenalty = hintsUsed * 4
  const rawScore = accuracyPart + timePart - hintPenalty

  return Math.max(0, Math.min(100, Math.round(rawScore)))
}

/**
 * Post-game results page. Reads game stats from React Router navigation state,
 * computes the player's score, and displays it alongside a per-quiz top-10 leaderboard.
 */
export function ResultsPage() {
  const { quizId } = useParams()
  const location = useLocation()
  const resultState = location.state as ResultsLocationState | null

  const selectedQuiz = quizzes.find((quiz) => quiz.id === quizId)

  const localRun =
    resultState && resultState.quizId === quizId
      ? {
          id: 'local-current-run',
          quizId,
          playerName: 'You',
          correctAnswers: resultState.correctAnswers,
          totalQuestions: resultState.totalQuestions,
          durationSec: resultState.durationSec,
          hintsUsed: resultState.hintsUsed,
          attempts: resultState.attempts,
          playedAt: new Date().toISOString(),
        }
      : null

  const currentScore = localRun ? computeScore(localRun) : null

  const quizLeaderboard = gameResults
    .filter((result) => result.quizId === quizId)
    .concat(
      localRun
        ? [
            {
              ...localRun,
              score: currentScore ?? 0,
            },
          ]
        : [],
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  return (
    <section>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
        <div>
          <h1 className="h2 mb-1">Results</h1>
          <p className="text-muted mb-0">
            {selectedQuiz ? selectedQuiz.title : 'Quiz'} - local Phase 1 summary
          </p>
        </div>
        <Link className="btn btn-outline-secondary" to="/quizzes">
          Back to quizzes
        </Link>
      </div>

      {!localRun ? (
        <div className="alert alert-warning" role="status">
          No game result found in navigation state. Start a quiz from the browser to
          see detailed results.
        </div>
      ) : (
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4">
            <div className="card h-100">
              <div className="card-body text-center">
                <p className="text-muted mb-2">Score</p>
                <p className="display-6 fw-semibold mb-0">{currentScore}</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card h-100">
              <div className="card-body text-center">
                <p className="text-muted mb-2">Correct answers</p>
                <p className="display-6 fw-semibold mb-0">
                  {localRun.correctAnswers}/{localRun.totalQuestions}
                </p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-4">
            <div className="card h-100">
              <div className="card-body text-center">
                <p className="text-muted mb-2">Duration</p>
                <p className="display-6 fw-semibold mb-0">{localRun.durationSec}s</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="card h-100">
              <div className="card-body text-center">
                <p className="text-muted mb-2">Hints used</p>
                <p className="h3 fw-semibold mb-0">{localRun.hintsUsed}</p>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6">
            <div className="card h-100">
              <div className="card-body text-center">
                <p className="text-muted mb-2">Attempts</p>
                <p className="h3 fw-semibold mb-0">{localRun.attempts}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <article className="card shadow-sm">
        <div className="card-body">
          <h2 className="h5 mb-3">Quiz leaderboard (Top 10)</h2>
          {quizLeaderboard.length === 0 ? (
            <p className="text-muted mb-0">No local results yet for this quiz.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle mb-0">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Player</th>
                    <th scope="col">Score</th>
                    <th scope="col">Correct</th>
                    <th scope="col">Time</th>
                    <th scope="col">Hints</th>
                  </tr>
                </thead>
                <tbody>
                  {quizLeaderboard.map((result, index) => (
                    <tr key={result.id}>
                      <th scope="row">{index + 1}</th>
                      <td>{result.playerName}</td>
                      <td>{result.score}</td>
                      <td>
                        {result.correctAnswers}/{result.totalQuestions}
                      </td>
                      <td>{result.durationSec}s</td>
                      <td>{result.hintsUsed}</td>
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
