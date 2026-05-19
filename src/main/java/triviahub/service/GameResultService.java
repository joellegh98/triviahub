package triviahub.service;

import org.springframework.stereotype.Service;
import triviahub.model.GameResult;
import triviahub.service.persistence.ObjectStreamFileStore;
import triviahub.service.persistence.PersistencePaths;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Persistence access for game results stored in {@code results.ser}.
 */
@Service
public class GameResultService {

    private final ObjectStreamFileStore fileStore;

    public GameResultService(ObjectStreamFileStore fileStore) {
        this.fileStore = fileStore;
    }

    /**
     * Loads all game results from disk.
     */
    public List<GameResult> findAll() {
        return fileStore.readList(PersistencePaths.RESULTS_FILE);
    }

    /**
     * Loads results for a single quiz.
     */
    public List<GameResult> findByQuizId(String quizId) {
        if (quizId == null) {
            return List.of();
        }
        return findAll().stream()
                .filter(result -> quizId.equals(result.getQuizId()))
                .collect(Collectors.toList());
    }

    /**
     * Replaces the full results list on disk.
     */
    public void saveAll(List<GameResult> results) {
        fileStore.writeList(PersistencePaths.RESULTS_FILE, new ArrayList<>(results));
    }

    /**
     * Applies a mutation to the results list atomically under the file lock.
     */
    public void updateAll(java.util.function.UnaryOperator<List<GameResult>> mutation) {
        fileStore.updateList(PersistencePaths.RESULTS_FILE, mutation);
    }

    /**
     * Appends a single result atomically.
     */
    public void add(GameResult result) {
        if (result == null) {
            return;
        }
        updateAll(results -> {
            List<GameResult> updated = new ArrayList<>(results);
            updated.add(result);
            return updated;
        });
    }
}
