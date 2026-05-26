package triviahub.service;

import triviahub.dto.QuestionRequest;
import triviahub.dto.QuizRequest;
import triviahub.exception.DuplicateResourceException;
import triviahub.exception.ValidationException;
import triviahub.model.Quiz;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Shared validation helpers for quiz and question API operations.
 */
public final class ValidationUtils {

    private ValidationUtils() {
    }

    /**
     * Validates quiz request fields and returns normalized title and category.
     *
     * @param request       incoming quiz payload
     * @param existing      all quizzes currently stored
     * @param excludeQuizId quiz id to ignore for duplicate title checks (updates), or null
     * @return map with keys {@code title} and {@code category}
     */
    public static Map<String, String> validateAndNormalizeQuiz(
            QuizRequest request,
            List<Quiz> existing,
            String excludeQuizId
    ) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (request == null) {
            throw new ValidationException("Request body is required.");
        }

        String title = request.getTitle() != null ? request.getTitle().trim().toLowerCase() : "";
        String category = request.getCategory() != null ? request.getCategory().trim().toLowerCase() : "";

        if (title.isEmpty()) {
            errors.put("title", "Title is required.");
        } else {
            boolean duplicate = existing.stream()
                    .filter(quiz -> excludeQuizId == null || !excludeQuizId.equals(quiz.getId()))
                    .anyMatch(quiz -> title.equals(normalize(quiz.getTitle())));
            if (duplicate) {
                throw new DuplicateResourceException("Quiz title must be unique (case-insensitive).");
            }
        }

        if (category.isEmpty()) {
            errors.put("category", "Category is required.");
        } else if (!category.matches("[a-z]+")) {
            errors.put("category", "Category must contain letters only (a-z).");
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("Validation failed.", errors);
        }

        return Map.of("title", title, "category", category);
    }

    /**
     * Validates question request fields and returns normalized option texts.
     *
     * @param request incoming question payload
     * @return normalized list of exactly four option strings
     */
    public static List<String> validateAndNormalizeQuestion(QuestionRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        if (request == null) {
            throw new ValidationException("Request body is required.");
        }

        String text = request.getText() != null ? request.getText().trim() : "";
        if (text.isEmpty()) {
            errors.put("text", "Question text is required.");
        }

        List<String> options = new ArrayList<>();
        if (request.getOptions() == null || request.getOptions().size() != 4) {
            errors.put("options", "Exactly four options are required.");
        } else {
            for (int i = 0; i < 4; i++) {
                String option = request.getOptions().get(i);
                String trimmed = option != null ? option.trim() : "";
                if (trimmed.isEmpty()) {
                    errors.put("options", "All four options must be non-empty.");
                    break;
                }
                options.add(trimmed);
            }
        }

        if (request.getCorrectIndex() < 0 || request.getCorrectIndex() > 3) {
            errors.put("correctIndex", "Correct index must be between 0 and 3.");
        }

        String difficulty = request.getDifficulty() != null ? request.getDifficulty().trim().toLowerCase() : "";
        if (difficulty.isEmpty()) {
            errors.put("difficulty", "Difficulty is required (easy, medium, or hard).");
        } else if (!difficulty.equals("easy") && !difficulty.equals("medium") && !difficulty.equals("hard")) {
            errors.put("difficulty", "Difficulty must be 'easy', 'medium', or 'hard'.");
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("Validation failed.", errors);
        }

        return options;
    }

    /**
     * Validates a game result save request.
     *
     * @param quizId      quiz id from request
     * @param playerName  player name from request
     * @param score       score from request
     * @param totalQuestions total questions from request
     */
    public static void validateGameResult(String quizId, String playerName, int score, int totalQuestions) {
        Map<String, String> errors = new LinkedHashMap<>();

        if (quizId == null || quizId.isBlank()) {
            errors.put("quizId", "Quiz id is required.");
        }
        if (playerName == null || playerName.isBlank()) {
            errors.put("playerName", "Player name is required.");
        }
        if (score < 0 || score > 100) {
            errors.put("score", "Score must be between 0 and 100.");
        }
        if (totalQuestions <= 0) {
            errors.put("totalQuestions", "Total questions must be greater than zero.");
        }

        if (!errors.isEmpty()) {
            throw new ValidationException("Validation failed.", errors);
        }
    }

    /** Trims and lower-cases {@code value}, returning an empty string for {@code null} input. */
    private static String normalize(String value) {
        return value != null ? value.trim().toLowerCase() : "";
    }
}
