package triviahub.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import triviahub.dto.QuizRequest;
import triviahub.dto.QuizResponse;
import triviahub.service.QuizService;

import java.util.List;

/**
 * REST endpoints for quiz CRUD operations.
 */
@RestController
@RequestMapping("/api/quizzes")
public class QuizController {

    private final QuizService quizService;

    public QuizController(QuizService quizService) {
        this.quizService = quizService;
    }

    /**
     * Lists all quizzes with question counts.
     *
     * @return HTTP 200 and quiz list
     */
    @GetMapping
    public List<QuizResponse> listQuizzes() {
        return quizService.findAllWithQuestionCounts();
    }

    /**
     * Returns a single quiz by id.
     *
     * @param id quiz id
     * @return HTTP 200 and quiz, or HTTP 404 if not found
     */
    @GetMapping("/{id}")
    public QuizResponse getQuiz(@PathVariable String id) {
        return quizService.getByIdOrThrow(id);
    }

    /**
     * Creates a new quiz.
     *
     * @param request quiz payload
     * @return HTTP 201 and created quiz, HTTP 400 on validation error, HTTP 409 on duplicate title
     */
    @PostMapping
    public ResponseEntity<QuizResponse> createQuiz(@RequestBody QuizRequest request) {
        QuizResponse created = quizService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates an existing quiz.
     *
     * @param id      quiz id
     * @param request updated fields
     * @return HTTP 200 and updated quiz, HTTP 404 if not found, HTTP 409 on duplicate title
     */
    @PutMapping("/{id}")
    public QuizResponse updateQuiz(@PathVariable String id, @RequestBody QuizRequest request) {
        return quizService.update(id, request);
    }

    /**
     * Deletes a quiz and all of its questions.
     *
     * @param id quiz id
     * @return HTTP 204 on success, HTTP 404 if not found
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable String id) {
        quizService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
