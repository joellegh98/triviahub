import type { GameResult, Question, Quiz } from './types'

const API_BASE = '/api'

/**
 * Thrown when the backend returns a non-2xx response.
 */
export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

export type QuizListItem = Quiz & { questionCount: number }

type ErrorBody = { message?: string; errors?: Record<string, string> }

function isJsonContentType(res: Response): boolean {
  const contentType = res.headers.get('content-type')?.toLowerCase() ?? ''
  return contentType.includes('application/json') || contentType.includes('+json')
}

async function parseJsonBody(res: Response): Promise<unknown> {
  const text = await res.text()
  if (!text) {
    return null
  }
  return JSON.parse(text) as unknown
}

async function parseErrorBody(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => '')
  if (!text) {
    return null
  }
  if (isJsonContentType(res)) {
    try {
      return JSON.parse(text) as unknown
    } catch {
      return text
    }
  }
  return text
}

function getErrorMessage(status: number, body: unknown): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const msg = (body as ErrorBody).message
    if (typeof msg === 'string' && msg.length > 0) {
      return msg
    }
  }
  return `Request failed (${status})`
}

/**
 * Performs a JSON request and returns parsed JSON on success.
 * Throws ApiError if the response is not OK or the success body is not JSON
 * (e.g. an HTML fallback page from a proxy / dev server).
 */
async function requestJson<T>(
  path: string,
  init?: RequestInit & { parseJson?: boolean },
): Promise<T> {
  const { parseJson: shouldParse = true, ...fetchInit } = init ?? {}
  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchInit,
    headers: {
      Accept: 'application/json',
      ...fetchInit.headers,
    },
  })

  if (!res.ok) {
    const errBody = await parseErrorBody(res)
    throw new ApiError(getErrorMessage(res.status, errBody), res.status, errBody)
  }

  if (res.status === 204 || !shouldParse) {
    return undefined as T
  }

  if (!isJsonContentType(res)) {
    const previewText = await res.text().catch(() => '')
    const contentType = res.headers.get('content-type') ?? 'unknown'
    throw new ApiError(
      `Expected JSON response from ${path} but received '${contentType}'.`,
      res.status,
      previewText,
    )
  }

  try {
    return (await parseJsonBody(res)) as T
  } catch {
    throw new ApiError(
      `Server returned malformed JSON for ${path}.`,
      res.status,
      null,
    )
  }
}

/**
 * GET /quizzes — all quizzes with question counts.
 */
export async function fetchQuizzes(): Promise<QuizListItem[]> {
  return requestJson<QuizListItem[]>('/quizzes')
}

/**
 * GET /quizzes/:id — single quiz with question count.
 */
export async function fetchQuiz(quizId: string): Promise<QuizListItem> {
  return requestJson<QuizListItem>(`/quizzes/${encodeURIComponent(quizId)}`)
}

/**
 * POST /quizzes — create quiz.
 */
export async function createQuiz(payload: {
  title: string
  category: string
  description: string
}): Promise<QuizListItem> {
  return requestJson<QuizListItem>('/quizzes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/**
 * PUT /quizzes/:id — update quiz.
 */
export async function updateQuiz(
  quizId: string,
  payload: {
    title: string
    category: string
    description: string
  },
): Promise<QuizListItem> {
  return requestJson<QuizListItem>(`/quizzes/${encodeURIComponent(quizId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/**
 * DELETE /quizzes/:id — delete quiz and its questions.
 */
export async function deleteQuiz(quizId: string): Promise<void> {
  await requestJson<null>(`/quizzes/${encodeURIComponent(quizId)}`, {
    method: 'DELETE',
  })
}

/**
 * GET /quizzes/:quizId/questions — ordered questions for a quiz.
 */
export async function fetchQuestionsForQuiz(quizId: string): Promise<Question[]> {
  return requestJson<Question[]>(
    `/quizzes/${encodeURIComponent(quizId)}/questions`,
  )
}

/**
 * GET /quizzes/:quizId/questions/random — shuffled questions for gameplay.
 */
export async function fetchRandomQuestionsForQuiz(quizId: string): Promise<Question[]> {
  return requestJson<Question[]>(
    `/quizzes/${encodeURIComponent(quizId)}/questions/random`,
  )
}

/**
 * POST /quizzes/:quizId/questions — add question.
 */
export async function createQuestion(
  quizId: string,
  payload: {
    text: string
    options: string[]
    correctIndex: number
    hint: string
    difficulty: string
  },
): Promise<Question> {
  return requestJson<Question>(
    `/quizzes/${encodeURIComponent(quizId)}/questions`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
}

/**
 * PUT /questions/:id — update question.
 */
export async function updateQuestion(
  questionId: string,
  payload: {
    text: string
    options: string[]
    correctIndex: number
    hint: string
    difficulty: string
  },
): Promise<Question> {
  return requestJson<Question>(`/questions/${encodeURIComponent(questionId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/**
 * DELETE /questions/:id — delete question.
 */
export async function deleteQuestion(questionId: string): Promise<void> {
  await requestJson<null>(`/questions/${encodeURIComponent(questionId)}`, {
    method: 'DELETE',
  })
}

/**
 * GET /leaderboard — global top results.
 */
export async function fetchGlobalLeaderboard(): Promise<GameResult[]> {
  return requestJson<GameResult[]>('/leaderboard')
}

/**
 * GET /quizzes/:quizId/leaderboard — top results for one quiz.
 */
export async function fetchQuizLeaderboard(quizId: string): Promise<GameResult[]> {
  return requestJson<GameResult[]>(
    `/quizzes/${encodeURIComponent(quizId)}/leaderboard`,
  )
}

/**
 * POST /results — save a completed game result.
 */
export async function saveGameResult(payload: {
  quizId: string
  playerName: string
  score: number
  correctAnswers: number
  totalQuestions: number
  durationSec: number
  hintsUsed: number
  playedAt: string
}): Promise<GameResult> {
  return requestJson<GameResult>('/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

/**
 * Reads field errors from a validation error response body (HTTP 400).
 */
export function getFieldErrorsFromApiError(error: unknown): Record<string, string> | null {
  if (!(error instanceof ApiError)) {
    return null
  }
  const body = error.body as ErrorBody | null
  if (body?.errors && typeof body.errors === 'object') {
    return body.errors
  }
  return null
}
