import { useMemo, useState } from 'react'
import { questions as initialQuestions, quizzes as initialQuizzes } from '../mockData.js'

const emptyQuizForm = {
  title: '',
  category: '',
  description: '',
}

const emptyQuestionForm = {
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  hint: '',
}

export function AdminPage() {
  const [quizzes, setQuizzes] = useState(initialQuizzes)
  const [questions, setQuestions] = useState(initialQuestions)
  const [selectedQuizId, setSelectedQuizId] = useState(
    initialQuizzes[0] ? initialQuizzes[0].id : '',
  )

  const [quizForm, setQuizForm] = useState(emptyQuizForm)
  const [quizErrors, setQuizErrors] = useState({})

  const [questionForm, setQuestionForm] = useState(emptyQuestionForm)
  const [questionErrors, setQuestionErrors] = useState({})
  const [editingQuestionId, setEditingQuestionId] = useState(null)

  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedQuizId) || null
  const selectedQuizQuestions = useMemo(
    () => questions.filter((question) => question.quizId === selectedQuizId),
    [questions, selectedQuizId],
  )

  const validateQuizForm = () => {
    const errors = {}
    const normalizedTitle = quizForm.title.trim().toLowerCase()
    const normalizedCategory = quizForm.category.trim().toLowerCase()

    if (!normalizedTitle) {
      errors.title = 'Title is required.'
    } else {
      const hasDuplicate = quizzes.some(
        (quiz) => quiz.title.trim().toLowerCase() === normalizedTitle,
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

  const handleQuizSubmit = (event) => {
    event.preventDefault()
    const errors = validateQuizForm()
    setQuizErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    const newQuiz = {
      id: `quiz-${Date.now()}`,
      title: quizForm.title.trim(),
      category: quizForm.category.trim().toLowerCase(),
      description: quizForm.description.trim() || 'Custom quiz created in admin.',
    }

    setQuizzes((prev) => [...prev, newQuiz])
    if (!selectedQuizId) {
      setSelectedQuizId(newQuiz.id)
    }
    setQuizForm(emptyQuizForm)
    setQuizErrors({})
  }

  const handleDeleteQuiz = (quizIdToDelete) => {
    setQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizIdToDelete))
    setQuestions((prev) =>
      prev.filter((question) => question.quizId !== quizIdToDelete),
    )

    if (selectedQuizId === quizIdToDelete) {
      const nextQuiz = quizzes.find((quiz) => quiz.id !== quizIdToDelete)
      setSelectedQuizId(nextQuiz ? nextQuiz.id : '')
      setEditingQuestionId(null)
      setQuestionForm(emptyQuestionForm)
      setQuestionErrors({})
    }
  }

  const validateQuestionForm = () => {
    const errors = {}

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

  const handleQuestionSubmit = (event) => {
    event.preventDefault()
    const errors = validateQuestionForm()
    setQuestionErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    const preparedQuestion = {
      id: editingQuestionId || `q-${Date.now()}`,
      quizId: selectedQuizId,
      text: questionForm.text.trim(),
      options: questionForm.options.map((option) => option.trim()),
      correctIndex: questionForm.correctIndex,
      hint: questionForm.hint.trim() || 'No hint provided.',
    }

    if (editingQuestionId) {
      setQuestions((prev) =>
        prev.map((question) =>
          question.id === editingQuestionId ? preparedQuestion : question,
        ),
      )
    } else {
      setQuestions((prev) => [...prev, preparedQuestion])
    }

    setEditingQuestionId(null)
    setQuestionForm(emptyQuestionForm)
    setQuestionErrors({})
  }

  const startEditingQuestion = (question) => {
    setEditingQuestionId(question.id)
    setQuestionForm({
      text: question.text,
      options: [...question.options],
      correctIndex: question.correctIndex,
      hint: question.hint,
    })
    setQuestionErrors({})
  }

  const handleDeleteQuestion = (questionId) => {
    setQuestions((prev) => prev.filter((question) => question.id !== questionId))
    if (editingQuestionId === questionId) {
      setEditingQuestionId(null)
      setQuestionForm(emptyQuestionForm)
      setQuestionErrors({})
    }
  }

  return (
    <section>
      <h1 className="h2 mb-4">Admin - Local CRUD</h1>

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <article className="card h-100 shadow-sm">
            <div className="card-body">
              <h2 className="h5 mb-3">Add Quiz</h2>
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
                    rows="2"
                    value={quizForm.description}
                    onChange={(event) =>
                      setQuizForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>

                <button type="submit" className="btn btn-primary">
                  Add quiz
                </button>
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
                          {quiz.category} • {questions.filter((q) => q.quizId === quiz.id).length}{' '}
                          questions
                        </p>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setSelectedQuizId(quiz.id)}
                        >
                          Manage questions
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteQuiz(quiz.id)}
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

      <article className="card shadow-sm mt-4">
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

          {!selectedQuiz ? (
            <div className="alert alert-secondary mb-0" role="status">
              Add a quiz first, then create questions.
            </div>
          ) : (
            <>
              <form onSubmit={handleQuestionSubmit} noValidate className="mb-4">
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
                            ),
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
                            onClick={() => handleDeleteQuestion(question.id)}
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
    </section>
  )
}
