package triviahub.service;

import org.springframework.stereotype.Service;
import triviahub.model.Quiz;
import triviahub.service.persistence.ObjectStreamFileStore;
import triviahub.service.persistence.PersistencePaths;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Persistence access for quizzes stored in {@code quizzes.ser}.
 */
@Service
public class QuizService {

    private final ObjectStreamFileStore fileStore;

    public QuizService(ObjectStreamFileStore fileStore) {
        this.fileStore = fileStore;
    }

    /**
     * Loads all quizzes from disk.
     */
    public List<Quiz> findAll() {
        return fileStore.readList(PersistencePaths.QUIZZES_FILE);
    }

    /**
     * Finds a quiz by id.
     */
    public Optional<Quiz> findById(String id) {
        if (id == null) {
            return Optional.empty();
        }
        return findAll().stream()
                .filter(quiz -> id.equals(quiz.getId()))
                .findFirst();
    }

    /**
     * Replaces the full quiz list on disk.
     */
    public void saveAll(List<Quiz> quizzes) {
        fileStore.writeList(PersistencePaths.QUIZZES_FILE, new ArrayList<>(quizzes));
    }

    /**
     * Applies a mutation to the quiz list atomically under the file lock.
     */
    public void updateAll(java.util.function.UnaryOperator<List<Quiz>> mutation) {
        fileStore.updateList(PersistencePaths.QUIZZES_FILE, mutation);
    }
}
