package triviahub.service;

import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import triviahub.dto.QuestionRequest;
import triviahub.exception.ResourceNotFoundException;
import triviahub.model.Question;
import triviahub.service.persistence.ObjectStreamFileStore;
import triviahub.service.persistence.PersistencePaths;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Question persistence and business operations backed by {@code questions.ser}.
 */
@Service
public class QuestionService {

    private final ObjectStreamFileStore fileStore;
    private final QuizService quizService;

    public QuestionService(ObjectStreamFileStore fileStore, @Lazy QuizService quizService) {
        this.fileStore = fileStore;
        this.quizService = quizService;
    }

    /**
     * Loads all questions from disk.
     */
    public List<Question> findAll() {
        return fileStore.readList(PersistencePaths.QUESTIONS_FILE);
    }

    /**
     * Finds a question by id.
     */
    public Optional<Question> findById(String id) {
        if (id == null) {
            return Optional.empty();
        }
        return findAll().stream()
                .filter(question -> id.equals(question.getId()))
                .findFirst();
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
     * Returns questions for a quiz in random order for gameplay.
     */
    public List<Question> findByQuizIdRandomOrder(String quizId) {
        quizService.requireExists(quizId);
        List<Question> copy = new ArrayList<>(findByQuizId(quizId));
        Collections.shuffle(copy);
        return copy;
    }

    /**
     * Adds a question to a quiz after validation.
     */
    public Question create(String quizId, QuestionRequest request) {
        quizService.requireExists(quizId);
        List<String> options = ValidationUtils.validateAndNormalizeQuestion(request);

        Question question = new Question(
                UUID.randomUUID().toString(),
                quizId,
                request.getText().trim(),
                options,
                request.getCorrectIndex(),
                request.getHint() != null ? request.getHint().trim() : ""
        );

        updateAll(questions -> {
            List<Question> updated = new ArrayList<>(questions);
            updated.add(question);
            return updated;
        });

        return question;
    }

    /**
     * Updates an existing question after validation.
     */
    public Question update(String id, QuestionRequest request) {
        Question existing = findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found: " + id));
        List<String> options = ValidationUtils.validateAndNormalizeQuestion(request);

        Question updated = new Question(
                id,
                existing.getQuizId(),
                request.getText().trim(),
                options,
                request.getCorrectIndex(),
                request.getHint() != null ? request.getHint().trim() : ""
        );

        updateAll(questions -> {
            List<Question> copy = new ArrayList<>();
            boolean found = false;
            for (Question question : questions) {
                if (id.equals(question.getId())) {
                    copy.add(updated);
                    found = true;
                } else {
                    copy.add(question);
                }
            }
            if (!found) {
                throw new ResourceNotFoundException("Question not found: " + id);
            }
            return copy;
        });

        return updated;
    }

    /**
     * Deletes a question by id.
     */
    public void delete(String id) {
        if (findById(id).isEmpty()) {
            throw new ResourceNotFoundException("Question not found: " + id);
        }

        updateAll(questions -> {
            List<Question> updated = new ArrayList<>(questions);
            boolean removed = updated.removeIf(question -> id.equals(question.getId()));
            if (!removed) {
                throw new ResourceNotFoundException("Question not found: " + id);
            }
            return updated;
        });
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
