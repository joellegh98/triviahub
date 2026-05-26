import { useEffect, useMemo, useRef, useState, type SubmitEventHandler } from 'react'
import {
  ApiError,
  createQuestion,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  fetchQuestionsForQuiz,
  fetchQuizzes,
  getFieldErrorsFromApiError,
  updateQuestion,
  updateQuiz,
  type QuizListItem,
} from '../api'
import { useAppData } from '../context/AppDataContext'
import type { Question } from '../types'

const emptyQuizForm = {
  title: '',
  category: '',
  description: '',
}

const emptyQuestionForm = {
  text: '',
  options: ['', '', '', ''] as [string, string, string, string],
  correctIndex: 0,
  hint: '',
}

type QuizFormErrors = Partial<Record<'title' | 'category', string>>

type QuestionFormErrors = Partial<
  Record<'quizId' | 'text' | 'correctIndex', string> & { options: string[] }
>

function hasQuestionFormErrors(errors: QuestionFormErrors): boolean {
  if (errors.quizId || errors.text || errors.correctIndex) {
    return true
  }
  return Boolean(errors.options?.some((message) => message))
}

/**
 * Admin CRUD page backed by the Spring API.
 * Loads quizzes and questions on mount and whenever {@code dataVersion} increments.
 * @returns {JSX.Element}
 */
export function AdminPage() {
  const { refreshQuizzes } = useAppData()
  const [dataVersion, setDataVersion] = useState(0)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [selectedQuizId, setSelectedQuizId] = useState('')

  const [quizForm, setQuizForm] = useState(emptyQuizForm)
  const [quizErrors, setQuizErrors] = useState<QuizFormErrors>({})
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null)

  const [questionForm, setQuestionForm] = useState(emptyQuestionForm)
  const [questionErrors, setQuestionErrors] = useState<QuestionFormErrors>({})
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [quizToDelete, setQuizToDelete] = useState<QuizListItem | null>(null)
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null)
  const questionsSectionRef = useRef<HTMLElement>(null)
  const questionFormRef = useRef<HTMLFormElement>(null)

  const scrollToQuestionsSection = () => {
    window.requestAnimationFrame(() => {
      questionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const scrollToQuestionForm = () => {
    window.requestAnimationFrame(() => {
      questionFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  useEffect(() => {
    let cancelled = false
    setLoadState('loading')

    async function load() {
      try {
        const quizList = await fetchQuizzes()
        const nested = await Promise.all(
          quizList.map(async (quiz) => ({
            quizId: quiz.id,
            items: await fetchQuestionsForQuiz(quiz.id),
          })),
        )
        if (cancelled) {
          return
        }
        const allQuestions = nested.flatMap((entry) => entry.items)
        setQuizzes(quizList)
        setQuestions(allQuestions)
        setSelectedQuizId((prev) => {
          if (prev && quizList.some((q) => q.id === prev)) {
            return prev
          }
          return quizList[0]?.id ?? ''
        })
        setLoadState('ready')
      } catch {
        if (!cancelled) {
          setLoadState('error')
          setQuizzes([])
          setQuestions([])
          setSelectedQuizId('')
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [dataVersion])

  const refresh = () => {
    setDataVersion((v) => v + 1)
  }

  const applyQuizApiError = (err: unknown, fallbackMessage: string) => {
    if (!(err instanceof ApiError)) {
      setSubmitError(fallbackMessage)
      return
    }
    const fields = getFieldErrorsFromApiError(err)
    if (fields?.title || fields?.category) {
      setQuizErrors({
        title: fields.title,
        category: fields.category,
      })
      return
    }
    if (err.status === 409) {
      setQuizErrors({ title: err.message })
      return
    }
    setSubmitError(err.message)
  }

  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedQuizId) || null
  const selectedQuizQuestions = useMemo(
    () => questions.filter((question) => question.quizId === selectedQuizId),
    [questions, selectedQuizId],
  )

  /**
   * Validates the Add Quiz form fields (client-side).
   * @returns {Object.<string, string>} Map of field name → error message (empty if valid).
   */
  const validateQuizForm = () => {
    const errors: QuizFormErrors = {}
    const normalizedTitle = quizForm.title.trim().toLowerCase()
    const normalizedCategory = quizForm.category.trim().toLowerCase()

    if (!normalizedTitle) {
      errors.title = 'Title is required.'
    } else {
      const hasDuplicate = quizzes.some(
        (quiz) =>
          quiz.id !== editingQuizId &&
          quiz.title.trim().toLowerCase() === normalizedTitle,
      )
      if (hasDuplicate) {
        errors.title = 'Quiz title must be unique (case-insensitive).'
      }
    }

    if (!normalizedCategory) {
      errors.category = 'Category is required.'
    } else if (!/^[a-z]+$/i.test(normalizedCategory)) {
      errors.category = 'Category must contain letters only (a-z).'
    }

    return errors
  }

  /**
   * Handles submission of the Add Quiz form.
   * @param event
   */
  const handleQuizSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setSubmitError(null)
    const errors = validateQuizForm()
    setQuizErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    const payload = {
      title: quizForm.title.trim(),
      category: quizForm.category.trim().toLowerCase(),
      description: quizForm.description.trim() || 'Custom quiz created in admin.',
    }

    try {
      if (editingQuizId) {
        await updateQuiz(editingQuizId, payload)
      } else {
        await createQuiz(payload)
      }
      setQuizForm(emptyQuizForm)
      setQuizErrors({})
      setEditingQuizId(null)
      refresh()
      refreshQuizzes()
    } catch (err) {
      applyQuizApiError(err, editingQuizId ? 'Could not update quiz.' : 'Could not create quiz.')
    }
  }

  const startEditingQuiz = (quiz: QuizListItem) => {
    setEditingQuizId(quiz.id)
    setQuizForm({
      title: quiz.title,
      category: quiz.category,
      description: quiz.description,
    })
    setQuizErrors({})
    setSubmitError(null)
  }

  const cancelQuizEdit = () => {
    setEditingQuizId(null)
    setQuizForm(emptyQuizForm)
    setQuizErrors({})
  }

  /**
   * Deletes a quiz and all its questions via the API.
   * @param {string} quizIdToDelete
   */
  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) {
      return
    }
    const quizIdToDelete = quizToDelete.id
    setSubmitError(null)
    try {
      await deleteQuiz(quizIdToDelete)
      if (selectedQuizId === quizIdToDelete) {
        setEditingQuestionId(null)
        setQuestionForm(emptyQuestionForm)
        setQuestionErrors({})
      }
      if (editingQuizId === quizIdToDelete) {
        cancelQuizEdit()
      }
      setQuizToDelete(null)
      refresh()
      refreshQuizzes()
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message)
      } else {
        setSubmitError('Could not delete quiz.')
      }
    }
  }

  /**
   * Validates the Add/Edit Question form fields.
   * @returns {Object.<string, string|string[]>} Map of field name → error message(s).
   */
  const validateQuestionForm = () => {
    const errors: QuestionFormErrors = {}

    if (!selectedQuizId) {
      errors.quizId = 'Select a quiz before adding a question.'
    }

    if (!questionForm.text.trim()) {
      errors.text = 'Question text is required.'
    }

    const optionErrors = questionForm.options.map((option) =>
      option.trim() ? '' : 'Option cannot be empty.',
    )
    if (optionErrors.some(Boolean)) {
      errors.options = optionErrors
    }

    if (
      !Number.isInteger(questionForm.correctIndex) ||
      questionForm.correctIndex < 0 ||
      questionForm.correctIndex > 3
    ) {
      errors.correctIndex = 'Correct answer index must be between 0 and 3.'
    }

    return errors
  }

  /**
   * Handles submission of the Add/Edit Question form.
   * @param event
   */
  const handleQuestionSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    setSubmitError(null)
    const errors = validateQuestionForm()
    setQuestionErrors(errors)

    if (hasQuestionFormErrors(errors)) {
      return
    }

    const payload = {
      text: questionForm.text.trim(),
      options: [...questionForm.options.map((option) => option.trim())],
      correctIndex: questionForm.correctIndex,
      hint: questionForm.hint.trim() || 'No hint provided.',
    }

    try {
      if (editingQuestionId) {
        await updateQuestion(editingQuestionId, payload)
      } else {
        await createQuestion(selectedQuizId, payload)
      }
      setEditingQuestionId(null)
      setQuestionForm(emptyQuestionForm)
      setQuestionErrors({})
      refresh()
      refreshQuizzes()
    } catch (err) {
      if (err instanceof ApiError) {
        const fields = getFieldErrorsFromApiError(err)
        if (fields) {
          const optMsg = fields.options
          setQuestionErrors({
            text: fields.text,
            correctIndex: fields.correctIndex,
            ...(optMsg
              ? { options: [optMsg, optMsg, optMsg, optMsg] }
              : {}),
          })
        } else {
          setSubmitError(err.message)
        }
      } else {
        setSubmitError('Could not save question.')
      }
    }
  }

  /**
   * Populates the question form with an existing question's data to begin editing it.
   * @param question
   */
  const startEditingQuestion = (question: Question) => {
    setEditingQuestionId(question.id)
    setQuestionForm({
      text: question.text,
      options: [...question.options],
      correctIndex: question.correctIndex,
      hint: question.hint,
    })
    setQuestionErrors({})
    scrollToQuestionForm()
  }

  /**
   * Removes a question via the API.
   * @param {string} questionId
   */
  const confirmDeleteQuestion = async () => {
    if (!questionToDelete) {
      return
    }
    const questionId = questionToDelete.id
    setSubmitError(null)
    try {
      await deleteQuestion(questionId)
      if (editingQuestionId === questionId) {
        setEditingQuestionId(null)
        setQuestionForm(emptyQuestionForm)
        setQuestionErrors({})
      }
      setQuestionToDelete(null)
      refresh()
      refreshQuizzes()
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message)
      } else {
        setSubmitError('Could not delete question.')
      }
    }
  }

  if (loadState === 'loading') {
    return (
      <section>
        <h1 className="h2 mb-4">Admin</h1>
        <p className="text-muted">Loading quizzes and questions…</p>
      </section>
    )
  }

  if (loadState === 'error') {
    return (
      <section>
        <h1 className="h2 mb-4">Admin</h1>
        <div className="alert alert-danger" role="status">
          Could not load admin data from the server. Check that the backend is running.
        </div>
        <button type="button" className="btn btn-outline-primary mt-3" onClick={refresh}>
          Retry
        </button>
      </section>
    )
  }

  return (
    <section>
      <h1 className="h2 mb-4">Admin</h1>

      {submitError && (
        <div className="alert alert-warning mb-3" role="status">
          {submitError}
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <article className="card h-100 shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">{editingQuizId ? 'Edit Quiz' : 'Add Quiz'}</h2>
              <form onSubmit={handleQuizSubmit} noValidate>
                <div className="mb-3">
                  <label className="form-label" htmlFor="quizTitle">
                    Title
                  </label>
                  <input
                    id="quizTitle"
                    type="text"
                    className={`form-control${quizErrors.title ? ' is-invalid' : ''}`}
                    value={quizForm.title}
                    onChange={(event) =>
                      setQuizForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                  />
                  {quizErrors.title && (
                    <div className="invalid-feedback">{quizErrors.title}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="quizCategory">
                    Category
                  </label>
                  <input
                    id="quizCategory"
                    type="text"
                    className={`form-control${quizErrors.category ? ' is-invalid' : ''}`}
                    value={quizForm.category}
                    onChange={(event) =>
                      setQuizForm((prev) => ({ ...prev, category: event.target.value }))
                    }
                  />
                  {quizErrors.category && (
                    <div className="invalid-feedback">{quizErrors.category}</div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="quizDescription">
                    Description
                  </label>
                  <textarea
                    id="quizDescription"
                    className="form-control"
                    rows={2}
                    value={quizForm.description}
                    onChange={(event) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingQuizId ? 'Update quiz' : 'Add quiz'}
                  </button>
                  {editingQuizId && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={cancelQuizEdit}
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </article>
        </div>

        <div className="col-12 col-lg-7">
          <article className="card h-100 shadow-sm">
            <div className="card-body text-start">
              <h2 className="h5 mb-3">Quizzes</h2>
              {quizzes.length === 0 ? (
                <p className="text-muted mb-0">No quizzes available.</p>
              ) : (
                <ul className="list-group">
                  {quizzes.map((quiz) => (
                    <li
                      key={quiz.id}
                      className="list-group-item d-flex justify-content-between align-items-start gap-3"
                    >
                      <div className="text-start">
                        <p className="fw-semibold mb-1">{quiz.title}</p>
                        <p className="mb-0 text-muted">
                          {quiz.category} •{' '}
                          {questions.filter((q) => q.quizId === quiz.id).length} questions
                        </p>
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setSelectedQuizId(quiz.id)
                            scrollToQuestionsSection()
                          }}
                        >
                          Manage questions
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => startEditingQuiz(quiz)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setQuizToDelete(quiz)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        </div>
      </div>

      <article ref={questionsSectionRef} className="card shadow-sm mt-4">
        <div className="card-body text-start">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
            <h2 className="h5 mb-0">Questions</h2>
            <select
              className="form-select w-auto"
              value={selectedQuizId}
              onChange={(event) => {
                setSelectedQuizId(event.target.value)
                setEditingQuestionId(null)
                setQuestionForm(emptyQuestionForm)
                setQuestionErrors({})
              }}
            >
              {quizzes.length === 0 && <option value="">No quizzes</option>}
              {quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          </div>
          {questionErrors.quizId && (
            <div className="alert alert-warning py-2 mb-3" role="status">
              {questionErrors.quizId}
            </div>
          )}

          {!selectedQuiz ? (
            <div className="alert alert-secondary mb-0" role="status">
              Add a quiz first, then create questions.
            </div>
          ) : (
            <>
              <form
                ref={questionFormRef}
                onSubmit={handleQuestionSubmit}
                noValidate
                className="mb-4"
              >
                <div className="mb-3">
                  <label htmlFor="questionText" className="form-label">
                    Question text
                  </label>
                  <input
                    id="questionText"
                    type="text"
                    className={`form-control${questionErrors.text ? ' is-invalid' : ''}`}
                    value={questionForm.text}
                    onChange={(event) =>
                      setQuestionForm((prev) => ({ ...prev, text: event.target.value }))
                    }
                  />
                  {questionErrors.text && (
                    <div className="invalid-feedback">{questionErrors.text}</div>
                  )}
                </div>

                <div className="row g-2 mb-3">
                  {questionForm.options.map((option, index) => (
                    <div className="col-12 col-md-6" key={`option-${index}`}>
                      <label className="form-label" htmlFor={`option-${index}`}>
                        Option {index + 1}
                      </label>
                      <input
                        id={`option-${index}`}
                        type="text"
                        className={`form-control${
                          questionErrors.options?.[index] ? ' is-invalid' : ''
                        }`}
                        value={option}
                        onChange={(event) =>
                          setQuestionForm((prev) => ({
                            ...prev,
                            options: prev.options.map((item, optionIndex) =>
                              optionIndex === index ? event.target.value : item,
                            ) as [string, string, string, string],
                          }))
                        }
                      />
                      {questionErrors.options?.[index] && (
                        <div className="invalid-feedback">
                          {questionErrors.options[index]}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-12 col-md-4">
                    <label htmlFor="correctIndex" className="form-label">
                      Correct option
                    </label>
                    <select
                      id="correctIndex"
                      className={`form-select${
                        questionErrors.correctIndex ? ' is-invalid' : ''
                      }`}
                      value={questionForm.correctIndex}
                      onChange={(event) =>
                        setQuestionForm((prev) => ({
                          ...prev,
                          correctIndex: Number(event.target.value),
                        }))
                      }
                    >
                      <option value={0}>Option 1</option>
                      <option value={1}>Option 2</option>
                      <option value={2}>Option 3</option>
                      <option value={3}>Option 4</option>
                    </select>
                    {questionErrors.correctIndex && (
                      <div className="invalid-feedback">
                        {questionErrors.correctIndex}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-8">
                    <label htmlFor="questionHint" className="form-label">
                      Hint (optional)
                    </label>
                    <input
                      id="questionHint"
                      type="text"
                      className="form-control"
                      value={questionForm.hint}
                      onChange={(event) =>
                        setQuestionForm((prev) => ({ ...prev, hint: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    {editingQuestionId ? 'Update question' : 'Add question'}
                  </button>
                  {editingQuestionId && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setEditingQuestionId(null)
                        setQuestionForm(emptyQuestionForm)
                        setQuestionErrors({})
                      }}
                    >
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>

              <h3 className="h6 mb-3">Existing questions ({selectedQuizQuestions.length})</h3>
              {selectedQuizQuestions.length === 0 ? (
                <p className="text-muted mb-0">No questions for this quiz yet.</p>
              ) : (
                <ul className="list-group">
                  {selectedQuizQuestions.map((question) => (
                    <li key={question.id} className="list-group-item">
                      <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                        <div className="text-start">
                          <p className="fw-semibold mb-1">{question.text}</p>
                          <p className="mb-1 text-muted">
                            Correct: Option {question.correctIndex + 1}
                          </p>
                          <p className="mb-0 small text-muted">Hint: {question.hint}</p>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => startEditingQuestion(question)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setQuestionToDelete(question)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </article>

      {quizToDelete && (
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
                  <h2 className="modal-title fs-5 mb-0">Delete quiz?</h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setQuizToDelete(null)}
                  />
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    Delete <strong>{quizToDelete.title}</strong> and all of its questions?
                    This cannot be undone.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setQuizToDelete(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => void confirmDeleteQuiz()}
                  >
                    Delete quiz
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

      {questionToDelete && (
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
                  <h2 className="modal-title fs-5 mb-0">Delete question?</h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setQuestionToDelete(null)}
                  />
                </div>
                <div className="modal-body">
                  <p className="mb-0">
                    Remove this question from the quiz? This cannot be undone.
                  </p>
                  <p className="mb-0 mt-2 text-muted small">{questionToDelete.text}</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setQuestionToDelete(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => void confirmDeleteQuestion()}
                  >
                    Delete question
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
