package triviahub.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import triviahub.dto.GameResultRequest;
import triviahub.model.GameResult;
import triviahub.service.GameResultService;

import java.util.List;

/**
 * REST endpoints for leaderboards and saving game results.
 */
@RestController
@RequestMapping("/api")
public class GameResultController {

    private final GameResultService gameResultService;

    public GameResultController(GameResultService gameResultService) {
        this.gameResultService = gameResultService;
    }

    /**
     * Returns the global top-20 leaderboard across all quizzes.
     *
     * @return HTTP 200 and ranked results
     */
    @GetMapping("/leaderboard")
    public List<GameResult> globalLeaderboard() {
        return gameResultService.globalLeaderboard();
    }

    /**
     * Returns the top-10 leaderboard for a single quiz.
     *
     * @param quizId quiz id
     * @return HTTP 200 and ranked results, HTTP 404 if quiz not found
     */
    @GetMapping("/quizzes/{quizId}/leaderboard")
    public List<GameResult> quizLeaderboard(@PathVariable String quizId) {
        return gameResultService.quizLeaderboard(quizId);
    }

    /**
     * Saves a completed game result.
     *
     * @param request result payload
     * @return HTTP 201 and saved result, HTTP 400 on validation error, HTTP 404 if quiz not found
     */
    @PostMapping("/results")
    public ResponseEntity<GameResult> saveResult(@RequestBody GameResultRequest request) {
        GameResult saved = gameResultService.save(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
