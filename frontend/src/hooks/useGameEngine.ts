import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import type { Question, ResultsLocationState } from '../types'
import { computeScore } from '../utils/computeScore'

const ANSWER_FEEDBACK_MS = 700

type GameEngineState = {
  questions: Question[]
  currentIndex: number
  attempts: number
  correctAnswers: number
  hintsUsed: number
  revealedHintIds: Record<string, boolean>
  elapsedSeconds: number
  selectedIndex: number | null
  isTransitioning: boolean
  showQuitModal: boolean
}

type GameEngineAction =
  | { type: 'RESET'; questions: Question[] }
  | { type: 'TICK' }
  | { type: 'ANSWER'; clickedIndex: number }
  | { type: 'ADVANCE' }
  | { type: 'REVEAL_HINT'; questionId: string }
  | { type: 'SET_QUIT_MODAL'; open: boolean }

const initialEngineState: GameEngineState = {
  questions: [],
  currentIndex: 0,
  attempts: 0,
  correctAnswers: 0,
  hintsUsed: 0,
  revealedHintIds: {},
  elapsedSeconds: 0,
  selectedIndex: null,
  isTransitioning: false,
  showQuitModal: false,
}

/**
 * Reducer for in-quiz gameplay (progress, answers, hints, stopwatch).
 */
function gameEngineReducer(
  state: GameEngineState,
  action: GameEngineAction,
): GameEngineState {
  switch (action.type) {
    case 'RESET':
      return {
        ...initialEngineState,
        questions: action.questions,
      }
    case 'TICK':
      return { ...state, elapsedSeconds: state.elapsedSeconds + 1 }
    case 'ANSWER': {
      const question = state.questions[state.currentIndex]
      if (!question || state.isTransitioning) {
        return state
      }
      const isCorrect = action.clickedIndex === question.correctIndex
      return {
        ...state,
        selectedIndex: action.clickedIndex,
        attempts: state.attempts + 1,
        correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0),
        isTransitioning: true,
      }
    }
    case 'ADVANCE':
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        selectedIndex: null,
        isTransitioning: false,
      }
    case 'REVEAL_HINT':
      if (state.revealedHintIds[action.questionId]) {
        return state
      }
      return {
        ...state,
        revealedHintIds: { ...state.revealedHintIds, [action.questionId]: true },
        hintsUsed: state.hintsUsed + 1,
      }
    case 'SET_QUIT_MODAL':
      return { ...state, showQuitModal: action.open }
    default:
      return state
  }
}

export type UseGameEngineOptions = {
  quizId: string | undefined
  playerName: string
  /** Shuffled questions from the API; when this list changes, the session resets. */
  questions: Question[]
  /** When false, the stopwatch does not run. */
  active: boolean
  /** Called when the last question is answered and the run is complete. */
  onComplete: (result: ResultsLocationState) => void
}

/**
 * Custom hook encapsulating the play-screen state machine via {@code useReducer}.
 * Exposes memoized progress/score preview and stable callbacks for UI handlers.
 */
export function useGameEngine({
  quizId,
  playerName,
  questions,
  active,
  onComplete,
}: UseGameEngineOptions) {
  const [state, dispatch] = useReducer(gameEngineReducer, initialEngineState)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    if (questions.length > 0) {
      dispatch({ type: 'RESET', questions })
    }
  }, [questions])

  useEffect(() => {
    if (!active || state.questions.length === 0) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      dispatch({ type: 'TICK' })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [active, state.questions.length])

  const currentQuestion = useMemo(
    () => state.questions[state.currentIndex] ?? null,
    [state.questions, state.currentIndex],
  )

  const totalQuestions = state.questions.length

  const progress = useMemo(() => {
    const current = totalQuestions > 0 ? state.currentIndex + 1 : 0
    const percent = totalQuestions > 0 ? (current / totalQuestions) * 100 : 0
    return { current, total: totalQuestions, percent }
  }, [state.currentIndex, totalQuestions])

  const scorePreview = useMemo(
    () =>
      computeScore({
        correctAnswers: state.correctAnswers,
        totalQuestions,
        durationSec: state.elapsedSeconds,
        hintsUsed: state.hintsUsed,
      }),
    [
      state.correctAnswers,
      totalQuestions,
      state.elapsedSeconds,
      state.hintsUsed,
    ],
  )

  const isHintRevealed = useMemo(
    () => (currentQuestion ? Boolean(state.revealedHintIds[currentQuestion.id]) : false),
    [currentQuestion, state.revealedHintIds],
  )

  /**
   * Records the selected answer, then advances or completes after a short feedback delay.
   */
  const handleAnswerClick = useCallback(
    (clickedIndex: number) => {
      const snapshot = stateRef.current
      const question = snapshot.questions[snapshot.currentIndex]
      if (!question || snapshot.isTransitioning || !quizId) {
        return
      }

      const isCorrect = clickedIndex === question.correctIndex
      const nextAttempts = snapshot.attempts + 1
      const nextCorrectAnswers =
        snapshot.correctAnswers + (isCorrect ? 1 : 0)
      const isLastQuestion = snapshot.currentIndex >= snapshot.questions.length - 1

      dispatch({ type: 'ANSWER', clickedIndex })

      window.setTimeout(() => {
        const latest = stateRef.current
        if (isLastQuestion) {
          onComplete({
            quizId,
            playerName,
            attempts: nextAttempts,
            correctAnswers: nextCorrectAnswers,
            totalQuestions: latest.questions.length,
            durationSec: latest.elapsedSeconds,
            hintsUsed: latest.hintsUsed,
          })
          return
        }
        dispatch({ type: 'ADVANCE' })
      }, ANSWER_FEEDBACK_MS)
    },
    [quizId, playerName, onComplete],
  )

  /**
   * Reveals the hint for the current question once per question.
   */
  const handleHintReveal = useCallback(() => {
    const question = stateRef.current.questions[stateRef.current.currentIndex]
    if (!question) {
      return
    }
    dispatch({ type: 'REVEAL_HINT', questionId: question.id })
  }, [])

  const openQuitModal = useCallback(() => {
    dispatch({ type: 'SET_QUIT_MODAL', open: true })
  }, [])

  const closeQuitModal = useCallback(() => {
    dispatch({ type: 'SET_QUIT_MODAL', open: false })
  }, [])

  return {
    currentQuestion,
    progress,
    scorePreview,
    elapsedSeconds: state.elapsedSeconds,
    attempts: state.attempts,
    correctAnswers: state.correctAnswers,
    hintsUsed: state.hintsUsed,
    selectedIndex: state.selectedIndex,
    isTransitioning: state.isTransitioning,
    isHintRevealed,
    showQuitModal: state.showQuitModal,
    handleAnswerClick,
    handleHintReveal,
    openQuitModal,
    closeQuitModal,
  }
}
