import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, fetchQuiz, fetchRandomQuestionsForQuiz, type QuizListItem } from '../api'
import type { Question } from '../types'

/**
 * Interactive quiz play page.
 * Loads quiz metadata and shuffled questions from the API when {@code quizId} changes,
 * runs a stopwatch, tracks attempts and hints, and navigates to the results page
 * when the last question is answered.
 */
export function PlayPage() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<QuizListItem | null>(null)
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [revealedHintQuestionIds, setRevealedHintQuestionIds] = useState<
    Record<string, boolean>
  >({})
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [noQuestionsWarning, setNoQuestionsWarning] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const currentQuestion = quizQuestions[currentQuestionIndex]

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
    setCurrentQuestionIndex(0)
    setAttempts(0)
    setCorrectAnswers(0)
    setHintsUsed(0)
    setRevealedHintQuestionIds({})
    setElapsedSeconds(0)
    setSelectedIndex(null)
    setIsTransitioning(false)

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
  }, [quizId, navigate])

  useEffect(() => {
    if (quizQuestions.length === 0 || noQuestionsWarning) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((prevSeconds) => prevSeconds + 1)
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [noQuestionsWarning, quizQuestions.length])

  /**
   * Reveals the hint for the current question (once per question) and increments
   * the global hints-used counter.
   */
  const handleHintReveal = () => {
    if (!currentQuestion || revealedHintQuestionIds[currentQuestion.id]) {
      return
    }

    setRevealedHintQuestionIds((prev) => ({ ...prev, [currentQuestion.id]: true }))
    setHintsUsed((prev) => prev + 1)
  }

  /**
   * Advances to the next question, or navigates to the results page when the last
   * question has been answered.
   */
  const moveToNextQuestion = (nextAttempts: number, nextCorrectAnswers: number) => {
    setSelectedIndex(null)
    setIsTransitioning(false)

    if (currentQuestionIndex === quizQuestions.length - 1) {
      navigate(`/results/${quizId}`, {
        state: {
          quizId,
          attempts: nextAttempts,
          correctAnswers: nextCorrectAnswers,
          totalQuestions: quizQuestions.length,
          durationSec: elapsedSeconds,
          hintsUsed,
        },
      })
      return
    }

    setCurrentQuestionIndex((prevIndex) => prevIndex + 1)
  }

  /**
   * Handles a player clicking one of the answer option buttons.
   */
  const handleAnswerClick = (clickedIndex: number) => {
    if (!currentQuestion || isTransitioning) {
      return
    }

    const isCorrect = clickedIndex === currentQuestion.correctIndex
    const nextAttempts = attempts + 1
    const nextCorrectAnswers = isCorrect ? correctAnswers + 1 : correctAnswers

    setSelectedIndex(clickedIndex)
    setAttempts((prev) => prev + 1)
    if (isCorrect) {
      setCorrectAnswers((prev) => prev + 1)
    }

    setIsTransitioning(true)
    window.setTimeout(
      () => moveToNextQuestion(nextAttempts, nextCorrectAnswers),
      700,
    )
  }

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

  if (loading || !quiz || !currentQuestion) {
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
          <p className="text-muted mb-1">
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </p>
          <div
            className="progress"
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuenow={currentQuestionIndex + 1}
            aria-valuemin={1}
            aria-valuemax={quizQuestions.length}
            style={{ height: '8px', minWidth: '200px' }}
          >
            <div
              className="progress-bar"
              style={{
                width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%`,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={() => setShowQuitModal(true)}
        >
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
          <h2 className="h5 mb-3">{currentQuestion.text}</h2>
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
            disabled={revealedHintQuestionIds[currentQuestion.id]}
          >
            {revealedHintQuestionIds[currentQuestion.id]
              ? 'Hint already used for this question'
              : 'Show hint'}
          </button>

          {revealedHintQuestionIds[currentQuestion.id] && (
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
                    onClick={() => setShowQuitModal(false)}
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
                    onClick={() => setShowQuitModal(false)}
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
