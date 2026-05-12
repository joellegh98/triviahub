/**
 * About page for TriviaHub.
 */
export function AboutPage() {
  return (
    <section>
      <h1 className="h2 mb-3">About TriviaHub</h1>

      <p className="text-muted mb-4">
        TriviaHub lets you practice with quiz questions, track your progress, and
        compete on leaderboards. Browse quizzes, play a game, and see your
        results.
      </p>

      <div className="card shadow-sm">
        <div className="card-body text-start">
          <h2 className="h5 mb-2">Submitters</h2>
          <ul className="mb-0 text-start">
            <li>Noa Haberer</li>
            <li>Joelle Gharo</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
