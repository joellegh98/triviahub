import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, fetchQuizzes, type QuizListItem } from '../api'

/**
 * Quiz browser page. Lets users filter quizzes by category and search by title,
 * then navigate to the play page for a chosen quiz. Quizzes load from the API on mount.
 */
export function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const list = await fetchQuizzes()
        if (!cancelled) {
          setQuizzes(list)
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiError ? err.message : 'Could not load quizzes from the server.'
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
  }, [])

  const categories = ['all', ...new Set(quizzes.map((quiz) => quiz.category))]

  const normalizedSearchTerm = searchTerm.trim().toLowerCase()

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesCategory =
      selectedCategory === 'all' || quiz.category === selectedCategory
    const matchesTitle = quiz.title.toLowerCase().includes(normalizedSearchTerm)
    return matchesCategory && matchesTitle
  })

  return (
    <section>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">Quiz Browser</h1>
          <p className="text-muted mb-0">
            Filter by category and search quizzes by title.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning mb-3" role="status">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted">Loading quizzes…</p>
      ) : (
        <>
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
              >
                {categories.map((category) => (
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
                        <Link className="btn btn-primary w-100" to={`/play/${quiz.id}`}>
                          Play
                        </Link>
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
