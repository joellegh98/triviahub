package triviahub.model;

import java.io.Serial;
import java.io.Serializable;

/**
 * Serializable game result entity persisted in {@code results.ser}.
 */
public class GameResult implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private String id;
    private String quizId;
    private String playerName;
    private int score;
    private int correctAnswers;
    private int totalQuestions;
    private int durationSec;
    private int hintsUsed;
    private String playedAt;

    public GameResult() {
    }

    public GameResult(
            String id,
            String quizId,
            String playerName,
            int score,
            int correctAnswers,
            int totalQuestions,
            int durationSec,
            int hintsUsed,
            String playedAt
    ) {
        this.id = id;
        this.quizId = quizId;
        this.playerName = playerName;
        this.score = score;
        this.correctAnswers = correctAnswers;
        this.totalQuestions = totalQuestions;
        this.durationSec = durationSec;
        this.hintsUsed = hintsUsed;
        this.playedAt = playedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getQuizId() {
        return quizId;
    }

    public void setQuizId(String quizId) {
        this.quizId = quizId;
    }

    public String getPlayerName() {
        return playerName;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public int getScore() {
        return score;
    }

    public void setScore(int score) {
        this.score = score;
    }

    public int getCorrectAnswers() {
        return correctAnswers;
    }

    public void setCorrectAnswers(int correctAnswers) {
        this.correctAnswers = correctAnswers;
    }

    public int getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(int totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public int getDurationSec() {
        return durationSec;
    }

    public void setDurationSec(int durationSec) {
        this.durationSec = durationSec;
    }

    public int getHintsUsed() {
        return hintsUsed;
    }

    public void setHintsUsed(int hintsUsed) {
        this.hintsUsed = hintsUsed;
    }

    public String getPlayedAt() {
        return playedAt;
    }

    public void setPlayedAt(String playedAt) {
        this.playedAt = playedAt;
    }
}
