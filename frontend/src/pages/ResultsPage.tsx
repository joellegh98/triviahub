import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ApiError, fetchQuiz, fetchQuizLeaderboard, saveGameResult } from '../api'
import { computeScore } from '../utils/computeScore'
import { isValidPlayerName, normalizePlayerName } from '../utils/playerName'
import type { GameResult, Quiz, ResultsLocationState } from '../types'

// In React Strict Mode (dev), effects run twice. The second run skips the save
// (sessionStorage guard) but must wait for the first run's save to finish before
// fetching the leaderboard, or the result won't appear yet.
let activeSavePromise: Promise<void> | null = null

/**
 * Post-game results page. Saves the run to the backend on mount, then loads the
 * quiz top-10 leaderboard. Local stats remain visible even if saving fails.
 */
export function ResultsPage() {
  const { quizId } = useParams()
  const location = useLocation()
  const resultState = location.state as ResultsLocationState | null

  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [apiLeaderboard, setApiLeaderboard] = useState<GameResult[]>([])
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const localRun = useMemo(() => {
    if (!resultState || !quizId || resultState.quizId !== quizId) {
      return null
    }
    return {
      playerName: normalizePlayerName(resultState.playerName),
      correctAnswers: resultState.correctAnswers,
      totalQuestions: resultState.totalQuestions,
      durationSec: resultState.durationSec,
      hintsUsed: resultState.hintsUsed,
      attempts: resultState.attempts,
    }
  }, [quizId, resultState])

  const currentScore = useMemo(() => {
    if (!localRun) {
      return null
    }
    return computeScore(localRun)
  }, [localRun])

  useEffect(() => {
    if (!quizId) {
      return undefined
    }

    const resolvedQuizId = quizId
    let cancelled = false

    async function loadQuiz() {
      setQuizError(null)
      try {
        const quiz = await fetchQuiz(resolvedQuizId)
        if (!cancelled) {
          setSelectedQuiz(quiz)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError ? err.message : 'Could not load quiz details from the server.'
          setQuizError(message)
          setSelectedQuiz(null)
        }
      }
    }

    void loadQuiz()
    return () => {
      cancelled = true
    }
  }, [quizId])

  /** Saves the current run on mount, then fetches the quiz leaderboard from the API. */
  useEffect(() => {
    if (!quizId || !localRun || currentScore === null || !isValidPlayerName(localRun.playerName)) {
      return undefined
    }

    const resolvedQuizId = quizId
    const run = localRun
    const score = currentScore
    const saveKey = [
      resolvedQuizId,
      run.playerName,
      score,
      run.correctAnswers,
      run.totalQuestions,
      run.durationSec,
      run.hintsUsed,
      run.attempts,
    ].join('|')
    const skipSave = sessionStorage.getItem('savedRunKey') === saveKey
    let cancelled = false
    const playedAt = new Date().toISOString()

    async function saveAndLoadLeaderboard() {
      setLeaderboardError(null)
      setLeaderboardLoading(true)

      if (!skipSave) {
        sessionStorage.setItem('savedRunKey', saveKey)
        setSaveError(null)
        let resolveSave!: () => void
        activeSavePromise = new Promise<void>((r) => { resolveSave = r })
        try {
          await saveGameResult({
            quizId: resolvedQuizId,
            playerName: run.playerName,
            score,
            correctAnswers: run.correctAnswers,
            totalQuestions: run.totalQuestions,
            durationSec: run.durationSec,
            hintsUsed: run.hintsUsed,
            playedAt,
          })
        } catch {
          sessionStorage.removeItem('savedRunKey')
          if (!cancelled) {
            setSaveError('Your result could not be saved.')
          }
        } finally {
          resolveSave()
          activeSavePromise = null
        }
      } else if (activeSavePromise) {
        await activeSavePromise
      }

      try {
        const rows = await fetchQuizLeaderboard(resolvedQuizId)
        if (!cancelled) {
          setApiLeaderboard(rows)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : 'Could not load leaderboard from the server.'
          setLeaderboardError(message)
          setApiLeaderboard([])
        }
      } finally {
        setLeaderboardLoading(false)
      }
    }

    void saveAndLoadLeaderboard()
    return () => {
      cancelled = true
    }
  }, [quizId, localRun, currentScore])

  /** Loads leaderboard only when there is no local run to save (e.g. direct navigation). */
  useEffect(() => {
    if (!quizId || localRun) {
      return undefined
    }

    const resolvedQuizId = quizId
    let cancelled = false

    async function loadLeaderboard() {
      setLeaderboardError(null)
      setLeaderboardLoading(true)
      try {
        const rows = await fetchQuizLeaderboard(resolvedQuizId)
        if (!cancelled) {
          setApiLeaderboard(rows)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : 'Could not load leaderboard from the server.'
          setLeaderboardError(message)
          setApiLeaderboard([])
        }
      } finally {
        setLeaderboardLoading(false)
      }
    }

    void loadLeaderboard()
    return () => {
      cancelled = true
    }
  }, [quizId, localRun])

  return (
    <section>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">
        <div>
          <h1 className="h2 mb-1">Results</h1>
          <p className="text-muted mb-0">
            {quizError
              ? 'Quiz'
              : selectedQuiz
                ? selectedQuiz.title
                : 'Quiz'}{' '}
            — summary
          </p>
        </div>
        <Link className="btn btn-outline-secondary" to="/quizzes">
          Back to quizzes
        </Link>
      </div>

      {quizError && (
        <div className="alert alert-warning mb-3" role="status">
          {quizError}
        </div>
      )}

      {saveError && (
        <div className="alert alert-warning mb-3" role="alert">
          {saveError}
        </div>
      )}

      {localRun && !isValidPlayerName(localRun.playerName) && (
        <div className="alert alert-warning mb-3" role="alert">
          Player name is missing; your result could not be saved to the leaderboard.
        </div>
      )}

      {!localRun ? (
        <div className="alert alert-warning" role="status">
          No game result found in navigation state. Start a quiz from the browser to
          see detailed results.
        </div>
      ) : (
        <>
          <p className="text-muted mb-3">
            Player: <strong>{localRun.playerName}</strong>
          </p>
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
        </>
      )}

      <article className="card shadow-sm">
        <div className="card-body">
          <h2 className="h5 mb-3">Quiz leaderboard (Top 10)</h2>
          {leaderboardError && (
            <div className="alert alert-secondary mb-3" role="status">
              {leaderboardError}
            </div>
          )}
          {leaderboardLoading ? (
            <p className="text-muted mb-0">Loading leaderboard…</p>
          ) : apiLeaderboard.length === 0 ? (
            <p className="text-muted mb-0">No results yet for this quiz.</p>
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
                  {apiLeaderboard.map((result, index) => (
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
