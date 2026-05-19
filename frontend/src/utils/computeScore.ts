/**
 * Computes a 0–100 score from game stats (same formula as Results page).
 */
export function computeScore({
  correctAnswers,
  totalQuestions,
  durationSec,
  hintsUsed,
}: {
  correctAnswers: number
  totalQuestions: number
  durationSec: number
  hintsUsed: number
}): number {
  if (!totalQuestions || totalQuestions <= 0) {
    return 0
  }

  const accuracyRatio = correctAnswers / totalQuestions
  const accuracyPart = accuracyRatio * 80

  const maxDurationForBonus = 180
  const boundedDuration = Math.min(Math.max(durationSec, 0), maxDurationForBonus)
  const timePart = ((maxDurationForBonus - boundedDuration) / maxDurationForBonus) * 20

  const hintPenalty = hintsUsed * 4
  const rawScore = accuracyPart + timePart - hintPenalty

  return Math.max(0, Math.min(100, Math.round(rawScore)))
}
