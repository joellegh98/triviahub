import { useParams } from 'react-router-dom'

export function ResultsPage() {
  const { quizId } = useParams()

  return (
    <section>
      <h1 className="h2 mb-3">Results</h1>
      <p className="text-muted mb-0">Results placeholder for quiz: {quizId}</p>
    </section>
  )
}
