import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { questions, quizzes } from '../mockData.js'

/**
 * Returns a new array with the same elements in a random (Fisher-Yates) order.
 * The original array is not mutated.
 * @template T
 * @param {T[]} items
 * @returns {T[]}
 */
function shuffleArray(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/**
 * Interactive quiz play page.
 * Loads questions for the quiz identified by the `:quizId` URL param, shuffles them,
 * runs a stopwatch, tracks attempts and hints, and navigates to the results page
 * when the last question is answered.
 * @returns {JSX.Element}
 */
export function PlayPage() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [quizQuestions, setQuizQuestions] = useState([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [revealedHintQuestionIds, setRevealedHintQuestionIds] = useState({})
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [noQuestionsWarning, setNoQuestionsWarning] = useState(false)

  const quiz = useMemo(
    () => quizzes.find((item) => item.id === quizId),
    [quizId],
  )

  const currentQuestion = quizQuestions[currentQuestionIndex]

  useEffect(() => {
    const selectedQuizQuestions = questions.filter(
      (question) => question.quizId === quizId,
    )

    if (selectedQuizQuestions.length === 0) {
      setNoQuestionsWarning(true)
      const redirectTimer = window.setTimeout(() => {
        navigate('/quizzes')
      }, 1800)

      return () => window.clearTimeout(redirectTimer)
    }

    setQuizQuestions(shuffleArray(selectedQuizQuestions))
    return undefined
  }, [navigate, quizId])

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
   * @param {number} nextAttempts - Updated total attempts count after current answer.
   * @param {number} nextCorrectAnswers - Updated correct-answers count after current answer.
   */
  const moveToNextQuestion = (nextAttempts, nextCorrectAnswers) => {
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
   * Colours the button green/red, updates counters, and schedules the transition
   * to the next question after a short delay.
   * @param {number} clickedIndex - Zero-based index of the option the player selected.
   */
  const handleAnswerClick = (clickedIndex) => {
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

  if (noQuestionsWarning) {
    return (
      <section>
        <div className="alert alert-warning mb-0" role="status">
          This quiz has no questions yet. Returning to quiz browser...
        </div>
      </section>
    )
  }

  if (!quiz || !currentQuestion) {
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
            tabIndex="-1"
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
