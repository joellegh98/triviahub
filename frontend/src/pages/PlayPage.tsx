import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ApiError, fetchQuiz, fetchRandomQuestionsForQuiz, type QuizListItem } from '../api'
import { useAppData } from '../context/AppDataContext'
import { useGameEngine } from '../hooks/useGameEngine'
import type { PlayLocationState, QuizzesLocationState, Question, ResultsLocationState } from '../types'
import {
  getStoredPlayerName,
  isValidPlayerName,
  normalizePlayerName,
  setStoredPlayerName,
} from '../utils/playerName'

/**
 * Interactive quiz play page.
 * Loads quiz data from the API and delegates gameplay to {@link useGameEngine}.
 */
export function PlayPage() {
  const { quizId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { refreshQuizzes } = useAppData()
  const playState = location.state as PlayLocationState | null

  const [quiz, setQuiz] = useState<QuizListItem | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [noQuestionsWarning, setNoQuestionsWarning] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [playerNameInput, setPlayerNameInput] = useState(() =>
    normalizePlayerName(playState?.playerName ?? getStoredPlayerName()),
  )
  const [nameConfirmed, setNameConfirmed] = useState(() =>
    Boolean(playState?.playerName && isValidPlayerName(playState.playerName)),
  )

  useEffect(() => {
    const fromNav = playState?.playerName
    if (fromNav && isValidPlayerName(fromNav)) {
      const name = normalizePlayerName(fromNav)
      setPlayerNameInput(name)
      setStoredPlayerName(name)
      setNameConfirmed(true)
    }
  }, [playState?.playerName])

  const resolvedPlayerName = useMemo(
    () => (nameConfirmed ? normalizePlayerName(playerNameInput) : ''),
    [nameConfirmed, playerNameInput],
  )

  const handleConfirmName = useCallback(() => {
    if (!isValidPlayerName(playerNameInput)) {
      return
    }
    const name = normalizePlayerName(playerNameInput)
    setStoredPlayerName(name)
    setPlayerNameInput(name)
    setNameConfirmed(true)
  }, [playerNameInput])

  const handleGameComplete = useCallback(
    (result: ResultsLocationState) => {
      navigate(`/results/${result.quizId}`, { state: result })
    },
    [navigate],
  )

  const gameActive = Boolean(
    quiz &&
      quizQuestions.length > 0 &&
      !loading &&
      !noQuestionsWarning &&
      nameConfirmed &&
      resolvedPlayerName,
  )

  const {
    currentQuestion,
    progress,
    scorePreview,
    elapsedSeconds,
    attempts,
    hintsUsed,
    selectedIndex,
    isTransitioning,
    isHintRevealed,
    showQuitModal,
    handleAnswerClick,
    handleHintReveal,
    openQuitModal,
    closeQuitModal,
  } = useGameEngine({
    quizId,
    playerName: resolvedPlayerName,
    questions: quizQuestions,
    active: gameActive,
    onComplete: handleGameComplete,
  })

  useEffect(() => {
    if (!quizId) {
      return undefined
    }

    const id = quizId

    let cancelled = false
    let redirectTimer: number | undefined

    setLoading(true)
    setLoadError(null)
    setNoQuestionsWarning(false)
    setQuiz(null)
    setQuizQuestions([])

    async function load() {
      try {
        const [quizData, questionsData] = await Promise.all([
          fetchQuiz(id),
          fetchRandomQuestionsForQuiz(id),
        ])
        if (cancelled) {
          return
        }
        setQuiz(quizData)
        if (questionsData.length === 0) {
          setNoQuestionsWarning(true)
          redirectTimer = window.setTimeout(() => {
            navigate('/quizzes')
          }, 1800)
        } else {
          setQuizQuestions(questionsData)
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 404) {
            refreshQuizzes()
            const toastState: QuizzesLocationState = {
              toastMessage: playState?.fromQuizBrowser
                ? 'This quiz was deleted and is no longer available.'
                : 'This quiz is not available.',
            }
            navigate('/quizzes', { replace: true, state: toastState })
            return
          }
          const message =
            err instanceof ApiError ? err.message : 'Could not load this quiz from the server.'
          setLoadError(message)
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
      if (redirectTimer !== undefined) {
        window.clearTimeout(redirectTimer)
      }
    }
  }, [quizId, location.state, navigate, refreshQuizzes])

  if (loadError) {
    return (
      <section>
        <div className="alert alert-danger mb-0" role="status">
          {loadError}
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary mt-3"
          onClick={() => navigate('/quizzes')}
        >
          Back to quizzes
        </button>
      </section>
    )
  }

  if (noQuestionsWarning) {
    return (
      <section>
        <div className="alert alert-warning mb-0" role="status">
          This quiz has no questions yet. Returning to quiz browser...
        </div>
      </section>
    )
  }

  if (loading || !quiz) {
    return (
      <section>
        <p className="text-muted mb-0">Loading game...</p>
      </section>
    )
  }

  if (!nameConfirmed) {
    return (
      <section>
        <h1 className="h2 mb-3">{quiz.title}</h1>
        <article className="card shadow-sm" style={{ maxWidth: '28rem' }}>
          <div className="card-body">
            <h2 className="h5 mb-3">Enter your name</h2>
            <p className="text-muted small">
              Your name is shown on the leaderboard for this quiz.
            </p>
            <label htmlFor="playPlayerName" className="form-label">
              Your name
            </label>
            <input
              id="playPlayerName"
              type="text"
              className="form-control mb-3"
              placeholder="e.g. Noa, Joelle"
              value={playerNameInput}
              onChange={(event) => setPlayerNameInput(event.target.value)}
              maxLength={50}
              autoComplete="nickname"
            />
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-primary"
                disabled={!isValidPlayerName(playerNameInput)}
                onClick={handleConfirmName}
              >
                Start quiz
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/quizzes')}
              >
                Back
              </button>
            </div>
          </div>
        </article>
      </section>
    )
  }

  if (!currentQuestion) {
    return (
      <section>
        <p className="text-muted mb-0">Loading game...</p>
      </section>
    )
  }

  return (
    <section>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
        <div>
          <h1 className="h2 mb-1">{quiz.title}</h1>
          <p className="text-muted small mb-1">Playing as {resolvedPlayerName}</p>
          <p className="text-muted mb-1">
            Question {progress.current} of {progress.total}
          </p>
          <p className="text-muted small mb-1">Projected score: {scorePreview}</p>
          <div
            className="progress"
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuenow={progress.current}
            aria-valuemin={1}
            aria-valuemax={progress.total}
            style={{ height: '8px', minWidth: '200px' }}
          >
            <div
              className="progress-bar"
              style={{
                width: `${progress.percent}%`,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
        <button type="button" className="btn btn-outline-danger" onClick={openQuitModal}>
          Quit
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card">
            <div className="card-body">
              <p className="mb-1 text-muted">Stopwatch</p>
              <p className="h4 mb-0">{elapsedSeconds}s</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card">
            <div className="card-body">
              <p className="mb-1 text-muted">Attempts</p>
              <p className="h4 mb-0">{attempts}</p>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="card">
            <div className="card-body">
              <p className="mb-1 text-muted">Hints used</p>
              <p className="h4 mb-0">{hintsUsed}</p>
            </div>
          </div>
        </div>
      </div>

      <article className="card shadow-sm">
        <div className="card-body">
          <h2 className="h5 mb-2">{currentQuestion.text}</h2>
          <span className={`badge mb-3 ${
            currentQuestion.difficulty === 'hard' ? 'bg-danger' :
            currentQuestion.difficulty === 'medium' ? 'bg-warning text-dark' :
            'bg-success'
          }`}>
            {currentQuestion.difficulty}
          </span>
          <div className="d-grid gap-2 mb-3">
            {currentQuestion.options.map((option, index) => {
              let btnClass = 'btn btn-outline-primary text-start'
              if (selectedIndex !== null && index === selectedIndex) {
                btnClass =
                  index === currentQuestion.correctIndex
                    ? 'btn btn-success text-start'
                    : 'btn btn-danger text-start'
              }
              return (
                <button
                  key={`${currentQuestion.id}-${option}`}
                  type="button"
                  className={btnClass}
                  onClick={() => handleAnswerClick(index)}
                  disabled={isTransitioning}
                >
                  {option}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleHintReveal}
            disabled={isHintRevealed}
          >
            {isHintRevealed ? 'Hint already used for this question' : 'Show hint'}
          </button>

          {isHintRevealed && (
            <p className="mt-3 mb-0 text-muted">
              <strong>Hint:</strong> {currentQuestion.hint}
            </p>
          )}
        </div>
      </article>

      {showQuitModal && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title fs-5 mb-0">Quit game?</h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={closeQuitModal}
                  />
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    If you quit now, your progress will be lost and no result will be
                    saved.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeQuitModal}
                  >
                    Continue game
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => navigate('/quizzes')}
                  >
                    Quit to quizzes
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </section>
  )
}
