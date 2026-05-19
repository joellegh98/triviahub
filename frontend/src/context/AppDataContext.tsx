import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ApiError, fetchQuizzes, type QuizListItem } from '../api'

export type AppDataContextValue = {
  /** All quizzes from {@code GET /api/quizzes} (includes {@code questionCount}). */
  quizzes: QuizListItem[]
  /** Distinct quiz categories, sorted (for filters; does not include {@code "all"}). */
  categories: string[]
  /** True while the shared quiz list is being fetched. */
  loading: boolean
  /** Set when the last shared quiz fetch failed; shown in the layout banner until dismissed. */
  error: string | null
  /** True when the API is unreachable after a fetch attempt; Play buttons should be disabled. */
  serverUnavailable: boolean
  /** Triggers a refetch of the shared quiz list (runs inside {@code useEffect}). */
  refreshQuizzes: () => void
  /** Clears {@link #error} without refetching. */
  dismissError: () => void
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

/**
 * Provides shared quiz list, categories, loading/error state, and refresh for the SPA.
 */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadKey, setLoadKey] = useState(0)

  const refreshQuizzes = useCallback(() => {
    setLoadKey((key) => key + 1)
  }, [])

  const dismissError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    async function load() {
      try {
        const list = await fetchQuizzes()
        if (!cancelled) {
          setQuizzes(list)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError
              ? err.message
              : 'Server unavailable. Could not reach the API.'
          setError(message)
          setQuizzes([])
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
    }
  }, [loadKey])

  const categories = useMemo(
    () => [...new Set(quizzes.map((quiz) => quiz.category))].sort(),
    [quizzes],
  )

  const serverUnavailable = !loading && error !== null

  const value = useMemo<AppDataContextValue>(
    () => ({
      quizzes,
      categories,
      loading,
      error,
      serverUnavailable,
      refreshQuizzes,
      dismissError,
    }),
    [quizzes, categories, loading, error, serverUnavailable, refreshQuizzes, dismissError],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

/**
 * Accesses shared app data (quizzes, categories, loading, errors, refresh).
 */
export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext)
  if (!ctx) {
    throw new Error('useAppData must be used within AppDataProvider')
  }
  return ctx
}
