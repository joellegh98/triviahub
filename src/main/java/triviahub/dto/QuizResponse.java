package triviahub.dto;

/**
 * Quiz returned by the API, including question count.
 */
public class QuizResponse {

    private String id;
    private String title;
    private String category;
    private String description;
    private int questionCount;

    public QuizResponse() {
    }

    public QuizResponse(String id, String title, String category, String description, int questionCount) {
        this.id = id;
        this.title = title;
        this.category = category;
        this.description = description;
        this.questionCount = questionCount;
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

    public int getQuestionCount() {
        return questionCount;
    }

    public void setQuestionCount(int questionCount) {
        this.questionCount = questionCount;
    }
}
