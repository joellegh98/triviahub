package triviahub.service;

import org.springframework.stereotype.Service;
import triviahub.model.Question;
import triviahub.service.persistence.ObjectStreamFileStore;
import triviahub.service.persistence.PersistencePaths;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Persistence access for questions stored in {@code questions.ser}.
 */
@Service
public class QuestionService {

    private final ObjectStreamFileStore fileStore;

    public QuestionService(ObjectStreamFileStore fileStore) {
        this.fileStore = fileStore;
    }

    /**
     * Loads all questions from disk.
     */
    public List<Question> findAll() {
        return fileStore.readList(PersistencePaths.QUESTIONS_FILE);
    }

    /**
     * Loads questions belonging to a quiz.
     */
    public List<Question> findByQuizId(String quizId) {
        if (quizId == null) {
            return List.of();
        }
        return findAll().stream()
                .filter(question -> quizId.equals(question.getQuizId()))
                .collect(Collectors.toList());
    }

    /**
     * Replaces the full question list on disk.
     */
    public void saveAll(List<Question> questions) {
        fileStore.writeList(PersistencePaths.QUESTIONS_FILE, new ArrayList<>(questions));
    }

    /**
     * Applies a mutation to the question list atomically under the file lock.
     */
    public void updateAll(java.util.function.UnaryOperator<List<Question>> mutation) {
        fileStore.updateList(PersistencePaths.QUESTIONS_FILE, mutation);
    }

    /**
     * Removes every question for the given quiz id.
     */
    public void deleteByQuizId(String quizId) {
        if (quizId == null) {
            return;
        }
        updateAll(questions -> {
            List<Question> remaining = new ArrayList<>(questions);
            remaining.removeIf(question -> quizId.equals(question.getQuizId()));
            return remaining;
        });
    }
}
