package triviahub.service;

import org.springframework.stereotype.Service;
import triviahub.dto.GameResultRequest;
import triviahub.exception.ValidationException;
import triviahub.model.GameResult;
import triviahub.service.persistence.ObjectStreamFileStore;
import triviahub.service.persistence.PersistencePaths;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Game result persistence and leaderboard operations backed by {@code results.ser}.
 */
@Service
public class GameResultService {

    public static final int GLOBAL_LEADERBOARD_LIMIT = 20;
    public static final int QUIZ_LEADERBOARD_LIMIT = 10;

    private final ObjectStreamFileStore fileStore;
    private final QuizService quizService;

    public GameResultService(ObjectStreamFileStore fileStore, QuizService quizService) {
        this.fileStore = fileStore;
        this.quizService = quizService;
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
     * Returns the global top results sorted by score (then most recent play).
     */
    public List<GameResult> globalLeaderboard() {
        return findAll().stream()
                .sorted(leaderboardComparator())
                .limit(GLOBAL_LEADERBOARD_LIMIT)
                .collect(Collectors.toList());
    }

    /**
     * Returns the top results for one quiz sorted by score (then most recent play).
     */
    public List<GameResult> quizLeaderboard(String quizId) {
        quizService.requireExists(quizId);
        return findByQuizId(quizId).stream()
                .sorted(leaderboardComparator())
                .limit(QUIZ_LEADERBOARD_LIMIT)
                .collect(Collectors.toList());
    }

    /**
     * Persists a completed game result after validation.
     */
    public GameResult save(GameResultRequest request) {
        if (request == null) {
            throw new ValidationException("Request body is required.");
        }
        ValidationUtils.validateGameResult(
                request.getQuizId(),
                request.getPlayerName(),
                request.getScore(),
                request.getTotalQuestions()
        );
        quizService.requireExists(request.getQuizId());

        String playedAt = request.getPlayedAt();
        if (playedAt == null || playedAt.isBlank()) {
            playedAt = Instant.now().toString();
        }

        GameResult result = new GameResult(
                UUID.randomUUID().toString(),
                request.getQuizId(),
                request.getPlayerName().trim(),
                request.getScore(),
                request.getCorrectAnswers(),
                request.getTotalQuestions(),
                request.getDurationSec(),
                request.getHintsUsed(),
                playedAt
        );

        add(result);
        return result;
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

    private static Comparator<GameResult> leaderboardComparator() {
        return Comparator
                .comparingInt(GameResult::getScore).reversed()
                .thenComparing(GameResult::getPlayedAt, Comparator.nullsLast(Comparator.reverseOrder()));
    }
}
