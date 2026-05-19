package triviahub.model;

import java.io.Serial;
import java.io.Serializable;

/**
 * Serializable quiz entity persisted in {@code quizzes.ser}.
 */
public class Quiz implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private String id;
    private String title;
    private String category;
    private String description;

    public Quiz() {
    }

    public Quiz(String id, String title, String category, String description) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.description = description;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
