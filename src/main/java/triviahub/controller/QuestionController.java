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
import triviahub.dto.QuestionRequest;
import triviahub.model.Question;
import triviahub.service.QuestionService;
import triviahub.service.QuizService;

import java.util.List;

/**
 * REST endpoints for question operations under a quiz and by question id.
 */
@RestController
@RequestMapping("/api")
public class QuestionController {

    private final QuestionService questionService;
    private final QuizService quizService;

    public QuestionController(QuestionService questionService, QuizService quizService) {
        this.questionService = questionService;
        this.quizService = quizService;
    }

    /**
     * Lists all questions for a quiz in storage order.
     *
     * @param quizId quiz id
     * @return HTTP 200 and questions, HTTP 404 if quiz not found
     */
    @GetMapping("/quizzes/{quizId}/questions")
    public List<Question> listQuestions(@PathVariable String quizId) {
        quizService.requireExists(quizId);
        return questionService.findByQuizId(quizId);
    }

    /**
     * Returns questions for a quiz in random order for gameplay.
     *
     * @param quizId quiz id
     * @return HTTP 200 and shuffled questions, HTTP 404 if quiz not found
     */
    @GetMapping("/quizzes/{quizId}/questions/random")
    public List<Question> listQuestionsRandomOrder(@PathVariable String quizId) {
        return questionService.findByQuizIdRandomOrder(quizId);
    }

    /**
     * Adds a question to a quiz.
     *
     * @param quizId  quiz id
     * @param request question payload
     * @return HTTP 201 and created question, HTTP 400 on validation error, HTTP 404 if quiz not found
     */
    @PostMapping("/quizzes/{quizId}/questions")
    public ResponseEntity<Question> createQuestion(
            @PathVariable String quizId,
            @RequestBody QuestionRequest request
    ) {
        Question created = questionService.create(quizId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Updates an existing question.
     *
     * @param id      question id
     * @param request updated fields
     * @return HTTP 200 and updated question, HTTP 404 if not found, HTTP 400 on validation error
     */
    @PutMapping("/questions/{id}")
    public Question updateQuestion(@PathVariable String id, @RequestBody QuestionRequest request) {
        return questionService.update(id, request);
    }

    /**
     * Deletes a question by id.
     *
     * @param id question id
     * @return HTTP 204 on success, HTTP 404 if not found
     */
    @DeleteMapping("/questions/{id}")
    public ResponseEntity<Void> deleteQuestion(@PathVariable String id) {
        questionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
