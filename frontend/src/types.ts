export interface Quiz {
  id: string
  title: string
  category: string
  description: string
  /** Present when returned from list/detail quiz API. */
  questionCount?: number
}

export interface Question {
  id: string
  quizId: string
  text: string
  options: [string, string, string, string]
  correctIndex: number
  hint: string
}

export interface GameResult {
  id: string
  quizId: string
  playerName: string
  score: number
  correctAnswers: number
  totalQuestions: number
  durationSec: number
  hintsUsed: number
  playedAt: string
}

export interface ResultsLocationState {
  quizId: string
  attempts: number
  correctAnswers: number
  totalQuestions: number
  durationSec: number
  hintsUsed: number
}
