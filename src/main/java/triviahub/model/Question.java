package triviahub.model;

import java.io.Serial;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Serializable question entity persisted in {@code questions.ser}.
 */
public class Question implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private String id;
    private String quizId;
    private String text;
    private List<String> options = new ArrayList<>();
    private int correctIndex;
    private String hint;

    public Question() {
    }

    public Question(
            String id,
            String quizId,
            String text,
            List<String> options,
            int correctIndex,
            String hint
    ) {
        this.id = id;
        this.quizId = quizId;
        this.text = text;
        this.options = options != null ? new ArrayList<>(options) : new ArrayList<>();
        this.correctIndex = correctIndex;
        this.hint = hint;
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
        this.options = options != null ? new ArrayList<>(options) : new ArrayList<>();
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
}
