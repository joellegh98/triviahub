import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppToast } from '../components/AppToast'
import { useAppData } from '../context/AppDataContext'
import type { PlayLocationState, QuizzesLocationState } from '../types'
import {
  getStoredPlayerName,
  isValidPlayerName,
  normalizePlayerName,
  setStoredPlayerName,
} from '../utils/playerName'

/**
 * Quiz browser page. Refetches quizzes/categories from the API on mount and on
 * explicit refresh. Disables Play when the server is unavailable.
 */
export function QuizzesPage() {
  const { quizzes, categories, loading, serverUnavailable, refreshQuizzes } = useAppData()
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [toastMessage, setToastMessage] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [playerName, setPlayerName] = useState(getStoredPlayerName)
  const [nameTouched, setNameTouched] = useState(false)

  /** Refetch quiz list (and derived categories) whenever this page is opened. */
  useEffect(() => {
    refreshQuizzes()
  }, [refreshQuizzes])

  useEffect(() => {
    const state = location.state as QuizzesLocationState | null
    if (state?.toastMessage) {
      setToastMessage(state.toastMessage)
      setToastVisible(true)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.pathname, location.state, navigate])

  const handleToastClose = useCallback(() => {
    setToastVisible(false)
    setToastMessage('')
  }, [])

  const categoryOptions = useMemo(() => ['all', ...categories], [categories])

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  const filteredQuizzes = useMemo(
    () =>
      quizzes.filter((quiz) => {
        const matchesCategory =
          selectedCategory === 'all' || quiz.category === selectedCategory
        const matchesTitle = quiz.title.toLowerCase().includes(normalizedSearchTerm)
        return matchesCategory && matchesTitle
      }),
    [quizzes, selectedCategory, normalizedSearchTerm],
  )

  const trimmedPlayerName = normalizePlayerName(playerName)
  const playerNameValid = isValidPlayerName(playerName)
  const playDisabled = serverUnavailable || loading || !playerNameValid

  const handlePlayerNameChange = useCallback(
    (value: string) => {
      setPlayerName(value)
      if (isValidPlayerName(value)) {
        setStoredPlayerName(value)
      }
    },
    [],
  )

  return (
    <section>
      <AppToast message={toastMessage} show={toastVisible} onClose={handleToastClose} />

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">Quiz Browser</h1>
          <p className="text-muted mb-0">
            Filter by category and search quizzes by title.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => refreshQuizzes()}
          disabled={loading}
        >
          {loading ? 'Refreshing…' : 'Refresh quizzes'}
        </button>
      </div>

      {loading && quizzes.length === 0 ? (
        <p className="text-muted">Loading quizzes…</p>
      ) : (
        <>
          <div className="row g-3 mb-3">
            <div className="col-12 col-lg-6">
              <label htmlFor="playerName" className="form-label">
                Your name
              </label>
              <input
                id="playerName"
                type="text"
                className={`form-control${!playerNameValid && (nameTouched || playerName.length > 0) ? ' is-invalid' : ''}`}
                placeholder="e.g. Noa, Joelle"
                value={playerName}
                onChange={(event) => handlePlayerNameChange(event.target.value)}
                onBlur={() => setNameTouched(true)}
                maxLength={50}
                autoComplete="nickname"
              />
              {!playerNameValid && playerName.length === 0 && nameTouched ? (
                <div className="invalid-feedback d-block">
                  You need to fill your name.
                </div>
              ) : !playerNameValid && playerName.length > 0 ? (
                <div className="invalid-feedback d-block">
                  Enter a name (1–50 characters) before playing.
                </div>
              ) : null}
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-12 col-md-4">
              <label htmlFor="categoryFilter" className="form-label">
                Category
              </label>
              <select
                id="categoryFilter"
                className="form-select"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                disabled={loading}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all'
                      ? 'All categories'
                      : `${category.charAt(0).toUpperCase()}${category.slice(1)}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-8">
              <label htmlFor="titleSearch" className="form-label">
                Search by title
              </label>
              <input
                id="titleSearch"
                type="text"
                className="form-control"
                placeholder="Type quiz title..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
          </div>

          <div className="row g-3">
            {filteredQuizzes.length === 0 ? (
              <div className="col-12">
                <div className="alert alert-secondary mb-0" role="status">
                  No quizzes match your filter/search.
                </div>
              </div>
            ) : (
              filteredQuizzes.map((quiz) => (
                <div key={quiz.id} className="col-12 col-md-6 col-lg-4">
                  <article className="card h-100 shadow-sm">
                    <div className="card-body d-flex flex-column">
                      <h2 className="h5 card-title mb-2">{quiz.title}</h2>
                      <p className="text-muted mb-2">
                        Category:{' '}
                        {`${quiz.category.charAt(0).toUpperCase()}${quiz.category.slice(1)}`}
                      </p>
                      <p className="mb-3">
                        Questions:{' '}
                        <strong>{quiz.questionCount ?? 0}</strong>
                      </p>
                      <p className="text-muted small mb-4">{quiz.description}</p>
                      <div className="mt-auto">
                        {playDisabled ? (
                          <span
                            className="btn btn-primary w-100 disabled"
                            aria-disabled="true"
                            style={{ cursor: !playerNameValid ? 'pointer' : 'not-allowed' }}
                            onClick={() => { if (!playerNameValid) { setNameTouched(true); document.getElementById('playerName')?.focus() } }}
                          >
                            Play
                          </span>
                        ) : (
                          <Link
                            className="btn btn-primary w-100"
                            to={`/play/${quiz.id}`}
                            state={
                              {
                                fromQuizBrowser: true,
                                playerName: trimmedPlayerName,
                              } satisfies PlayLocationState
                            }
                          >
                            Play
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  )
}
