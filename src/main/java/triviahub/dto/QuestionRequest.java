package triviahub.dto;

import java.util.List;

/**
 * Request body for creating or updating a question.
 */
public class QuestionRequest {

    private String text;
    private List<String> options;
    private int correctIndex;
    private String hint;
    /** Difficulty level: {@code "easy"}, {@code "medium"}, or {@code "hard"}. */
    private String difficulty;

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public int getCorrectIndex() {
        return correctIndex;
    }

    public void setCorrectIndex(int correctIndex) {
        this.correctIndex = correctIndex;
    }

    public String getHint() {
        return hint;
    }

    public void setHint(String hint) {
        this.hint = hint;
    }

    public String getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(String difficulty) {
        this.difficulty = difficulty;
    }
}
