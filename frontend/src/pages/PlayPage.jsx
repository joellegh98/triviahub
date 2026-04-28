import { useParams } from 'react-router-dom'

export function PlayPage() {
  const { quizId } = useParams()

  return (
    <section>
      <h1 className="h2 mb-3">Play Quiz</h1>
      <p className="text-muted mb-0">Route param quizId: {quizId}</p>
    </section>
  )
}
