package triviahub.service;

import org.springframework.stereotype.Service;
import triviahub.dto.QuizRequest;
import triviahub.dto.QuizResponse;
import triviahub.exception.DuplicateResourceException;
import triviahub.exception.ResourceNotFoundException;
import triviahub.model.Quiz;
import triviahub.service.persistence.ObjectStreamFileStore;
import triviahub.service.persistence.PersistencePaths;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Quiz persistence and business operations backed by {@code quizzes.ser}.
 */
@Service
public class QuizService {

    private final ObjectStreamFileStore fileStore;
    private final QuestionService questionService;

    public QuizService(ObjectStreamFileStore fileStore, QuestionService questionService) {
        this.fileStore = fileStore;
        this.questionService = questionService;
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
     * Returns all quizzes with question counts for API listing.
     */
    public List<QuizResponse> findAllWithQuestionCounts() {
        return findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Returns a single quiz with question count, or throws if not found.
     */
    public QuizResponse getByIdOrThrow(String id) {
        Quiz quiz = findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + id));
        return toResponse(quiz);
    }

    /**
     * Creates a new quiz after validation and duplicate checks.
     */
    public QuizResponse create(QuizRequest request) {
        List<Quiz> existing = findAll();
        Map<String, String> normalized = ValidationUtils.validateAndNormalizeQuiz(request, existing, null);

        Quiz quiz = new Quiz(
                UUID.randomUUID().toString(),
                normalized.get("title"),
                normalized.get("category"),
                normalizeDescription(request.getDescription())
        );

        updateAll(quizzes -> {
            List<Quiz> updated = new ArrayList<>(quizzes);
            if (hasDuplicateTitle(updated, quiz.getTitle(), null)) {
                throw new DuplicateResourceException("Quiz title must be unique (case-insensitive).");
            }
            updated.add(quiz);
            return updated;
        });

        return toResponse(quiz);
    }

    /**
     * Updates an existing quiz after validation and duplicate checks.
     */
    public QuizResponse update(String id, QuizRequest request) {
        if (!findById(id).isPresent()) {
            throw new ResourceNotFoundException("Quiz not found: " + id);
        }

        List<Quiz> existing = findAll();
        Map<String, String> normalized = ValidationUtils.validateAndNormalizeQuiz(request, existing, id);

        Quiz updatedQuiz = new Quiz(
                id,
                normalized.get("title"),
                normalized.get("category"),
                normalizeDescription(request.getDescription())
        );

        updateAll(quizzes -> {
            List<Quiz> updated = new ArrayList<>();
            boolean found = false;
            for (Quiz quiz : quizzes) {
                if (id.equals(quiz.getId())) {
                    if (hasDuplicateTitle(quizzes, updatedQuiz.getTitle(), id)) {
                        throw new DuplicateResourceException("Quiz title must be unique (case-insensitive).");
                    }
                    updated.add(updatedQuiz);
                    found = true;
                } else {
                    updated.add(quiz);
                }
            }
            if (!found) {
                throw new ResourceNotFoundException("Quiz not found: " + id);
            }
            return updated;
        });

        return toResponse(updatedQuiz);
    }

    /**
     * Deletes a quiz and all of its questions.
     */
    public void delete(String id) {
        if (findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Quiz not found: " + id);
        }

        updateAll(quizzes -> {
            List<Quiz> updated = new ArrayList<>(quizzes);
            boolean removed = updated.removeIf(quiz -> id.equals(quiz.getId()));
            if (!removed) {
                throw new ResourceNotFoundException("Quiz not found: " + id);
            }
            return updated;
        });

        questionService.deleteByQuizId(id);
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

    /**
     * Ensures a quiz exists before question or result operations.
     */
    public void requireExists(String quizId) {
        if (findById(quizId).isEmpty()) {
            throw new ResourceNotFoundException("Quiz not found: " + quizId);
        }
    }

    /**
     * Converts a {@link Quiz} entity to a {@link QuizResponse} DTO with its question count.
     */
    private QuizResponse toResponse(Quiz quiz) {
        int count = questionService.findByQuizId(quiz.getId()).size();
        return new QuizResponse(
                quiz.getId(),
                quiz.getTitle(),
                quiz.getCategory(),
                quiz.getDescription(),
                count
        );
    }

    /**
     * Returns {@code true} if any quiz in {@code quizzes} (other than {@code excludeId}) has the same title.
     */
    private static boolean hasDuplicateTitle(List<Quiz> quizzes, String title, String excludeId) {
        return quizzes.stream()
                .filter(quiz -> excludeId == null || !excludeId.equals(quiz.getId()))
                .anyMatch(quiz -> title.equals(quiz.getTitle() != null ? quiz.getTitle().trim().toLowerCase() : ""));
    }

    /**
     * Trims whitespace from the description, returning an empty string for {@code null} input.
     */
    private static String normalizeDescription(String description) {
        if (description == null) {
            return "";
        }
        return description.trim();
    }
}
